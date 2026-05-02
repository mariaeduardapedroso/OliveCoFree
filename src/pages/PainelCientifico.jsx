/**
 * PAGE: Painel Cientifico
 *
 * Dashboard exclusivo para pesquisadores.
 * Secoes: Metricas dos Modelos | Templates + Upload | Historico de Uploads
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  Download,
  Upload,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Database,
  Calendar,
  Trash2,
  CloudRain,
  Leaf,
} from 'lucide-react';
import OliveIcon from '../views/icons/OliveIcon';
import { Card, Button, Select, Alerta, Loading, Paginacao } from '../views/components';
import {
  obterInfoModelos,
  baixarTemplate,
  enviarDados,
  obterHistoricoUploads,
} from '../controllers/PesquisadorController';

// ============================================================
// HELPERS
// ============================================================

const formatarPercentual = (valor) => {
  if (valor == null) return '—';
  return `${(valor * 100).toFixed(1)}%`;
};

// MAE/RMSE chegam ja em pontos percentuais (ex: 1.48 -> "1.48%")
const formatarPontos = (valor) => {
  if (valor == null) return '—';
  return `${Number(valor).toFixed(2)}%`;
};

// R2 e adimensional, mostrar com 3 casas decimais
const formatarR2 = (valor) => {
  if (valor == null) return '—';
  return Number(valor).toFixed(3);
};

const formatarData = (dataStr) => {
  if (!dataStr) return '—';
  const d = new Date(dataStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const nomeDoenca = (id) => {
  const nomes = {
    'olho-pavao': 'Olho de Pavao',
    'antracnose': 'Antracnose',
  };
  return nomes[id] || id;
};

const iconeDoenca = (id) => {
  if (id === 'olho-pavao') return <Leaf size={20} />;
  return <OliveIcon size={20} />;
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const PainelCientifico = () => {
  // --- Estados globais ---
  const [carregando, setCarregando] = useState(true);
  const [modelos, setModelos] = useState([]);
  const [historico, setHistorico] = useState([]);

  // Paginacao do historico
  const [paginaHistorico, setPaginaHistorico] = useState(1);
  const [totalPaginasHistorico, setTotalPaginasHistorico] = useState(1);
  const [totalHistorico, setTotalHistorico] = useState(0);
  const [tamanhoPaginaHistorico, setTamanhoPaginaHistorico] = useState(5);

  // --- Estados do upload ---
  const [doencaSelecionada, setDoencaSelecionada] = useState('olho-pavao');
  const [arquivoDoenca, setArquivoDoenca] = useState(null);
  const [arquivoClima, setArquivoClima] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [resultadoUpload, setResultadoUpload] = useState(null);
  const [erroUpload, setErroUpload] = useState(null);

  // --- Estados dos templates ---
  const [baixandoTemplate, setBaixandoTemplate] = useState(null);

  // --- Carregar dados ---
  const carregarDados = async (showLoading = true) => {
    if (showLoading) setCarregando(true);
    try {
      const modelosData = await obterInfoModelos().catch(() => []);
      setModelos(modelosData);

      const historicoData = await obterHistoricoUploads(paginaHistorico, tamanhoPaginaHistorico).catch(() => null);
      if (historicoData && historicoData.uploads) {
        setHistorico(historicoData.uploads);
        setTotalPaginasHistorico(historicoData.totalPaginas || 1);
        setTotalHistorico(historicoData.total || 0);
      }
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [paginaHistorico, tamanhoPaginaHistorico]);

  // --- Handlers ---

  const handleBaixarTemplate = async (tipo) => {
    setBaixandoTemplate(tipo);
    try {
      await baixarTemplate(tipo);
    } catch (err) {
      setErroUpload(err.message || 'Erro ao baixar template');
    } finally {
      setBaixandoTemplate(null);
    }
  };

  const handleUpload = async () => {
    if (!arquivoDoenca || !arquivoClima) return;

    setEnviando(true);
    setResultadoUpload(null);
    setErroUpload(null);

    try {
      const resultado = await enviarDados(doencaSelecionada, arquivoDoenca, arquivoClima);
      setResultadoUpload(resultado);
      setArquivoDoenca(null);
      setArquivoClima(null);

      // Resetar inputs de ficheiro
      const inputs = document.querySelectorAll('input[type="file"]');
      inputs.forEach((input) => (input.value = ''));

      // Recarregar modelos e historico (sem mostrar loading global)
      await carregarDados(false);
    } catch (err) {
      // Tratar erros de validacao (detail pode ser objeto com erros_doenca / erros_clima)
      if (err.detail && typeof err.detail === 'object') {
        const msgs = [];
        if (err.detail.erros_doenca) {
          msgs.push(...err.detail.erros_doenca.map((e) => `Doenca: ${e}`));
        }
        if (err.detail.erros_clima) {
          msgs.push(...err.detail.erros_clima.map((e) => `Clima: ${e}`));
        }
        setErroUpload(msgs.join('\n'));
      } else {
        setErroUpload(err.message || 'Erro ao enviar dados');
      }
    } finally {
      setEnviando(false);
    }
  };

  const handleLimparArquivos = () => {
    setArquivoDoenca(null);
    setArquivoClima(null);
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach((input) => (input.value = ''));
  };

  // --- Loading ---
  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FlaskConical className="text-primary-600" />
            Painel Cientifico
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie modelos de Machine Learning e envie novos dados de campo
          </p>
        </div>

        <div className="flex gap-3 mt-4 md:mt-0">
          <Button
            variant="outline"
            onClick={carregarDados}
            icone={<RefreshCw size={18} />}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECAO 1: METRICAS DOS MODELOS */}
      {/* ============================================================ */}
      <section className="mt-2">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-primary-600" />
          Metricas dos Modelos
        </h2>

        {modelos.length === 0 ? (
          <Alerta
            tipo="warning"
            mensagem="Nenhum modelo encontrado. Verifique se os microsservicos estao em execucao."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modelos.map((m) => (
              <Card key={m.doencaId} className="relative">
                {/* Badge da doenca */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`p-2 rounded-lg ${m.doencaId === 'olho-pavao' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'}`}>
                    {iconeDoenca(m.doencaId)}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-800">{nomeDoenca(m.doencaId)}</h3>
                    <p className="text-xs text-gray-500">{m.modelo}</p>
                  </div>
                </div>

                {/* Metricas - Dataset Completo (otimista) */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Dataset Completo <span className="text-gray-400 normal-case font-normal">(treino e teste nos mesmos dados)</span>
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <p className="text-base font-bold text-blue-700">{formatarPercentual(m.accuracy)}</p>
                      <p className="text-[10px] text-blue-600">Accuracy</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded-lg">
                      <p className="text-base font-bold text-purple-700">{formatarPercentual(m.f1Score)}</p>
                      <p className="text-[10px] text-purple-600">F1-Score</p>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded-lg">
                      <p className="text-base font-bold text-orange-700">{formatarPontos(m.mae)}</p>
                      <p className="text-[10px] text-orange-600">MAE</p>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded-lg">
                      <p className="text-base font-bold text-amber-700">{formatarPontos(m.rmse)}</p>
                      <p className="text-[10px] text-amber-600">RMSE</p>
                    </div>
                    <div className="text-center p-2 bg-teal-50 rounded-lg">
                      <p className="text-base font-bold text-teal-700">{formatarR2(m.r2)}</p>
                      <p className="text-[10px] text-teal-600">R²</p>
                    </div>
                  </div>
                </div>

                {/* Metricas - Janela Deslizante (validacao temporal) */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Janela Deslizante <span className="text-gray-400 normal-case font-normal">(validação temporal entre anos)</span>
                  </p>
                  {m.maeSlidingWindow == null && m.accuracySlidingWindow == null ? (
                    <p className="text-xs text-gray-400 italic p-2 bg-gray-50 rounded-lg">
                      Anos insuficientes para esta avaliação
                    </p>
                  ) : (
                    <div className="grid grid-cols-5 gap-2">
                      <div className="text-center p-2 bg-blue-50/60 rounded-lg border border-blue-100">
                        <p className="text-base font-bold text-blue-700">{formatarPercentual(m.accuracySlidingWindow)}</p>
                        <p className="text-[10px] text-blue-600">Accuracy</p>
                      </div>
                      <div className="text-center p-2 bg-purple-50/60 rounded-lg border border-purple-100">
                        <p className="text-base font-bold text-purple-700">{formatarPercentual(m.f1ScoreSlidingWindow)}</p>
                        <p className="text-[10px] text-purple-600">F1-Score</p>
                      </div>
                      <div className="text-center p-2 bg-orange-50/60 rounded-lg border border-orange-100">
                        <p className="text-base font-bold text-orange-700">{formatarPontos(m.maeSlidingWindow)}</p>
                        <p className="text-[10px] text-orange-600">MAE</p>
                      </div>
                      <div className="text-center p-2 bg-amber-50/60 rounded-lg border border-amber-100">
                        <p className="text-base font-bold text-amber-700">{formatarPontos(m.rmseSlidingWindow)}</p>
                        <p className="text-[10px] text-amber-600">RMSE</p>
                      </div>
                      <div className="text-center p-2 bg-teal-50/60 rounded-lg border border-teal-100">
                        <p className="text-base font-bold text-teal-700">{formatarR2(m.r2SlidingWindow)}</p>
                        <p className="text-[10px] text-teal-600">R²</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pesos do Ensemble (IVW) */}
                {m.pesosEnsemble && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Pesos do Ensemble <span className="text-gray-400 normal-case font-normal">(Inverse-Variance Weighting)</span>
                    </p>
                    <div className="flex gap-2">
                      {Object.entries(m.pesosEnsemble).map(([nome, peso]) => (
                        <div key={nome} className="flex-1 text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-sm font-bold text-gray-700">{(peso * 100).toFixed(1)}%</p>
                          <p className="text-[10px] text-gray-500 uppercase">{nome}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadados */}
                <div className="space-y-2 text-sm pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Database size={14} />
                    <span>{m.totalAmostrasTreino} amostras · {m.featuresUtilizadas?.length || 0} features</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} />
                    <span>Anos: {m.anosTreino?.join(', ') || '—'}</span>
                  </div>
                  {m.thresholds && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(m.thresholds).map(([nivel, valor]) => (
                        <span
                          key={nivel}
                          className={`text-xs px-2 py-1 rounded-full ${
                            nivel === 'baixo' ? 'bg-green-100 text-green-700' :
                            nivel === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}
                        >
                          {nivel}: {valor}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* SECAO 2: TEMPLATES + UPLOAD */}
      {/* ============================================================ */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <FileSpreadsheet size={20} className="text-primary-600" />
          Templates e Upload de Dados
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Templates */}
          <Card titulo="Templates Excel" subtitulo="Baixe os modelos para preenchimento" icone={<Download size={20} />}>
            <div className="space-y-3">
              {[
                { tipo: 'olho-pavao', label: 'Olho de Pavao', desc: 'Dados de incidencia (folhas)', icone: <Leaf size={16} />, cor: 'pink' },
                { tipo: 'antracnose', label: 'Antracnose', desc: 'Dados de incidencia (azeitonas)', icone: <OliveIcon size={16} />, cor: 'purple' },
                { tipo: 'clima', label: 'Dados Climaticos', desc: 'Temperatura, humidade, precipitacao', icone: <CloudRain size={16} />, cor: 'blue' },
              ].map((t) => (
                <button
                  key={t.tipo}
                  onClick={() => handleBaixarTemplate(t.tipo)}
                  disabled={baixandoTemplate === t.tipo}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-${t.cor}-300 hover:bg-${t.cor}-50 transition-colors text-left disabled:opacity-50`}
                >
                  <span className={`p-2 rounded-lg bg-${t.cor}-100 text-${t.cor}-600`}>
                    {t.icone}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{t.label}</p>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                  </div>
                  {baixandoTemplate === t.tipo ? (
                    <RefreshCw size={16} className="animate-spin text-gray-400" />
                  ) : (
                    <Download size={16} className="text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* Upload */}
          <Card titulo="Enviar Dados" subtitulo="Upload de dados de campo para retreinar o modelo" icone={<Upload size={20} />}>
            <div className="space-y-4">
              {/* Selecao da doenca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doenca</label>
                <select
                  value={doencaSelecionada}
                  onChange={(e) => setDoencaSelecionada(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                >
                  <option value="olho-pavao">Olho de Pavao</option>
                  <option value="antracnose">Antracnose</option>
                </select>
              </div>

              {/* Ficheiro de doenca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ficheiro de Doenca (.xlsx) *
                </label>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => setArquivoDoenca(e.target.files[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 file:cursor-pointer cursor-pointer"
                />
                {arquivoDoenca && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle size={12} /> {arquivoDoenca.name}
                  </p>
                )}
              </div>

              {/* Ficheiro de clima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ficheiro de Clima (.xlsx) *
                </label>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => setArquivoClima(e.target.files[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                />
                {arquivoClima && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle size={12} /> {arquivoClima.name}
                  </p>
                )}
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>Importante:</strong> Ambos os ficheiros sao obrigatorios. Os dados novos serao
                  combinados com os dados originais e o modelo sera retreinado automaticamente.
                </p>
              </div>

              {/* Botoes */}
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={!arquivoDoenca || !arquivoClima || enviando}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {enviando ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Retreinando modelo...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Enviar e Retreinar
                    </>
                  )}
                </button>
                {(arquivoDoenca || arquivoClima) && !enviando && (
                  <button
                    onClick={handleLimparArquivos}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Trash2 size={16} />
                    Limpar
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Alertas de resultado do upload */}
        {resultadoUpload && (
          <div className="mt-4">
            <Alerta
              tipo="success"
              titulo="Modelo retreinado com sucesso!"
              mensagem={resultadoUpload.mensagem}
              onFechar={() => setResultadoUpload(null)}
            />
            {/* Comparacao de metricas antes/depois */}
            {resultadoUpload.metricasAntes && (
              <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Comparacao de Metricas</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium text-gray-500">Antes</p>
                    <p>Accuracy: <span className="font-semibold">{formatarPercentual(resultadoUpload.metricasAntes.accuracy)}</span></p>
                    <p>F1-Score: <span className="font-semibold">{formatarPercentual(resultadoUpload.metricasAntes.f1Score)}</span></p>
                    <p>Amostras: <span className="font-semibold">{resultadoUpload.metricasAntes.totalAmostrasTreino}</span></p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-green-600">Depois</p>
                    <p>Accuracy: <span className="font-semibold text-green-700">{formatarPercentual(resultadoUpload.metricasDepois.accuracy)}</span></p>
                    <p>F1-Score: <span className="font-semibold text-green-700">{formatarPercentual(resultadoUpload.metricasDepois.f1Score)}</span></p>
                    <p>Amostras: <span className="font-semibold text-green-700">{resultadoUpload.metricasDepois.totalAmostrasTreino}</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {erroUpload && (
          <div className="mt-4">
            <Alerta
              tipo="error"
              titulo="Erro no upload"
              mensagem={erroUpload}
              onFechar={() => setErroUpload(null)}
            />
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* SECAO 3: HISTORICO DE UPLOADS */}
      {/* ============================================================ */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Database size={20} className="text-primary-600" />
          Historico de Uploads
        </h2>

        {historico.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <Upload size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Nenhum upload realizado ainda.</p>
              <p className="text-sm text-gray-400">
                Envie dados de campo para retreinar os modelos.
              </p>
            </div>
          </Card>
        ) : (
          <Card bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Pesquisador</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Doenca</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Amostras</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Anos</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Accuracy</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">F1-Score</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Total Amostras</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700">{formatarData(u.dataUpload)}</td>
                      <td className="px-4 py-3 text-gray-700">{u.usuarioNome || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          u.doencaId === 'olho-pavao' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {iconeDoenca(u.doencaId)}
                          {nomeDoenca(u.doencaId)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {u.amostrasDoenca} + {u.amostrasClima}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {u.anosDados?.join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {u.accuracyAntes != null && (
                            <>
                              <span className="text-gray-400">{formatarPercentual(u.accuracyAntes)}</span>
                              <span className="text-gray-400">→</span>
                            </>
                          )}
                          <span className="font-medium text-green-700">{formatarPercentual(u.accuracyDepois)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {u.f1Antes != null && (
                            <>
                              <span className="text-gray-400">{formatarPercentual(u.f1Antes)}</span>
                              <span className="text-gray-400">→</span>
                            </>
                          )}
                          <span className="font-medium text-green-700">{formatarPercentual(u.f1Depois)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-700">
                        {u.totalAmostrasDepois}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPaginasHistorico > 1 && (
              <div className="p-4 border-t border-gray-200">
                <Paginacao
                  paginaAtual={paginaHistorico}
                  totalPaginas={totalPaginasHistorico}
                  totalRegistos={totalHistorico}
                  tamanho={tamanhoPaginaHistorico}
                  onPaginaChange={setPaginaHistorico}
                  onTamanhoChange={(novoTamanho) => {
                    setTamanhoPaginaHistorico(novoTamanho);
                    setPaginaHistorico(1);
                  }}
                />
              </div>
            )}
          </Card>
        )}
      </section>
    </div>
  );
};

export default PainelCientifico;
