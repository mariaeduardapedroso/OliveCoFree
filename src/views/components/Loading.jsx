/**
 * VIEW: Loading
 *
 * Componente de loading/carregamento.
 */

import React from 'react';
import { Leaf } from 'lucide-react';

const Loading = ({ mensagem = 'A carregar...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
        <Leaf
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-600"
          size={24}
        />
      </div>
      <p className="text-gray-600 font-medium">{mensagem}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="py-12 flex items-center justify-center">
      {content}
    </div>
  );
};

export default Loading;
