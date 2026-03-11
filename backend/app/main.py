"""
OlhoPavao Backend - FastAPI Application

API para previsão de doenças em oliveiras.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import CORS_ORIGINS, API_HOST, API_PORT
from .database import engine, Base, SessionLocal
from .routes import clima_router, auth_router, previsao_router, pesquisador_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events"""
    # Startup
    from .models import Usuario, Previsao, Doenca

    # Criar tabelas
    Base.metadata.create_all(bind=engine)

    # Migração: adicionar colunas novas se não existirem
    from sqlalchemy import text
    with engine.connect() as conn:
        for col, col_type in [("tipo", "VARCHAR(50)"), ("propriedade", "VARCHAR(255)"), ("localizacao", "VARCHAR(255)")]:
            try:
                conn.execute(text(f"ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS {col} {col_type}"))
            except Exception:
                pass
        # Migração: novas colunas climáticas na tabela previsoes
        for col, col_type in [("temperatura_maxima", "NUMERIC(5,2)"), ("temperatura_minima", "NUMERIC(5,2)"), ("velocidade_vento", "NUMERIC(5,2)")]:
            try:
                conn.execute(text(f"ALTER TABLE previsoes ADD COLUMN IF NOT EXISTS {col} {col_type}"))
            except Exception:
                pass
        conn.commit()
    print("[OK] Migração de colunas verificada")

    # Inserir doenças padrão
    db = SessionLocal()
    try:
        doencas_padrao = [
            {
                "id": "olho-pavao",
                "nome": "Olho de Pavão",
                "nome_cientifico": "Spilocaea oleagina",
                "cor": "#ec4899",
                "threshold_baixo": 10.0,
                "threshold_alto": 15.0,
                "unidade": "folhas"
            },
            {
                "id": "antracnose",
                "nome": "Antracnose",
                "nome_cientifico": "Colletotrichum spp.",
                "cor": "#8b5cf6",
                "threshold_baixo": 8.0,
                "threshold_alto": 12.0,
                "unidade": "oliveiras"
            }
        ]

        for d in doencas_padrao:
            existing = db.query(Doenca).filter(Doenca.id == d["id"]).first()
            if not existing:
                doenca = Doenca(**d)
                db.add(doenca)

        db.commit()
        print("[OK] Banco de dados inicializado")
    except Exception as e:
        print(f"[ERRO] Erro ao inicializar banco: {e}")
    finally:
        db.close()

    yield
    # Shutdown
    print("[INFO] Encerrando aplicacao")


# Criar aplicação FastAPI
app = FastAPI(
    title="OlhoPavao API",
    description="""
    API para previsão de doenças em oliveiras.

    ## Funcionalidades

    * **Autenticação** - Registro e login de usuários
    * **Clima Atual** - Dados climáticos do dia de Mirandela
    * **Clima Semanal** - Médias climáticas por semana
    * **Previsões** - CRUD de previsões de infecção

    ## Doenças Suportadas

    * Olho de Pavão (Spilocaea oleagina)
    * Antracnose (Colletotrichum spp.)
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configurar CORS para permitir frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rotas
app.include_router(clima_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(previsao_router, prefix="/api")
app.include_router(pesquisador_router, prefix="/api")


@app.get("/")
async def root():
    """Endpoint raiz - informações da API"""
    return {
        "name": "OlhoPavao API",
        "version": "1.0.0",
        "description": "API para previsão de doenças em oliveiras",
        "docs": "/docs",
        "endpoints": {
            "auth": {
                "registrar": "POST /api/auth/registrar",
                "login": "POST /api/auth/login",
                "me": "GET /api/auth/me"
            },
            "previsoes": {
                "criar": "POST /api/previsoes/",
                "listar": "GET /api/previsoes/",
                "ultima": "GET /api/previsoes/ultima",
                "anos": "GET /api/previsoes/anos",
                "doencas": "GET /api/previsoes/doencas"
            },
            "clima": {
                "hoje": "/api/clima/hoje",
                "semana": "/api/clima/semana/{semana}",
                "semanas": "/api/clima/semanas?semanas=7-2026,8-2026",
                "semana_atual": "/api/clima/semana-atual"
            }
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=API_HOST, port=API_PORT)
