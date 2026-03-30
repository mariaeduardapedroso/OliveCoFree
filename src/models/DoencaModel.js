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
      baixo: [],
      medio: [
        'Se as condições climáticas forem favoráveis ao desenvolvimento da doença (temperaturas amenas e humidade elevada), recomenda-se a monitorização regular das folhas mais novas, procurando o aparecimento de manchas características.',
        'Se forem observados sintomas recentes de infeção e se as condições climáticas se mantiverem favoráveis, deve considerar a aplicação de um produto antifúngico homologado para oliveira, em tratamento preferencialmente preventivo, respeitando sempre as indicações de rótulo. Esta prática é sobretudo recomendável para olivais com cultivares mais suscetíveis à doença.',
        'Pondere, ainda, realizar as seguintes práticas culturais: (i) Favorecer o arejamento da copa através da poda; (ii) Gerir a fertilização de modo a evitar o excesso de nitrogénio e a deficiência em potássio; (iii) Remover e destruir as folhas e restos de poda do solo.'
      ],
      alto: [
        'Se as condições climáticas forem favoráveis ao desenvolvimento da doença (temperaturas amenas e humidade elevada), recomenda-se a aplicação de um produto antifúngico homologado para oliveira, em tratamento preferencialmente preventivo, respeitando sempre as indicações de rótulo.',
        'Pondere, ainda, realizar as seguintes práticas culturais: (i) Favorecer o arejamento da copa através da poda; (ii) Gerir a fertilização de modo a evitar o excesso de nitrogénio e a deficiência em potássio; (iii) Remover e destruir as folhas e restos de poda do solo.'
      ]
    },
    'antracnose': {
      baixo: [],
      medio: [
        'Se as condições climáticas se mantiverem favoráveis (i.e., temperaturas amenas e humidade elevada), deve considerar a aplicação de um produto antifúngico homologado para oliveira, em tratamento preferencialmente preventivo, respeitando sempre as indicações de rótulo. Esta prática é sobretudo recomendável para olivais com cultivares mais suscetíveis à doença.',
        'Pondere, ainda, realizar as seguintes práticas culturais: (i) Favorecer o arejamento da copa através da poda; (ii) Remover e destruir restos de poda e frutos infetados do solo.'
      ],
      alto: [
        'Se as condições climáticas se mantiverem favoráveis (i.e., temperaturas amenas e humidade elevada), aplicar um produto antifúngico homologado para oliveira, em tratamento preferencialmente preventivo, respeitando sempre as indicações de rótulo.',
        'Pondere, ainda, realizar as seguintes práticas culturais: (i) Favorecer o arejamento da copa através da poda; (ii) Remover e destruir restos de poda e frutos infetados do solo.'
      ]
    }
  };
  return recs[doencaId]?.[risco] || recs['olho-pavao'][risco];
};
