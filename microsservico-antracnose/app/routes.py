"""
Rotas da API - Microsservico Antracnose
"""
import pandas as pd
from fastapi import APIRouter, HTTPException, status
from .schemas import PrevisaoRequest, PrevisaoResponse, ModeloInfo, HealthResponse, RetreinoRequest
from .pipeline import calcular_features_do_input, preparar_dataset_com_novos_dados
from .config import FEATURES_MODELO, THRESHOLD_MEDIO, THRESHOLD_ALTO

router = APIRouter()

# Referencia global (inicializada no main.py)
modelo = None


def init_routes(_modelo):
    """Inicializa referencia do modelo nas rotas."""
    global modelo
    modelo = _modelo


@router.get("/health", response_model=HealthResponse, tags=["Sistema"])
async def health():
    """Verifica estado do servico."""
    return HealthResponse(
        status="healthy",
        modelo_pronto=modelo.pronto if modelo else False,
        total_amostras_treino=modelo.dataset_info.get('total_amostras', 0) if modelo else 0,
    )


@router.post("/previsao", response_model=PrevisaoResponse, tags=["Previsao"])
async def fazer_previsao(request: PrevisaoRequest):
    """
    Faz previsao de Antracnose a partir de dados climaticos.

    Envie os dados meteorologicos da semana e receba:
    - **percentual_infeccao**: probabilidade de infecao significativa (%)
    - **classificacao**: baixo, medio ou alto
    - **confianca**: confianca do modelo na previsao (%)
    """
    if not modelo or not modelo.pronto:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modelo ainda nao esta pronto. Aguarde a inicializacao."
        )

    # Calcular features epidemiologicas a partir dos dados climaticos
    features = calcular_features_do_input(
        semana=request.semana,
        temperatura_media=request.temperatura_media,
        temperatura_maxima=request.temperatura_maxima,
        temperatura_minima=request.temperatura_minima,
        humidade=request.humidade,
        precipitacao=request.precipitacao,
        velocidade_vento=request.velocidade_vento,
    )

    # Fazer previsao
    resultado = modelo.prever(features)

    return PrevisaoResponse(
        semana=request.semana,
        ano=request.ano,
        **resultado,
    )


@router.post("/modelo/retreinar", response_model=ModeloInfo, tags=["Modelo"])
async def retreinar_modelo(request: RetreinoRequest):
    """
    Retreina o modelo com novos dados enviados pelo pesquisador.
    Combina os dados novos com os dados originais do GitHub.
    """
    if not modelo:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modelo nao inicializado."
        )

    try:
        df_doenca = pd.DataFrame(request.dados_doenca)
        df_clima = pd.DataFrame(request.dados_clima)

        # Combinar dados novos com GitHub e retreinar
        df_treino = preparar_dataset_com_novos_dados(df_doenca, df_clima)
        modelo.treinar(df_treino)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erro ao retreinar modelo: {str(e)}"
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


@router.get("/modelo/info", response_model=ModeloInfo, tags=["Modelo"])
async def info_modelo():
    """Retorna informacoes sobre o modelo treinado e suas metricas."""
    if not modelo or not modelo.pronto:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modelo ainda nao esta pronto."
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
