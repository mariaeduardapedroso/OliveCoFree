"""
Serviço de Previsão
"""
from datetime import date, datetime, timedelta
from typing import List, Optional
from uuid import UUID
import httpx
import logging

from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.previsao import Previsao
from ..models.doenca import Doenca
from ..schemas.previsao import PrevisaoCreate
from ..config import MICROSSERVICO_OLHO_PAVAO_URL, MICROSSERVICO_ANTRACNOSE_URL
from .clima_service import obter_clima_semana

logger = logging.getLogger(__name__)


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


_MICROSSERVICO_URLS = {
    "olho-pavao": MICROSSERVICO_OLHO_PAVAO_URL,
    "antracnose": MICROSSERVICO_ANTRACNOSE_URL,
}


def _calcular_semana_anterior(semana: int, ano: int) -> tuple[int, int]:
    """Devolve (semana_anterior, ano_anterior). Se semana=1 -> (52, ano-1)."""
    if semana <= 1:
        return 52, ano - 1
    return semana - 1, ano


def _ultima_semana_forecast() -> tuple[int, int]:
    """
    Devolve (semana, ano) da ultima semana ISO completa coberta pela
    Open-Meteo forecast (today + 15 dias, dado que forecast_days=16
    inclui o dia de hoje).
    """
    hoje = datetime.now()
    limite = hoje + timedelta(days=15)
    ano_iso, semana_iso, _ = limite.isocalendar()
    # Se o Domingo (dia 7) da semana ISO de `limite` cair alem do limite,
    # recuamos para a semana anterior (que esta totalmente disponivel).
    domingo = datetime.fromisocalendar(ano_iso, semana_iso, 7)
    if domingo > limite:
        domingo_anterior = domingo - timedelta(days=7)
        ano_iso, semana_iso, _ = domingo_anterior.isocalendar()
    return semana_iso, ano_iso


def _clamp_semana_para_forecast(
    semana: int, ano: int
) -> tuple[int, int, bool]:
    """
    Se (semana, ano) for futura demais para a Open-Meteo, devolve a ultima
    semana com forecast disponivel.

    Returns:
        (semana_a_usar, ano_a_usar, foi_clamped)
    """
    semana_lim, ano_lim = _ultima_semana_forecast()
    monday_pedida = datetime.fromisocalendar(ano, semana, 1)
    monday_limite = datetime.fromisocalendar(ano_lim, semana_lim, 1)
    if monday_pedida > monday_limite:
        return semana_lim, ano_lim, True
    return semana, ano, False


async def chamar_microsservico(
    doenca_id: str,
    semana: int,
    ano: int,
    temperatura: float,
    temperatura_maxima: float,
    temperatura_minima: float,
    humidade: float,
    precipitacao: float,
    velocidade_vento: float,
    temperatura_media_anterior: float,
    humidade_anterior: float,
    precipitacao_anterior: float,
) -> dict:
    """Chama o microsserviço de previsão correspondente à doença."""
    base_url = _MICROSSERVICO_URLS.get(doenca_id)
    if not base_url:
        raise Exception(f"Doença desconhecida: {doenca_id}")

    payload = {
        "semana": semana,
        "ano": ano,
        "temperatura_media": temperatura,
        "temperatura_maxima": temperatura_maxima,
        "temperatura_minima": temperatura_minima,
        "humidade": humidade,
        "precipitacao": precipitacao,
        "velocidade_vento": velocidade_vento or 0.0,
        "temperatura_media_anterior": temperatura_media_anterior,
        "humidade_anterior": humidade_anterior,
        "precipitacao_anterior": precipitacao_anterior,
    }

    url = f"{base_url}/previsao"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=30.0)
            response.raise_for_status()
            return response.json()
    except httpx.ConnectError:
        logger.error(f"Microsserviço {doenca_id} indisponível em {url}")
        raise Exception(
            f"Microsserviço de {doenca_id} não está disponível. "
            f"Verifique se está em execução em {base_url}."
        )
    except httpx.TimeoutException:
        logger.error(f"Timeout ao chamar microsserviço {doenca_id} em {url}")
        raise Exception(f"Microsserviço de {doenca_id} demorou demais a responder.")
    except httpx.HTTPStatusError as e:
        logger.error(f"Erro HTTP {e.response.status_code} do microsserviço {doenca_id}")
        raise Exception(f"Erro ao chamar microsserviço de {doenca_id}: {e.response.status_code}")


async def criar_previsao(
    db: Session,
    usuario_id: UUID,
    previsao_data: PrevisaoCreate
) -> Previsao:
    """Cria uma nova previsão chamando o microsserviço correspondente."""
    # Buscar clima da semana anterior (lags) - estrito: falha 503 se Open-Meteo cair.
    # Se a semana anterior estiver alem do range de forecast da Open-Meteo
    # (~16 dias no futuro), fazemos clamp para a ultima semana disponivel.
    semana_ant, ano_ant = _calcular_semana_anterior(
        previsao_data.semana, previsao_data.ano
    )
    semana_busca, ano_busca, foi_clamped = _clamp_semana_para_forecast(
        semana_ant, ano_ant
    )
    if foi_clamped:
        logger.warning(
            f"Semana anterior {semana_ant}/{ano_ant} alem do range Open-Meteo. "
            f"Usando forecast da semana {semana_busca}/{ano_busca} como aproximacao."
        )
    try:
        clima_anterior = await obter_clima_semana(
            semana_busca, ano_busca, permitir_mock=False
        )
    except Exception as e:
        logger.error(
            f"Open-Meteo indisponivel para semana {semana_busca}/{ano_busca}: {e}"
        )
        raise Exception(
            "Nao conseguimos obter o clima da semana anterior necessario "
            "para a previsao. Por favor, tenta de novo daqui a alguns instantes."
        )

    resultado = await chamar_microsservico(
        doenca_id=previsao_data.doenca_id,
        semana=previsao_data.semana,
        ano=previsao_data.ano,
        temperatura=previsao_data.temperatura or 15.0,
        temperatura_maxima=previsao_data.temperatura_maxima or 20.0,
        temperatura_minima=previsao_data.temperatura_minima or 10.0,
        humidade=previsao_data.humidade or 70.0,
        precipitacao=previsao_data.precipitacao or 10.0,
        velocidade_vento=previsao_data.velocidade_vento or 0.0,
        temperatura_media_anterior=clima_anterior["temperatura_media"],
        humidade_anterior=clima_anterior["humidade_media"],
        precipitacao_anterior=clima_anterior["precipitacao_media"],
    )

    percentual = resultado["percentual_infeccao"]
    risco = resultado["classificacao"]
    confianca = round(resultado["confianca"])

    primeiro_dia_ano = date(previsao_data.ano, 1, 1)
    dias_ate_semana = (previsao_data.semana - 1) * 7
    data_previsao = primeiro_dia_ano + timedelta(days=dias_ate_semana)

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
