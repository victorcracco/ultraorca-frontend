import React from "react";
import { NavLink, Outlet, Link } from "react-router-dom";

export default function Layout() {
  // Links de navegação
  const navItems = [
    { name: "Início", path: "/app", icon: "🏠", exact: true },
    { name: "Novo Orçamento", path: "/app/new-budget", icon: "📝" },
    { name: "Meus Produtos", path: "/app/products", icon: "📦" },
    { name: "Dados da Empresa", path: "/app/my-data", icon: "🏢" },
    { name: "Assinatura", path: "/app/subscription", icon: "💎" },
    { name: "Tutoriais", path: "/app/tutorials", icon: "📚" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans text-gray-800">
      
      {/* SIDEBAR (Barra Lateral) */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <span className="font-extrabold text-xl text-blue-900 tracking-tight">UltraOrça</span>
        </div>

        {/* Navegação */}
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

          {/* Link Admin (Discreto) */}
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
        </nav>

        {/* Footer Sidebar (Logout) */}
        <div className="p-4 border-t border-gray-100">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
          >
            <span>🚪</span>
            Sair
          </Link>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-x-hidden">
        {/* Header Mobile (Aparece só em telas pequenas) */}
        <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <span className="font-bold text-lg text-blue-900">UltraOrça</span>
          {/* Futuramente: Botão de Menu Hambúrguer aqui */}
          <div className="flex gap-4 text-sm">
             <Link to="/app" className="text-gray-600">🏠</Link>
             <Link to="/app/new-budget" className="text-blue-600 font-bold">+</Link>
          </div>
        </div>

        {/* Onde as páginas (Dashboard, NewBudget, etc) são renderizadas */}
        <Outlet />
      </main>
    </div>
  );
}