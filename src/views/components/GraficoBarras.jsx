/**
 * VIEW: GraficoBarras
 *
 * Componente de gráfico de barras usando Chart.js.
 * Ideal para dados discretos como semanas.
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

const GraficoBarras = ({
  labels,
  dados,
  titulo,
  labelDataset = 'Dados',
  cor = null,
  altura = 300,
  mostrarLegenda = true,
  thresholds = { baixo: 10, alto: 15 } // Thresholds para definir risco
}) => {
  // Função para ajustar luminosidade de cor hex
  const ajustarLuminosidade = (hex, percent) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const R = (num >> 16);
    const G = (num >> 8 & 0x00FF);
    const B = (num & 0x0000FF);

    // Aumentar percent para clarear, diminuir para escurecer
    const newR = Math.min(255, Math.max(0, Math.round(R + (255 - R) * percent / 100)));
    const newG = Math.min(255, Math.max(0, Math.round(G + (255 - G) * percent / 100)));
    const newB = Math.min(255, Math.max(0, Math.round(B + (255 - B) * percent / 100)));

    return '#' + (0x1000000 + newR * 0x10000 + newG * 0x100 + newB).toString(16).slice(1);
  };

  // Função para escurecer cor hex
  const escurecerCor = (hex, percent) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  };

  // Gerar cores baseadas no risco usando a cor da doença
  const gerarCorPorRisco = (valor, corBase) => {
    if (valor >= thresholds.alto) {
      // Risco alto - cor mais escura/saturada
      return escurecerCor(corBase, 20);
    } else if (valor >= thresholds.baixo) {
      // Risco médio - cor normal
      return corBase;
    }
    // Risco baixo - cor mais clara
    return ajustarLuminosidade(corBase, 50);
  };

  // Se cor da doença for passada, usar tons dessa cor baseados no risco
  // Caso contrário, usar cores padrão (verde/amarelo/vermelho)
  const cores = cor
    ? dados.map(valor => gerarCorPorRisco(valor, cor))
    : dados.map(valor => {
        if (valor >= thresholds.alto) return '#ef4444'; // vermelho - risco alto
        if (valor >= thresholds.baixo) return '#f59e0b'; // amarelo - risco médio
        return '#22c55e'; // verde - risco baixo
      });

  const coresHover = cores.map(c => escurecerCor(c, 15));

  // Gerar cores para a legenda quando usar cor da doença
  const corBaixa = cor ? ajustarLuminosidade(cor, 50) : '#22c55e';
  const corMedia = cor || '#f59e0b';
  const corAlta = cor ? escurecerCor(cor, 20) : '#ef4444';

  const data = {
    labels,
    datasets: [
      {
        label: labelDataset,
        data: dados,
        backgroundColor: cores,
        hoverBackgroundColor: coresHover,
        borderColor: cores.map(c => escurecerCor(c, 10)),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
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
            size: 11
          },
          generateLabels: function() {
            return [
              { text: `Baixo (<${thresholds.baixo}%)`, fillStyle: corBaixa, strokeStyle: corBaixa },
              { text: `Médio (${thresholds.baixo}-${thresholds.alto}%)`, fillStyle: corMedia, strokeStyle: corMedia },
              { text: `Alto (>${thresholds.alto}%)`, fillStyle: corAlta, strokeStyle: corAlta }
            ];
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
            const valor = context.parsed.y;
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
          font: { size: 11 }
        }
      },
      y: {
        beginAtZero: true,
        max: Math.max(30, Math.ceil(Math.max(...dados) / 5) * 5 + 5),
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

export default GraficoBarras;
