"""
Schemas Pydantic para Previsão
"""
from datetime import date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field
from decimal import Decimal


class PrevisaoBase(BaseModel):
    doenca_id: str = Field(..., description="ID da doença (olho-pavao ou antracnose)")
    semana: int = Field(..., ge=1, le=53)
    ano: int = Field(..., ge=2020, le=2100)
    temperatura: Optional[float] = Field(None, description="Temperatura média (°C)")
    temperatura_maxima: Optional[float] = Field(None, description="Temperatura máxima (°C)")
    temperatura_minima: Optional[float] = Field(None, description="Temperatura mínima (°C)")
    humidade: Optional[float] = Field(None, description="Humidade relativa (%)")
    precipitacao: Optional[float] = Field(None, description="Precipitação média diária (mm)")
    velocidade_vento: Optional[float] = Field(None, description="Velocidade do vento (m/s)")


class PrevisaoCreate(PrevisaoBase):
    pass


class PrevisaoResponse(PrevisaoBase):
    id: UUID
    usuario_id: UUID
    data: date
    percentual_infectadas: float
    risco: str
    confianca: Optional[int] = None
    criado_em: datetime

    class Config:
        from_attributes = True


class PrevisaoListResponse(BaseModel):
    total: int
    pagina: int
    tamanho: int
    total_paginas: int
    previsoes: List[PrevisaoResponse]


class PrevisaoSemanaAtualResponse(BaseModel):
    semana: int
    ano: int
    previsoes: List[PrevisaoResponse]


class DoencaResponse(BaseModel):
    id: str
    nome: str
    nome_cientifico: Optional[str]
    cor: str
    threshold_baixo: float
    threshold_alto: float
    unidade: str

    class Config:
        from_attributes = True
