/**
 * SERVICE: API
 *
 * Serviço para comunicação com o backend FastAPI.
 */

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8001/api'
  : '/api';

/**
 * Obtém o token JWT do localStorage
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Função auxiliar para fazer requisições autenticadas
 */
const fetchAPI = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
    throw new Error('Sessao expirada');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.detail || `Erro HTTP: ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return await response.json();
};

// ==================== AUTH ====================

export const apiLogin = async (email, senha) => {
  return await fetchAPI('/auth/login-json', {
    method: 'POST',
    body: JSON.stringify({ email, senha })
  });
};

export const apiRegistrar = async (nome, email, senha, { tipo, propriedade, localizacao } = {}) => {
  const body = { nome, email, senha };
  if (tipo) body.tipo = tipo;
  if (propriedade) body.propriedade = propriedade;
  if (localizacao) body.localizacao = localizacao;
  return await fetchAPI('/auth/registrar', {
    method: 'POST',
    body: JSON.stringify(body)
  });
};

export const apiObterUsuario = async () => {
  return await fetchAPI('/auth/me');
};

export const apiAtualizarUsuario = async (dados) => {
  return await fetchAPI('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(dados)
  });
};

export const apiSolicitarRecuperacao = async (email) => {
  return await fetchAPI('/auth/solicitar-recuperacao', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

export const apiRedefinirSenha = async (token, nova_senha) => {
  return await fetchAPI('/auth/redefinir-senha', {
    method: 'POST',
    body: JSON.stringify({ token, nova_senha })
  });
};

// ==================== PREVISOES ====================

export const apiCriarPrevisao = async (dados) => {
  return await fetchAPI('/previsoes/', {
    method: 'POST',
    body: JSON.stringify(dados)
  });
};

export const apiListarPrevisoes = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.doenca_id) params.append('doenca_id', filtros.doenca_id);
  if (filtros.ano) params.append('ano', filtros.ano);
  if (filtros.pagina) params.append('pagina', filtros.pagina);
  if (filtros.tamanho) params.append('tamanho', filtros.tamanho);
  const query = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/previsoes/${query}`);
};

export const apiUltimaPrevisao = async (doenca_id = null) => {
  const query = doenca_id ? `?doenca_id=${doenca_id}` : '';
  return await fetchAPI(`/previsoes/ultima${query}`);
};

export const apiAnosDisponiveis = async () => {
  return await fetchAPI('/previsoes/anos');
};

export const apiListarDoencas = async () => {
  return await fetchAPI('/previsoes/doencas');
};

export const apiPrevisoesSemanaAtual = async () => {
  return await fetchAPI('/previsoes/semana-atual');
};

export const apiDeletarPrevisao = async (id) => {
  return await fetchAPI(`/previsoes/${id}`, { method: 'DELETE' });
};

// ==================== CLIMA ====================

export const buscarClimaHoje = async () => {
  const response = await fetchAPI('/clima/hoje');
  return response.data;
};

export const buscarClimaSemana = async (semana, ano, permitirMock = true) => {
  const url = `/clima/semana/${semana}?ano=${ano}&permitir_mock=${permitirMock}`;
  const response = await fetchAPI(url);
  return response.data;
};

export const buscarSemanaAtual = async () => {
  const response = await fetchAPI('/clima/semana-atual');
  return response.data;
};

// ==================== PESQUISADOR ====================

/**
 * Funcao auxiliar para uploads com FormData (multipart).
 * Nao define Content-Type para o browser preencher o boundary.
 */
const fetchAPIUpload = async (endpoint, formData) => {
  const token = getToken();
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
    throw new Error('Sessao expirada');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.detail || `Erro HTTP: ${response.status}`;
    throw typeof message === 'string' ? new Error(message) : { detail: message };
  }

  return await response.json();
};

export const apiObterInfoModelos = async () => {
  return await fetchAPI('/pesquisador/modelo/info');
};

export const apiDownloadTemplate = async (tipo) => {
  const token = getToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/pesquisador/templates/${tipo}`, {
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Erro ao baixar template`);
  }

  return await response.blob();
};

export const apiUploadDados = async (doencaId, arquivoDoenca, arquivoClima) => {
  const formData = new FormData();
  formData.append('doenca_id', doencaId);
  formData.append('arquivo_doenca', arquivoDoenca);
  formData.append('arquivo_clima', arquivoClima);
  return await fetchAPIUpload('/pesquisador/upload', formData);
};

export const apiListarUploads = async (pagina = 1, tamanho = 10) => {
  return await fetchAPI(`/pesquisador/uploads?pagina=${pagina}&tamanho=${tamanho}`);
};

// ==================== HEALTH ====================

export const verificarBackend = async () => {
  try {
    const healthUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:8001/health'
      : '/health';
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
};

export default {
  apiLogin,
  apiRegistrar,
  apiObterUsuario,
  apiAtualizarUsuario,
  apiSolicitarRecuperacao,
  apiRedefinirSenha,
  apiCriarPrevisao,
  apiListarPrevisoes,
  apiUltimaPrevisao,
  apiAnosDisponiveis,
  apiListarDoencas,
  apiPrevisoesSemanaAtual,
  apiDeletarPrevisao,
  buscarClimaHoje,
  buscarClimaSemana,
  buscarSemanaAtual,
  verificarBackend,
  apiObterInfoModelos,
  apiDownloadTemplate,
  apiUploadDados,
  apiListarUploads
};
