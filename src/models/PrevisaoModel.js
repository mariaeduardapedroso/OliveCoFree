/**
 * MODEL: PrevisaoModel
 *
 * Responsável pelos dados de previsões.
 * Contém dados mock e funções para manipulação de previsões.
 */

import { getDoencaById, getNivelRisco, getRecomendacoesDoenca } from './DoencaModel';

// Dados mock de previsões históricas
export const previsoesMock = [
  // Olho de Pavão - 2025
  {
    id: 1,
    doencaId: 'olho-pavao',
    data: '2025-01-06',
    semana: 2,
    ano: 2025,
    percentualInfectadas: 12.5,
    risco: 'medio',
    temperatura: 14.2,
    humidade: 78,
    precipitacao: 12.5,
    confianca: 85
  },
  {
    id: 2,
    doencaId: 'olho-pavao',
    data: '2025-01-13',
    semana: 3,
    ano: 2025,
    percentualInfectadas: 18.3,
    risco: 'alto',
    temperatura: 12.8,
    humidade: 85,
    precipitacao: 25.0,
    confianca: 82
  },
  {
    id: 3,
    doencaId: 'olho-pavao',
    data: '2025-01-20',
    semana: 4,
    ano: 2025,
    percentualInfectadas: 8.7,
    risco: 'baixo',
    temperatura: 16.5,
    humidade: 65,
    precipitacao: 5.2,
    confianca: 88
  },
  {
    id: 4,
    doencaId: 'olho-pavao',
    data: '2025-01-27',
    semana: 5,
    ano: 2025,
    percentualInfectadas: 22.1,
    risco: 'alto',
    temperatura: 11.2,
    humidade: 92,
    precipitacao: 45.0,
    confianca: 79
  },
  {
    id: 5,
    doencaId: 'olho-pavao',
    data: '2025-02-03',
    semana: 6,
    ano: 2025,
    percentualInfectadas: 5.4,
    risco: 'baixo',
    temperatura: 18.0,
    humidade: 55,
    precipitacao: 0.0,
    confianca: 91
  },
  // Olho de Pavão - 2024
  {
    id: 6,
    doencaId: 'olho-pavao',
    data: '2024-03-11',
    semana: 11,
    ano: 2024,
    percentualInfectadas: 15.2,
    risco: 'alto',
    temperatura: 15.5,
    humidade: 75,
    precipitacao: 18.0,
    confianca: 84
  },
  {
    id: 7,
    doencaId: 'olho-pavao',
    data: '2024-04-01',
    semana: 14,
    ano: 2024,
    percentualInfectadas: 28.9,
    risco: 'alto',
    temperatura: 13.0,
    humidade: 88,
    precipitacao: 35.0,
    confianca: 77
  },
  {
    id: 8,
    doencaId: 'olho-pavao',
    data: '2024-04-15',
    semana: 16,
    ano: 2024,
    percentualInfectadas: 3.2,
    risco: 'baixo',
    temperatura: 20.0,
    humidade: 50,
    precipitacao: 2.0,
    confianca: 93
  },
  // Antracnose - 2025
  {
    id: 9,
    doencaId: 'antracnose',
    data: '2025-01-06',
    semana: 2,
    ano: 2025,
    percentualInfectadas: 6.2,
    risco: 'baixo',
    temperatura: 14.2,
    humidade: 78,
    precipitacao: 12.5,
    confianca: 83
  },
  {
    id: 10,
    doencaId: 'antracnose',
    data: '2025-01-13',
    semana: 3,
    ano: 2025,
    percentualInfectadas: 9.5,
    risco: 'medio',
    temperatura: 12.8,
    humidade: 85,
    precipitacao: 25.0,
    confianca: 80
  },
  {
    id: 11,
    doencaId: 'antracnose',
    data: '2025-01-20',
    semana: 4,
    ano: 2025,
    percentualInfectadas: 4.3,
    risco: 'baixo',
    temperatura: 16.5,
    humidade: 65,
    precipitacao: 5.2,
    confianca: 87
  },
  {
    id: 12,
    doencaId: 'antracnose',
    data: '2025-01-27',
    semana: 5,
    ano: 2025,
    percentualInfectadas: 14.8,
    risco: 'alto',
    temperatura: 11.2,
    humidade: 92,
    precipitacao: 45.0,
    confianca: 76
  },
  {
    id: 13,
    doencaId: 'antracnose',
    data: '2025-02-03',
    semana: 6,
    ano: 2025,
    percentualInfectadas: 2.1,
    risco: 'baixo',
    temperatura: 18.0,
    humidade: 55,
    precipitacao: 0.0,
    confianca: 90
  },
  // Antracnose - 2024
  {
    id: 14,
    doencaId: 'antracnose',
    data: '2024-03-11',
    semana: 11,
    ano: 2024,
    percentualInfectadas: 10.5,
    risco: 'medio',
    temperatura: 15.5,
    humidade: 75,
    precipitacao: 18.0,
    confianca: 82
  },
  {
    id: 15,
    doencaId: 'antracnose',
    data: '2024-04-01',
    semana: 14,
    ano: 2024,
    percentualInfectadas: 18.2,
    risco: 'alto',
    temperatura: 13.0,
    humidade: 88,
    precipitacao: 35.0,
    confianca: 75
  },
  {
    id: 16,
    doencaId: 'antracnose',
    data: '2024-04-15',
    semana: 16,
    ano: 2024,
    percentualInfectadas: 1.8,
    risco: 'baixo',
    temperatura: 20.0,
    humidade: 50,
    precipitacao: 2.0,
    confianca: 92
  }
];

// Função para determinar o nível de risco (usa DoencaModel)
export const calcularRisco = (percentual, doencaId = 'olho-pavao') => {
  return getNivelRisco(doencaId, percentual);
};

// Função para obter cor do risco
export const getCorRisco = (risco) => {
  const cores = {
    alto: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', hex: '#ef4444' },
    medio: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', hex: '#eab308' },
    baixo: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', hex: '#22c55e' }
  };
  return cores[risco] || cores.baixo;
};

// Função para obter texto do risco
export const getTextoRisco = (risco) => {
  const textos = {
    alto: 'Risco Alto',
    medio: 'Risco Médio',
    baixo: 'Risco Baixo'
  };
  return textos[risco] || 'Desconhecido';
};

// Função para gerar recomendações baseadas no risco e doença
export const getRecomendacoes = (risco, dados, doencaId = 'olho-pavao') => {
  return getRecomendacoesDoenca(doencaId, risco);
};

// Função para obter semana do ano a partir de uma data
export const getSemanaDoAno = (data) => {
  const d = new Date(data);
  const primeiroDia = new Date(d.getFullYear(), 0, 1);
  const dias = Math.floor((d - primeiroDia) / (24 * 60 * 60 * 1000));
  return Math.ceil((dias + primeiroDia.getDay() + 1) / 7);
};

// Função para formatar data
export const formatarData = (dataString) => {
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Função para obter previsões por ano
export const getPrevisoesPorAno = (ano, doencaId = null) => {
  let previsoes = previsoesMock.filter(p => p.ano === ano);
  if (doencaId) {
    previsoes = previsoes.filter(p => p.doencaId === doencaId);
  }
  return previsoes;
};

// Função para obter previsões por doença
export const getPrevisoesPorDoenca = (doencaId) => {
  return previsoesMock.filter(p => p.doencaId === doencaId);
};

// Função para obter última previsão
export const getUltimaPrevisao = (doencaId = null) => {
  let previsoes = previsoesMock;
  if (doencaId) {
    previsoes = previsoes.filter(p => p.doencaId === doencaId);
  }
  return previsoes.reduce((mais_recente, atual) => {
    return new Date(atual.data) > new Date(mais_recente.data) ? atual : mais_recente;
  });
};

// Função para obter anos disponíveis
export const getAnosDisponiveis = () => {
  const anos = [...new Set(previsoesMock.map(p => p.ano))];
  return anos.sort((a, b) => b - a);
};

export default {
  previsoesMock,
  calcularRisco,
  getCorRisco,
  getTextoRisco,
  getRecomendacoes,
  getSemanaDoAno,
  formatarData,
  getPrevisoesPorAno,
  getPrevisoesPorDoenca,
  getUltimaPrevisao,
  getAnosDisponiveis
};
