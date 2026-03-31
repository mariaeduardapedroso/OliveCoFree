# Arquitetura OliveCoFree

## 1. Visao Geral do Sistema

```mermaid
graph TB
    subgraph Cliente
        Browser[Browser do Utilizador]
    end

    subgraph Docker[Docker Compose]
        subgraph Frontend
            Nginx[Nginx :80]
            React[React SPA]
        end

        subgraph Backend
            FastAPI[FastAPI :8001]
        end

        subgraph Microsservicos
            MS1[MS Olho de Pavao :8002]
            MS2[MS Antracnose :8003]
        end

        subgraph BaseDados
            PG[(PostgreSQL :5432)]
        end
    end

    Browser -->|HTTP| Nginx
    Nginx -->|/api/*| FastAPI
    Nginx -->|Ficheiros estaticos| React
    FastAPI -->|Previsao / Retreino| MS1
    FastAPI -->|Previsao / Retreino| MS2
    FastAPI -->|CRUD| PG
    MS1 -->|Leitura dados treino| PG
    MS2 -->|Leitura dados treino| PG
```

## 2. Fluxo de Previsao

```mermaid
sequenceDiagram
    participant U as Utilizador
    participant F as Frontend
    participant B as Backend :8001
    participant MS as Microsservico :8002/:8003
    participant DB as PostgreSQL

    U->>F: Seleciona doenca + semana
    F->>F: Preenche dados climaticos
    U->>F: Clica "Fazer Previsao"
    F->>B: POST /api/previsoes/
    B->>MS: POST /previsao (dados climaticos)

    Note over MS: Pipeline ML
    MS->>MS: Calcula features derivadas
    MS->>MS: Escala features (StandardScaler)
    MS->>MS: Random Forest preve
    MS->>MS: XGBoost preve
    MS->>MS: Ridge preve
    MS->>MS: Ensemble ponderado (0.4 RF + 0.4 XGB + 0.2 Ridge)
    MS->>MS: Classifica risco (baixo/medio/alto)
    MS->>MS: Calcula confianca e intervalo

    MS-->>B: percentual, classificacao, confianca, detalhes
    B->>DB: INSERT INTO previsoes
    B-->>F: Resultado da previsao
    F->>F: Mostra card de risco + gauge + recomendacoes
    F-->>U: Visualiza resultado
```

## 3. Fluxo de Upload e Retreino (Painel Cientifico)

```mermaid
sequenceDiagram
    participant P as Pesquisador
    participant F as Frontend
    participant B as Backend :8001
    participant MS as Microsservico
    participant DB as PostgreSQL

    P->>F: Seleciona ficheiros Excel (doenca + clima)
    P->>F: Clica "Enviar e Retreinar"
    F->>B: POST /api/pesquisador/upload (multipart)

    Note over B: Validacao
    B->>B: Valida colunas obrigatorias
    B->>B: Verifica valores nulos e vazios
    B->>B: Valida tipos de dados e datas

    alt Validacao falha
        B-->>F: 422 Erros de validacao
        F-->>P: Mostra erros especificos
    else Validacao OK
        B->>DB: INSERT INTO dados_doenca (novos registos)
        B->>DB: INSERT INTO dados_clima (novos registos)
        B->>MS: POST /modelo/retreinar

        Note over MS: Retreino
        MS->>DB: SELECT * FROM dados_doenca
        MS->>DB: SELECT * FROM dados_clima
        MS->>MS: Prepara dataset (agrega por semana)
        MS->>MS: Stepwise Feature Selection (AIC)
        MS->>MS: Treina Ensemble (RF + XGBoost + Ridge)
        MS->>MS: Avalia com Expanding Window
        MS-->>B: Metricas novas (accuracy, f1, amostras)

        B->>DB: INSERT INTO uploads (registo do upload)
        B-->>F: Metricas antes vs depois
        F-->>P: Mostra comparacao de metricas
    end
```

## 4. Pipeline de Machine Learning

```mermaid
flowchart TD
    subgraph Dados["1. Dados (PostgreSQL)"]
        D1[(dados_olho_pavao<br/>ou dados_antracnose)]
        D2[(dados_clima)]
    end

    subgraph Preparacao["2. Preparacao"]
        P1[Agregar por semana]
        P2[Cruzar doenca + clima<br/>por ano e semana]
        P3[Calcular features derivadas:<br/>amplitude termica<br/>precipitacao acumulada 2sem<br/>temp media 2sem anterior<br/>humidade 2sem anterior<br/>dias de chuva]
    end

    subgraph Selecao["3. Stepwise Selection"]
        S1[12 features candidatas]
        S2[Forward AIC]
        S3[3-6 features selecionadas]
    end

    subgraph Treino["4. Ensemble"]
        T1[Random Forest<br/>peso: 0.4]
        T2[XGBoost<br/>peso: 0.4]
        T3[Ridge Regression<br/>peso: 0.2]
    end

    subgraph Avaliacao["5. Avaliacao"]
        A1[Expanding Window]
        A2[Cross-Validation]
        A3[MAE, RMSE, R2<br/>Accuracy, F1-Score]
    end

    subgraph Previsao["6. Previsao"]
        PR1[Input: dados climaticos]
        PR2[Escalar features]
        PR3[3 previsoes individuais]
        PR4[Clip 0-100% cada]
        PR5[Media ponderada]
        PR6[Classificacao:<br/>baixo / medio / alto]
        PR7[Confianca e<br/>intervalo]
    end

    D1 --> P1
    D2 --> P2
    P1 --> P2
    P2 --> P3
    P3 --> S1
    S1 --> S2
    S2 --> S3
    S3 --> T1
    S3 --> T2
    S3 --> T3
    T1 --> A1
    T2 --> A1
    T3 --> A1
    A1 --> A2
    A2 --> A3

    PR1 --> PR2
    PR2 --> PR3
    PR3 --> PR4
    PR4 --> PR5
    PR5 --> PR6
    PR6 --> PR7
```

## 5. Modelo de Dados (PostgreSQL)

```mermaid
erDiagram
    usuarios {
        uuid id PK
        string nome
        string email UK
        string senha_hash
        string tipo "produtor | pesquisador"
        datetime criado_em
    }

    previsoes {
        uuid id PK
        uuid usuario_id FK
        string doenca_id
        date data
        int semana
        int ano
        float temperatura
        float temperatura_maxima
        float temperatura_minima
        float humidade
        float precipitacao
        float velocidade_vento
        float percentual_infectadas
        string risco
        int confianca
        datetime criado_em
    }

    uploads {
        uuid id PK
        uuid usuario_id FK
        string doenca_id
        datetime data_upload
        int amostras_doenca
        int amostras_clima
        json anos_dados
        float accuracy_antes
        float accuracy_depois
        float f1_antes
        float f1_depois
        int total_amostras_depois
    }

    dados_olho_pavao {
        int id PK
        date data
        int repeticao
        int arvore
        int folha
        int visiveis
        int visiveis_latentes
        datetime criado_em
    }

    dados_antracnose {
        int id PK
        date data
        string olival_parcela
        int arvore
        int azeitona
        float severidade
        int incidencia
        datetime criado_em
    }

    dados_clima {
        int id PK
        int ano
        int mes
        int dia
        float t_med
        float t_max
        float t_min
        float hr_med
        float ff_med
        float pr_qtd
        datetime criado_em
    }

    usuarios ||--o{ previsoes : "faz"
    usuarios ||--o{ uploads : "envia"
```

## 6. Infraestrutura Docker

```mermaid
graph LR
    subgraph Docker Compose
        subgraph db[PostgreSQL :5432]
            VOL[(Volume:<br/>postgres_data)]
        end

        subgraph backend[Backend :8001]
            BE[FastAPI + SQLAlchemy]
        end

        subgraph ms1[MS Olho Pavao :8002]
            ML1[FastAPI + scikit-learn + XGBoost]
        end

        subgraph ms2[MS Antracnose :8003]
            ML2[FastAPI + scikit-learn + XGBoost]
        end

        subgraph frontend[Frontend :80]
            NG[Nginx + React SPA]
        end
    end

    subgraph Rede[olivecofree-net]
        direction LR
    end

    db -.->|healthy| backend
    backend -.->|healthy| ms1
    backend -.->|healthy| ms2
    backend -.->|healthy| frontend

    style db fill:#336791,color:#fff
    style backend fill:#009688,color:#fff
    style ms1 fill:#4CAF50,color:#fff
    style ms2 fill:#9C27B0,color:#fff
    style frontend fill:#FF5722,color:#fff
```

## 7. Ordem de Startup

```mermaid
flowchart LR
    A[PostgreSQL] -->|healthy| B[Backend]
    B -->|cria tabelas + seed| B
    B -->|healthy| C[MS Olho Pavao]
    B -->|healthy| D[MS Antracnose]
    C -->|started| E[Frontend]
    D -->|started| E

    style A fill:#336791,color:#fff
    style B fill:#009688,color:#fff
    style C fill:#4CAF50,color:#fff
    style D fill:#9C27B0,color:#fff
    style E fill:#FF5722,color:#fff
```
