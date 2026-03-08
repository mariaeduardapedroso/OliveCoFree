/**
 * VIEW: Paginacao
 *
 * Componente reutilizável de paginação.
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Paginacao = ({
  paginaAtual,
  totalPaginas,
  totalRegistos,
  tamanho,
  onPaginaChange,
  onTamanhoChange,
  opcoesTamanho = [5, 10, 20, 50]
}) => {
  const inicio = totalRegistos === 0 ? 0 : (paginaAtual - 1) * tamanho + 1;
  const fim = Math.min(paginaAtual * tamanho, totalRegistos);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 mt-4">
      {/* Info de registos e tamanho da página */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          {totalRegistos === 0
            ? 'Nenhum registo'
            : `${inicio}–${fim} de ${totalRegistos} registos`
          }
        </span>

        <div className="flex items-center gap-2">
          <span className="text-gray-500">Por página:</span>
          <select
            value={tamanho}
            onChange={(e) => onTamanhoChange(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            {opcoesTamanho.map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Controlos de navegação */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPaginaChange(paginaAtual - 1)}
          disabled={paginaAtual <= 1}
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
          Anterior
        </button>

        <span className="text-sm text-gray-700 px-3">
          Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
        </span>

        <button
          onClick={() => onPaginaChange(paginaAtual + 1)}
          disabled={paginaAtual >= totalPaginas}
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Próxima
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Paginacao;
