"""
Schemas Pydantic do Microsservico Antracnose
"""
from pydantic import BaseModel, Field
from typing import List


class PrevisaoRequest(BaseModel):
    """
    Dados climaticos da semana para previsao.
    O utilizador envia os dados meteorologicos e o microsservico preve o risco.
    """
    semana: int = Field(..., ge=1, le=53, description="Semana do ano (1-53)")
    ano: int = Field(..., ge=2021, le=2030, description="Ano")
    temperatura_media: float = Field(..., description="Temperatura media diaria da semana (C)")
    temperatura_maxima: float = Field(..., description="Temperatura maxima da semana (C)")
    temperatura_minima: float = Field(..., description="Temperatura minima da semana (C)")
    humidade: float = Field(..., ge=0, le=100, description="Humidade relativa media diaria (%)")
    precipitacao: float = Field(..., ge=0, description="Precipitacao media diaria da semana (mm/dia)")
    velocidade_vento: float = Field(default=0.0, ge=0, description="Velocidade media diaria do vento (m/s)")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "semana": 44,
                    "ano": 2024,
                    "temperatura_media": 22.0,
                    "temperatura_maxima": 27.0,
                    "temperatura_minima": 17.0,
                    "humidade": 82.0,
                    "precipitacao": 2.0,
                    "velocidade_vento": 1.5,
                }
            ]
        }
    }


class PrevisaoResponse(BaseModel):
    """Resposta da previsao de Antracnose."""
    semana: int
    ano: int
    percentual_infeccao: float = Field(..., description="Probabilidade de infecao significativa (%)")
    classificacao: str = Field(..., description="Classificacao de risco: baixo, medio ou alto")
    confianca: float = Field(..., description="Confianca do modelo na previsao (0-100%)")
    detalhes: dict = Field(default_factory=dict, description="Detalhes adicionais")


class ModeloInfo(BaseModel):
    """Informacoes sobre o modelo treinado e suas metricas."""
    modelo: str
    accuracy: float
    f1_score: float
    total_amostras_treino: int
    anos_treino: List[int]
    features_utilizadas: List[str]
    thresholds: dict


class RetreinoRequest(BaseModel):
    """Dados enviados pelo pesquisador para retreino do modelo."""
    dados_doenca: List[dict] = Field(..., description="Registos de doenca (lista de dicts)")
    dados_clima: List[dict] = Field(..., description="Registos climaticos (lista de dicts)")


class HealthResponse(BaseModel):
    """Resposta do health check."""
    status: str
    modelo_pronto: bool
    total_amostras_treino: int
