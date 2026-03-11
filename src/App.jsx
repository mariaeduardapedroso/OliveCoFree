/**
 * APP: Componente Principal
 *
 * Configuração de rotas e estrutura da aplicação.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Páginas
import { Login, Cadastro, Dashboard, Previsao, Historico, EsqueciSenha, Perfil, LandingPage, TermosUso, PoliticaPrivacidade, RedefinirSenha, NaoEncontrada, PainelCientifico } from './pages';

// Componentes
import Layout from './components/Layout';
import RotaProtegida from './components/RotaProtegida';

// Estilos
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/termos-de-uso" element={<TermosUso />} />
        <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />

        {/* Rotas Protegidas (requerem autenticação) */}
        <Route
          path="/app"
          element={
            <RotaProtegida>
              <Layout />
            </RotaProtegida>
          }
        >
          {/* Redirecionar /app para dashboard */}
          <Route index element={<Navigate to="/app/dashboard" replace />} />

          {/* Páginas principais */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="previsao" element={<Previsao />} />
          <Route path="historico" element={<Historico />} />
          <Route path="painel-cientifico" element={<PainelCientifico />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>

        {/* Rota 404 */}
        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
