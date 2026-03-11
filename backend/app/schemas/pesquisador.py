"""
Schemas Pydantic para o Painel Cientifico (Pesquisador)
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class ModeloInfoItem(BaseModel):
    """Info de um modelo individual."""
    doenca_id: str
    modelo: str
    accuracy: float
    f1_score: float
    total_amostras_treino: int
    anos_treino: List[int]
    features_utilizadas: List[str]
    thresholds: dict


class ModeloInfoCombinado(BaseModel):
    """Info combinada de todos os modelos."""
    modelos: List[ModeloInfoItem]


class UploadResponse(BaseModel):
    """Resposta apos upload e retreino."""
    sucesso: bool
    mensagem: str
    metricas_antes: Optional[ModeloInfoItem] = None
    metricas_depois: ModeloInfoItem


class UploadHistoricoItem(BaseModel):
    """Item do historico de uploads."""
    id: UUID
    doenca_id: str
    usuario_nome: str
    data_upload: datetime
    amostras_doenca: int
    amostras_clima: int
    anos_dados: List[int]
    accuracy_antes: Optional[float] = None
    accuracy_depois: float
    f1_antes: Optional[float] = None
    f1_depois: float
    total_amostras_depois: int

    class Config:
        from_attributes = True
