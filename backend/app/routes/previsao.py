"""
Rotas de previsão
"""
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.previsao import (
    PrevisaoCreate,
    PrevisaoResponse,
    PrevisaoListResponse,
    PrevisaoSemanaAtualResponse,
    DoencaResponse
)
from ..services.previsao_service import (
    criar_previsao,
    listar_previsoes,
    contar_previsoes,
    obter_previsao,
    deletar_previsao,
    obter_ultima_previsao,
    obter_previsoes_semana_atual,
    listar_doencas,
    obter_anos_disponiveis
)
from ..services.auth_service import get_current_user
from ..models.usuario import Usuario

router = APIRouter(prefix="/previsoes", tags=["Previsões"])


@router.post("/", response_model=PrevisaoResponse, status_code=status.HTTP_201_CREATED)
async def criar_nova_previsao(
    previsao: PrevisaoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Cria uma nova previsão"""
    nova_previsao = criar_previsao(db, current_user.id, previsao)
    return nova_previsao


@router.get("/", response_model=PrevisaoListResponse)
async def listar(
    doenca_id: Optional[str] = Query(None, description="Filtrar por doença"),
    ano: Optional[int] = Query(None, description="Filtrar por ano"),
    pagina: int = Query(1, ge=1, description="Número da página"),
    tamanho: int = Query(10, ge=5, le=100, description="Itens por página"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Lista previsões do usuário com paginação"""
    import math
    offset = (pagina - 1) * tamanho
    total = contar_previsoes(db, current_user.id, doenca_id, ano)
    total_paginas = math.ceil(total / tamanho) if total > 0 else 1
    previsoes = listar_previsoes(db, current_user.id, doenca_id, ano, limite=tamanho, offset=offset)
    return PrevisaoListResponse(
        total=total,
        pagina=pagina,
        tamanho=tamanho,
        total_paginas=total_paginas,
        previsoes=previsoes
    )


@router.get("/ultima", response_model=Optional[PrevisaoResponse])
async def ultima_previsao(
    doenca_id: Optional[str] = Query(None, description="Filtrar por doença"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtém a última previsão do usuário"""
    previsao = obter_ultima_previsao(db, current_user.id, doenca_id)
    if not previsao:
        return None
    return previsao


@router.get("/anos", response_model=List[int])
async def anos_disponiveis(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Lista anos com previsões"""
    return obter_anos_disponiveis(db, current_user.id)


@router.get("/semana-atual", response_model=PrevisaoSemanaAtualResponse)
async def previsoes_semana_atual(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtém as previsões da semana atual para todas as doenças"""
    from datetime import date
    hoje = date.today()
    primeiro_dia = date(hoje.year, 1, 1)
    dias = (hoje - primeiro_dia).days
    semana = (dias + primeiro_dia.isoweekday()) // 7 + 1
    ano = hoje.year

    previsoes = obter_previsoes_semana_atual(db, current_user.id)
    return PrevisaoSemanaAtualResponse(
        semana=semana,
        ano=ano,
        previsoes=previsoes
    )


@router.get("/doencas", response_model=List[DoencaResponse])
async def listar_todas_doencas(db: Session = Depends(get_db)):
    """Lista todas as doenças disponíveis"""
    return listar_doencas(db)


@router.get("/{previsao_id}", response_model=PrevisaoResponse)
async def obter_por_id(
    previsao_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtém uma previsão específica"""
    previsao = obter_previsao(db, previsao_id, current_user.id)
    if not previsao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Previsão não encontrada"
        )
    return previsao


@router.delete("/{previsao_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar(
    previsao_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Deleta uma previsão"""
    deleted = deletar_previsao(db, previsao_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Previsão não encontrada"
        )
    return None
