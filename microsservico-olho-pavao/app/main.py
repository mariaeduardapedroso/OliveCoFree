"""
Microsserviço de Previsão - Olho de Pavão (Spilocaea oleaginea)

Serviço independente que recebe dados climáticos de uma semana
e retorna a previsão de infeção por Olho de Pavão.

Modelo: Logistic Regression (Análise 3 do notebook)
Treino: Dados de campo 2021-2023 + clima de Mirandela
Porta: 8002
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .pipeline import preparar_dataset_treino
from .ml_models import ModeloOlhoPavao
from .routes import router, init_routes


modelo_global = ModeloOlhoPavao()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: carrega planilhas e treina o modelo."""
    print("\n" + "=" * 60)
    print("  MICROSSERVIÇO OLHO DE PAVÃO - Iniciando...")
    print("=" * 60)

    # 1. Preparar dataset de treino (planilhas → features)
    df_treino = preparar_dataset_treino()

    # 2. Treinar modelo
    modelo_global.treinar(df_treino)

    # 3. Passar modelo às rotas
    init_routes(modelo_global)

    print("\n  PRONTO! Swagger: http://127.0.0.1:8002/docs\n")

    yield

    print("[Shutdown] Microsserviço encerrado.")


app = FastAPI(
    title="Microsserviço Olho de Pavão",
    description=(
        "API de previsão de infeção por **Olho de Pavão** (*Spilocaea oleaginea*) "
        "em oliveiras.\n\n"
        "**Como usar:** Envie os dados climáticos da semana (temperatura, humidade, "
        "precipitação) no endpoint `POST /previsao` e receba a previsão de risco.\n\n"
        "**Modelo:** Logistic Regression treinado com dados de campo (2021-2023) "
        "e 15 features epidemiológicas."
    ),
    version="2.0.0",
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
