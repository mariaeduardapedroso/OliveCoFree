/**
 * PAGE: Perfil
 *
 * Página para visualizar e editar dados do usuário.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Save,
  ArrowLeft,
  Calendar,
  Shield,
  Eye,
  EyeOff,
  MapPin,
  Home,
  Briefcase
} from 'lucide-react';
import { Card, Button, Input, Alerta, Loading } from '../views/components';
import { apiObterUsuario, apiAtualizarUsuario } from '../services/api';

const Perfil = () => {
  const navigate = useNavigate();

  // Estados
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [editando, setEditando] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [propriedade, setPropriedade] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Carregar dados do usuário
  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const dados = await apiObterUsuario();
        setUsuario(dados);
        setNome(dados.nome);
        setLocalizacao(dados.localizacao || '');
        setPropriedade(dados.propriedade || '');
      } catch (error) {
        setErro('Erro ao carregar dados do usuário');
      }
      setCarregando(false);
    };
    carregarUsuario();
  }, []);

  // Cancelar edição
  const handleCancelar = () => {
    setNome(usuario.nome);
    setLocalizacao(usuario.localizacao || '');
    setPropriedade(usuario.propriedade || '');
    setSenha('');
    setConfirmarSenha('');
    setEditando(false);
    setErro('');
    setSucesso('');
  };

  // Salvar alterações
  const handleSalvar = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    // Validações
    if (!nome || nome.length < 2) {
      setErro('O nome deve ter pelo menos 2 caracteres');
      return;
    }

    if (senha) {
      if (senha.length < 6) {
        setErro('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (senha !== confirmarSenha) {
        setErro('As senhas não coincidem');
        return;
      }
    }

    setSalvando(true);

    try {
      const dados = {};
      if (nome !== usuario.nome) dados.nome = nome;
      if (localizacao !== (usuario.localizacao || '')) dados.localizacao = localizacao;
      if (propriedade !== (usuario.propriedade || '')) dados.propriedade = propriedade;
      if (senha) dados.senha = senha;

      if (Object.keys(dados).length === 0) {
        setSucesso('Nenhuma alteração para salvar');
        setEditando(false);
        setSalvando(false);
        return;
      }

      const atualizado = await apiAtualizarUsuario(dados);
      setUsuario(atualizado);
      setNome(atualizado.nome);
      setLocalizacao(atualizado.localizacao || '');
      setPropriedade(atualizado.propriedade || '');
      setSenha('');
      setConfirmarSenha('');

      // Atualizar localStorage
      localStorage.setItem('usuario', JSON.stringify(atualizado));

      setSucesso('Dados atualizados com sucesso!');
      setEditando(false);
    } catch (error) {
      setErro(error.message || 'Erro ao atualizar dados');
    }

    setSalvando(false);
  };

  // Formatar data
  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (carregando) {
    return <Loading mensagem="A carregar perfil..." />;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-primary-600" />
            Meu Perfil
          </h1>
          <p className="text-gray-600 mt-1">
            Visualize e edite os seus dados pessoais
          </p>
        </div>
      </div>

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
          onFechar={() => setSucesso('')}
          className="mb-4"
        />
      )}

      {/* Card do Perfil */}
      <Card>
        {/* Avatar e info básica */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <User size={40} className="text-primary-600" />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-800">{usuario?.nome}</h2>
            <p className="text-gray-500">{usuario?.email}</p>
            <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${usuario?.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {usuario?.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
          <div className="sm:ml-auto">
            {!editando ? (
              <Button
                variant="primary"
                onClick={() => setEditando(true)}
              >
                Editar Perfil
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={handleCancelar}
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* Formulário / Dados */}
        {editando ? (
          <form onSubmit={handleSalvar} className="pt-6 space-y-4">
            <Input
              label="Nome completo"
              type="text"
              name="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              required
              icone={<User size={20} />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Localização"
                type="text"
                name="localizacao"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                placeholder="Ex: Mirandela"
                icone={<MapPin size={20} />}
              />

              <Input
                label="Propriedade / Olival"
                type="text"
                name="propriedade"
                value={propriedade}
                onChange={(e) => setPropriedade(e.target.value)}
                placeholder="Ex: Olival da Serra"
                icone={<Home size={20} />}
              />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                <Lock size={16} />
                Alterar senha (deixe em branco para manter a atual)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="Nova senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    name="senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    icone={<Lock size={20} />}
                  />
                </div>
                <Input
                  label="Confirmar nova senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  name="confirmarSenha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a senha"
                  icone={<Lock size={20} />}
                />
              </div>

              {senha && (
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-1"
                >
                  {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                  {mostrarSenha ? 'Ocultar senhas' : 'Mostrar senhas'}
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                loading={salvando}
                icone={<Save size={18} />}
              >
                Salvar Alterações
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancelar}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <div className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <User size={16} />
                  Nome
                </div>
                <p className="font-medium text-gray-800">{usuario?.nome}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Mail size={16} />
                  Email
                </div>
                <p className="font-medium text-gray-800">{usuario?.email}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Calendar size={16} />
                  Membro desde
                </div>
                <p className="font-medium text-gray-800">{formatarData(usuario?.criado_em)}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Shield size={16} />
                  Estado
                </div>
                <p className="font-medium text-gray-800">
                  {usuario?.ativo ? 'Conta ativa' : 'Conta inativa'}
                </p>
              </div>

              {usuario?.tipo && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Briefcase size={16} />
                    Tipo de utilizador
                  </div>
                  <p className="font-medium text-gray-800 capitalize">{usuario.tipo === 'tecnico' ? 'Técnico Agrícola' : usuario.tipo}</p>
                </div>
              )}

              {usuario?.localizacao && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <MapPin size={16} />
                    Localização
                  </div>
                  <p className="font-medium text-gray-800">{usuario.localizacao}</p>
                </div>
              )}
            </div>

            {usuario?.propriedade && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Home size={16} />
                  Propriedade / Olival
                </div>
                <p className="font-medium text-gray-800">{usuario.propriedade}</p>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Lock size={16} />
                Senha
              </div>
              <p className="font-medium text-gray-800">••••••••</p>
              <button
                onClick={() => setEditando(true)}
                className="text-sm text-primary-600 hover:text-primary-700 mt-1"
              >
                Alterar senha
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Perfil;
