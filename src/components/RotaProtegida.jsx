/**
 * COMPONENT: RotaProtegida
 *
 * Componente para proteger rotas que requerem autenticação.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { verificarAutenticacao } from '../controllers/AuthController';

const RotaProtegida = ({ children }) => {
  const location = useLocation();
  const autenticado = verificarAutenticacao();

  if (!autenticado) {
    // Redirecionar para login, salvando a localização atual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RotaProtegida;
