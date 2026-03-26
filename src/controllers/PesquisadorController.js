/**
 * CONTROLLER: PesquisadorController
 *
 * Responsavel pela logica do Painel Cientifico.
 * Gerencia modelos ML, templates, upload de dados e historico.
 */

import {
  apiObterInfoModelos,
  apiDownloadTemplate,
  apiUploadDados,
  apiListarUploads,
} from '../services/api';


/**
 * Mapeia info de um modelo da API para formato do frontend.
 */
const mapearModelo = (m) => ({
  doencaId: m.doenca_id,
  modelo: m.modelo,
  accuracy: m.accuracy,
  f1Score: m.f1_score,
  totalAmostrasTreino: m.total_amostras_treino,
  anosTreino: m.anos_treino,
  featuresUtilizadas: m.features_utilizadas,
  thresholds: m.thresholds,
});

/**
 * Obtem informacoes de ambos os modelos (Olho de Pavao + Antracnose).
 */
export const obterInfoModelos = async () => {
  const response = await apiObterInfoModelos();
  return (response.modelos || []).map(mapearModelo);
};

/**
 * Baixa um template Excel e dispara download no navegador.
 * @param {'olho-pavao' | 'antracnose' | 'clima'} tipo
 */
export const baixarTemplate = async (tipo) => {
  const blob = await apiDownloadTemplate(tipo);

  const nomes = {
    'olho-pavao': 'template_olho_pavao.xlsx',
    'antracnose': 'template_antracnose.xlsx',
    'clima': 'template_clima.xlsx',
  };

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomes[tipo] || `template_${tipo}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Envia dados de doenca e clima para retreinar o modelo.
 * @param {string} doencaId - 'olho-pavao' ou 'antracnose'
 * @param {File} arquivoDoenca - ficheiro .xlsx de doenca
 * @param {File} arquivoClima - ficheiro .xlsx de clima
 * @returns {object} { sucesso, mensagem, metricasAntes, metricasDepois }
 */
export const enviarDados = async (doencaId, arquivoDoenca, arquivoClima) => {
  const response = await apiUploadDados(doencaId, arquivoDoenca, arquivoClima);

  return {
    sucesso: response.sucesso,
    mensagem: response.mensagem,
    metricasAntes: response.metricas_antes ? mapearModelo(response.metricas_antes) : null,
    metricasDepois: mapearModelo(response.metricas_depois),
  };
};

/**
 * Obtem historico de uploads do pesquisador com paginacao.
 */
export const obterHistoricoUploads = async (pagina = 1, tamanho = 10) => {
  const response = await apiListarUploads(pagina, tamanho);

  const uploads = (response.uploads || []).map((u) => ({
    id: u.id,
    doencaId: u.doenca_id,
    usuarioNome: u.usuario_nome,
    dataUpload: u.data_upload,
    amostrasDoenca: u.amostras_doenca,
    amostrasClima: u.amostras_clima,
    anosDados: u.anos_dados,
    accuracyAntes: u.accuracy_antes,
    accuracyDepois: u.accuracy_depois,
    f1Antes: u.f1_antes,
    f1Depois: u.f1_depois,
    totalAmostrasDepois: u.total_amostras_depois,
  }));

  return {
    uploads,
    pagina: response.pagina || 1,
    tamanho: response.tamanho || 10,
    total: response.total || 0,
    totalPaginas: response.total_paginas || 1,
  };
};

export default {
  obterInfoModelos,
  baixarTemplate,
  enviarDados,
  obterHistoricoUploads,
};
