/**
 * PAGE: Login
 *
 * Página de autenticação do usuário.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Alerta } from '../views/components';
import { fazerLogin } from '../controllers/AuthController';

const Login = () => {
  const navigate = useNavigate();

  // Estados
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  // Handler do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const resultado = await fazerLogin(email, senha);

      if (resultado.sucesso) {
        navigate('/app/dashboard');
      } else {
        setErro(resultado.mensagem);
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
    }

    setCarregando(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <img src="/olivecofree.svg" alt="OliveCoFree" className="h-20 mx-auto mb-4" />
          <p className="text-gray-600 mt-2">Sistema de Previsão de Infeção</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Entrar
          </h2>

          {/* Alerta de erro */}
          {erro && (
            <Alerta
              tipo="error"
              mensagem={erro}
              onFechar={() => setErro('')}
              className="mb-4"
            />
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              icone={<Mail size={20} />}
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={20} />
                </span>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg outline-none transition-all duration-200 focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">Lembrar-me</span>
              </label>
              <Link to="/esqueci-senha" className="text-sm text-primary-600 hover:text-primary-700">
                Esqueci a senha
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={carregando}
            >
              Entrar
            </Button>
          </form>

          {/* Link para cadastro */}
          <p className="text-center mt-6 text-gray-600">
            Não tem conta?{' '}
            <Link
              to="/cadastro"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Criar conta
            </Link>
          </p>
        </div>

        {/* Rodapé */}
        <p className="text-center mt-6 text-sm text-gray-500">
          &copy; 2025 OliveCoFree - IPB
        </p>
      </div>
    </div>
  );
};

export default Login;
