/**
 * PAGE: EsqueciSenha
 *
 * Página para recuperação de senha.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Card, Button, Input } from '../views/components';
import { solicitarRecuperacao } from '../controllers/AuthController';

const EsqueciSenha = () => {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const resultado = await solicitarRecuperacao(email);
      if (resultado.sucesso) {
        setEnviado(true);
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
        {/* Logo/Título */}
        <div className="text-center mb-8">
          <img src="/olivecofree.svg" alt="OliveCoFree" className="h-16 mx-auto" />
          <p className="text-gray-600 mt-2">Recuperação de Senha</p>
        </div>

        <Card className="p-6">
          {!enviado ? (
            <>
              {/* Formulário */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="text-primary-600" size={32} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Esqueceu a senha?
                </h2>
                <p className="text-gray-600 text-sm mt-2">
                  Sem problema! Insira seu email e enviaremos instruções para redefinir sua senha.
                </p>
              </div>

              {erro && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  icone={<Mail size={18} />}
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  loading={carregando}
                  className="mt-4"
                >
                  Enviar Instruções
                </Button>
              </form>

              {/* Link voltar */}
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
            <>
              {/* Mensagem de sucesso */}
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Email Enviado!
                </h2>
                <p className="text-gray-600 text-sm mt-2">
                  Enviamos instruções para <strong>{email}</strong>.
                  Verifique sua caixa de entrada e spam.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      setEnviado(false);
                      setEmail('');
                    }}
                  >
                    Enviar novamente
                  </Button>

                  <Link to="/login" className="block">
                    <Button variant="outline" fullWidth>
                      Voltar para o login
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Lembrou a senha?{' '}
          <Link to="/login" className="text-primary-600 hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default EsqueciSenha;
