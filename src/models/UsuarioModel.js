/**
 * MODEL: UsuarioModel
 *
 * Responsável pelos dados de usuário e autenticação.
 * Integrado com API backend real.
 */

import { apiLogin, apiRegistrar, apiObterUsuario, apiSolicitarRecuperacao, apiRedefinirSenha } from '../services/api';

// Usuário atualmente logado (null se não logado)
let usuarioAtual = null;

// Função para validar login via API
export const validarLogin = async (email, senha) => {
  try {
    const response = await apiLogin(email, senha);
    // Guardar token
    localStorage.setItem('token', response.access_token);

    // Buscar dados do usuário
    const usuario = await apiObterUsuario();
    usuarioAtual = usuario;
    localStorage.setItem('usuario', JSON.stringify(usuario));

    return { sucesso: true, usuario };
  } catch (error) {
    return { sucesso: false, mensagem: error.message || 'Email ou senha inválidos' };
  }
};

// Função para fazer logout
export const logout = () => {
  usuarioAtual = null;
  localStorage.removeItem('usuario');
  localStorage.removeItem('token');
};

// Função para obter usuário atual
export const getUsuarioAtual = () => {
  if (usuarioAtual) return usuarioAtual;

  // Tentar recuperar do localStorage
  const usuarioSalvo = localStorage.getItem('usuario');
  if (usuarioSalvo) {
    usuarioAtual = JSON.parse(usuarioSalvo);
    return usuarioAtual;
  }

  return null;
};

// Função para verificar se está autenticado
export const estaAutenticado = () => {
  const token = localStorage.getItem('token');
  return token !== null && getUsuarioAtual() !== null;
};

// Função para validar email
export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Função para validar senha (mínimo 6 caracteres)
export const validarSenha = (senha) => {
  return senha && senha.length >= 6;
};

// Função para cadastrar novo usuário via API
export const cadastrarUsuario = async (dados) => {
  try {
    await apiRegistrar(dados.nome, dados.email, dados.senha, {
      tipo: dados.tipo,
      propriedade: dados.propriedade,
      localizacao: dados.localizacao
    });

    // Login automático após registro
    const loginResult = await validarLogin(dados.email, dados.senha);
    return loginResult;
  } catch (error) {
    return { sucesso: false, mensagem: error.message || 'Erro ao cadastrar' };
  }
};

// Função para solicitar recuperação de senha via API
export const solicitarRecuperacaoSenha = async (email) => {
  try {
    const response = await apiSolicitarRecuperacao(email);
    return { sucesso: true, mensagem: response.mensagem };
  } catch (error) {
    return { sucesso: false, mensagem: error.message || 'Erro ao solicitar recuperação' };
  }
};

// Função para redefinir senha via API
export const redefinirSenha = async (token, novaSenha) => {
  try {
    const response = await apiRedefinirSenha(token, novaSenha);
    return { sucesso: true, mensagem: response.mensagem };
  } catch (error) {
    return { sucesso: false, mensagem: error.message || 'Erro ao redefinir senha' };
  }
};

// Tipos de usuário disponíveis
export const tiposUsuario = [
  { valor: 'produtor', label: 'Produtor' },
  { valor: 'tecnico', label: 'Técnico Agrícola' },
  { valor: 'pesquisador', label: 'Pesquisador' }
];

export default {
  validarLogin,
  logout,
  getUsuarioAtual,
  estaAutenticado,
  validarEmail,
  validarSenha,
  cadastrarUsuario,
  solicitarRecuperacaoSenha,
  redefinirSenha,
  tiposUsuario
};
