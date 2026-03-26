"""
Modelos SQLAlchemy - Dados de Treino (doenca + clima)

Tabelas para armazenar dados de campo e climaticos
que alimentam o treino dos modelos de ML.
"""
from datetime import datetime

from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric

from ..database import Base


class DadosOlhoPavao(Base):
    __tablename__ = "dados_olho_pavao"

    id = Column(Integer, primary_key=True, autoincrement=True)
    data = Column(Date, nullable=False)
    repeticao = Column(Integer)
    arvore = Column(Integer)
    folha = Column(Integer)
    visiveis = Column(Integer)
    visiveis_latentes = Column(Integer)
    criado_em = Column(DateTime(timezone=True), default=datetime.utcnow)


class DadosAntracnose(Base):
    __tablename__ = "dados_antracnose"

    id = Column(Integer, primary_key=True, autoincrement=True)
    data = Column(Date, nullable=False)
    olival_parcela = Column(String(100))
    arvore = Column(Integer)
    azeitona = Column(Integer)
    severidade = Column(Numeric(8, 4))
    incidencia = Column(Numeric(8, 4))
    criado_em = Column(DateTime(timezone=True), default=datetime.utcnow)


class DadosClima(Base):
    __tablename__ = "dados_clima"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False)
    mes = Column(Integer, nullable=False)
    dia = Column(Integer, nullable=False)
    t_med = Column(Numeric(6, 2))
    t_max = Column(Numeric(6, 2))
    t_min = Column(Numeric(6, 2))
    hr_med = Column(Numeric(6, 2))
    ff_med = Column(Numeric(6, 2))
    pr_qtd = Column(Numeric(8, 2))
    criado_em = Column(DateTime(timezone=True), default=datetime.utcnow)
