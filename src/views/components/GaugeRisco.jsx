/**
 * VIEW: GaugeRisco
 *
 * Componente visual de gauge/velocímetro para mostrar o nível de risco.
 *
 * Thresholds:
 * - Verde (Baixo): < 10%
 * - Amarelo (Médio): 10% - 15%
 * - Vermelho (Alto): > 15%
 *
 * O gauge mostra de 0% a 30% para melhor visualização das zonas de risco.
 */

import React from 'react';

const GaugeRisco = ({ percentual, tamanho = 200 }) => {
  // O gauge vai de 0 a 30% para melhor visualização
  const maxGauge = 30;

  // Limitar percentual entre 0 e maxGauge para o gauge
  const percentualLimitado = Math.min(maxGauge, Math.max(0, percentual));

  // Calcular ângulo (0% = -90°, 30% = 90°)
  const angulo = (percentualLimitado / maxGauge) * 180 - 90;

  // Determinar cor baseada no percentual
  // < 10% = verde, 10-15% = amarelo, > 15% = vermelho
  const getCor = (perc) => {
    if (perc >= 15) return '#ef4444'; // vermelho
    if (perc >= 10) return '#eab308'; // amarelo
    return '#22c55e';                  // verde
  };

  const cor = getCor(percentual);

  // Determinar texto do risco
  const getRisco = (perc) => {
    if (perc >= 15) return 'ALTO';
    if (perc >= 10) return 'MÉDIO';
    return 'BAIXO';
  };

  const risco = getRisco(percentual);

  return (
    <div className="flex flex-col items-center">
      <svg
        width={tamanho}
        height={tamanho / 2 + 30}
        viewBox="0 0 200 130"
        className="overflow-visible"
      >
        {/* Fundo do gauge */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {/* Verde (0-10%) - esquerda - de -90° a -30° */}
        <path
          d="M 20 100 A 80 80 0 0 1 60 31.7"
          fill="none"
          stroke="#22c55e"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Amarelo (10-15%) - meio - de -30° a 0° */}
        <path
          d="M 60 31.7 A 80 80 0 0 1 100 20"
          fill="none"
          stroke="#eab308"
          strokeWidth="20"
          opacity="0.5"
        />

        {/* Vermelho (15-30%) - direita - de 0° a 90° */}
        <path
          d="M 100 20 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#ef4444"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Indicador (ponteiro) */}
        <g transform={`rotate(${angulo}, 100, 100)`}>
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="35"
            stroke={cor}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="8" fill={cor} />
        </g>

        {/* Centro */}
        <circle cx="100" cy="100" r="5" fill="white" stroke={cor} strokeWidth="2" />

        {/* Labels */}
        <text x="15" y="120" className="text-xs fill-gray-500" textAnchor="start">0%</text>
        <text x="100" y="15" className="text-xs fill-gray-500" textAnchor="middle">15%</text>
        <text x="185" y="120" className="text-xs fill-gray-500" textAnchor="end">30%</text>
      </svg>

      {/* Valor e texto */}
      <div className="text-center -mt-4">
        <div className="text-4xl font-bold" style={{ color: cor }}>
          {percentual.toFixed(1)}%
        </div>
        <div
          className="text-lg font-semibold mt-1 px-4 py-1 rounded-full"
          style={{
            backgroundColor: `${cor}20`,
            color: cor
          }}
        >
          Risco {risco}
        </div>
      </div>
    </div>
  );
};

export default GaugeRisco;
