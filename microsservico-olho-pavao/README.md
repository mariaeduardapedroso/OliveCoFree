# Microsservico Olho de Pavao - OliveCoFree

Microsservico de Machine Learning para previsao de infecao por Olho de Pavao (*Spilocaea oleagina*) em oliveiras.

## Arquitetura ML

### Ensemble (RF + XGBoost + Ridge)

| Modelo | Peso | Configuracao |
|---|---|---|
| Random Forest Regressor | 40% | 100 estimators, max_depth=5, min_samples_leaf=3 |
| XGBoost Regressor | 40% | 50 estimators, max_depth=3, learning_rate=0.1 |
| Ridge Regression | 20% | alpha=1.0 |

### Pipeline

1. **Dados** - Carrega dados de `dados_olho_pavao` e `dados_clima` do PostgreSQL
2. **Agregacao** - Agrupa por semana (media de folhas infectadas vs total)
3. **Features derivadas** - Amplitude termica, precipitacao acumulada 2 semanas, medias anteriores
4. **Stepwise Selection (AIC)** - Seleciona automaticamente as melhores features de 12 candidatas
5. **Treino Ensemble** - Treina os 3 modelos com os dados acumulados
6. **Expanding Window** - Avalia com janela de expansao para validacao temporal
7. **Metricas** - Calcula MAE, RMSE, R2, accuracy e F1-Score

### Thresholds de Risco

| Nivel | Percentual |
|---|---|
| Baixo | < 10% |
| Medio | 10% - 15% |
| Alto | > 15% |

## Estrutura

```
microsservico-olho-pavao/
├── app/
│   ├── __init__.py
│   ├── main.py               # Aplicacao FastAPI (porta 8002)
│   ├── config.py             # Configuracoes e constantes
│   ├── routes.py             # Endpoints da API
│   ├── schemas.py            # Schemas Pydantic (request/response)
│   ├── pipeline.py           # Preparacao de dados e features
│   ├── ml_models.py          # Classe ModeloOlhoPavao (Ensemble)
│   └── feature_selection.py  # Stepwise forward AIC
├── requirements.txt
├── Dockerfile
└── .dockerignore
```

## API Endpoints

| Metodo | Endpoint | Descricao |
|---|---|---|
| GET | `/health` | Health check (status e modelo pronto) |
| POST | `/previsao` | Previsao de infecao para uma semana |
| GET | `/modelo/info` | Metricas e informacoes do modelo treinado |
| POST | `/modelo/retreinar` | Retreinar modelo com dados atualizados do banco |

### POST /previsao

**Request:**
```json
{
  "semana": 14,
  "ano": 2026,
  "temperatura_media": 13.9,
  "temperatura_maxima": 25.5,
  "temperatura_minima": 5.2,
  "humidade": 61.1,
  "precipitacao": 3.0,
  "velocidade_vento": 23.8
}
```

**Response:**
```json
{
  "percentual_infeccao": 17.1,
  "classificacao": "alto",
  "confianca": 82,
  "intervalo_confianca": {
    "inferior": 12.5,
    "superior": 21.7
  },
  "detalhes": {
    "predicao_rf": 15.2,
    "predicao_xgboost": 18.5,
    "predicao_ridge": 12.1,
    "features_utilizadas": ["amplitude_termica", "precipitacao_semana", "temp_media_2sem_anterior"]
  }
}
```

## Dados de Treino

- **Fonte:** PostgreSQL (tabelas `dados_olho_pavao` + `dados_clima`)
- **Seed inicial:** Dados do GitHub (2021, 2022, 2023, 2025)
- **Granularidade:** Folhas infectadas vs total por repeticao/arvore
- **Regiao:** Mirandela, Nordeste de Portugal

## Execucao

### Local
```bash
cd microsservico-olho-pavao
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8002
```

### Docker
Gerido pelo `docker-compose.yml` na raiz do projeto.

## Dependencias

- FastAPI, Uvicorn
- scikit-learn, XGBoost
- pandas, numpy
- SQLAlchemy, psycopg2-binary
- statsmodels (Stepwise AIC)
- openpyxl (leitura de Excel)
