"""
Configuracoes do Microsservico Antracnose
"""
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://olivecofree:olivecofree2024@localhost:5432/olivecofree"
)

URLS_DOENCA = [
    "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/2024_Data_Anthracnose.xlsx",
    "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/2025_Data_Anthracnose.xlsx",
]
SHEETS_DOENCA = [
    "Antracnose_2024",
    "Antracnose_2025",
]
URL_CLIMA = "https://raw.githubusercontent.com/mariaeduardapedroso/Dados-tese/main/clima.xlsx"
SHEET_CLIMA = "Mirandela"

PERCENTAGEM_INFECTADO = 10
THRESHOLD_MEDIO = 8.0
THRESHOLD_ALTO = 12.0

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

FALLBACK_FEATURES = [
    'semana_do_ano',
    'temp_media_semana',
    'humidade_semana',
    'precipitacao_semana',
    'vento_semana',
]

PORT = 8003
