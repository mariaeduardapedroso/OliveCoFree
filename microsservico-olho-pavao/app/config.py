"""
Configuracoes do Microsservico Olho de Pavao
"""
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://olivecofree:olivecofree2024@localhost:5432/olivecofree"
)

URLS_DOENCA = [
    "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/2021_Data_Olive%20leaf%20spot%20Trat1.xlsx",
    "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/2022_Data_Olive%20leaf%20spot%20Trat1.xlsx",
    "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/2023_Data_Olive%20leaf%20spot%20Trat1.xlsx",
    "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/2025_Data_Olive%20leaf%20spot.xlsx",
]
URL_CLIMA = "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/clima.xlsx"
SHEET_CLIMA = "Mirandela"

PERCENTAGEM_INFECTADO = 10
THRESHOLD_MEDIO = 10.0
THRESHOLD_ALTO = 15.0

# All candidate features for stepwise selection
CANDIDATE_FEATURES = [
    'semana_do_ano',
    'temp_media_semana',
    'temp_max_semana',
    'temp_min_semana',
    'amplitude_termica',
    'humidade_semana',
    'precipitacao_semana',
    'precipitacao_2sem_anterior',
    'vento_semana',
    'temp_media_2sem_anterior',
    'humidade_2sem_anterior',
    'dias_chuva_semana',
]

# Fallback if stepwise fails
FALLBACK_FEATURES = [
    'semana_do_ano',
    'temp_media_semana',
    'humidade_semana',
    'precipitacao_semana',
    'vento_semana',
]

PORT = 8002
