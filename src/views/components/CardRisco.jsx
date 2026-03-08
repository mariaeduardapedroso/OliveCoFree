/**
 * VIEW: CardRisco
 *
 * Card que mostra o status de risco atual.
 */

import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { getCorRisco, getTextoRisco } from '../../models/PrevisaoModel';

const CardRisco = ({ risco, percentual, semana, ano, doenca }) => {
  const cores = getCorRisco(risco);
  const texto = getTextoRisco(risco);

  const getIcone = () => {
    switch (risco) {
      case 'alto':
        return <AlertTriangle size={32} />;
      case 'medio':
        return <AlertCircle size={32} />;
      default:
        return <CheckCircle size={32} />;
    }
  };

  return (
    <div
      className={`rounded-xl p-6 border-2 ${cores.bg} ${cores.border} transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          {doenca && (
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white mb-2"
              style={{ backgroundColor: doenca.cor }}
            >
              {doenca.nome}
            </span>
          )}
          <p className="text-sm text-gray-600 mb-1">Status Atual</p>
          <h3 className={`text-2xl font-bold ${cores.text}`}>
            {texto}
          </h3>
          <p className={`text-lg ${cores.text} mt-1`}>
            {percentual.toFixed(1)}% de {doenca?.unidade || 'folhas'} infectadas
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Semana {semana} de {ano}
          </p>
        </div>
        <div className={`p-4 rounded-full ${cores.bg} ${cores.text}`}>
          {getIcone()}
        </div>
      </div>
    </div>
  );
};

export default CardRisco;
