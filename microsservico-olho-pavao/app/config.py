"""
Configurações do Microsserviço Olho de Pavão
"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

# Ficheiros de dados (usados APENAS para treino)
FICHEIROS_DOENCA = [
    os.path.join(DATA_DIR, "2021_Data_Olive_leaf_spot_Trat1.xlsx"),
    os.path.join(DATA_DIR, "2022_Data_Olive_leaf_spot_Trat1.xlsx"),
    os.path.join(DATA_DIR, "2023_Data_Olive_leaf_spot_Trat1.xlsx"),
]
FICHEIRO_CLIMA = os.path.join(DATA_DIR, "clima.xlsx")

# Threshold para classificação binária no treino (% infectadas)
PERCENTAGEM_INFECTADO = 10

# Thresholds para classificação baixo/medio/alto (probabilidade do modelo)
THRESHOLD_MEDIO = 40.0   # >= 40% → medio
THRESHOLD_ALTO = 60.0    # >= 60% → alto

# Features usadas no componente ML do modelo
FEATURES_MODELO = [
    'semana_do_ano',
    'temp_media_semana',
    'humidade_semana',
    'precipitacao_semana',
    'vento_semana',
    'indice_favorabilidade_semana',
]

# Porta do serviço
PORT = 8002
