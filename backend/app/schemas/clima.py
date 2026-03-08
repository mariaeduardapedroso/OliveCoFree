"""
Schemas de dados climáticos (Pydantic)
"""

from pydantic import BaseModel
from typing import Optional
from datetime import date


class ClimaHoje(BaseModel):
    """Dados climáticos do dia atual - para Dashboard"""
    data: str
    temperatura: float
    temperatura_min: float
    temperatura_max: float
    humidade: float
    precipitacao: float
    vento: float
    condicao: str
    icone: str
    localizacao: str = "Mirandela, Portugal"


class ClimaSemana(BaseModel):
    """Médias climáticas da semana - para Previsão"""
    semana: int
    ano: int
    data_inicio: str
    data_fim: str
    temperatura_media: float
    temperatura_min: float
    temperatura_max: float
    humidade_media: float
    precipitacao_total: float
    vento_medio: float
    dias_com_chuva: int
    localizacao: str = "Mirandela, Portugal"


class ClimaPrevisaoInput(BaseModel):
    """Dados de entrada formatados para o modelo de previsão"""
    semana: int
    ano: int
    temperatura: float
    humidade: float
    precipitacao: float
    favorabilidade: float  # índice calculado


class ClimaResponse(BaseModel):
    """Resposta padrão da API"""
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None
