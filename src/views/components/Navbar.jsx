/**
 * VIEW: Navbar
 *
 * Barra de navegação principal.
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  History,
  LogOut,
  Menu,
  X,
  User,
  Leaf
} from 'lucide-react';
import { logout, getUsuarioAtual } from '../../models/UsuarioModel';

const Navbar = () => {
  const [menuAberto, setMenuAberto] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const usuario = getUsuarioAtual();

  const links = [
    { path: '/app/dashboard', label: 'Dashboard', icone: <LayoutDashboard size={20} /> },
    { path: '/app/previsao', label: 'Previsão', icone: <TrendingUp size={20} /> },
    { path: '/app/historico', label: 'Histórico', icone: <History size={20} /> }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/app/dashboard" className="flex items-center gap-2">
              <img src="/olivecofree.svg" alt="OliveCoFree" className="h-9" />
            </Link>
          </div>

          {/* Links Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200
                  ${isActive(link.path)
                    ? 'bg-primary-100 text-primary-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {link.icone}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Usuário e Logout Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/app/perfil"
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              <User size={20} />
              <span className="text-sm">{usuario?.nome || 'Usuario'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>

          {/* Botão Menu Mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {menuAberto ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {menuAberto && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-2 space-y-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuAberto(false)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg transition-colors duration-200
                  ${isActive(link.path)
                    ? 'bg-primary-100 text-primary-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {link.icone}
                <span>{link.label}</span>
              </Link>
            ))}
            <hr className="my-2" />
            <Link
              to="/app/perfil"
              onClick={() => setMenuAberto(false)}
              className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
            >
              <User size={20} />
              <span>{usuario?.nome || 'Usuario'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
