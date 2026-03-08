/**
 * VIEW: GraficoMultiplasDoencas
 *
 * Componente de gráfico de barras agrupadas para múltiplas doenças.
 */

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const GraficoMultiplasDoencas = ({
  dadosPorDoenca, // { 'olho-pavao': { labels: [], dados: [] }, 'antracnose': { labels: [], dados: [] } }
  doencas, // Array de objetos doença com id, nome, cor, thresholds
  titulo,
  altura = 300
}) => {
  // Combinar todos os labels únicos e ordenar cronologicamente
  const todosLabels = new Set();
  Object.values(dadosPorDoenca).forEach(d => {
    d.labels.forEach(label => todosLabels.add(label));
  });

  // Ordenar labels cronologicamente (S11/2024, S14/2024, S2/2025, etc)
  const labelsOrdenados = Array.from(todosLabels).sort((a, b) => {
    const [sA, anoA] = a.replace('S', '').split('/');
    const [sB, anoB] = b.replace('S', '').split('/');
    if (anoA !== anoB) return parseInt(anoA) - parseInt(anoB);
    return parseInt(sA) - parseInt(sB);
  });

  // Criar datasets para cada doença
  const datasets = doencas.map(doenca => {
    const dadosDoenca = dadosPorDoenca[doenca.id] || { labels: [], dados: [] };

    // Mapear dados para os labels ordenados (null se não existir)
    const dadosMapeados = labelsOrdenados.map(label => {
      const idx = dadosDoenca.labels.indexOf(label);
      return idx >= 0 ? dadosDoenca.dados[idx] : null;
    });

    return {
      label: doenca.nome,
      data: dadosMapeados,
      backgroundColor: doenca.cor,
      borderColor: doenca.cor,
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false
    };
  });

  const data = {
    labels: labelsOrdenados,
    datasets
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: { size: 12 },
          usePointStyle: true,
          pointStyle: 'rect',
          padding: 20
        }
      },
      title: {
        display: !!titulo,
        text: titulo,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const valor = context.parsed.y;
            if (valor === null) return null;

            // Encontrar a doença correspondente
            const doenca = doencas.find(d => d.nome === context.dataset.label);
            const thresholds = doenca?.thresholds || { baixo: 10, alto: 15 };

            let risco = 'Baixo';
            if (valor >= thresholds.alto) risco = 'Alto';
            else if (valor >= thresholds.baixo) risco = 'Médio';

            return `${context.dataset.label}: ${valor.toFixed(1)}% (Risco ${risco})`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 10 },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        max: 35,
        grid: {
          color: '#f1f5f9'
        },
        ticks: {
          font: { size: 11 },
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  return (
    <div style={{ height: altura }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default GraficoMultiplasDoencas;
