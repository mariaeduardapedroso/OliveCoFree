# Olho de Pavão - Sistema de Previsão MVP

Sistema de previsão de infecção por Olho de Pavão (Spilocaea oleagina) em oliveiras.

## Estrutura do Projeto (MVC)

```
OlhoPavao-MVP/
├── src/
│   ├── models/              # MODEL - Dados e lógica de dados
│   │   ├── PrevisaoModel.js    # Dados de previsões (mock)
│   │   ├── ClimaModel.js       # Dados climáticos (mock)
│   │   ├── UsuarioModel.js     # Dados de usuários (mock)
│   │   └── index.js
│   │
│   ├── views/               # VIEW - Componentes visuais
│   │   └── components/
│   │       ├── Card.jsx         # Card reutilizável
│   │       ├── Button.jsx       # Botão reutilizável
│   │       ├── Input.jsx        # Campo de input
│   │       ├── Select.jsx       # Campo de seleção
│   │       ├── GaugeRisco.jsx   # Velocímetro de risco
│   │       ├── CardRisco.jsx    # Card de status de risco
│   │       ├── CardClima.jsx    # Card de clima
│   │       ├── Navbar.jsx       # Barra de navegação
│   │       ├── Tabela.jsx       # Tabela de dados
│   │       ├── GraficoLinha.jsx # Gráfico de linha (Chart.js)
│   │       ├── Alerta.jsx       # Componente de alerta
│   │       ├── Loading.jsx      # Componente de loading
│   │       └── index.js
│   │
│   ├── controllers/         # CONTROLLER - Lógica de negócio
│   │   ├── AuthController.js      # Lógica de autenticação
│   │   ├── PrevisaoController.js  # Lógica de previsões
│   │   ├── ClimaController.js     # Lógica de clima
│   │   └── index.js
│   │
│   ├── pages/               # Páginas da aplicação
│   │   ├── Login.jsx           # Página de login
│   │   ├── Cadastro.jsx        # Página de cadastro
│   │   ├── Dashboard.jsx       # Dashboard principal
│   │   ├── Previsao.jsx        # Fazer nova previsão
│   │   ├── Historico.jsx       # Histórico de previsões
│   │   └── index.js
│   │
│   ├── components/          # Componentes auxiliares
│   │   ├── Layout.jsx          # Layout com navbar
│   │   └── RotaProtegida.jsx   # Proteção de rotas
│   │
│   ├── App.jsx              # Componente principal + rotas
│   ├── main.jsx             # Entry point
│   └── index.css            # Estilos globais (Tailwind)
│
├── tailwind.config.js       # Configuração do Tailwind
├── postcss.config.js        # Configuração do PostCSS
├── package.json
└── README.md
```

## Telas do MVP

1. **Login** (`/login`)
   - Email e senha
   - Link para cadastro
   - Credenciais de teste: `maria@exemplo.com` / `123456`

2. **Cadastro** (`/cadastro`)
   - Formulário de novo usuário
   - Validações de email e senha

3. **Dashboard** (`/dashboard`)
   - Card de status atual (risco)
   - Gráfico de histórico
   - Estatísticas resumidas
   - Clima atual
   - Ações rápidas

4. **Previsão** (`/previsao`)
   - Seleção de semana/ano
   - Entrada de dados climáticos
   - Resultado com gauge de risco
   - Recomendações

5. **Histórico** (`/historico`)
   - Tabela de previsões
   - Gráfico de evolução
   - Filtro por ano
   - Exportar para CSV

## Como Rodar

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Passos

1. **Instalar dependências:**
```bash
cd OlhoPavao-MVP
npm install
```

2. **Iniciar servidor de desenvolvimento:**
```bash
npm run dev
```

3. **Abrir no navegador:**
```
http://localhost:5173
```

### Credenciais de Teste
- **Email:** maria@exemplo.com
- **Senha:** 123456

## Tecnologias Utilizadas

- **React 18** - Framework frontend
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **React Router DOM** - Navegação
- **Chart.js + react-chartjs-2** - Gráficos
- **Lucide React** - Ícones

## Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
```

## Arquitetura MVC

### Model (Dados)
- `PrevisaoModel.js` - Dados mock de previsões, funções de cálculo de risco
- `ClimaModel.js` - Dados mock climáticos, funções de favorabilidade
- `UsuarioModel.js` - Dados mock de usuários, autenticação

### View (Interface)
- Componentes reutilizáveis em `src/views/components/`
- Cada componente é visual e recebe dados via props
- Não contém lógica de negócio

### Controller (Lógica)
- `AuthController.js` - Login, logout, cadastro
- `PrevisaoController.js` - Fazer previsão, obter histórico
- `ClimaController.js` - Obter dados climáticos

## Próximos Passos (Backend)

Para conectar a um backend real:

1. Substituir dados mock por chamadas API
2. Implementar autenticação JWT
3. Conectar ao modelo ML (FastAPI + scikit-learn)
4. Integrar API de clima (Open-Meteo, IPMA)
5. Usar banco de dados PostgreSQL

## Autor

Projeto desenvolvido para tese IPB - Análise de Olho de Pavão em Oliveiras
