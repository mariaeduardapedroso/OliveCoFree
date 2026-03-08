"""
Configuracoes do Microsservico Antracnose
"""

# URLs dos dados no GitHub (carregados em tempo de execucao)
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

# Threshold para classificacao binaria no treino (% infectadas)
PERCENTAGEM_INFECTADO = 10

# Thresholds para classificacao baixo/medio/alto (probabilidade do modelo)
THRESHOLD_MEDIO = 40.0   # >= 40% -> medio
THRESHOLD_ALTO = 60.0    # >= 60% -> alto

# Features usadas no componente ML do modelo
FEATURES_MODELO = [
    'semana_do_ano',
    'temp_media_semana',
    'humidade_semana',
    'precipitacao_semana',
    'vento_semana',
    'indice_favorabilidade_semana',
]

# Porta do servico
PORT = 8003
