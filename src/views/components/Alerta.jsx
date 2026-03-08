/**
 * VIEW: Alerta
 *
 * Componente de alerta/notificação.
 */

import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const Alerta = ({
  tipo = 'info',
  titulo,
  mensagem,
  onFechar,
  className = ''
}) => {
  const estilos = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icone: <CheckCircle size={24} />
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icone: <XCircle size={24} />
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icone: <AlertTriangle size={24} />
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icone: <Info size={24} />
    }
  };

  const estilo = estilos[tipo] || estilos.info;

  return (
    <div
      className={`
        ${estilo.bg} ${estilo.border} ${estilo.text}
        border rounded-lg p-4 flex items-start gap-3
        ${className}
      `}
    >
      <span className="flex-shrink-0">
        {estilo.icone}
      </span>
      <div className="flex-1">
        {titulo && (
          <h4 className="font-semibold mb-1">{titulo}</h4>
        )}
        <p className="text-sm">{mensagem}</p>
      </div>
      {onFechar && (
        <button
          onClick={onFechar}
          className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default Alerta;
