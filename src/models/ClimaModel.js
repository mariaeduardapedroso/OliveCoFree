/**
 * MODEL: ClimaModel
 *
 * Responsável pelos dados climáticos.
 * Contém dados mock e funções para manipulação de clima.
 */

// Dados mock climáticos por semana
export const climaMock = [
  {
    semana: 1,
    ano: 2025,
    dataInicio: '2024-12-30',
    dataFim: '2025-01-05',
    temperatura: {
      media: 8.5,
      min: 2.0,
      max: 14.0
    },
    humidade: {
      media: 72,
      min: 55,
      max: 88
    },
    precipitacao: 15.5,
    vento: 12.3,
    diasFavoraveis: 3
  },
  {
    semana: 2,
    ano: 2025,
    dataInicio: '2025-01-06',
    dataFim: '2025-01-12',
    temperatura: {
      media: 14.2,
      min: 8.0,
      max: 18.5
    },
    humidade: {
      media: 78,
      min: 60,
      max: 92
    },
    precipitacao: 12.5,
    vento: 8.7,
    diasFavoraveis: 4
  },
  {
    semana: 3,
    ano: 2025,
    dataInicio: '2025-01-13',
    dataFim: '2025-01-19',
    temperatura: {
      media: 12.8,
      min: 6.5,
      max: 17.0
    },
    humidade: {
      media: 85,
      min: 70,
      max: 95
    },
    precipitacao: 25.0,
    vento: 15.2,
    diasFavoraveis: 5
  },
  {
    semana: 4,
    ano: 2025,
    dataInicio: '2025-01-20',
    dataFim: '2025-01-26',
    temperatura: {
      media: 16.5,
      min: 10.0,
      max: 22.0
    },
    humidade: {
      media: 65,
      min: 45,
      max: 80
    },
    precipitacao: 5.2,
    vento: 10.5,
    diasFavoraveis: 2
  },
  {
    semana: 5,
    ano: 2025,
    dataInicio: '2025-01-27',
    dataFim: '2025-02-02',
    temperatura: {
      media: 11.2,
      min: 4.0,
      max: 16.0
    },
    humidade: {
      media: 92,
      min: 82,
      max: 98
    },
    precipitacao: 45.0,
    vento: 18.0,
    diasFavoraveis: 6
  },
  {
    semana: 6,
    ano: 2025,
    dataInicio: '2025-02-03',
    dataFim: '2025-02-09',
    temperatura: {
      media: 18.0,
      min: 12.0,
      max: 24.0
    },
    humidade: {
      media: 55,
      min: 38,
      max: 70
    },
    precipitacao: 0.0,
    vento: 6.5,
    diasFavoraveis: 1
  }
];

// Clima atual (mock)
export const climaAtual = {
  data: new Date().toISOString().split('T')[0],
  temperatura: 15.5,
  humidade: 72,
  precipitacao: 8.0,
  vento: 10.2,
  condicao: 'Parcialmente nublado',
  iconeCodigo: '02d'
};

// Função para obter clima por semana
export const getClimaPorSemana = (semana, ano) => {
  return climaMock.find(c => c.semana === semana && c.ano === ano);
};

// Função para avaliar condições favoráveis à doença
export const avaliarCondicoesFavoraveis = (temperatura, humidade) => {
  // Condições favoráveis ao Spilocaea oleagina:
  // - Temperatura entre 10-25°C (ótimo 15-20°C)
  // - Humidade > 70%

  const tempFavoravel = temperatura >= 10 && temperatura <= 25;
  const humFavoravel = humidade >= 70;

  if (tempFavoravel && humFavoravel) {
    return {
      nivel: 'alto',
      mensagem: 'Condições muito favoráveis ao desenvolvimento do fungo'
    };
  } else if (tempFavoravel || humFavoravel) {
    return {
      nivel: 'medio',
      mensagem: 'Condições parcialmente favoráveis'
    };
  }
  return {
    nivel: 'baixo',
    mensagem: 'Condições desfavoráveis ao desenvolvimento do fungo'
  };
};

// Função para calcular índice de favorabilidade
export const calcularIndiceFavorabilidade = (temperatura, humidade) => {
  let fatorTemp = 0;
  let fatorHum = 0;

  // Fator temperatura (ótimo 15-20°C)
  if (temperatura >= 15 && temperatura <= 20) {
    fatorTemp = 1.0;
  } else if (temperatura >= 10 && temperatura < 15) {
    fatorTemp = 0.7;
  } else if (temperatura > 20 && temperatura <= 25) {
    fatorTemp = 0.7;
  } else if (temperatura >= 5 && temperatura < 10) {
    fatorTemp = 0.3;
  } else {
    fatorTemp = 0.1;
  }

  // Fator humidade (>80% muito favorável)
  if (humidade >= 80) {
    fatorHum = 1.0;
  } else if (humidade >= 70) {
    fatorHum = 0.7;
  } else if (humidade >= 60) {
    fatorHum = 0.4;
  } else {
    fatorHum = 0.1;
  }

  return (fatorTemp * fatorHum * 100).toFixed(1);
};

// Função para obter ícone do clima
export const getIconeClima = (condicao) => {
  const icones = {
    'ensolarado': '☀️',
    'parcialmente nublado': '⛅',
    'nublado': '☁️',
    'chuva leve': '🌦️',
    'chuva': '🌧️',
    'chuva forte': '⛈️',
    'tempestade': '🌩️'
  };
  return icones[condicao.toLowerCase()] || '🌤️';
};

// Função para obter semanas disponíveis
export const getSemanasDisponiveis = (ano) => {
  return climaMock
    .filter(c => c.ano === ano)
    .map(c => ({
      semana: c.semana,
      dataInicio: c.dataInicio,
      dataFim: c.dataFim
    }));
};

export default {
  climaMock,
  climaAtual,
  getClimaPorSemana,
  avaliarCondicoesFavoraveis,
  calcularIndiceFavorabilidade,
  getIconeClima,
  getSemanasDisponiveis
};
