/**
 * VIEW: GaugeRisco
 *
 * Componente visual de gauge/velocímetro para mostrar o nível de risco.
 * Recebe thresholds dinâmicos por doença.
 *
 * Props:
 * - percentual: valor da previsão
 * - tamanho: tamanho do gauge (default 200)
 * - thresholds: { baixo: number, alto: number } (default Olho de Pavão: 10/15)
 */

import React from 'react';

const GaugeRisco = ({ percentual, tamanho = 200, thresholds = { baixo: 10, alto: 15 } }) => {
  const { baixo, alto } = thresholds;
  const maxGauge = alto * 2;

  // Limitar percentual entre 0 e maxGauge
  const percentualLimitado = Math.min(maxGauge, Math.max(0, percentual));

  // Calcular ângulo (0% = -90°, maxGauge% = 90°)
  const angulo = (percentualLimitado / maxGauge) * 180 - 90;

  // Determinar cor baseada nos thresholds
  const getCor = (perc) => {
    if (perc >= alto) return '#ef4444';
    if (perc >= baixo) return '#eab308';
    return '#22c55e';
  };

  const cor = getCor(percentual);

  // Determinar texto do risco
  const getRisco = (perc) => {
    if (perc >= alto) return 'ALTO';
    if (perc >= baixo) return 'MÉDIO';
    return 'BAIXO';
  };

  const risco = getRisco(percentual);

  // Arcos fixos e simétricos (mesma proporção visual do original)
  // Verde: -90° a -30° | Amarelo: -30° a 0° | Vermelho: 0° a 90°
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

        {/* Verde (baixo) - esquerda */}
        <path
          d="M 20 100 A 80 80 0 0 1 60 31.7"
          fill="none"
          stroke="#22c55e"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Amarelo (médio) - meio */}
        <path
          d="M 60 31.7 A 80 80 0 0 1 100 20"
          fill="none"
          stroke="#eab308"
          strokeWidth="20"
          opacity="0.5"
        />

        {/* Vermelho (alto) - direita */}
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

        {/* Labels dinâmicos */}
        <text x="15" y="120" className="text-xs fill-gray-500" textAnchor="start">0%</text>
        <text x="100" y="10" className="text-xs fill-gray-500" textAnchor="middle">{alto}%</text>
        <text x="185" y="120" className="text-xs fill-gray-500" textAnchor="end">{maxGauge}%</text>
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
