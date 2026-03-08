"""
Configurações do Backend OlhoPavao
"""
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Coordenadas de Mirandela, Portugal
MIRANDELA_COORDS = {
    "latitude": 41.4833,
    "longitude": -7.1833
}

# URL da API Open-Meteo
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# Configurações do servidor
API_HOST = "0.0.0.0"
API_PORT = 8001

# CORS - permitir frontend
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

# Configuração do banco de dados Supabase
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:KVcnIJFAJukxUMTw@db.hjvomnrmsfyeiseuslds.supabase.co:5432/postgres"
)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "olhopavao-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas
PASSWORD_RESET_EXPIRE_MINUTES = 15  # Token de recuperação: 15 minutos

# SMTP Configuration (para recuperação de senha)
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "OliveCoFree")

# Frontend URL (para links de recuperação de senha)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
