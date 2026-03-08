/**
 * PAGE: NaoEncontrada (404)
 *
 * Pagina exibida para rotas invalidas.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../views/components';

const NaoEncontrada = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-primary-200 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Pagina nao encontrada
        </h1>
        <p className="text-gray-600 mb-8">
          A pagina que procura nao existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button variant="primary" size="lg">
              <span className="flex items-center gap-2">
                <Home size={20} />
                Pagina Inicial
              </span>
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">
              <span className="flex items-center gap-2">
                <ArrowLeft size={20} />
                Fazer Login
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NaoEncontrada;
