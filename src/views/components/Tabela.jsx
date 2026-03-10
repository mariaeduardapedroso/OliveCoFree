/**
 * VIEW: Tabela
 *
 * Componente de tabela reutilizável com ordenação por colunas.
 */

import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

const Tabela = ({ colunas, dados, onRowClick, className = '', ordenacao, onOrdenacaoChange }) => {

  const handleSort = (accessor) => {
    if (!onOrdenacaoChange) return;
    if (ordenacao?.campo === accessor) {
      if (ordenacao.direcao === 'asc') {
        onOrdenacaoChange({ campo: accessor, direcao: 'desc' });
      } else if (ordenacao.direcao === 'desc') {
        onOrdenacaoChange({ campo: null, direcao: null });
      }
    } else {
      onOrdenacaoChange({ campo: accessor, direcao: 'asc' });
    }
  };

  const renderSortIcon = (accessor) => {
    if (!onOrdenacaoChange) return null;
    if (ordenacao?.campo === accessor) {
      if (ordenacao.direcao === 'asc') {
        return <ChevronUp size={14} className="text-primary-600" />;
      }
      return <ChevronDown size={14} className="text-primary-600" />;
    }
    return <ChevronsUpDown size={14} className="text-gray-300" />;
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {colunas.map((coluna, index) => (
              <th
                key={index}
                className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${
                  onOrdenacaoChange && coluna.sortable !== false ? 'cursor-pointer select-none hover:bg-gray-100 transition-colors' : ''
                } ${coluna.className || ''}`}
                onClick={() => coluna.sortable !== false && handleSort(coluna.accessor)}
              >
                <div className="flex items-center gap-1">
                  {coluna.header}
                  {coluna.sortable !== false && renderSortIcon(coluna.accessor)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.length === 0 ? (
            <tr>
              <td
                colSpan={colunas.length}
                className="px-4 py-8 text-center text-gray-500"
              >
                Nenhum dado encontrado
              </td>
            </tr>
          ) : (
            dados.map((item, rowIndex) => (
              <tr
                key={item.id || rowIndex}
                onClick={() => onRowClick && onRowClick(item)}
                className={`
                  border-b border-gray-100 transition-colors duration-150
                  ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                `}
              >
                {colunas.map((coluna, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-4 py-3 text-sm text-gray-600 ${coluna.cellClassName || ''}`}
                  >
                    {coluna.render
                      ? coluna.render(item[coluna.accessor], item)
                      : item[coluna.accessor]
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Tabela;
