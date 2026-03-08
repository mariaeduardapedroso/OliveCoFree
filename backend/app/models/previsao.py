"""
Modelo de Previsão
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ..database import Base


class Previsao(Base):
    __tablename__ = "previsoes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    doenca_id = Column(String(50), ForeignKey("doencas.id"), nullable=False)
    data = Column(Date, nullable=False)
    semana = Column(Integer, nullable=False)
    ano = Column(Integer, nullable=False)
    percentual_infectadas = Column(Numeric(5, 2), nullable=False)
    risco = Column(String(10), nullable=False)
    temperatura = Column(Numeric(5, 2))
    temperatura_maxima = Column(Numeric(5, 2))
    temperatura_minima = Column(Numeric(5, 2))
    humidade = Column(Numeric(5, 2))
    precipitacao = Column(Numeric(7, 2))
    velocidade_vento = Column(Numeric(5, 2))
    confianca = Column(Integer)
    criado_em = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Constraints
    __table_args__ = (
        CheckConstraint('semana >= 1 AND semana <= 53', name='check_semana'),
        CheckConstraint('ano >= 2020 AND ano <= 2100', name='check_ano'),
        CheckConstraint('percentual_infectadas >= 0 AND percentual_infectadas <= 100', name='check_percentual'),
        CheckConstraint("risco IN ('baixo', 'medio', 'alto')", name='check_risco'),
    )

    # Relacionamentos
    usuario = relationship("Usuario", back_populates="previsoes")
    doenca = relationship("Doenca", back_populates="previsoes")

    def __repr__(self):
        return f"<Previsao(id={self.id}, semana={self.semana}/{self.ano}, risco={self.risco})>"
