/**
 * PAGE: Previsao
 *
 * Página para fazer nova previsão.
 * Mostra apenas semanas futuras (que ainda não passaram) para previsão.
 * Limitado a 5 semanas à frente.
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  CheckCircle,
  Lightbulb,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Select,
  GaugeRisco,
  Alerta,
  Loading
} from '../views/components';
import {
  fazerPrevisao,
  getCorRisco,
  getTextoRisco
} from '../controllers/PrevisaoController';
import {
  obterSemanasParaPrevisao,
  obterSemanaAtual,
  obterClimaSemana,
  formatarDadosClima
} from '../controllers/ClimaController';
import { doencas, getDoencaById, getDoencasOptions } from '../models/DoencaModel';

const Previsao = () => {
  // Estados do formulário
  const [doencaSelecionada, setDoencaSelecionada] = useState('olho-pavao');
  const [semanaEscolhida, setSemanaEscolhida] = useState(null);
  const [temperatura, setTemperatura] = useState('');
  const [temperaturaMaxima, setTemperaturaMaxima] = useState('');
  const [temperaturaMinima, setTemperaturaMinima] = useState('');
  const [humidade, setHumidade] = useState('');
  const [precipitacao, setPrecipitacao] = useState('');
  const [velocidadeVento, setVelocidadeVento] = useState('');

  // Estados da UI
  const [carregando, setCarregando] = useState(false);
  const [carregandoClima, setCarregandoClima] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const [semanasDisponiveis, setSemanasDisponiveis] = useState([]);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [semanaAtual, setSemanaAtual] = useState(null);
  const [fonteClima, setFonteClima] = useState(null);

  // Carregar semanas disponíveis para previsão
  useEffect(() => {
    const atual = obterSemanaAtual();
    setSemanaAtual(atual);

    const semanas = obterSemanasParaPrevisao(5);
    setSemanasDisponiveis(semanas);

    // Pré-selecionar a primeira opção
    if (semanas.length > 0) {
      setSemanaEscolhida(semanas[0]);
    }
  }, []);

  // Carregar dados climáticos quando mudar a semana (agora assíncrono)
  useEffect(() => {
    const carregarClima = async () => {
      if (semanaEscolhida) {
        setCarregandoClima(true);
        try {
          const clima = await obterClimaSemana(semanaEscolhida.semana, semanaEscolhida.ano);
          if (clima) {
            const dados = formatarDadosClima(clima);
            setTemperatura(dados.temperatura.toString());
            setTemperaturaMaxima(dados.temperaturaMaxima?.toString() || '');
            setTemperaturaMinima(dados.temperaturaMinima?.toString() || '');
            setHumidade(dados.humidade.toString());
            setPrecipitacao(dados.precipitacao.toString());
            setVelocidadeVento(dados.velocidadeVento?.toString() || '');
            setFonteClima(clima.fonte || 'mock');
          }
        } catch (error) {
          console.error('Erro ao carregar clima:', error);
        }
        setCarregandoClima(false);
      }
    };
    carregarClima();
  }, [semanaEscolhida]);

  // Handler de mudança de semana
  const handleSemanaChange = (e) => {
    const valor = e.target.value;
    const semana = semanasDisponiveis.find(s => s.valor === valor);
    setSemanaEscolhida(semana);
  };

  // Handler do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setResultado(null);
    setMostrarDetalhes(false);

    // Validações
    if (!semanaEscolhida) {
      setErro('Selecione uma semana');
      return;
    }

    if (!temperatura || !temperaturaMaxima || !temperaturaMinima || !humidade || !precipitacao) {
      setErro('Preencha todos os dados climáticos obrigatórios');
      return;
    }

    setCarregando(true);

    try {
      const previsao = await fazerPrevisao(
        semanaEscolhida.semana,
        semanaEscolhida.ano,
        {
          temperatura: isNaN(parseFloat(temperatura)) ? null : parseFloat(temperatura),
          temperatura_maxima: isNaN(parseFloat(temperaturaMaxima)) ? null : parseFloat(temperaturaMaxima),
          temperatura_minima: isNaN(parseFloat(temperaturaMinima)) ? null : parseFloat(temperaturaMinima),
          humidade: isNaN(parseFloat(humidade)) ? null : parseFloat(humidade),
          precipitacao: isNaN(parseFloat(precipitacao)) ? null : parseFloat(precipitacao),
          velocidade_vento: isNaN(parseFloat(velocidadeVento)) ? 0 : parseFloat(velocidadeVento)
        },
        doencaSelecionada
      );

      // Adicionar info da semana e doença
      previsao.semana = semanaEscolhida.semana;
      previsao.ano = semanaEscolhida.ano;
      previsao.doencaId = doencaSelecionada;
      previsao.doenca = getDoencaById(doencaSelecionada);

      // Garantir que dados climáticos do formulário apareçam nos detalhes
      if (!previsao.temperaturaMaxima && temperaturaMaxima) previsao.temperaturaMaxima = parseFloat(temperaturaMaxima);
      if (!previsao.temperaturaMinima && temperaturaMinima) previsao.temperaturaMinima = parseFloat(temperaturaMinima);
      if (!previsao.velocidadeVento && velocidadeVento) previsao.velocidadeVento = parseFloat(velocidadeVento);

      setResultado(previsao);
    } catch (error) {
      setErro('Erro ao fazer previsão. Tente novamente.');
      console.error(error);
    }

    setCarregando(false);
  };

  // Limpar formulário
  const handleLimpar = () => {
    setDoencaSelecionada('olho-pavao');
    if (semanasDisponiveis.length > 0) {
      setSemanaEscolhida(semanasDisponiveis[0]);
    }
    setTemperatura('');
    setTemperaturaMaxima('');
    setTemperaturaMinima('');
    setHumidade('');
    setPrecipitacao('');
    setVelocidadeVento('');
    setResultado(null);
    setErro('');
    setMostrarDetalhes(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="text-primary-600" />
          Nova Previsão
        </h1>
        <p className="text-gray-600 mt-1">
          Estamos na <strong>Semana {semanaAtual?.semana} de {semanaAtual?.ano}</strong>.
          Selecione a semana e insira os dados climáticos para prever a infecção.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card titulo="Dados de Entrada" icone={<Calendar size={24} />}>
          {erro && (
            <Alerta
              tipo="error"
              mensagem={erro}
              onFechar={() => setErro('')}
              className="mb-4"
            />
          )}

          {/* Info sobre previsão */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Como funciona:</strong> Selecione a semana desejada.
              Com os dados climáticos da semana, o modelo prevê a percentagem de infecção para essa mesma semana.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Seleção de Doença */}
            <Select
              label="Doença"
              name="doenca"
              value={doencaSelecionada}
              onChange={(e) => setDoencaSelecionada(e.target.value)}
              options={getDoencasOptions()}
              required
            />

            {/* Seleção de Semana */}
            <Select
              label="Semana"
              name="semana"
              value={semanaEscolhida?.valor || ''}
              onChange={handleSemanaChange}
              options={semanasDisponiveis.map(s => ({
                valor: s.valor,
                label: s.label
              }))}
              placeholder="Selecione..."
              required
            />

            {/* Dados Climáticos */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Dados Climáticos da Semana {semanaEscolhida?.semana || '...'}/{semanaEscolhida?.ano || '...'}
                </h4>
                {carregandoClima && (
                  <span className="text-xs text-blue-600 animate-pulse">A carregar...</span>
                )}
                {!carregandoClima && fonteClima && (
                  <span className={`text-xs px-2 py-1 rounded ${fonteClima === 'api' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {fonteClima === 'api' ? 'Dados reais (Mirandela)' : 'Dados simulados'}
                  </span>
                )}
              </div>

              <Input
                label="Temperatura média (°C)"
                type="number"
                name="temperatura"
                value={temperatura}
                onChange={(e) => setTemperatura(e.target.value)}
                placeholder="Ex: 15.5"
                required
                icone={<Thermometer size={18} />}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Temp. máxima (°C)"
                  type="number"
                  name="temperatura_maxima"
                  value={temperaturaMaxima}
                  onChange={(e) => setTemperaturaMaxima(e.target.value)}
                  placeholder="Ex: 20.0"
                  required
                  icone={<Thermometer size={18} />}
                />

                <Input
                  label="Temp. mínima (°C)"
                  type="number"
                  name="temperatura_minima"
                  value={temperaturaMinima}
                  onChange={(e) => setTemperaturaMinima(e.target.value)}
                  placeholder="Ex: 10.0"
                  required
                  icone={<Thermometer size={18} />}
                />
              </div>

              <Input
                label="Humidade relativa (%)"
                type="number"
                name="humidade"
                value={humidade}
                onChange={(e) => setHumidade(e.target.value)}
                placeholder="Ex: 75"
                required
                icone={<Droplets size={18} />}
              />

              <Input
                label="Precipitação média diária (mm)"
                type="number"
                name="precipitacao"
                value={precipitacao}
                onChange={(e) => setPrecipitacao(e.target.value)}
                placeholder="Ex: 1.5"
                required
                icone={<CloudRain size={18} />}
              />

              <Input
                label="Velocidade do vento (m/s)"
                type="number"
                name="velocidade_vento"
                value={velocidadeVento}
                onChange={(e) => setVelocidadeVento(e.target.value)}
                placeholder="Ex: 2.0"
                icone={<Wind size={18} />}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 mt-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={carregando}
                className="flex-1"
              >
                Fazer Previsão
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleLimpar}
              >
                Limpar
              </Button>
            </div>
          </form>
        </Card>

        {/* Resultado */}
        <div className="space-y-6">
          {carregando && (
            <Card>
              <Loading mensagem="A calcular previsão..." />
            </Card>
          )}

          {resultado && !carregando && (
            <>
              {/* Card Principal de Resultado - Sempre visível */}
              <Card
                className={`border-2 ${getCorRisco(resultado.risco).border} ${getCorRisco(resultado.risco).bg}`}
              >
                <div className="flex flex-col items-center py-4">
                  {/* Título com semana prevista */}
                  <div className="text-center mb-4">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white mb-2"
                      style={{ backgroundColor: resultado.doenca?.cor || '#22c55e' }}
                    >
                      {resultado.doenca?.nome || 'Olho de Pavão'}
                    </span>
                    <p className="text-sm text-gray-600">Previsão para</p>
                    <p className="text-xl font-bold text-gray-800">
                      Semana {resultado.semana} de {resultado.ano}
                    </p>
                  </div>

                  {/* Risco Principal */}
                  <div
                    className={`text-center px-8 py-4 rounded-xl ${getCorRisco(resultado.risco).bg}`}
                  >
                    <p className={`text-4xl font-bold ${getCorRisco(resultado.risco).text}`}>
                      {getTextoRisco(resultado.risco).toUpperCase()}
                    </p>
                    <p className={`text-2xl font-semibold mt-2 ${getCorRisco(resultado.risco).text}`}>
                      {resultado.percentualInfectadas.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      de {resultado.doenca?.unidade || 'folhas'} infectadas previstas
                    </p>
                  </div>

                  {/* Botão para expandir/colapsar detalhes */}
                  <button
                    onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
                    className="mt-4 flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    {mostrarDetalhes ? (
                      <>
                        <EyeOff size={20} />
                        Ocultar detalhes
                        <ChevronUp size={20} />
                      </>
                    ) : (
                      <>
                        <Eye size={20} />
                        Ver detalhes completos
                        <ChevronDown size={20} />
                      </>
                    )}
                  </button>
                </div>
              </Card>

              {/* Detalhes Expandidos */}
              {mostrarDetalhes && (
                <>
                  {/* Gauge de Risco */}
                  <Card titulo="Visualização do Risco" icone={<CheckCircle size={24} />}>
                    <div className="flex flex-col items-center py-4">
                      <GaugeRisco
                        percentual={resultado.percentualInfectadas}
                        tamanho={200}
                        thresholds={resultado.doenca?.thresholds}
                      />
                      <p className="text-sm text-gray-500 mt-4">
                        Confiança do modelo: {resultado.confianca}%
                      </p>
                    </div>
                  </Card>

                  {/* Recomendações */}
                  {resultado.recomendacoes?.length > 0 ? (
                    <Card
                      titulo="Recomendações"
                      icone={<Lightbulb size={24} />}
                      className={`border-2 ${getCorRisco(resultado.risco).border}`}
                    >
                      <div className="space-y-4">
                        {resultado.recomendacoes.map((rec, index) => {
                          // Verifica se contém práticas culturais numeradas
                          const practicasMatch = rec.match(/^(.*?):\s*\(i\)\s*(.*?);\s*\(ii\)\s*(.*?)(?:;\s*\(iii\)\s*(.*?))?\.?$/s);
                          if (practicasMatch) {
                            const [, intro, p1, p2, p3] = practicasMatch;
                            return (
                              <div key={index}>
                                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                                  {intro.trim()}:
                                </p>
                                <ul className="ml-4 space-y-1.5">
                                  <li className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-primary-600 font-semibold mt-0.5">i.</span>
                                    <span>{p1.trim()}</span>
                                  </li>
                                  <li className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-primary-600 font-semibold mt-0.5">ii.</span>
                                    <span>{p2.trim()}</span>
                                  </li>
                                  {p3 && (
                                    <li className="text-sm text-gray-700 flex items-start gap-2">
                                      <span className="text-primary-600 font-semibold mt-0.5">iii.</span>
                                      <span>{p3.trim()}</span>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            );
                          }
                          return (
                            <p
                              key={index}
                              className="text-sm text-gray-700 leading-relaxed"
                            >
                              {rec}
                            </p>
                          );
                        })}
                      </div>
                    </Card>
                  ) : (
                    <Card
                      titulo="Recomendações"
                      icone={<Lightbulb size={24} />}
                      className="border-2 border-green-200"
                    >
                      <p className="text-sm text-green-700">
                        Sem recomendações adicionais para este nível de risco. Manter as práticas habituais de monitorização.
                      </p>
                    </Card>
                  )}

                  {/* Detalhes Técnicos */}
                  <Card>
                    <h4 className="font-medium text-gray-700 mb-3">Detalhes da Previsão</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="text-gray-500">Semana:</span>
                        <span className="font-medium ml-2">{resultado.semana}/{resultado.ano}</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="text-gray-500">Temp. média:</span>
                        <span className="font-medium ml-2">{resultado.temperatura}°C</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="text-gray-500">Temp. máx/mín:</span>
                        <span className="font-medium ml-2">
                          {resultado.temperaturaMaxima != null ? `${resultado.temperaturaMaxima}°C` : 'N/D'}
                          {' / '}
                          {resultado.temperaturaMinima != null ? `${resultado.temperaturaMinima}°C` : 'N/D'}
                        </span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="text-gray-500">Humidade:</span>
                        <span className="font-medium ml-2">{resultado.humidade}%</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="text-gray-500">Precipitação:</span>
                        <span className="font-medium ml-2">{resultado.precipitacao} mm</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="text-gray-500">Vento:</span>
                        <span className="font-medium ml-2">{resultado.velocidadeVento || 0} m/s</span>
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </>
          )}

          {/* Info inicial (quando não há resultado) */}
          {!resultado && !carregando && (
            <Card className="bg-blue-50 border-blue-200">
              <div className="text-center py-6">
                <TrendingUp className="mx-auto text-blue-500 mb-3" size={48} />
                <h3 className="text-lg font-medium text-blue-800">
                  Pronto para prever
                </h3>
                <p className="text-blue-600 mt-2 text-sm">
                  Selecione uma das próximas semanas disponíveis e insira os dados
                  climáticos esperados para fazer a previsão.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Informação sobre o modelo */}
      <Card className="mt-6 bg-gray-50">
        <div className="flex items-start gap-3">
          <Lightbulb className="text-yellow-500 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-medium text-gray-800">Sobre o Modelo</h4>
            <p className="text-sm text-gray-600 mt-1">
              O modelo disponibilizado foi desenvolvido para cultivares moderadamente
              suscetíveis à gafa e olho de pavão, em olival tradicional e de sequeiro,
              para a região de Mirandela (Nordeste de Portugal).
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Trata-se de um modelo previsional, de ajuda à tomada de decisão,
              que <strong>não substitui a consulta de um técnico agrícola</strong>.
            </p>
            {doencaSelecionada === 'olho-pavao' ? (
              <p className="text-sm text-gray-600 mt-2">
                Condições favoráveis ao <strong>Olho de Pavão</strong> (<em>Spilocaea oleagina</em>):
                temperaturas amenas (15-20°C) e humidade relativa elevada (acima de 80%).
              </p>
            ) : (
              <p className="text-sm text-gray-600 mt-2">
                Condições favoráveis à <strong>Gafa/Antracnose</strong> (<em>Colletotrichum spp.</em>):
                temperaturas amenas (10-25°C), humidade elevada e períodos de chuva.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Previsao;
