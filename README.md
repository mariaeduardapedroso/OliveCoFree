# OliveCoFree - Sistema de Previsao de Doencas em Oliveiras

Sistema preditivo para detecao precoce de doencas fungicas em oliveiras, desenvolvido no ambito de uma dissertacao de mestrado no Instituto Politecnico de Braganca (IPB), com o apoio do CeDRI e financiamento da Fundacao "la Caixa" e BPI.

O modelo foi desenvolvido para cultivares moderadamente suscetiveis a gafa e olho de pavao, em olival tradicional e de sequeiro, para a regiao de Mirandela (Nordeste de Portugal).

## Doencas Monitorizadas

| Doenca | Agente | Thresholds |
|---|---|---|
| **Olho de Pavao** | *Spilocaea oleagina* | Baixo: <10%, Medio: 10-15%, Alto: >15% |
| **Antracnose (Gafa)** | *Colletotrichum spp.* | Baixo: <8%, Medio: 8-12%, Alto: >12% |

## Arquitetura

```
Frontend (React)          Backend (FastAPI)         Microsservicos (FastAPI)
  :5173 / :80       --->    :8001             --->    :8002 (Olho de Pavao)
                                                      :8003 (Antracnose)
                              |
                         PostgreSQL
                           :5432
```

### Stack Tecnologico

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Chart.js, Lucide React |
| Backend | FastAPI, SQLAlchemy, Pydantic, python-jose (JWT) |
| ML Pipeline | scikit-learn, XGBoost, Ensemble (RF + XGBoost + Ridge) |
| Base de Dados | PostgreSQL (Supabase remoto ou Docker local) |
| Deploy | Docker Compose, Nginx |

### Pipeline de Machine Learning

- **Stepwise Feature Selection (AIC)** - Selecao automatica das melhores features
- **Ensemble** - Combina Random Forest (40%), XGBoost (40%) e Ridge Regression (20%)
- **Expanding Window** - Avaliacao com janela de expansao para simular treino incremental
- **Clip 0-100%** - Garante previsoes dentro de limites biologicamente possiveis

## Estrutura do Projeto

```
OliveCoFree/
├── src/                          # Frontend React (MVC)
│   ├── models/                     # Dados e logica
│   │   ├── DoencaModel.js            # Definicoes das doencas e thresholds
│   │   └── PrevisaoModel.js          # Mapeamento de previsoes
│   ├── views/                      # Componentes visuais
│   │   ├── components/               # Card, Button, GaugeRisco, Tabela, etc.
│   │   └── icons/                    # Icones SVG personalizados
│   ├── controllers/                # Logica de negocio
│   │   ├── AuthController.js         # Autenticacao
│   │   ├── PrevisaoController.js     # Previsoes
│   │   ├── ClimaController.js        # Dados climaticos
│   │   └── PesquisadorController.js  # Painel cientifico
│   ├── pages/                      # Paginas da aplicacao
│   │   ├── LandingPage.jsx           # Pagina inicial publica
│   │   ├── Login.jsx / Cadastro.jsx  # Autenticacao
│   │   ├── Dashboard.jsx             # Dashboard principal
│   │   ├── Previsao.jsx              # Fazer previsao
│   │   ├── Historico.jsx             # Historico com paginacao e filtros
│   │   └── PainelCientifico.jsx      # Painel exclusivo para pesquisadores
│   └── services/
│       └── api.js                    # Comunicacao com o backend
│
├── backend/                      # Backend FastAPI
│   ├── app/
│   │   ├── main.py                   # Aplicacao FastAPI
│   │   ├── config.py                 # Configuracoes e variaveis de ambiente
│   │   ├── routes/                   # Endpoints da API
│   │   │   ├── auth.py                 # Autenticacao (JWT)
│   │   │   ├── clima.py                # Dados climaticos
│   │   │   ├── previsao.py             # Previsoes
│   │   │   └── pesquisador.py          # Painel cientifico
│   │   ├── services/                 # Logica de negocio
│   │   ├── models/                   # Modelos SQLAlchemy
│   │   └── schemas/                  # Schemas Pydantic
│   ├── database/                   # Scripts de seed e migracoes
│   ├── requirements.txt
│   └── Dockerfile
│
├── microsservico-olho-pavao/     # ML - Olho de Pavao
│   ├── app/
│   │   ├── main.py                   # API FastAPI
│   │   ├── pipeline.py               # Preparacao de dados
│   │   └── ml_models.py             # Ensemble (RF + XGBoost + Ridge)
│   ├── requirements.txt
│   └── Dockerfile
│
├── microsservico-antracnose/     # ML - Antracnose
│   ├── app/
│   │   ├── main.py                   # API FastAPI
│   │   ├── pipeline.py               # Preparacao de dados
│   │   └── ml_models.py             # Ensemble (RF + XGBoost + Ridge)
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml            # Orquestracao de todos os servicos
├── Dockerfile                    # Frontend (multi-stage: Node + Nginx)
├── nginx.conf                    # Configuracao do proxy reverso
└── scripts/                      # Scripts utilitarios
```

## Paginas da Aplicacao

| Pagina | Rota | Descricao |
|---|---|---|
| Landing Page | `/` | Apresentacao do projeto e doencas monitorizadas |
| Login | `/login` | Autenticacao com email e senha |
| Cadastro | `/cadastro` | Registo de novos utilizadores |
| Dashboard | `/app/dashboard` | Visao geral com alertas e previsoes da semana |
| Previsao | `/app/previsao` | Fazer previsao com dados climaticos |
| Historico | `/app/historico` | Historico de previsoes com filtros e exportacao CSV |
| Painel Cientifico | `/app/painel-cientifico` | Metricas dos modelos, upload de dados, retreino (apenas pesquisadores) |
| Perfil | `/app/perfil` | Gestao do perfil do utilizador |

## Como Executar

### Desenvolvimento Local

**Pre-requisitos:** Node.js 18+, Python 3.11+

```bash
# Terminal 1 - Frontend
cd OliveCoFree
npm install
npm run dev

# Terminal 2 - Backend
cd OliveCoFree/backend
pip install -r requirements.txt
python run.py

# Terminal 3 - MS Olho de Pavao
cd OliveCoFree/microsservico-olho-pavao
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8002

# Terminal 4 - MS Antracnose
cd OliveCoFree/microsservico-antracnose
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8003
```

### Docker (Producao)

**Pre-requisitos:** Docker e Docker Compose

```bash
cd OliveCoFree
cp backend/.env.example backend/.env
# Editar backend/.env com as variaveis necessarias
docker compose up -d --build
```

Servicos disponiveis:
- Frontend: http://localhost (porta 80)
- Backend API: http://localhost:8001
- Swagger: http://localhost:8001/docs

### Portas

| Servico | Porta |
|---|---|
| Frontend (Nginx) | 80 |
| Backend (FastAPI) | 8001 |
| MS Olho de Pavao | 8002 |
| MS Antracnose | 8003 |
| PostgreSQL | 5432 |

## Variaveis de Ambiente

O ficheiro `backend/.env` deve conter:

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=chave-secreta
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

No Docker, `DATABASE_URL` e as URLs dos microsservicos sao injetadas automaticamente pelo `docker-compose.yml`.

## Tipos de Utilizadores

| Tipo | Funcionalidades |
|---|---|
| **Produtor** | Dashboard, Previsao, Historico, Perfil |
| **Pesquisador** | Tudo do produtor + Painel Cientifico (upload de dados, retreino de modelos, metricas) |

## Autor

Maria Eduarda Pedroso - Dissertacao de Mestrado, Instituto Politecnico de Braganca (IPB)

Projeto financiado pela Fundacao "la Caixa" e BPI, desenvolvido no CeDRI.
