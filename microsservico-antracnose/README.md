# Microsservico Antracnose (Gafa) - OliveCoFree

Microsservico de Machine Learning para previsao de infecao por Antracnose/Gafa (*Colletotrichum spp.*) em oliveiras.

## Arquitetura ML

### Ensemble (RF + XGBoost + Ridge)

Pesos calculados dinamicamente por **Inverse-Variance Weighting (IVW)** — cada modelo recebe peso inversamente proporcional a variancia dos seus erros de treino. Modelos mais consistentes contribuem mais para a previsao final.

| Modelo | Configuracao |
|---|---|
| Random Forest Regressor | 100 estimators, max_depth=5, min_samples_leaf=3 |
| XGBoost Regressor | 50 estimators, max_depth=3, learning_rate=0.1 |
| Ridge Regression | alpha=1.0 |

### Pipeline

1. **Dados** - Carrega dados de `dados_antracnose` e `dados_clima` do PostgreSQL
2. **Agregacao** - Agrupa por semana (media de azeitonas infectadas vs total)
3. **Features derivadas** - Amplitude termica, precipitacao da semana anterior, medias anteriores
4. **Stepwise Selection (AIC)** - Seleciona automaticamente as melhores features de 12 candidatas
5. **Treino Ensemble** - Treina os 3 modelos com os dados acumulados
6. **Sliding Window** - Avalia com janela deslizante para validacao temporal (treina com N anos consecutivos, testa no ano seguinte; fallback para janela=1 se houver poucos anos)
7. **Metricas** - Calcula MAE, RMSE, R2, accuracy e F1-Score

### Thresholds de Risco

| Nivel | Percentual |
|---|---|
| Baixo | < 8% |
| Medio | 8% - 12% |
| Alto | > 12% |

### Condicoes Favoraveis a Doenca

- Temperatura: 20-25 C
- Humidade relativa: >= 80%
- Disseminacao por salpico de chuva

## Estrutura

```
microsservico-antracnose/
├── app/
│   ├── __init__.py
│   ├── main.py               # Aplicacao FastAPI (porta 8003)
│   ├── config.py             # Configuracoes e constantes
│   ├── routes.py             # Endpoints da API
│   ├── schemas.py            # Schemas Pydantic (request/response)
│   ├── pipeline.py           # Preparacao de dados e features
│   ├── ml_models.py          # Classe ModeloAntracnose (Ensemble)
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
  "semana": 42,
  "ano": 2026,
  "temperatura_media": 19.5,
  "temperatura_maxima": 26.0,
  "temperatura_minima": 14.0,
  "humidade": 82.0,
  "precipitacao": 4.5,
  "velocidade_vento": 1.5
}
```

**Response:**
```json
{
  "percentual_infeccao": 9.9,
  "classificacao": "medio",
  "confianca": 87,
  "intervalo_confianca": {
    "inferior": 6.2,
    "superior": 13.6
  },
  "detalhes": {
    "predicao_rf": 10.5,
    "predicao_xgboost": 9.2,
    "predicao_ridge": 8.1,
    "features_utilizadas": ["humidade_semana", "precipitacao_2sem_anterior", "temp_media_semana"]
  }
}
```

## Dados de Treino

- **Fonte:** PostgreSQL (tabelas `dados_antracnose` + `dados_clima`)
- **Seed inicial:** Dados do GitHub (2024, 2025)
- **Granularidade:** Azeitonas infectadas (severidade e incidencia) por arvore/parcela
- **Regiao:** Mirandela, Nordeste de Portugal

## Execucao

### Local
```bash
cd microsservico-antracnose
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8003
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
