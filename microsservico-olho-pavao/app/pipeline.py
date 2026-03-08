"""
Pipeline de Dados - Microsservico Olho de Pavao

Duas responsabilidades:
  1. TREINO: Dados do GitHub -> features semanais -> dataset para treinar o modelo
  2. PREVISAO: Dados climaticos do utilizador -> mesmas features -> previsao

Dados carregados diretamente do repositorio GitHub (sem ficheiros locais).
"""
import unicodedata
import pandas as pd
import numpy as np
from .config import (
    URLS_DOENCA,
    URL_CLIMA,
    SHEET_CLIMA,
    PERCENTAGEM_INFECTADO,
)


def _calcular_fator_temp(temp_media):
    """Fator de temperatura (otimo 15-20C para Spilocaea oleaginea)."""
    return np.where(
        (temp_media >= 15) & (temp_media <= 20), 1.0,
        np.where((temp_media >= 10) & (temp_media < 15), 0.7,
        np.where((temp_media > 20) & (temp_media <= 25), 0.5, 0.2)))


def _calcular_fator_humidade(humidade):
    """Fator de humidade (favoravel >= 80%)."""
    return np.where(
        humidade >= 80, 1.0,
        np.where(humidade >= 70, 0.7,
        np.where(humidade >= 60, 0.4, 0.1)))


# ============================================================
# PIPELINE DE TREINO
# ============================================================

def preparar_dataset_treino() -> pd.DataFrame:
    """Pipeline completo: dados GitHub -> features semanais -> dataset."""
    print("=" * 60)
    print("[Pipeline] Preparando dataset de treino (dados do GitHub)...")
    print("=" * 60)

    # --- Dados de doenca (do GitHub) ---
    frames = []
    for url in URLS_DOENCA:
        print(f"[Pipeline] Carregando: {url.split('/')[-1]}")
        df = pd.read_excel(url, header=1)
        df.columns = df.columns.astype(str).str.strip()
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
        frames.append(df)

    df_pavao = pd.concat(frames, ignore_index=True)
    # Normalizar nomes: remover espacos, acentos e lowercase
    df_pavao.columns = [
        unicodedata.normalize('NFKD', str(c)).encode('ascii', 'ignore').decode().strip().lower()
        for c in df_pavao.columns
    ]
    df_pavao = df_pavao.rename(columns={
        'data': 'data',
        'repeticao': 'repeticao',
        'arvore': 'arvore',
        'folha': 'folha',
        'visiveis': 'visiveis',
        'visiveis + latentes': 'visiveis_latentes',
    })
    df_pavao['data'] = pd.to_datetime(df_pavao['data'])
    df_pavao['visiveis_latentes'] = pd.to_numeric(
        df_pavao['visiveis_latentes'], errors='coerce'
    ).fillna(0)
    df_pavao['semana_do_ano'] = df_pavao['data'].dt.isocalendar().week.astype(int)
    df_pavao['ano'] = df_pavao['data'].dt.year
    df_pavao['folha_infectada'] = (df_pavao['visiveis_latentes'] > 0).astype(int)
    print(f"[Pipeline] Doenca: {len(df_pavao)} registos")

    # Agregar doenca por semana
    df_doenca_sem = df_pavao.groupby(['ano', 'semana_do_ano']).agg(
        total_folhas=('folha', 'count'),
        folhas_infectadas=('folha_infectada', 'sum'),
    ).reset_index()
    df_doenca_sem['perc_infectadas'] = (
        df_doenca_sem['folhas_infectadas'] / df_doenca_sem['total_folhas'] * 100
    ).round(2)
    df_doenca_sem['infectado'] = (
        df_doenca_sem['perc_infectadas'] >= PERCENTAGEM_INFECTADO
    ).astype(int)

    # --- Dados climaticos (do GitHub) ---
    print(f"[Pipeline] Carregando clima do GitHub...")
    df_clima = pd.read_excel(URL_CLIMA, sheet_name=SHEET_CLIMA)
    df_clima = df_clima.drop('ESTACAO', axis=1, errors='ignore')
    df_clima['data'] = pd.to_datetime({
        'year': df_clima['ANO'], 'month': df_clima['MES'], 'day': df_clima['DIA']
    })
    df_clima = df_clima.rename(columns={
        'ANO': 'ano', 'T_MED': 'temp_media', 'T_MAX': 'temp_max',
        'T_MIN': 'temp_min', 'HR_MED': 'humidade', 'FF_MED': 'vento',
        'PR_QTD': 'precipitacao',
    })
    df_clima['semana_do_ano'] = df_clima['data'].dt.isocalendar().week.astype(int)

    for col in ['temp_media', 'temp_max', 'temp_min', 'humidade', 'vento', 'precipitacao']:
        if col in df_clima.columns:
            df_clima[col] = df_clima[col].where(df_clima[col] >= -100, np.nan).ffill()
    print(f"[Pipeline] Clima: {len(df_clima)} registos")

    # Features epidemiologicas diarias
    df_clima['fator_temp'] = _calcular_fator_temp(df_clima['temp_media'])
    df_clima['fator_humidade'] = _calcular_fator_humidade(df_clima['humidade'])
    df_clima['indice_favorabilidade'] = df_clima['fator_temp'] * df_clima['fator_humidade']

    # Agregar clima por semana (medias semanais)
    df_clima_sem = df_clima.groupby(['ano', 'semana_do_ano']).agg(
        temp_media_semana=('temp_media', 'mean'),
        humidade_semana=('humidade', 'mean'),
        precipitacao_semana=('precipitacao', 'mean'),
        vento_semana=('vento', 'mean'),
        indice_favorabilidade_semana=('indice_favorabilidade', 'mean'),
    ).reset_index()

    # Merge
    df_final = pd.merge(df_doenca_sem, df_clima_sem, on=['ano', 'semana_do_ano'], how='inner')
    df_final = df_final.dropna()

    print(f"\n[Pipeline] Dataset treino: {len(df_final)} registos")
    print(f"  Infectado: {df_final['infectado'].value_counts().to_dict()}")
    print("=" * 60)
    return df_final


# ============================================================
# CALCULAR FEATURES DO INPUT DO UTILIZADOR
# ============================================================

def calcular_features_do_input(
    semana: int,
    temperatura_media: float,
    temperatura_maxima: float,
    temperatura_minima: float,
    humidade: float,
    precipitacao: float,
    velocidade_vento: float = 0.0,
) -> pd.Series:
    """
    Calcula as mesmas 6 features usadas no treino a partir dos dados
    climaticos enviados pelo utilizador.
    """
    # Fator de temperatura
    if 15 <= temperatura_media <= 20:
        fator_temp = 1.0
    elif 10 <= temperatura_media < 15:
        fator_temp = 0.7
    elif 20 < temperatura_media <= 25:
        fator_temp = 0.5
    else:
        fator_temp = 0.2

    # Fator de humidade
    if humidade >= 80:
        fator_humidade = 1.0
    elif humidade >= 70:
        fator_humidade = 0.7
    elif humidade >= 60:
        fator_humidade = 0.4
    else:
        fator_humidade = 0.1

    indice_favorabilidade = fator_temp * fator_humidade

    return pd.Series({
        'semana_do_ano': float(semana),
        'temp_media_semana': temperatura_media,
        'humidade_semana': humidade,
        'precipitacao_semana': precipitacao,
        'vento_semana': velocidade_vento,
        'indice_favorabilidade_semana': indice_favorabilidade,
    })
