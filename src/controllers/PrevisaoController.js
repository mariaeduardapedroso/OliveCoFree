/**
 * CONTROLLER: PrevisaoController
 *
 * Responsável pela lógica de previsões.
 * Integrado com API backend real.
 */

import {
  apiCriarPrevisao,
  apiListarPrevisoes,
  apiUltimaPrevisao,
  apiPrevisoesSemanaAtual,
  apiAnosDisponiveis,
  apiListarDoencas
} from '../services/api';

import {
  calcularRisco,
  getCorRisco,
  getTextoRisco,
  getRecomendacoes,
  getSemanaDoAno,
  formatarData
} from '../models/PrevisaoModel';

import { getDoencaById } from '../models/DoencaModel';

/**
 * Faz uma previsão chamando a API do backend.
 */
export const fazerPrevisao = async (semana, ano, dadosClima, doencaId = 'olho-pavao') => {
  const toNum = (v, fallback = null) => (v != null && !isNaN(v)) ? Number(v) : fallback;
  const dados = {
    doenca_id: doencaId,
    semana,
    ano,
    temperatura: toNum(dadosClima.temperatura),
    temperatura_maxima: toNum(dadosClima.temperatura_maxima),
    temperatura_minima: toNum(dadosClima.temperatura_minima),
    humidade: toNum(dadosClima.humidade),
    precipitacao: toNum(dadosClima.precipitacao),
    velocidade_vento: toNum(dadosClima.velocidade_vento, 0)
  };

  const resultado = await apiCriarPrevisao(dados);

  // Mapear resposta da API para formato do frontend
  return {
    id: resultado.id,
    doencaId: resultado.doenca_id,
    data: resultado.data,
    semana: resultado.semana,
    ano: resultado.ano,
    percentualInfectadas: resultado.percentual_infectadas,
    risco: resultado.risco,
    temperatura: resultado.temperatura,
    temperaturaMaxima: resultado.temperatura_maxima,
    temperaturaMinima: resultado.temperatura_minima,
    humidade: resultado.humidade,
    precipitacao: resultado.precipitacao,
    velocidadeVento: resultado.velocidade_vento,
    confianca: resultado.confianca,
    recomendacoes: getRecomendacoes(resultado.risco, dadosClima, doencaId)
  };
};

/**
 * Mapeia previsão da API para formato do frontend
 */
const mapearPrevisao = (p) => ({
  id: p.id,
  doencaId: p.doenca_id,
  data: p.data,
  semana: p.semana,
  ano: p.ano,
  percentualInfectadas: p.percentual_infectadas,
  risco: p.risco,
  temperatura: p.temperatura,
  temperaturaMaxima: p.temperatura_maxima,
  temperaturaMinima: p.temperatura_minima,
  humidade: p.humidade,
  precipitacao: p.precipitacao,
  velocidadeVento: p.velocidade_vento,
  confianca: p.confianca
});

/**
 * Obtém o histórico de previsões da API.
 */
export const obterHistorico = async (filtros = {}) => {
  const apiFiltros = {};
  if (filtros.ano) apiFiltros.ano = filtros.ano;
  if (filtros.doencaId) apiFiltros.doenca_id = filtros.doencaId;
  if (filtros.pagina) apiFiltros.pagina = filtros.pagina;
  if (filtros.tamanho) apiFiltros.tamanho = filtros.tamanho;

  const response = await apiListarPrevisoes(apiFiltros);
  return {
    previsoes: response.previsoes.map(mapearPrevisao),
    total: response.total,
    pagina: response.pagina,
    tamanho: response.tamanho,
    totalPaginas: response.total_paginas
  };
};

/**
 * Obtém a última previsão realizada.
 */
export const obterUltimaPrevisao = async (doencaId = null) => {
  const resultado = await apiUltimaPrevisao(doencaId);
  if (!resultado) return null;
  return mapearPrevisao(resultado);
};

/**
 * Obtém as previsões da semana atual para todas as doenças.
 */
export const obterPrevisoesSemanaAtual = async () => {
  const response = await apiPrevisoesSemanaAtual();
  const previsoesMapeadas = {};

  for (const p of response.previsoes) {
    previsoesMapeadas[p.doenca_id] = mapearPrevisao(p);
  }

  return {
    semana: response.semana,
    ano: response.ano,
    previsoes: previsoesMapeadas
  };
};

/**
 * Obtém dados para o gráfico de histórico.
 */
export const obterDadosGrafico = async (tamanho = 8, ano = null, doencaId = null) => {
  const filtros = { tamanho };
  if (ano) filtros.ano = ano;
  if (doencaId) filtros.doenca_id = doencaId;

  const response = await apiListarPrevisoes(filtros);
  const historico = response.previsoes.map(mapearPrevisao);

  // Ordenar cronologicamente
  historico.sort((a, b) => {
    if (a.ano !== b.ano) return a.ano - b.ano;
    return a.semana - b.semana;
  });

  const labels = historico.map(p => `S${p.semana}/${p.ano}`);
  const dados = historico.map(p => p.percentualInfectadas);

  return { labels, dados };
};

/**
 * Obtém anos disponíveis no histórico.
 */
export const obterAnosDisponiveis = async () => {
  try {
    const anos = await apiAnosDisponiveis();
    return anos.sort((a, b) => b - a);
  } catch {
    return [];
  }
};

/**
 * Exporta histórico para formato de tabela.
 */
export const exportarHistorico = async (filtros = {}) => {
  const resultado = await obterHistorico(filtros);
  return resultado.previsoes.map(p => ({
    Data: formatarData(p.data),
    Semana: p.semana,
    Ano: p.ano,
    Doença: p.doencaId,
    'Infeção (%)': p.percentualInfectadas,
    Risco: getTextoRisco(p.risco),
    'Temperatura (°C)': p.temperatura,
    'Humidade (%)': p.humidade,
    'Precipitação (mm)': p.precipitacao,
    'Confiança (%)': p.confianca
  }));
};

// Re-exportar funções úteis dos models
export {
  calcularRisco,
  getCorRisco,
  getTextoRisco,
  getRecomendacoes,
  getSemanaDoAno,
  formatarData
};

export default {
  fazerPrevisao,
  obterHistorico,
  obterUltimaPrevisao,
  obterPrevisoesSemanaAtual,
  obterDadosGrafico,
  obterAnosDisponiveis,
  exportarHistorico,
  calcularRisco,
  getCorRisco,
  getTextoRisco,
  getRecomendacoes,
  getSemanaDoAno,
  formatarData
};
