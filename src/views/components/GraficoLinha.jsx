/**
 * VIEW: GraficoLinha
 *
 * Componente de gráfico de linha usando Chart.js.
 */

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const GraficoLinha = ({
  labels,
  dados,
  titulo,
  labelDataset = 'Dados',
  cor = '#22c55e',
  altura = 300,
  mostrarLegenda = true,
  preenchido = true
}) => {
  const data = {
    labels,
    datasets: [
      {
        label: labelDataset,
        data: dados,
        borderColor: cor,
        backgroundColor: preenchido ? `${cor}30` : 'transparent',
        fill: preenchido,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: cor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: mostrarLegenda,
        position: 'top',
        labels: {
          font: {
            size: 12
          }
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
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
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
          font: { size: 11 }
        }
      },
      y: {
        beginAtZero: true,
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
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div style={{ height: altura }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default GraficoLinha;
