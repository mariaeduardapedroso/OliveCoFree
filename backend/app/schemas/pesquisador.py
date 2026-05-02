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
    # Metricas no dataset completo
    accuracy: float
    f1_score: float
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2: Optional[float] = None
    # Metricas por janela deslizante (validacao temporal)
    mae_sliding_window: Optional[float] = None
    rmse_sliding_window: Optional[float] = None
    r2_sliding_window: Optional[float] = None
    accuracy_sliding_window: Optional[float] = None
    f1_score_sliding_window: Optional[float] = None
    # Pesos do ensemble calculados por IVW
    pesos_ensemble: Optional[dict] = None
    # Metadados
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
