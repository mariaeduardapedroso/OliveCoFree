"""
Serviço de Previsão
"""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
import random

from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.previsao import Previsao
from ..models.doenca import Doenca
from ..schemas.previsao import PrevisaoCreate


def calcular_risco(percentual: float, doenca_id: str, db: Session) -> str:
    """Calcula o nível de risco baseado nos thresholds da doença"""
    doenca = db.query(Doenca).filter(Doenca.id == doenca_id).first()
    if not doenca:
        # Valores padrão
        if percentual >= 15:
            return "alto"
        elif percentual >= 10:
            return "medio"
        return "baixo"

    if percentual >= float(doenca.threshold_alto):
        return "alto"
    elif percentual >= float(doenca.threshold_baixo):
        return "medio"
    return "baixo"


def calcular_previsao_mock(temperatura: float, humidade: float, precipitacao: float, doenca_id: str) -> float:
    """
    Calcula previsão mock baseada nos dados climáticos.
    Em produção, isso seria substituído pelo modelo ML real.
    """
    percentual = 0

    if doenca_id == 'olho-pavao':
        # Olho de Pavão: Temperatura ótima 15-20°C, humidade alta
        if 15 <= temperatura <= 20:
            percentual += 10
        elif 10 <= temperatura <= 25:
            percentual += 5

        if humidade >= 80:
            percentual += 12
        elif humidade >= 70:
            percentual += 6
        elif humidade >= 60:
            percentual += 2

        if precipitacao >= 30:
            percentual += 8
        elif precipitacao >= 15:
            percentual += 4
        elif precipitacao >= 5:
            percentual += 2
    else:
        # Antracnose: Temperatura ótima 10-25°C, favorece mais com chuva
        if 15 <= temperatura <= 22:
            percentual += 8
        elif 10 <= temperatura <= 25:
            percentual += 4

        if humidade >= 85:
            percentual += 10
        elif humidade >= 75:
            percentual += 5
        elif humidade >= 65:
            percentual += 2

        if precipitacao >= 40:
            percentual += 10
        elif precipitacao >= 20:
            percentual += 6
        elif precipitacao >= 8:
            percentual += 3

    # Adicionar variação aleatória para simular incerteza
    variacao = (random.random() - 0.5) * 6
    percentual = max(0, min(100, percentual + variacao))

    return round(percentual, 1)


def criar_previsao(
    db: Session,
    usuario_id: UUID,
    previsao_data: PrevisaoCreate
) -> Previsao:
    """Cria uma nova previsão"""
    # Calcular percentual de infecção (mock por enquanto)
    percentual = calcular_previsao_mock(
        previsao_data.temperatura or 15.0,
        previsao_data.humidade or 70.0,
        previsao_data.precipitacao or 10.0,
        previsao_data.doenca_id
    )

    # Calcular risco
    risco = calcular_risco(percentual, previsao_data.doenca_id, db)

    # Calcular confiança (mock)
    confianca = random.randint(75, 95)

    # Calcular data baseada na semana/ano
    from datetime import timedelta
    primeiro_dia_ano = date(previsao_data.ano, 1, 1)
    dias_ate_semana = (previsao_data.semana - 1) * 7
    data_previsao = primeiro_dia_ano + timedelta(days=dias_ate_semana)

    # Criar previsão
    db_previsao = Previsao(
        usuario_id=usuario_id,
        doenca_id=previsao_data.doenca_id,
        data=data_previsao,
        semana=previsao_data.semana,
        ano=previsao_data.ano,
        percentual_infectadas=percentual,
        risco=risco,
        temperatura=previsao_data.temperatura,
        temperatura_maxima=previsao_data.temperatura_maxima,
        temperatura_minima=previsao_data.temperatura_minima,
        humidade=previsao_data.humidade,
        precipitacao=previsao_data.precipitacao,
        velocidade_vento=previsao_data.velocidade_vento,
        confianca=confianca
    )

    db.add(db_previsao)
    db.commit()
    db.refresh(db_previsao)

    return db_previsao


def _build_query_previsoes(db: Session, usuario_id: UUID, doenca_id: Optional[str] = None, ano: Optional[int] = None):
    """Constrói query base para previsões com filtros"""
    query = db.query(Previsao).filter(Previsao.usuario_id == usuario_id)

    if doenca_id:
        query = query.filter(Previsao.doenca_id == doenca_id)

    if ano:
        query = query.filter(Previsao.ano == ano)

    return query


def contar_previsoes(
    db: Session,
    usuario_id: UUID,
    doenca_id: Optional[str] = None,
    ano: Optional[int] = None
) -> int:
    """Conta total de previsões do usuário com filtros opcionais"""
    return _build_query_previsoes(db, usuario_id, doenca_id, ano).count()


def listar_previsoes(
    db: Session,
    usuario_id: UUID,
    doenca_id: Optional[str] = None,
    ano: Optional[int] = None,
    limite: int = 100,
    offset: int = 0
) -> List[Previsao]:
    """Lista previsões do usuário com filtros opcionais e paginação"""
    query = _build_query_previsoes(db, usuario_id, doenca_id, ano)
    return query.order_by(desc(Previsao.criado_em)).offset(offset).limit(limite).all()


def obter_previsao(db: Session, previsao_id: UUID, usuario_id: UUID) -> Optional[Previsao]:
    """Obtém uma previsão específica"""
    return db.query(Previsao).filter(
        Previsao.id == previsao_id,
        Previsao.usuario_id == usuario_id
    ).first()


def deletar_previsao(db: Session, previsao_id: UUID, usuario_id: UUID) -> bool:
    """Deleta uma previsão"""
    previsao = obter_previsao(db, previsao_id, usuario_id)
    if not previsao:
        return False

    db.delete(previsao)
    db.commit()
    return True


def obter_ultima_previsao(db: Session, usuario_id: UUID, doenca_id: Optional[str] = None) -> Optional[Previsao]:
    """Obtém a última previsão do usuário"""
    query = db.query(Previsao).filter(Previsao.usuario_id == usuario_id)

    if doenca_id:
        query = query.filter(Previsao.doenca_id == doenca_id)

    return query.order_by(desc(Previsao.criado_em)).first()


def obter_previsoes_semana_atual(db: Session, usuario_id: UUID) -> List[Previsao]:
    """Obtém as previsões da semana atual para todas as doenças"""
    from datetime import date
    hoje = date.today()
    primeiro_dia = date(hoje.year, 1, 1)
    dias = (hoje - primeiro_dia).days
    semana = (dias + primeiro_dia.isoweekday()) // 7 + 1
    ano = hoje.year

    # Buscar previsões da semana atual (a mais recente de cada doença)
    doencas_ids = db.query(Previsao.doenca_id).filter(
        Previsao.usuario_id == usuario_id
    ).distinct().all()

    resultados = []
    for (doenca_id,) in doencas_ids:
        previsao = db.query(Previsao).filter(
            Previsao.usuario_id == usuario_id,
            Previsao.doenca_id == doenca_id,
            Previsao.semana == semana,
            Previsao.ano == ano
        ).order_by(desc(Previsao.criado_em)).first()

        if previsao:
            resultados.append(previsao)

    return resultados


def listar_doencas(db: Session) -> List[Doenca]:
    """Lista todas as doenças"""
    return db.query(Doenca).all()


def obter_anos_disponiveis(db: Session, usuario_id: UUID) -> List[int]:
    """Obtém lista de anos com previsões"""
    result = db.query(Previsao.ano).filter(
        Previsao.usuario_id == usuario_id
    ).distinct().order_by(desc(Previsao.ano)).all()

    return [r[0] for r in result]
