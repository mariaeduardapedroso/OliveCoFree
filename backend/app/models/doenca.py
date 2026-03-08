"""
Modelo de Doença
"""
from datetime import datetime
from sqlalchemy import Column, String, Numeric, DateTime
from sqlalchemy.orm import relationship

from ..database import Base


class Doenca(Base):
    __tablename__ = "doencas"

    id = Column(String(50), primary_key=True)
    nome = Column(String(100), nullable=False)
    nome_cientifico = Column(String(150))
    cor = Column(String(7), default='#22c55e')
    threshold_baixo = Column(Numeric(5, 2), default=10.0)
    threshold_alto = Column(Numeric(5, 2), default=15.0)
    unidade = Column(String(50), default='folhas')
    criado_em = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relacionamento com previsões
    previsoes = relationship("Previsao", back_populates="doenca")

    def __repr__(self):
        return f"<Doenca(id={self.id}, nome={self.nome})>"
