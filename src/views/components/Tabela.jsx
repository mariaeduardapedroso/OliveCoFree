/**
 * VIEW: Tabela
 *
 * Componente de tabela reutilizável.
 */

import React from 'react';

const Tabela = ({ colunas, dados, onRowClick, className = '' }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {colunas.map((coluna, index) => (
              <th
                key={index}
                className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${coluna.className || ''}`}
              >
                {coluna.header}
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
