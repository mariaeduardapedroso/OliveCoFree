# OlhoPavao Backend - FastAPI

Backend MVP para o sistema de previsão de Olho de Pavão em oliveiras.

## Estrutura do Projeto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # Aplicação FastAPI
│   ├── config.py        # Configurações
│   ├── routes/          # Endpoints da API
│   │   ├── __init__.py
│   │   └── clima.py     # Rotas de clima
│   ├── services/        # Lógica de negócio
│   │   ├── __init__.py
│   │   └── clima_service.py  # Integração Open-Meteo
│   ├── models/          # Modelos de dados (futuro)
│   └── schemas/         # Schemas Pydantic
│       └── clima.py
├── requirements.txt
├── run.py               # Script para rodar
└── README.md
```

## Instalação

1. Criar ambiente virtual:
```bash
cd backend
python -m venv venv
```

2. Ativar ambiente virtual:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Instalar dependências:
```bash
pip install -r requirements.txt
```

## Executar

```bash
python run.py
```

Ou diretamente com uvicorn:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Documentação
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Endpoints Disponíveis

#### GET /api/clima/hoje
Retorna dados climáticos atuais de Mirandela.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "data": "2026-02-13",
    "temperatura": 12.5,
    "temperatura_min": 8.2,
    "temperatura_max": 15.1,
    "humidade": 78.0,
    "precipitacao": 2.3,
    "vento": 12.5,
    "condicao": "Parcialmente nublado",
    "icone": "cloud-sun",
    "localizacao": "Mirandela, Portugal",
    "favorabilidade": 65.2
  }
}
```

#### GET /api/clima/semana/{semana}
Retorna médias climáticas de uma semana específica.

**Parâmetros:**
- `semana`: Número da semana (1-52)
- `ano` (query, opcional): Ano (default: ano atual)

**Exemplo:** `/api/clima/semana/7?ano=2026`

**Resposta:**
```json
{
  "success": true,
  "data": {
    "semana": 7,
    "ano": 2026,
    "data_inicio": "2026-02-09",
    "data_fim": "2026-02-15",
    "temperatura_media": 11.8,
    "temperatura_min": 5.2,
    "temperatura_max": 16.3,
    "humidade_media": 75.5,
    "precipitacao_total": 18.2,
    "vento_medio": 14.3,
    "dias_com_chuva": 3,
    "localizacao": "Mirandela, Portugal",
    "favorabilidade": 62.8
  }
}
```

#### GET /api/clima/semana-atual
Retorna informações da semana atual.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "semana": 7,
    "ano": 2026,
    "data": "2026-02-13"
  }
}
```

## Fonte de Dados

Os dados climáticos são obtidos da API **Open-Meteo** (gratuita, sem necessidade de API key).

**Coordenadas de Mirandela:**
- Latitude: 41.4833
- Longitude: -7.1833

## Índice de Favorabilidade

O índice de favorabilidade (0-100) indica quão favoráveis são as condições para o desenvolvimento do fungo Spilocaea oleagina:

- **0-30**: Condições desfavoráveis (risco baixo)
- **30-60**: Condições moderadas (risco médio)
- **60-100**: Condições favoráveis (risco alto)

Condições ideais para o fungo:
- Temperatura: 15-20°C
- Humidade: >80%
