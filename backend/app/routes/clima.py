"""
Rotas de Clima - API Endpoints

Endpoints para dados climáticos de Mirandela.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime

from ..services.clima_service import (
    obter_clima_hoje,
    obter_clima_semana,
    obter_clima_semanas
)

router = APIRouter(prefix="/clima", tags=["Clima"])


@router.get("/hoje")
async def get_clima_hoje():
    """
    Retorna dados climáticos do dia atual de Mirandela.

    Usado no Dashboard para mostrar condições climáticas atuais.

    Returns:
        - temperatura: Temperatura atual (°C)
        - temperatura_min/max: Min e máx do dia (°C)
        - humidade: Humidade relativa (%)
        - precipitacao: Precipitação (mm)
        - vento: Velocidade do vento (km/h)
        - condicao: Descrição do tempo
        - icone: Ícone do clima
        - favorabilidade: Índice de favorabilidade para Olho de Pavão (0-100)
    """
    dados = await obter_clima_hoje()

    if not dados:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível obter dados climáticos"
        )

    return {
        "success": True,
        "data": dados
    }


@router.get("/semana/{semana}")
async def get_clima_semana(
    semana: int,
    ano: Optional[int] = Query(default=None, description="Ano (default: ano atual)")
):
    """
    Retorna médias climáticas de uma semana específica.

    Usado na Previsão para obter dados de entrada do modelo.

    Args:
        semana: Número da semana (1-52)
        ano: Ano (opcional, default: ano atual)

    Returns:
        - temperatura_media: Temperatura média da semana (°C)
        - humidade_media: Humidade média (%)
        - precipitacao_total: Precipitação total da semana (mm)
        - favorabilidade: Índice de favorabilidade (0-100)
    """
    if semana < 1 or semana > 52:
        raise HTTPException(
            status_code=400,
            detail="Semana deve estar entre 1 e 52"
        )

    if ano is None:
        ano = datetime.now().year

    dados = await obter_clima_semana(semana, ano)

    if not dados:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível obter dados climáticos da semana"
        )

    return {
        "success": True,
        "data": dados
    }


@router.get("/semanas")
async def get_clima_varias_semanas(
    semanas: str = Query(
        ...,
        description="Semanas no formato 'semana-ano,semana-ano' (ex: '7-2026,8-2026,9-2026')"
    )
):
    """
    Retorna médias climáticas de várias semanas.

    Útil para buscar dados de múltiplas semanas de uma vez.

    Args:
        semanas: String com semanas no formato "semana-ano,semana-ano"

    Returns:
        Lista de dados climáticos por semana
    """
    try:
        lista_semanas = []
        for item in semanas.split(","):
            partes = item.strip().split("-")
            if len(partes) != 2:
                raise ValueError(f"Formato inválido: {item}")
            semana = int(partes[0])
            ano = int(partes[1])
            if semana < 1 or semana > 52:
                raise ValueError(f"Semana inválida: {semana}")
            lista_semanas.append((semana, ano))
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Formato inválido. Use 'semana-ano,semana-ano'. Erro: {str(e)}"
        )

    dados = await obter_clima_semanas(lista_semanas)

    return {
        "success": True,
        "data": dados
    }


@router.get("/semana-atual")
async def get_semana_atual():
    """
    Retorna informações sobre a semana atual.

    Returns:
        - semana: Número da semana atual
        - ano: Ano atual
    """
    hoje = datetime.now()
    semana = hoje.isocalendar()[1]
    ano = hoje.year

    return {
        "success": True,
        "data": {
            "semana": semana,
            "ano": ano,
            "data": hoje.strftime("%Y-%m-%d")
        }
    }
