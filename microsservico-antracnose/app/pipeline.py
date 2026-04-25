"""
Pipeline de Dados - Microsservico Antracnose

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


def preparar_dataset_treino() -> pd.DataFrame:
    """Pipeline completo: dados PostgreSQL -> features semanais -> dataset."""
    print("=" * 60)
    print("[Pipeline] Preparando dataset de treino (dados do PostgreSQL)...")
    print("=" * 60)

    engine = create_engine(DATABASE_URL)

    df_antracnose = pd.read_sql("SELECT * FROM dados_antracnose", engine)
    print(f"[Pipeline] Doenca: {len(df_antracnose)} registos")

    if len(df_antracnose) == 0:
        print("[Pipeline] AVISO: Tabela dados_antracnose vazia!")
        return pd.DataFrame()

    df_antracnose = df_antracnose.rename(columns={'olival_parcela': 'parcela'})
    df_antracnose['data'] = pd.to_datetime(df_antracnose['data'])
    df_antracnose['semana_do_ano'] = df_antracnose['data'].dt.isocalendar().week.astype(int)
    df_antracnose['ano'] = df_antracnose['data'].dt.year

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

    df_clima_sem = df_clima.groupby(['ano', 'semana_do_ano']).agg(
        temp_media_semana=('temp_media', 'mean'),
        temp_max_semana=('temp_max', 'max'),
        temp_min_semana=('temp_min', 'min'),
        humidade_semana=('humidade', 'mean'),
        precipitacao_semana=('precipitacao', 'mean'),
        vento_semana=('vento', 'mean'),
        dias_chuva_semana=('precipitacao', lambda x: (x > 0.1).sum()),
    ).reset_index()

    df_clima_sem['amplitude_termica'] = df_clima_sem['temp_max_semana'] - df_clima_sem['temp_min_semana']
    df_clima_sem = df_clima_sem.sort_values(['ano', 'semana_do_ano']).reset_index(drop=True)
    df_clima_sem['precipitacao_acumulada_2sem'] = (
        df_clima_sem['precipitacao_semana'].rolling(2, min_periods=1).sum()
    )
    df_clima_sem['temp_media_2sem_anterior'] = df_clima_sem['temp_media_semana'].shift(1).fillna(0)
    df_clima_sem['humidade_2sem_anterior'] = df_clima_sem['humidade_semana'].shift(1).fillna(0)

    df_final = pd.merge(df_doenca_sem, df_clima_sem, on=['ano', 'semana_do_ano'], how='inner')
    df_final = df_final.sort_values(['ano', 'semana_do_ano']).reset_index(drop=True)
    df_final = df_final.fillna(0)

    print(f"\n[Pipeline] Dataset treino: {len(df_final)} registos")
    print(f"  Infectado: {df_final['infectado'].value_counts().to_dict()}")
    print(f"  Features candidatas: {len(CANDIDATE_FEATURES)}")
    print("=" * 60)

    engine.dispose()
    return df_final


def gerar_janelas_deslizantes(df: pd.DataFrame, tamanho_janela: int = 2):
    """
    Gera janelas deslizantes para validacao temporal entre anos.

    Treina com N anos consecutivos, testa no ano seguinte.
    Yields tuplas (anos_treino, ano_teste, df_treino, df_teste).
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
    """Calcula features a partir dos dados climaticos (Colletotrichum spp.)."""
    amplitude = temperatura_maxima - temperatura_minima

    all_features = {
        'semana_do_ano': float(semana),
        'temp_media_semana': temperatura_media,
        'temp_max_semana': temperatura_maxima,
        'temp_min_semana': temperatura_minima,
        'amplitude_termica': amplitude,
        'humidade_semana': humidade,
        'precipitacao_semana': precipitacao,
        'precipitacao_acumulada_2sem': precipitacao,
        'vento_semana': velocidade_vento,
        'temp_media_2sem_anterior': 0.0,
        'humidade_2sem_anterior': 0.0,
        'dias_chuva_semana': 1.0 if precipitacao > 0.1 else 0.0,
    }

    if features_selecionadas:
        return pd.Series({k: all_features.get(k, 0.0) for k in features_selecionadas})
    return pd.Series(all_features)
