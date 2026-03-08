"""
Rotas da API - Microsserviço Olho de Pavão
"""
from fastapi import APIRouter, HTTPException, status
from .schemas import PrevisaoRequest, PrevisaoResponse, ModeloInfo, HealthResponse
from .pipeline import calcular_features_do_input
from .config import FEATURES_MODELO, THRESHOLD_MEDIO, THRESHOLD_ALTO

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
    )

    # Fazer previsão
    resultado = modelo.prever(features)

    return PrevisaoResponse(
        semana=request.semana,
        ano=request.ano,
        **resultado,
    )


@router.get("/modelo/info", response_model=ModeloInfo, tags=["Modelo"])
async def info_modelo():
    """Retorna informações sobre o modelo treinado e suas métricas."""
    if not modelo or not modelo.pronto:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modelo ainda não está pronto."
        )

    return ModeloInfo(
        modelo=modelo.metricas.get('modelo', ''),
        accuracy=modelo.metricas.get('accuracy', 0),
        f1_score=modelo.metricas.get('f1_score', 0),
        total_amostras_treino=modelo.dataset_info.get('total_amostras', 0),
        anos_treino=modelo.dataset_info.get('anos', []),
        features_utilizadas=modelo.features_utilizadas,
        thresholds={
            'baixo': f'< {THRESHOLD_MEDIO}%',
            'medio': f'{THRESHOLD_MEDIO}% - {THRESHOLD_ALTO}%',
            'alto': f'>= {THRESHOLD_ALTO}%',
        },
    )
