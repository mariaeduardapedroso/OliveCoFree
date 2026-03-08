/**
 * MODEL: DoencaModel
 *
 * Modelo de dados das doenças suportadas pelo sistema.
 */

export const doencas = [
  {
    id: 'olho-pavao',
    nome: 'Olho de Pavão',
    nomeCientifico: 'Spilocaea oleagina',
    cor: '#ec4899',
    thresholds: { baixo: 10, alto: 15 },
    unidade: 'folhas',
    labelGrafico: '% Folhas Infectadas'
  },
  {
    id: 'antracnose',
    nome: 'Antracnose',
    nomeCientifico: 'Colletotrichum spp.',
    cor: '#8b5cf6',
    thresholds: { baixo: 8, alto: 12 },
    unidade: 'oliveiras',
    labelGrafico: '% Oliveiras Infectadas'
  }
];

export const getDoencaById = (id) => doencas.find(d => d.id === id) || doencas[0];

export const getDoencasOptions = () => doencas.map(d => ({ valor: d.id, label: d.nome }));

export const getNivelRisco = (doencaId, percentual) => {
  const doenca = getDoencaById(doencaId);
  if (percentual >= doenca.thresholds.alto) return 'alto';
  if (percentual >= doenca.thresholds.baixo) return 'medio';
  return 'baixo';
};

export const getRecomendacoesDoenca = (doencaId, risco) => {
  const recs = {
    'olho-pavao': {
      baixo: ['Manter monitoramento de rotina das folhas', 'Verificar condições climáticas semanalmente'],
      medio: ['Intensificar inspeção visual das folhas', 'Considerar aplicação preventiva de fungicida cúprico', 'Remover folhas caídas do solo'],
      alto: ['Aplicar tratamento fungicida imediatamente', 'Remover e destruir folhas infectadas', 'Consultar técnico agrícola']
    },
    'antracnose': {
      baixo: ['Monitorar estado dos frutos regularmente', 'Manter boas práticas de higiene no olival'],
      medio: ['Inspecionar frutos para sinais de podridão', 'Aplicar fungicida preventivo', 'Antecipar colheita se possível'],
      alto: ['Aplicar tratamento fungicida urgente', 'Colher frutos saudáveis imediatamente', 'Consultar técnico agrícola']
    }
  };
  return recs[doencaId]?.[risco] || recs['olho-pavao'][risco];
};
