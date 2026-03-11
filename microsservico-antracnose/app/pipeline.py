"""
Pipeline de Dados - Microsservico Antracnose

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
    SHEETS_DOENCA,
    URL_CLIMA,
    SHEET_CLIMA,
    PERCENTAGEM_INFECTADO,
)


def _calcular_fator_temp(temp_media):
    """Fator de temperatura (otimo 20-25C para Colletotrichum spp.)."""
    return np.where(
        (temp_media >= 20) & (temp_media <= 25), 1.0,
        np.where((temp_media >= 15) & (temp_media < 20), 0.7,
        np.where((temp_media > 25) & (temp_media <= 30), 0.5, 0.2)))


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
    for url, sheet in zip(URLS_DOENCA, SHEETS_DOENCA):
        print(f"[Pipeline] Carregando: {sheet}")
        df = pd.read_excel(url, sheet_name=sheet, header=1)
        df.columns = df.columns.astype(str).str.strip()
        frames.append(df)

    df_antracnose = pd.concat(frames, ignore_index=True)
    # Normalizar nomes: remover espacos, acentos e lowercase
    df_antracnose.columns = [
        unicodedata.normalize('NFKD', str(c)).encode('ascii', 'ignore').decode().strip().lower()
        for c in df_antracnose.columns
    ]
    df_antracnose = df_antracnose.rename(columns={
        'data': 'data',
        'olival/parcela': 'parcela',
        'arvore': 'arvore',
        'azeitona': 'azeitona',
        'severidade': 'severidade',
        'incidencia': 'incidencia',
    })
    df_antracnose['data'] = pd.to_datetime(df_antracnose['data'])
    df_antracnose['semana_do_ano'] = df_antracnose['data'].dt.isocalendar().week.astype(int)
    df_antracnose['ano'] = df_antracnose['data'].dt.year
    print(f"[Pipeline] Doenca: {len(df_antracnose)} registos")

    # Agregar por data, parcela, arvore
    df_agg = (
        df_antracnose
        .groupby(['data', 'parcela', 'arvore', 'semana_do_ano', 'ano'])
        .agg(
            total_azeitonas=('incidencia', 'count'),
            azeitonas_infectadas=('incidencia', 'sum'),
            severidade_media=('severidade', 'mean'),
        )
        .reset_index()
    )
    df_agg['perc_infectadas'] = (
        df_agg['azeitonas_infectadas'] / df_agg['total_azeitonas'] * 100
    ).round(2)
    df_agg['infectado'] = (df_agg['perc_infectadas'] >= PERCENTAGEM_INFECTADO).astype(int)

    # Agregar ao nivel semanal (media de todas as parcelas/arvores)
    df_doenca_sem = df_agg.groupby(['ano', 'semana_do_ano']).agg(
        total_azeitonas=('total_azeitonas', 'sum'),
        azeitonas_infectadas=('azeitonas_infectadas', 'sum'),
        severidade_media=('severidade_media', 'mean'),
    ).reset_index()
    df_doenca_sem['perc_infectadas'] = (
        df_doenca_sem['azeitonas_infectadas'] / df_doenca_sem['total_azeitonas'] * 100
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

    # Features epidemiologicas diarias (Colletotrichum spp.)
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
# PIPELINE DE RETREINO (dados novos do pesquisador + GitHub)
# ============================================================

def preparar_dataset_com_novos_dados(df_doenca_novo: pd.DataFrame, df_clima_novo: pd.DataFrame) -> pd.DataFrame:
    """
    Combina dados originais do GitHub com novos dados enviados pelo pesquisador.
    Retorna dataset pronto para treino.
    """
    print("[Pipeline] Retreino: combinando dados GitHub + novos dados do pesquisador...")

    # --- Carregar dados originais do GitHub ---
    frames = []
    for url, sheet in zip(URLS_DOENCA, SHEETS_DOENCA):
        print(f"[Pipeline] Carregando original: {sheet}")
        df = pd.read_excel(url, sheet_name=sheet, header=1)
        df.columns = df.columns.astype(str).str.strip()
        frames.append(df)

    df_antracnose_original = pd.concat(frames, ignore_index=True)

    # Normalizar nomes das colunas originais
    df_antracnose_original.columns = [
        unicodedata.normalize('NFKD', str(c)).encode('ascii', 'ignore').decode().strip().lower()
        for c in df_antracnose_original.columns
    ]

    # Normalizar nomes das colunas novas
    df_doenca_novo.columns = [
        unicodedata.normalize('NFKD', str(c)).encode('ascii', 'ignore').decode().strip().lower()
        for c in df_doenca_novo.columns
    ]

    # Concatenar doença
    df_antracnose = pd.concat([df_antracnose_original, df_doenca_novo], ignore_index=True)
    df_antracnose = df_antracnose.rename(columns={
        'olival/parcela': 'parcela',
    })
    df_antracnose['data'] = pd.to_datetime(df_antracnose['data'])
    df_antracnose['semana_do_ano'] = df_antracnose['data'].dt.isocalendar().week.astype(int)
    df_antracnose['ano'] = df_antracnose['data'].dt.year

    # Agregar por data, parcela, arvore
    df_agg = (
        df_antracnose
        .groupby(['data', 'parcela', 'arvore', 'semana_do_ano', 'ano'])
        .agg(
            total_azeitonas=('incidencia', 'count'),
            azeitonas_infectadas=('incidencia', 'sum'),
            severidade_media=('severidade', 'mean'),
        )
        .reset_index()
    )
    df_agg['perc_infectadas'] = (
        df_agg['azeitonas_infectadas'] / df_agg['total_azeitonas'] * 100
    ).round(2)
    df_agg['infectado'] = (df_agg['perc_infectadas'] >= PERCENTAGEM_INFECTADO).astype(int)

    # Agregar ao nível semanal
    df_doenca_sem = df_agg.groupby(['ano', 'semana_do_ano']).agg(
        total_azeitonas=('total_azeitonas', 'sum'),
        azeitonas_infectadas=('azeitonas_infectadas', 'sum'),
        severidade_media=('severidade_media', 'mean'),
    ).reset_index()
    df_doenca_sem['perc_infectadas'] = (
        df_doenca_sem['azeitonas_infectadas'] / df_doenca_sem['total_azeitonas'] * 100
    ).round(2)
    df_doenca_sem['infectado'] = (
        df_doenca_sem['perc_infectadas'] >= PERCENTAGEM_INFECTADO
    ).astype(int)

    # --- Clima: GitHub + novos ---
    print(f"[Pipeline] Carregando clima original do GitHub...")
    df_clima_original = pd.read_excel(URL_CLIMA, sheet_name=SHEET_CLIMA)
    df_clima_original = df_clima_original.drop('ESTACAO', axis=1, errors='ignore')

    # Normalizar colunas do clima novo para uppercase
    df_clima_novo.columns = [str(c).strip().upper() for c in df_clima_novo.columns]

    df_clima = pd.concat([df_clima_original, df_clima_novo], ignore_index=True)
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

    # Features epidemiológicas diárias
    df_clima['fator_temp'] = _calcular_fator_temp(df_clima['temp_media'])
    df_clima['fator_humidade'] = _calcular_fator_humidade(df_clima['humidade'])
    df_clima['indice_favorabilidade'] = df_clima['fator_temp'] * df_clima['fator_humidade']

    # Agregar clima por semana
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

    print(f"[Pipeline] Dataset retreino: {len(df_final)} registos (antes + novos)")
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

    Biologia do Colletotrichum spp.:
    - Temperatura otima: 20-25C (germinacao dos conidios)
    - Humidade >= 80% (favorece esporulacao)
    - Precipitacao (disseminacao por salpico de chuva)
    """
    # Fator de temperatura (Colletotrichum spp.: otimo 20-25C)
    if 20 <= temperatura_media <= 25:
        fator_temp = 1.0
    elif 15 <= temperatura_media < 20:
        fator_temp = 0.7
    elif 25 < temperatura_media <= 30:
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
