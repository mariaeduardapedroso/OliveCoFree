"""
Rotas da API - Microsserviço Olho de Pavão
"""
import pandas as pd
from fastapi import APIRouter, HTTPException, status
from .schemas import PrevisaoRequest, PrevisaoResponse, ModeloInfo, HealthResponse
from .pipeline import calcular_features_do_input, preparar_dataset_treino
from .config import THRESHOLD_MEDIO, THRESHOLD_ALTO

router = APIRouter()

# Referência global (inicializada no main.py)
modelo = None


def init_routes(_modelo):
    """Inicializa referência do modelo nas rotas."""
    global modelo
    modelo = _modelo


@router.get("/health", response_model=HealthResponse, tags=["Sistema"])
async def health():
    """Verifica estado do serviço."""
    return HealthResponse(
        status="healthy",
        modelo_pronto=modelo.pronto if modelo else False,
        total_amostras_treino=modelo.dataset_info.get('total_amostras', 0) if modelo else 0,
    )


@router.post("/previsao", response_model=PrevisaoResponse, tags=["Previsão"])
async def fazer_previsao(request: PrevisaoRequest):
    """
    Faz previsão de Olho de Pavão a partir de dados climáticos.

    Envie os dados meteorológicos da semana e receba:
    - **percentual_infeccao**: probabilidade de infeção significativa (%)
    - **classificacao**: baixo, medio ou alto
    - **confianca**: confiança do modelo na previsão (%)
    """
    if not modelo or not modelo.pronto:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modelo ainda não está pronto. Aguarde a inicialização."
        )

    # Calcular features epidemiológicas a partir dos dados climáticos
    features = calcular_features_do_input(
        semana=request.semana,
        temperatura_media=request.temperatura_media,
        temperatura_maxima=request.temperatura_maxima,
        temperatura_minima=request.temperatura_minima,
        humidade=request.humidade,
        precipitacao=request.precipitacao,
        velocidade_vento=request.velocidade_vento,
        temperatura_media_anterior=request.temperatura_media_anterior,
        humidade_anterior=request.humidade_anterior,
        precipitacao_anterior=request.precipitacao_anterior,
        features_selecionadas=modelo.features_utilizadas,
    )

    # Fazer previsão
    resultado = modelo.prever(features)

    return PrevisaoResponse(
        semana=request.semana,
        ano=request.ano,
        **resultado,
    )


@router.post("/modelo/retreinar", response_model=ModeloInfo, tags=["Modelo"])
async def retreinar_modelo():
    """
    Retreina o modelo com todos os dados do banco de dados.
    Os dados novos ja foram inseridos pelo backend antes de chamar este endpoint.
    """
    if not modelo:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modelo não inicializado."
        )

    try:
        # Le todos os dados do banco e retreina
        df_treino = preparar_dataset_treino()
        modelo.treinar(df_treino)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erro ao retreinar modelo: {str(e)}"
        )

    return _build_modelo_info()


@router.get("/modelo/info", response_model=ModeloInfo, tags=["Modelo"])
async def info_modelo():
    """Retorna informações sobre o modelo treinado e suas métricas."""
    if not modelo or not modelo.pronto:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modelo ainda não está pronto."
        )
    return _build_modelo_info()


def _build_modelo_info() -> ModeloInfo:
    """Constrói o objeto ModeloInfo a partir das métricas do modelo."""
    m = modelo.metricas
    return ModeloInfo(
        modelo=m.get('modelo', ''),
        accuracy=m.get('accuracy', 0),
        f1_score=m.get('f1_score', 0),
        mae=m.get('mae'),
        rmse=m.get('rmse'),
        r2=m.get('r2'),
        mae_sliding_window=m.get('mae_sliding_window'),
        rmse_sliding_window=m.get('rmse_sliding_window'),
        r2_sliding_window=m.get('r2_sliding_window'),
        accuracy_sliding_window=m.get('accuracy_sliding_window'),
        f1_score_sliding_window=m.get('f1_score_sliding_window'),
        pesos_ensemble=m.get('pesos_ensemble'),
        total_amostras_treino=modelo.dataset_info.get('total_amostras', 0),
        anos_treino=modelo.dataset_info.get('anos', []),
        features_utilizadas=modelo.features_utilizadas,
        thresholds={
            'baixo': f'< {THRESHOLD_MEDIO}%',
            'medio': f'{THRESHOLD_MEDIO}% - {THRESHOLD_ALTO}%',
            'alto': f'>= {THRESHOLD_ALTO}%',
        },
    )
