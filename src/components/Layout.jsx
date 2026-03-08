/**
 * COMPONENT: Layout
 *
 * Layout principal da aplicação (com navbar).
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../views/components';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="min-h-[calc(100vh-64px)]">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
