/**
 * PAGE: Cadastro
 *
 * Página de cadastro de novo usuário.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, User, Mail, Lock, MapPin, Home } from 'lucide-react';
import { Button, Input, Select, Alerta } from '../views/components';
import { registrarUsuario } from '../controllers/AuthController';
import { tiposUsuario } from '../models/UsuarioModel';

const Cadastro = () => {
  const navigate = useNavigate();

  // Estados
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    tipo: '',
    propriedade: '',
    localizacao: ''
  });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Handler de mudança dos inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);

    try {
      const resultado = await registrarUsuario(formData);

      if (resultado.sucesso) {
        setSucesso('Conta criada com sucesso! A redirecionar...');
        setTimeout(() => navigate('/app/dashboard'), 2000);
      } else {
        setErro(resultado.mensagem);
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
    }

    setCarregando(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        {/* Logo e Título */}
        <div className="text-center mb-6">
          <img src="/olivecofree.svg" alt="OliveCoFree" className="h-16 mx-auto mb-3" />
          <p className="text-gray-600 mt-1">Criar nova conta</p>
        </div>

        {/* Card de Cadastro */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          {/* Alertas */}
          {erro && (
            <Alerta
              tipo="error"
              mensagem={erro}
              onFechar={() => setErro('')}
              className="mb-4"
            />
          )}

          {sucesso && (
            <Alerta
              tipo="success"
              mensagem={sucesso}
              className="mb-4"
            />
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="md:col-span-2">
                <Input
                  label="Nome completo"
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  required
                  icone={<User size={20} />}
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  required
                  icone={<Mail size={20} />}
                />
              </div>

              {/* Senha */}
              <Input
                label="Senha"
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                required
                icone={<Lock size={20} />}
              />

              {/* Confirmar Senha */}
              <Input
                label="Confirmar senha"
                type="password"
                name="confirmarSenha"
                value={formData.confirmarSenha}
                onChange={handleChange}
                placeholder="Repita a senha"
                required
                icone={<Lock size={20} />}
              />

              {/* Tipo de Usuário */}
              <Select
                label="Tipo de usuário"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                options={tiposUsuario}
                placeholder="Selecione..."
              />

              {/* Localização */}
              <Input
                label="Localização"
                type="text"
                name="localizacao"
                value={formData.localizacao}
                onChange={handleChange}
                placeholder="Ex: Mirandela"
                icone={<MapPin size={20} />}
              />

              {/* Propriedade */}
              <div className="md:col-span-2">
                <Input
                  label="Nome da propriedade/olival"
                  type="text"
                  name="propriedade"
                  value={formData.propriedade}
                  onChange={handleChange}
                  placeholder="Ex: Olival da Serra"
                  icone={<Home size={20} />}
                />
              </div>
            </div>

            {/* Termos */}
            <label className="flex items-start gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-1 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">
                Li e aceito os{' '}
                <Link to="/termos-de-uso" className="text-primary-600 hover:underline" target="_blank">
                  termos de uso
                </Link>{' '}
                e a{' '}
                <Link to="/politica-de-privacidade" className="text-primary-600 hover:underline" target="_blank">
                  política de privacidade
                </Link>
              </span>
            </label>

            {/* Botão */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={carregando}
              className="mt-6"
            >
              Criar conta
            </Button>
          </form>

          {/* Link para login */}
          <p className="text-center mt-6 text-gray-600">
            Já tem conta?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Entrar
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

export default Cadastro;
