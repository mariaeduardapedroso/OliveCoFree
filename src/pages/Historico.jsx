/**
 * PAGE: Historico
 *
 * Página de histórico de previsões com paginação.
 */

import React, { useState, useEffect } from 'react';
import { History, Download, Filter, TrendingUp, Calendar } from 'lucide-react';
import {
  Card,
  Button,
  Select,
  Tabela,
  GraficoBarras,
  Loading,
  Paginacao
} from '../views/components';
import {
  obterHistorico,
  obterDadosGrafico,
  obterAnosDisponiveis,
  formatarData,
  getCorRisco,
  getTextoRisco
} from '../controllers/PrevisaoController';
import { doencas, getDoencaById, getDoencasOptions } from '../models/DoencaModel';

const Historico = () => {
  // Estados
  const [carregando, setCarregando] = useState(true);
  const [historico, setHistorico] = useState([]);
  const [dadosGraficoPorDoenca, setDadosGraficoPorDoenca] = useState({});
  const [filtroAno, setFiltroAno] = useState('');
  const [filtroDoenca, setFiltroDoenca] = useState('');
  const [filtroAnoGrafico, setFiltroAnoGrafico] = useState('');
  const [anosDisponiveis, setAnosDisponiveis] = useState([]);

  // Estados de paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [tamanhoPagina, setTamanhoPagina] = useState(10);
  const [totalRegistos, setTotalRegistos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  // Atualizar tabela quando filtros ou paginação mudarem
  useEffect(() => {
    if (!carregando) {
      atualizarTabela();
    }
  }, [filtroAno, filtroDoenca, paginaAtual, tamanhoPagina]);

  // Resetar página quando filtros mudam
  const handleFiltroAnoChange = (e) => {
    setFiltroAno(e.target.value);
    setPaginaAtual(1);
  };

  const handleFiltroDoencaChange = (e) => {
    setFiltroDoenca(e.target.value);
    setPaginaAtual(1);
  };

  const handleLimparFiltros = () => {
    setFiltroAno('');
    setFiltroDoenca('');
    setPaginaAtual(1);
  };

  // Atualizar gráficos quando filtro de ano mudar
  useEffect(() => {
    if (!carregando) {
      const atualizarGraficos = async () => {
        try {
          const ano = filtroAnoGrafico ? parseInt(filtroAnoGrafico) : null;
          const graficos = {};
          for (const d of doencas) {
            graficos[d.id] = await obterDadosGrafico(52, ano, d.id);
          }
          setDadosGraficoPorDoenca(graficos);
        } catch (error) {
          console.error('Erro ao atualizar graficos:', error);
        }
      };
      atualizarGraficos();
    }
  }, [filtroAnoGrafico]);

  const atualizarTabela = async () => {
    try {
      const filtros = {
        pagina: paginaAtual,
        tamanho: tamanhoPagina
      };
      if (filtroAno) filtros.ano = parseInt(filtroAno);
      if (filtroDoenca) filtros.doencaId = filtroDoenca;
      const resultado = await obterHistorico(filtros);
      setHistorico(resultado.previsoes);
      setTotalRegistos(resultado.total);
      setTotalPaginas(resultado.totalPaginas);
    } catch (error) {
      console.error('Erro ao filtrar historico:', error);
    }
  };

  const carregarDadosIniciais = async () => {
    setCarregando(true);

    try {
      // Carregar histórico com paginação
      const resultado = await obterHistorico({ pagina: 1, tamanho: tamanhoPagina });
      setHistorico(resultado.previsoes);
      setTotalRegistos(resultado.total);
      setTotalPaginas(resultado.totalPaginas);

      // Carregar dados do gráfico para cada doença
      const graficos = {};
      for (const d of doencas) {
        try {
          graficos[d.id] = await obterDadosGrafico(52, null, d.id);
        } catch {
          graficos[d.id] = { labels: [], dados: [] };
        }
      }
      setDadosGraficoPorDoenca(graficos);

      // Carregar anos disponíveis
      const anos = await obterAnosDisponiveis();
      setAnosDisponiveis(
        anos.map(a => ({ valor: a, label: a.toString() }))
      );
    } catch (error) {
      console.error('Erro ao carregar historico:', error);
    }

    setCarregando(false);
  };

  // Handler para mudança de tamanho da página
  const handleTamanhoChange = (novoTamanho) => {
    setTamanhoPagina(novoTamanho);
    setPaginaAtual(1);
  };

  // Colunas da tabela
  const colunas = [
    {
      header: 'Doença',
      accessor: 'doencaId',
      render: (valor) => {
        const doenca = getDoencaById(valor);
        return (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: doenca.cor }}
          >
            {doenca.nome}
          </span>
        );
      }
    },
    {
      header: 'Data',
      accessor: 'data',
      render: (valor) => formatarData(valor)
    },
    {
      header: 'Semana',
      accessor: 'semana',
      render: (valor, item) => `S${valor} / ${item.ano}`
    },
    {
      header: 'Infeção',
      accessor: 'percentualInfectadas',
      render: (valor) => (
        <span className="font-medium">{valor.toFixed(1)}%</span>
      )
    },
    {
      header: 'Risco',
      accessor: 'risco',
      render: (valor) => {
        const cores = getCorRisco(valor);
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${cores.bg} ${cores.text}`}
          >
            {getTextoRisco(valor)}
          </span>
        );
      }
    },
    {
      header: 'Temp.',
      accessor: 'temperatura',
      render: (valor) => valor ? `${valor}C` : '-'
    },
    {
      header: 'Hum.',
      accessor: 'humidade',
      render: (valor) => valor ? `${valor}%` : '-'
    },
    {
      header: 'Conf.',
      accessor: 'confianca',
      render: (valor) => (
        <span className="text-gray-500">{valor || '-'}%</span>
      )
    }
  ];

  // Exportar para CSV
  const handleExportar = () => {
    const cabecalho = ['Doença', 'Data', 'Semana', 'Ano', 'Infeção (%)', 'Risco', 'Temperatura', 'Humidade', 'Precipitação', 'Confiança'];

    const linhas = historico.map(item => [
      getDoencaById(item.doencaId).nome,
      formatarData(item.data),
      item.semana,
      item.ano,
      item.percentualInfectadas,
      getTextoRisco(item.risco),
      item.temperatura || '',
      item.humidade || '',
      item.precipitacao || '',
      item.confianca || ''
    ]);

    const csv = [
      cabecalho.join(';'),
      ...linhas.map(l => l.join(';'))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_previsoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  if (carregando) {
    return <Loading mensagem="A carregar histórico..." />;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <History className="text-primary-600" />
            Histórico de Previsões
          </h1>
          <p className="text-gray-600 mt-1">
            Consulte todas as previsões realizadas
          </p>
        </div>

        <div className="flex gap-3 mt-4 md:mt-0">
          <Button
            variant="outline"
            onClick={handleExportar}
            icone={<Download size={18} />}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Gráficos por Doença */}
      <Card
        titulo="Evolução da Infeção"
        subtitulo={filtroAnoGrafico ? `Ano ${filtroAnoGrafico}` : "Todas as semanas"}
        icone={<TrendingUp size={24} />}
        className="mb-6"
      >
        {/* Filtro de Ano */}
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-3 border-b border-gray-100">
          <span className="text-sm text-gray-600">Filtrar por ano:</span>
          <Select
            name="filtroAnoGrafico"
            value={filtroAnoGrafico}
            onChange={(e) => setFiltroAnoGrafico(e.target.value)}
            options={anosDisponiveis}
            placeholder="Todos"
            className="w-32 mb-0"
          />
          {filtroAnoGrafico && (
            <button
              onClick={() => setFiltroAnoGrafico('')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Gráficos separados por doença */}
        <div className="space-y-6">
          {doencas.map(doenca => {
            const dadosGrafico = dadosGraficoPorDoenca[doenca.id] || { labels: [], dados: [] };
            return (
              <div key={doenca.id}>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: doenca.cor }}
                  ></span>
                  {doenca.nome}
                </h4>
                {dadosGrafico.dados.length > 0 ? (
                  <GraficoBarras
                    labels={dadosGrafico.labels}
                    dados={dadosGrafico.dados}
                    labelDataset={doenca.labelGrafico}
                    altura={200}
                    cor={doenca.cor}
                    thresholds={doenca.thresholds}
                  />
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                    Sem dados para esta doença
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Filtros e Tabela */}
      <Card
        titulo="Lista de Previsões"
        subtitulo={`${totalRegistos} registos encontrados`}
        icone={<Calendar size={24} />}
      >
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <span className="text-sm text-gray-600">Filtrar:</span>
          </div>
          <Select
            name="filtroDoenca"
            value={filtroDoenca}
            onChange={handleFiltroDoencaChange}
            options={getDoencasOptions()}
            placeholder="Todas doenças"
            className="w-40 mb-0"
          />
          <Select
            name="filtroAno"
            value={filtroAno}
            onChange={handleFiltroAnoChange}
            options={anosDisponiveis}
            placeholder="Todos os anos"
            className="w-40 mb-0"
          />
          {(filtroAno || filtroDoenca) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLimparFiltros}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Tabela */}
        <Tabela
          colunas={colunas}
          dados={historico}
        />

        {/* Sem resultados */}
        {historico.length === 0 && (
          <div className="text-center py-12">
            <History className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">Nenhuma previsão encontrada</p>
            <p className="text-gray-400 text-sm mt-1">
              {(filtroAno || filtroDoenca)
                ? 'Tente remover os filtros ou selecionar outras opções'
                : 'Faça a sua primeira previsão para ver o histórico'
              }
            </p>
          </div>
        )}

        {/* Paginação */}
        {totalRegistos > 0 && (
          <Paginacao
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            totalRegistos={totalRegistos}
            tamanho={tamanhoPagina}
            onPaginaChange={setPaginaAtual}
            onTamanhoChange={handleTamanhoChange}
          />
        )}
      </Card>

    </div>
  );
};

export default Historico;
