/**
 * CONTROLLER: ClimaController
 *
 * Responsável pela lógica de dados climáticos.
 * Agora com integração ao backend FastAPI.
 */

import {
  climaMock,
  climaAtual,
  getClimaPorSemana,
  avaliarCondicoesFavoraveis,
  calcularIndiceFavorabilidade,
  getIconeClima,
  getSemanasDisponiveis
} from '../models/ClimaModel';

import {
  buscarClimaHoje,
  buscarClimaSemana,
  verificarBackend
} from '../services/api';

// Cache para verificar se backend está disponível
let backendDisponivel = null;

/**
 * Verifica se o backend está online (com cache)
 */
const isBackendOnline = async () => {
  if (backendDisponivel === null) {
    backendDisponivel = await verificarBackend();
    // Revalidar a cada 30 segundos
    setTimeout(() => { backendDisponivel = null; }, 30000);
  }
  return backendDisponivel;
};

/**
 * Obtém o clima atual.
 * Tenta buscar do backend, senão usa mock.
 * @returns {Object}
 */
export const obterClimaAtual = async () => {
  try {
    // Tentar buscar do backend
    if (await isBackendOnline()) {
      const dados = await buscarClimaHoje();
      return {
        temperatura: dados.temperatura,
        humidade: dados.humidade,
        precipitacao: dados.precipitacao,
        vento: dados.vento,
        condicao: dados.condicao,
        icone: dados.icone,
        favorabilidade: dados.favorabilidade,
        fonte: 'api'
      };
    }
  } catch (error) {
    console.warn('Backend indisponível, usando mock:', error);
  }

  // Fallback: usar mock
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    ...climaAtual,
    icone: getIconeClima(climaAtual.condicao),
    favorabilidade: avaliarCondicoesFavoraveis(
      climaAtual.temperatura,
      climaAtual.humidade
    ),
    fonte: 'mock'
  };
};

/**
 * Obtém dados climáticos de uma semana específica.
 * Tenta buscar do backend (média semanal), senão usa mock.
 * @param {number} semana
 * @param {number} ano
 * @param {boolean} estrito - Se true, NAO usa fallback mock: devolve null
 *   quando o backend/Open-Meteo nao tem dados reais. Usado na pagina de
 *   Previsao para nao mostrar valores inventados ao utilizador.
 * @returns {Object|null}
 */
export const obterClimaSemana = async (semana, ano, estrito = false) => {
  try {
    // Tentar buscar do backend
    if (await isBackendOnline()) {
      const dados = await buscarClimaSemana(semana, ano, !estrito);
      return {
        temperatura: { media: dados.temperatura_media, min: dados.temperatura_min, max: dados.temperatura_max },
        humidade: { media: dados.humidade_media, min: dados.humidade_media - 10, max: dados.humidade_media + 10 },
        precipitacao: dados.precipitacao_total,
        vento: dados.vento_medio,
        diasFavoraveis: dados.dias_com_chuva,
        favorabilidade: dados.favorabilidade,
        fonte: 'api'
      };
    }
  } catch (error) {
    console.warn('Backend indisponível para semana:', error);
    if (estrito) {
      // Modo estrito: nao usa mock, devolve null para o chamador deixar
      // os campos em branco e pedir ao utilizador para preencher.
      return null;
    }
  }

  if (estrito) {
    return null;
  }

  // Fallback: usar mock
  const clima = getClimaPorSemana(semana, ano);

  if (!clima) {
    return {
      temperatura: { media: 15, min: 10, max: 20 },
      humidade: { media: 70, min: 50, max: 85 },
      precipitacao: 10,
      vento: 10,
      diasFavoraveis: 3,
      fonte: 'mock'
    };
  }

  return { ...clima, fonte: 'mock' };
};

/**
 * Obtém lista de semanas disponíveis para um ano.
 * @param {number} ano
 * @returns {Array}
 */
export const obterSemanasDisponiveis = (ano) => {
  const semanas = getSemanasDisponiveis(ano);

  if (semanas.length === 0) {
    const semanasGeradas = [];
    for (let i = 1; i <= 52; i++) {
      semanasGeradas.push({
        semana: i,
        label: `Semana ${i}`
      });
    }
    return semanasGeradas;
  }

  return semanas.map(s => ({
    ...s,
    label: `Semana ${s.semana} (${s.dataInicio} a ${s.dataFim})`
  }));
};

/**
 * Obtém a semana atual do ano.
 * @returns {Object} - { semana, ano }
 */
export const obterSemanaAtual = () => {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), 0, 1);
  const dias = Math.floor((hoje - primeiroDia) / (24 * 60 * 60 * 1000));
  const semana = Math.ceil((dias + primeiroDia.getDay() + 1) / 7);

  return {
    semana,
    ano: hoje.getFullYear()
  };
};

/**
 * Obtém as próximas semanas disponíveis para previsão.
 * Mostra apenas semanas futuras (ainda não passaram).
 * Os dados climáticos da semana X são usados para prever a infecção da semana X.
 * @param {number} quantidadeSemanas - Quantas semanas futuras mostrar (máximo 5)
 * @returns {Array}
 */
export const obterSemanasParaPrevisao = (quantidadeSemanas = 5) => {
  const atual = obterSemanaAtual();
  const semanas = [];

  const limite = Math.min(quantidadeSemanas, 5);

  let semanaAtual = atual.semana;
  let anoAtual = atual.ano;

  // Começar da semana atual e ir até 5 semanas à frente
  for (let i = 0; i < limite; i++) {
    let semana = semanaAtual + i;
    let ano = anoAtual;

    // Ajustar se passar de 52 semanas
    if (semana > 52) {
      semana = semana - 52;
      ano = anoAtual + 1;
    }

    semanas.push({
      semana: semana,
      ano: ano,
      valor: `${semana}-${ano}`,
      label: `Semana ${semana}/${ano}`
    });
  }

  return semanas;
};

/**
 * Obtém anos disponíveis para previsão.
 * @returns {Array}
 */
export const obterAnosParaPrevisao = () => {
  const atual = obterSemanaAtual();
  const anos = [{ valor: atual.ano, label: atual.ano.toString() }];

  if (atual.semana > 47) {
    anos.push({ valor: atual.ano + 1, label: (atual.ano + 1).toString() });
  }

  return anos;
};

/**
 * Avalia as condições climáticas para o desenvolvimento do fungo.
 * @param {number} temperatura
 * @param {number} humidade
 * @returns {Object}
 */
export const avaliarCondicoes = (temperatura, humidade) => {
  return avaliarCondicoesFavoraveis(temperatura, humidade);
};

/**
 * Calcula o índice de favorabilidade.
 * @param {number} temperatura
 * @param {number} humidade
 * @returns {number}
 */
export const calcularFavorabilidade = (temperatura, humidade) => {
  return calcularIndiceFavorabilidade(temperatura, humidade);
};

/**
 * Obtém anos disponíveis nos dados climáticos.
 * @returns {Array}
 */
export const obterAnosDisponiveis = () => {
  const anos = [...new Set(climaMock.map(c => c.ano))];
  return anos.sort((a, b) => b - a);
};

/**
 * Formata dados climáticos para exibição.
 * @param {Object} clima
 * @returns {Object}
 */
export const formatarDadosClima = (clima) => {
  const tempObj = typeof clima.temperatura === 'object' ? clima.temperatura : null;
  return {
    temperatura: tempObj ? tempObj.media : clima.temperatura,
    temperaturaMaxima: tempObj ? tempObj.max : null,
    temperaturaMinima: tempObj ? tempObj.min : null,
    humidade: typeof clima.humidade === 'object'
      ? clima.humidade.media
      : clima.humidade,
    precipitacao: clima.precipitacao,
    velocidadeVento: clima.vento || 0
  };
};

export default {
  obterClimaAtual,
  obterClimaSemana,
  obterSemanasDisponiveis,
  obterSemanasParaPrevisao,
  obterAnosParaPrevisao,
  obterSemanaAtual,
  avaliarCondicoes,
  calcularFavorabilidade,
  obterAnosDisponiveis,
  formatarDadosClima
};
