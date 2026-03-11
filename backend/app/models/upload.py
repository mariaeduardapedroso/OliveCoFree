"""
Modelo SQLAlchemy - Upload de Dados (historico de uploads do pesquisador)
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ..database import Base


class UploadDados(Base):
    __tablename__ = "uploads_dados"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    doenca_id = Column(String(50), nullable=False)
    amostras_doenca = Column(Integer, nullable=False)
    amostras_clima = Column(Integer, nullable=False)
    anos_dados = Column(String(255), nullable=False)  # JSON string "[2021, 2022]"
    accuracy_antes = Column(Numeric(5, 4), nullable=True)
    accuracy_depois = Column(Numeric(5, 4), nullable=False)
    f1_antes = Column(Numeric(5, 4), nullable=True)
    f1_depois = Column(Numeric(5, 4), nullable=False)
    total_amostras_depois = Column(Integer, nullable=False, default=0)
    criado_em = Column(DateTime(timezone=True), default=datetime.utcnow)

    usuario = relationship("Usuario")
