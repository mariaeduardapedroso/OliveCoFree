/**
 * PAGE: Dashboard
 *
 * Página principal com visão geral do sistema.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity,
  ArrowRight
} from 'lucide-react';
import {
  Card,
  Button,
  Select,
  CardRisco,
  CardClima,
  GraficoMultiplasDoencas,
  Loading
} from '../views/components';
import {
  obterPrevisoesSemanaAtual,
  obterDadosGrafico,
  obterAnosDisponiveis
} from '../controllers/PrevisaoController';
import { obterClimaAtual, obterSemanaAtual } from '../controllers/ClimaController';
import { doencas, getDoencasOptions } from '../models/DoencaModel';

const Dashboard = () => {
  // Estados
  const [carregando, setCarregando] = useState(true);
  const [ultimasPrevisoes, setUltimasPrevisoes] = useState({});
  const [dadosGraficoPorDoenca, setDadosGraficoPorDoenca] = useState({});
  const [clima, setClima] = useState(null);
  const [semanaAtual, setSemanaAtual] = useState(null);
  const [filtroAnoGrafico, setFiltroAnoGrafico] = useState('');
  const [filtroDoencaGrafico, setFiltroDoencaGrafico] = useState('');
  const [anosDisponiveis, setAnosDisponiveis] = useState([]);

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setCarregando(true);

      try {
        // Carregar previsões da semana atual
        try {
          const dadosSemana = await obterPrevisoesSemanaAtual();
          setUltimasPrevisoes(dadosSemana.previsoes);
          setSemanaAtual({ semana: dadosSemana.semana, ano: dadosSemana.ano });
        } catch {
          setUltimasPrevisoes({});
          const semana = obterSemanaAtual();
          setSemanaAtual(semana);
        }

        // Carregar anos disponíveis
        const anos = await obterAnosDisponiveis();
        setAnosDisponiveis(anos.map(a => ({ valor: a, label: a.toString() })));

        // Carregar dados do gráfico para cada doença
        const graficos = {};
        for (const d of doencas) {
          try {
            graficos[d.id] = await obterDadosGrafico(10, null, d.id);
          } catch {
            graficos[d.id] = { labels: [], dados: [] };
          }
        }
        setDadosGraficoPorDoenca(graficos);

        // Carregar clima atual
        try {
          const climaAtual = await obterClimaAtual();
          setClima(climaAtual);
        } catch {
          setClima(null);
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }

      setCarregando(false);
    };

    carregarDadosIniciais();
  }, []);

  // Atualizar gráficos quando filtros mudarem
  useEffect(() => {
    const atualizarGraficos = async () => {
      const ano = filtroAnoGrafico ? parseInt(filtroAnoGrafico) : null;
      const graficos = {};

      try {
        if (filtroDoencaGrafico) {
          graficos[filtroDoencaGrafico] = await obterDadosGrafico(52, ano, filtroDoencaGrafico);
        } else {
          for (const d of doencas) {
            graficos[d.id] = await obterDadosGrafico(52, ano, d.id);
          }
        }
        setDadosGraficoPorDoenca(graficos);
      } catch (error) {
        console.error('Erro ao atualizar graficos:', error);
      }
    };

    atualizarGraficos();
  }, [filtroAnoGrafico, filtroDoencaGrafico]);

  if (carregando) {
    return <Loading mensagem="A carregar dashboard..." />;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Visão geral do sistema de previsão - Semana {semanaAtual?.semana} de {semanaAtual?.ano}
        </p>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 - Status e Ações */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cards de Análise da Semana Atual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doencas.map(doenca => {
              const previsao = ultimasPrevisoes[doenca.id];
              return previsao ? (
                <CardRisco
                  key={doenca.id}
                  risco={previsao.risco}
                  percentual={previsao.percentualInfectadas}
                  semana={semanaAtual?.semana}
                  ano={semanaAtual?.ano}
                  doenca={doenca}
                />
              ) : (
                <Card key={doenca.id} className="border-gray-200">
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">
                      Sem previsão de <strong>{doenca.nome}</strong> para a semana {semanaAtual?.semana}/{semanaAtual?.ano}
                    </p>
                    <Link to="/app/previsao" className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block">
                      Fazer previsão →
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Gráfico Unificado de Histórico */}
          <Card
            titulo="Histórico de Infeção"
            subtitulo={filtroAnoGrafico ? `Ano ${filtroAnoGrafico}` : "Todas as semanas"}
            icone={<Activity size={24} className="text-primary-600" />}
          >
            <div className="flex flex-wrap items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Filtrar:</span>
              <Select
                name="filtroDoencaGrafico"
                value={filtroDoencaGrafico}
                onChange={(e) => setFiltroDoencaGrafico(e.target.value)}
                options={getDoencasOptions()}
                placeholder="Todas doenças"
                className="w-40 mb-0"
              />
              <Select
                name="filtroAnoGrafico"
                value={filtroAnoGrafico}
                onChange={(e) => setFiltroAnoGrafico(e.target.value)}
                options={anosDisponiveis}
                placeholder="Todos anos"
                className="w-32 mb-0"
              />
              {(filtroAnoGrafico || filtroDoencaGrafico) && (
                <button
                  onClick={() => {
                    setFiltroAnoGrafico('');
                    setFiltroDoencaGrafico('');
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Limpar
                </button>
              )}
            </div>

            <GraficoMultiplasDoencas
              dadosPorDoenca={dadosGraficoPorDoenca}
              doencas={doencas}
              altura={280}
            />
          </Card>
        </div>

        {/* Coluna 2 - Clima e Ações Rápidas */}
        <div className="space-y-6">
          {/* Clima Atual */}
          {clima && (
            <CardClima clima={clima} />
          )}

          {/* Ações Rápidas */}
          <Card titulo="Ações Rápidas" icone={<TrendingUp size={24} />}>
            <div className="flex flex-col gap-4">
              <Link to="/app/previsao">
                <Button
                  variant="primary"
                  fullWidth
                  icone={<TrendingUp size={20} />}
                >
                  Nova Previsão
                  <ArrowRight size={18} className="ml-auto" />
                </Button>
              </Link>

              <Link to="/app/historico">
                <Button
                  variant="outline"
                  fullWidth
                  icone={<Calendar size={20} />}
                >
                  Ver Histórico
                  <ArrowRight size={18} className="ml-auto" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Alertas por doença */}
          {doencas.map(doenca => {
            const previsao = ultimasPrevisoes[doenca.id];
            if (previsao?.risco === 'alto') {
              return (
                <Card key={`alerta-${doenca.id}`} className="border-red-200 bg-red-50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
                    <div>
                      <h4 className="font-semibold text-red-800">Atenção - {doenca.nome}!</h4>
                      <p className="text-sm text-red-700 mt-1">
                        O risco de infeção por {doenca.nome} está alto. Recomenda-se aplicar tratamento
                        preventivo e intensificar o monitoramento.
                      </p>
                    </div>
                  </div>
                </Card>
              );
            }
            return null;
          })}

          {/* Mensagem positiva se todas estiverem em risco baixo */}
          {doencas.every(d => ultimasPrevisoes[d.id]?.risco === 'baixo') && (
            <Card className="border-green-200 bg-green-50">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-semibold text-green-800">Tudo bem!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    O risco de infeção está baixo para ambas as doenças. Continue com o monitoramento
                    de rotina.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Info sobre semana atual */}
          <div className="text-center text-sm text-gray-500">
            <p>Análise da semana {semanaAtual?.semana}/{semanaAtual?.ano}</p>
            {doencas.map(d => (
              <p key={`info-${d.id}`}>
                {d.nome}: {ultimasPrevisoes[d.id] ? '✓ Previsão disponível' : '— Sem previsão'}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
