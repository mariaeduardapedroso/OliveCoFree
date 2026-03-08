/**
 * VIEW: Card
 *
 * Componente de card reutilizável.
 */

import React from 'react';

const Card = ({
  children,
  titulo,
  subtitulo,
  icone,
  className = '',
  headerClassName = '',
  bodyClassName = ''
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden ${className}`}>
      {(titulo || icone) && (
        <div className={`px-6 py-4 border-b border-gray-100 ${headerClassName}`}>
          <div className="flex items-center gap-3">
            {icone && (
              <span className="text-primary-600">
                {icone}
              </span>
            )}
            <div>
              {titulo && (
                <h3 className="text-lg font-semibold text-gray-800">{titulo}</h3>
              )}
              {subtitulo && (
                <p className="text-sm text-gray-500">{subtitulo}</p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;
