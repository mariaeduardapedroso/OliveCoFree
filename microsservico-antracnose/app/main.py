"""
Microsservico de Previsao - Antracnose (Colletotrichum spp.)

Servico independente que recebe dados climaticos de uma semana
e retorna a previsao de infecao por Antracnose.

Modelo: Logistic Regression (abordagem hibrida)
Treino: Dados de campo 2024-2025 (GitHub) + clima de Mirandela
Porta: 8003
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .pipeline import preparar_dataset_treino
from .ml_models import ModeloAntracnose
from .routes import router, init_routes


modelo_global = ModeloAntracnose()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: carrega dados do GitHub e treina o modelo."""
    print("\n" + "=" * 60)
    print("  MICROSSERVICO ANTRACNOSE - Iniciando...")
    print("=" * 60)

    # 1. Preparar dataset de treino (GitHub -> features)
    df_treino = preparar_dataset_treino()

    # 2. Treinar modelo
    modelo_global.treinar(df_treino)

    # 3. Passar modelo as rotas
    init_routes(modelo_global)

    print("\n  PRONTO! Swagger: http://127.0.0.1:8003/docs\n")

    yield

    print("[Shutdown] Microsservico encerrado.")


app = FastAPI(
    title="Microsservico Antracnose",
    description=(
        "API de previsao de infecao por **Antracnose** (*Colletotrichum spp.*) "
        "em oliveiras.\n\n"
        "**Como usar:** Envie os dados climaticos da semana (temperatura, humidade, "
        "precipitacao) no endpoint `POST /previsao` e receba a previsao de risco.\n\n"
        "**Modelo:** Logistic Regression treinado com dados de campo (2024-2025) "
        "e features epidemiologicas.\n\n"
        "**Dados:** Carregados diretamente do repositorio GitHub."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
