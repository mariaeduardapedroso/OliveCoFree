/**
 * PAGE: RedefinirSenha
 *
 * Pagina para redefinir a senha usando token de recuperacao.
 */

import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Card, Button, Input, Alerta } from '../views/components';
import { redefinirSenhaComToken } from '../controllers/AuthController';

const RedefinirSenha = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/olivecofree.svg" alt="OliveCoFree" className="h-16 mx-auto" />
          </div>
          <Card className="p-6">
            <Alerta
              tipo="error"
              mensagem="O link de recuperacao e invalido ou esta incompleto. Solicite um novo link."
            />
            <div className="mt-4 text-center">
              <Link to="/esqueci-senha">
                <Button variant="primary" fullWidth>
                  Solicitar novo link
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const resultado = await redefinirSenhaComToken(token, novaSenha, confirmarSenha);
      if (resultado.sucesso) {
        setSucesso(true);
      } else {
        setErro(resultado.mensagem);
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
    }

    setCarregando(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/olivecofree.svg" alt="OliveCoFree" className="h-16 mx-auto" />
          <p className="text-gray-600 mt-2">Redefinir Senha</p>
        </div>

        <Card className="p-6">
          {!sucesso ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="text-primary-600" size={32} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Nova Senha
                </h2>
                <p className="text-gray-600 text-sm mt-2">
                  Insira e confirme a sua nova senha.
                </p>
              </div>

              {erro && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nova senha <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock size={18} />
                    </span>
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Minimo 6 caracteres"
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

                <Input
                  label="Confirmar nova senha"
                  type="password"
                  name="confirmarSenha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  icone={<Lock size={18} />}
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  loading={carregando}
                  className="mt-4"
                >
                  Redefinir Senha
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  <ArrowLeft size={16} />
                  Voltar para o login
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                Senha Redefinida!
              </h2>
              <p className="text-gray-600 text-sm mt-2">
                A sua senha foi alterada com sucesso. Ja pode fazer login.
              </p>
              <div className="mt-6">
                <Link to="/login">
                  <Button variant="primary" fullWidth size="lg">
                    Ir para o Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RedefinirSenha;
