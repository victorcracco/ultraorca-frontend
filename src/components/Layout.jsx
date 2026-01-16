import React, { useState, useEffect } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { supabase } from "../services/supabase"; // <--- Importe o Supabase

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // <--- Novo estado
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Verifica se é Admin ao carregar o Layout
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      // Pega o email do .env (VITE_ADMIN_EMAIL)
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      
      if (user && adminEmail && user.email.trim().toLowerCase() === adminEmail.trim().toLowerCase()) {
        setIsAdmin(true);
      }
    }
    checkAdmin();
  }, []);

  const navItems = [
    { name: "Início", path: "/app", icon: "🏠", exact: true },
    { name: "Novo Orçamento", path: "/app/new-budget", icon: "📝" },
    { name: "Meus Produtos", path: "/app/products", icon: "📦" },
    { name: "Dados da Empresa", path: "/app/my-data", icon: "🏢" },
    { name: "Assinatura", path: "/app/subscription", icon: "💎" },
    { name: "Tutoriais", path: "/app/tutorials", icon: "📚" },
  ];

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-gray-100 flex items-center gap-2">
        <span className="text-2xl">🚀</span>
        <span className="font-extrabold text-xl text-blue-900 tracking-tight">UltraOrça</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}

        {/* SÓ MOSTRA SE FOR ADMIN 👇 */}
        {isAdmin && (
          <NavLink
            to="/app/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mt-6 ${
                isActive ? "bg-red-50 text-red-700" : "text-gray-400 hover:text-red-600 hover:bg-red-50"
              }`
            }
          >
            <span>⚙️</span>
            Admin
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
        >
          <span>🚪</span>
          Sair
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans text-gray-800">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-20">
        <NavContent />
      </aside>

      {/* MENU MOBILE (Drawer) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col shadow-2xl
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
         <button 
           onClick={() => setIsMobileMenuOpen(false)}
           className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-500"
         >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
           </svg>
         </button>
         <NavContent />
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-x-hidden w-full">
        {/* HEADER MOBILE */}
        <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-0 z-30">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          <span className="font-bold text-lg text-blue-900 truncate mx-2">UltraOrça</span>
          
          <Link to="/app/new-budget" className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold shadow-md active:scale-95 transition-transform">
            +
          </Link>
        </div>

        <Outlet />
      </main>
    </div>
  );
}