/**
 * CONTROLLER: AuthController
 *
 * Responsável pela lógica de autenticação.
 */

import {
  validarLogin,
  logout,
  getUsuarioAtual,
  estaAutenticado,
  cadastrarUsuario,
  validarEmail,
  validarSenha,
  solicitarRecuperacaoSenha,
  redefinirSenha
} from '../models/UsuarioModel';

/**
 * Realiza o login do usuário.
 */
export const fazerLogin = async (email, senha) => {
  if (!email || !senha) {
    return { sucesso: false, mensagem: 'Preencha todos os campos' };
  }

  if (!validarEmail(email)) {
    return { sucesso: false, mensagem: 'Email inválido' };
  }

  const resultado = await validarLogin(email, senha);
  return resultado;
};

/**
 * Realiza o logout do usuário.
 */
export const fazerLogout = () => {
  logout();
};

/**
 * Verifica se o usuário está autenticado.
 */
export const verificarAutenticacao = () => {
  return estaAutenticado();
};

/**
 * Obtém o usuário atualmente logado.
 */
export const obterUsuarioAtual = () => {
  return getUsuarioAtual();
};

/**
 * Cadastra um novo usuário.
 */
export const registrarUsuario = async (dados) => {
  if (!dados.nome || !dados.email || !dados.senha) {
    return { sucesso: false, mensagem: 'Preencha todos os campos obrigatórios' };
  }

  if (!validarEmail(dados.email)) {
    return { sucesso: false, mensagem: 'Email inválido' };
  }

  if (!validarSenha(dados.senha)) {
    return { sucesso: false, mensagem: 'A senha deve ter no mínimo 6 caracteres' };
  }

  if (dados.senha !== dados.confirmarSenha) {
    return { sucesso: false, mensagem: 'As senhas não coincidem' };
  }

  const resultado = await cadastrarUsuario(dados);
  return resultado;
};

/**
 * Solicita recuperação de senha.
 */
export const solicitarRecuperacao = async (email) => {
  if (!email) {
    return { sucesso: false, mensagem: 'Insira o seu email' };
  }

  if (!validarEmail(email)) {
    return { sucesso: false, mensagem: 'Email inválido' };
  }

  const resultado = await solicitarRecuperacaoSenha(email);
  return resultado;
};

/**
 * Redefine a senha com token de recuperação.
 */
export const redefinirSenhaComToken = async (token, novaSenha, confirmarSenha) => {
  if (!token) {
    return { sucesso: false, mensagem: 'Token de recuperação não encontrado' };
  }

  if (!novaSenha || !confirmarSenha) {
    return { sucesso: false, mensagem: 'Preencha todos os campos' };
  }

  if (!validarSenha(novaSenha)) {
    return { sucesso: false, mensagem: 'A senha deve ter no mínimo 6 caracteres' };
  }

  if (novaSenha !== confirmarSenha) {
    return { sucesso: false, mensagem: 'As senhas não coincidem' };
  }

  const resultado = await redefinirSenha(token, novaSenha);
  return resultado;
};

export default {
  fazerLogin,
  fazerLogout,
  verificarAutenticacao,
  obterUsuarioAtual,
  registrarUsuario,
  solicitarRecuperacao,
  redefinirSenhaComToken
};
