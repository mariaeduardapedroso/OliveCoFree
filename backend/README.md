# OliveCoFree Backend - FastAPI

Backend do sistema OliveCoFree, responsavel pela autenticacao, gestao de previsoes, comunicacao com microsservicos de ML e painel cientifico.

## Estrutura

```
backend/
├── app/
│   ├── main.py                # Aplicacao FastAPI (startup, CORS, routers)
│   ├── config.py              # Configuracoes e variaveis de ambiente
│   ├── routes/
│   │   ├── auth.py              # Autenticacao (login, registo, JWT)
│   │   ├── clima.py             # Dados climaticos (semana atual, historico)
│   │   ├── previsao.py          # Previsoes (criar, listar, historico)
│   │   └── pesquisador.py       # Painel cientifico (upload, retreino, metricas)
│   ├── services/
│   │   ├── auth_service.py      # Logica de autenticacao e JWT
│   │   ├── clima_service.py     # Integracao com API climatica
│   │   ├── previsao_service.py  # Orquestracao de previsoes com microsservicos
│   │   └── pesquisador_service.py # Validacao de uploads e retreino
│   ├── models/
│   │   ├── usuario.py           # Modelo Usuario (SQLAlchemy)
│   │   ├── previsao.py          # Modelo Previsao
│   │   ├── upload.py            # Modelo Upload (historico de uploads)
│   │   ├── dados_doenca.py      # Modelos DadosOlhoPavao e DadosAntracnose
│   │   └── dados_clima.py       # Modelo DadosClima
│   └── schemas/
│       ├── auth.py              # Schemas de autenticacao
│       ├── clima.py             # Schemas de clima
│       ├── previsao.py          # Schemas de previsao
│       └── pesquisador.py       # Schemas do painel cientifico
├── database/
│   └── seed.py                # Seed de dados iniciais do GitHub
├── requirements.txt
├── run.py                     # Script para iniciar o servidor
├── Dockerfile
└── .env.example
```

## Instalacao

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Editar .env com as credenciais do banco
python run.py
```

## API Endpoints

### Documentacao
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

### Autenticacao
| Metodo | Endpoint | Descricao |
|---|---|---|
| POST | `/api/auth/login` | Login (retorna JWT) |
| POST | `/api/auth/registrar` | Registo de novo utilizador |
| GET | `/api/auth/me` | Dados do utilizador autenticado |
| PUT | `/api/auth/perfil` | Atualizar perfil |
| POST | `/api/auth/esqueci-senha` | Solicitar recuperacao de senha |

### Previsoes
| Metodo | Endpoint | Descricao |
|---|---|---|
| POST | `/api/previsoes/` | Criar previsao (chama microsservico) |
| GET | `/api/previsoes/` | Listar previsoes com paginacao e filtros |
| GET | `/api/previsoes/anos` | Anos disponiveis no historico |

### Clima
| Metodo | Endpoint | Descricao |
|---|---|---|
| GET | `/api/clima/atual` | Dados climaticos da semana atual |
| GET | `/api/clima/semana/{semana}` | Dados de uma semana especifica |
| GET | `/api/clima/semana-atual` | Numero da semana atual |

### Pesquisador (requer tipo=pesquisador)
| Metodo | Endpoint | Descricao |
|---|---|---|
| GET | `/api/pesquisador/modelo/info` | Metricas dos modelos de ambas as doencas |
| GET | `/api/pesquisador/templates/{tipo}` | Download de template Excel |
| POST | `/api/pesquisador/upload` | Upload de dados + retreino do modelo |
| GET | `/api/pesquisador/uploads` | Historico de uploads com paginacao |

### Health
| Metodo | Endpoint | Descricao |
|---|---|---|
| GET | `/health` | Health check do servico |

## Base de Dados

O backend utiliza PostgreSQL com SQLAlchemy. As tabelas sao criadas automaticamente no startup.

### Tabelas
- **usuarios** - Utilizadores do sistema (produtor/pesquisador)
- **previsoes** - Historico de previsoes realizadas
- **uploads** - Historico de uploads de dados pelo pesquisador
- **dados_olho_pavao** - Dados de campo de Olho de Pavao
- **dados_antracnose** - Dados de campo de Antracnose
- **dados_clima** - Dados climaticos historicos

### Seed
No primeiro startup, o backend verifica se as tabelas de dados estao vazias e faz seed automatico a partir de ficheiros no GitHub:
- Dados de Olho de Pavao (2021-2025)
- Dados de Antracnose (2024-2025)
- Dados climaticos de Mirandela

## Comunicacao com Microsservicos

O backend atua como orquestrador, encaminhando pedidos para os microsservicos:

```
POST /api/previsoes/
  --> POST http://ms-olho-pavao:8002/previsao
  --> POST http://ms-antracnose:8003/previsao

POST /api/pesquisador/upload
  --> POST http://ms-olho-pavao:8002/modelo/retreinar
  --> POST http://ms-antracnose:8003/modelo/retreinar

GET /api/pesquisador/modelo/info
  --> GET http://ms-olho-pavao:8002/modelo/info
  --> GET http://ms-antracnose:8003/modelo/info
```

## Variaveis de Ambiente

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=chave-secreta
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
MICROSSERVICO_OLHO_PAVAO_URL=http://localhost:8002
MICROSSERVICO_ANTRACNOSE_URL=http://localhost:8003
FRONTEND_URL=http://localhost:5173
```
