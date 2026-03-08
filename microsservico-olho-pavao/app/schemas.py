"""
Schemas Pydantic do Microsserviço Olho de Pavão
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class PrevisaoRequest(BaseModel):
    """
    Dados climáticos da semana para previsão.
    O utilizador envia os dados meteorológicos e o microsserviço prevê o risco.
    """
    semana: int = Field(..., ge=1, le=53, description="Semana do ano (1-53)")
    ano: int = Field(..., ge=2021, le=2030, description="Ano")
    temperatura_media: float = Field(..., description="Temperatura média diária da semana (°C)")
    temperatura_maxima: float = Field(..., description="Temperatura máxima da semana (°C)")
    temperatura_minima: float = Field(..., description="Temperatura mínima da semana (°C)")
    humidade: float = Field(..., ge=0, le=100, description="Humidade relativa média diária (%)")
    precipitacao: float = Field(..., ge=0, description="Precipitação média diária da semana (mm/dia)")
    velocidade_vento: float = Field(default=0.0, ge=0, description="Velocidade média diária do vento (m/s)")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "semana": 42,
                    "ano": 2023,
                    "temperatura_media": 14.0,
                    "temperatura_maxima": 19.0,
                    "temperatura_minima": 9.0,
                    "humidade": 75.0,
                    "precipitacao": 1.5,
                    "velocidade_vento": 2.0,
                }
            ]
        }
    }


class PrevisaoResponse(BaseModel):
    """Resposta da previsão de Olho de Pavão."""
    semana: int
    ano: int
    percentual_infeccao: float = Field(..., description="Probabilidade de infeção significativa (%)")
    classificacao: str = Field(..., description="Classificação de risco: baixo, medio ou alto")
    confianca: float = Field(..., description="Confiança do modelo na previsão (0-100%)")
    detalhes: dict = Field(default_factory=dict, description="Detalhes adicionais")


class ModeloInfo(BaseModel):
    """Informações sobre o modelo treinado e suas métricas."""
    modelo: str
    accuracy: float
    f1_score: float
    total_amostras_treino: int
    anos_treino: List[int]
    features_utilizadas: List[str]
    thresholds: dict


class HealthResponse(BaseModel):
    """Resposta do health check."""
    status: str
    modelo_pronto: bool
    total_amostras_treino: int
