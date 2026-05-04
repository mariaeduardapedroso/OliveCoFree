"""
Pipeline de Dados - Microsservico Olho de Pavao

Duas responsabilidades:
  1. TREINO: Dados do PostgreSQL -> features semanais -> dataset para treinar o modelo
  2. PREVISAO: Dados climaticos do utilizador -> mesmas features -> previsao

Dados carregados diretamente do banco de dados PostgreSQL.
"""
import pandas as pd
import numpy as np
from typing import List, Optional
from sqlalchemy import create_engine
from .config import (
    DATABASE_URL,
    PERCENTAGEM_INFECTADO,
    CANDIDATE_FEATURES,
)


# ============================================================
# PIPELINE DE TREINO
# ============================================================

def preparar_dataset_treino() -> pd.DataFrame:
    """Pipeline completo: dados PostgreSQL -> features semanais -> dataset."""
    print("=" * 60)
    print("[Pipeline] Preparando dataset de treino (dados do PostgreSQL)...")
    print("=" * 60)

    engine = create_engine(DATABASE_URL)

    # --- Dados de doenca (do banco) ---
    df_pavao = pd.read_sql("SELECT * FROM dados_olho_pavao", engine)
    print(f"[Pipeline] Doenca: {len(df_pavao)} registos")

    if len(df_pavao) == 0:
        print("[Pipeline] AVISO: Tabela dados_olho_pavao vazia!")
        return pd.DataFrame()

    df_pavao['data'] = pd.to_datetime(df_pavao['data'])
    df_pavao['visiveis_latentes'] = pd.to_numeric(
        df_pavao['visiveis_latentes'], errors='coerce'
    ).fillna(0)
    df_pavao['semana_do_ano'] = df_pavao['data'].dt.isocalendar().week.astype(int)
    df_pavao['ano'] = df_pavao['data'].dt.year
    df_pavao['folha_infectada'] = (df_pavao['visiveis_latentes'] > 0).astype(int)

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

    # --- Dados climaticos (do banco) ---
    df_clima = pd.read_sql("SELECT * FROM dados_clima", engine)
    print(f"[Pipeline] Clima: {len(df_clima)} registos")

    if len(df_clima) == 0:
        print("[Pipeline] AVISO: Tabela dados_clima vazia!")
        return pd.DataFrame()

    df_clima = df_clima.rename(columns={
        'ano': 'ano', 't_med': 'temp_media', 't_max': 'temp_max',
        't_min': 'temp_min', 'hr_med': 'humidade', 'ff_med': 'vento',
        'pr_qtd': 'precipitacao',
    })
    df_clima['data'] = pd.to_datetime({
        'year': df_clima['ano'], 'month': df_clima['mes'], 'day': df_clima['dia']
    })
    df_clima['semana_do_ano'] = df_clima['data'].dt.isocalendar().week.astype(int)

    for col in ['temp_media', 'temp_max', 'temp_min', 'humidade', 'vento', 'precipitacao']:
        if col in df_clima.columns:
            df_clima[col] = df_clima[col].where(df_clima[col] >= -100, np.nan).ffill()

    # Agregar clima por semana (medias semanais + novas features)
    df_clima_sem = df_clima.groupby(['ano', 'semana_do_ano']).agg(
        temp_media_semana=('temp_media', 'mean'),
        temp_max_semana=('temp_max', 'max'),
        temp_min_semana=('temp_min', 'min'),
        humidade_semana=('humidade', 'mean'),
        precipitacao_semana=('precipitacao', 'mean'),
        vento_semana=('vento', 'mean'),
        dias_chuva_semana=('precipitacao', lambda x: (x > 0.1).sum() / len(x)),
    ).reset_index()

    # Amplitude termica
    df_clima_sem['amplitude_termica'] = df_clima_sem['temp_max_semana'] - df_clima_sem['temp_min_semana']

    # Ordenar cronologicamente para features temporais
    df_clima_sem = df_clima_sem.sort_values(['ano', 'semana_do_ano']).reset_index(drop=True)

    # Features com lag temporal
    df_clima_sem['precipitacao_2sem_anterior'] = df_clima_sem['precipitacao_semana'].shift(1).fillna(0)
    df_clima_sem['temp_media_2sem_anterior'] = df_clima_sem['temp_media_semana'].shift(1).fillna(0)
    df_clima_sem['humidade_2sem_anterior'] = df_clima_sem['humidade_semana'].shift(1).fillna(0)

    # Merge
    df_final = pd.merge(df_doenca_sem, df_clima_sem, on=['ano', 'semana_do_ano'], how='inner')
    df_final = df_final.sort_values(['ano', 'semana_do_ano']).reset_index(drop=True)
    df_final = df_final.fillna(0)

    print(f"\n[Pipeline] Dataset treino: {len(df_final)} registos")
    print(f"  Infectado: {df_final['infectado'].value_counts().to_dict()}")
    print(f"  Features candidatas: {len(CANDIDATE_FEATURES)}")
    print("=" * 60)

    engine.dispose()
    return df_final


# ============================================================
# JANELA DESLIZANTE (SLIDING WINDOW)
# ============================================================

def gerar_janelas_deslizantes(df: pd.DataFrame, tamanho_janela: int = 2):
    """
    Gera janelas deslizantes para validacao temporal entre anos.

    Treina com N anos consecutivos, testa no ano seguinte.
    A janela desliza: o tamanho do treino mantem-se constante.

    Exemplo com tamanho_janela=2:
      Passo 1: Treino [2021, 2022] -> Teste [2023]
      Passo 2: Treino [2022, 2023] -> Teste [2024]

    Yields tuplas (anos_treino, ano_teste, df_treino, df_teste).
    Se nao houver anos suficientes, nao yield nada.
    """
    df = df.sort_values(['ano', 'semana_do_ano']).reset_index(drop=True)
    anos = sorted(df['ano'].unique())

    if len(anos) < tamanho_janela + 1:
        return

    for i in range(len(anos) - tamanho_janela):
        anos_treino = anos[i:i + tamanho_janela]
        ano_teste = anos[i + tamanho_janela]
        train_df = df[df['ano'].isin(anos_treino)].copy().reset_index(drop=True)
        test_df = df[df['ano'] == ano_teste].copy().reset_index(drop=True)
        yield anos_treino, ano_teste, train_df, test_df


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
    features_selecionadas: Optional[List[str]] = None,
) -> pd.Series:
    """
    Calcula as features usadas no treino a partir dos dados
    climaticos enviados pelo utilizador.
    """
    amplitude = temperatura_maxima - temperatura_minima

    all_features = {
        'semana_do_ano': float(semana),
        'temp_media_semana': temperatura_media,
        'temp_max_semana': temperatura_maxima,
        'temp_min_semana': temperatura_minima,
        'amplitude_termica': amplitude,
        'humidade_semana': humidade,
        'precipitacao_semana': precipitacao,
        'precipitacao_2sem_anterior': 0.0,
        'vento_semana': velocidade_vento,
        'temp_media_2sem_anterior': 0.0,
        'humidade_2sem_anterior': 0.0,
        'dias_chuva_semana': 1.0 if precipitacao > 0.1 else 0.0,
    }

    if features_selecionadas:
        return pd.Series({k: all_features.get(k, 0.0) for k in features_selecionadas})
    return pd.Series(all_features)
