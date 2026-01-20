import { Link, useLocation } from "react-router-dom";

export default function MobileNav() {
  const location = useLocation();
  const path = location.pathname;

  // Função para saber se o ícone está ativo
  const isActive = (route) => path === route ? "text-blue-600" : "text-gray-400";

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-between items-center px-6 py-3 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      
      {/* 1. HOME */}
      <Link to="/app" className={`flex flex-col items-center gap-1 ${isActive("/app")}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        <span className="text-[10px] font-bold">Início</span>
      </Link>

      {/* 2. PRODUTOS */}
      <Link to="/app/products" className={`flex flex-col items-center gap-1 ${isActive("/app/products")}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
        <span className="text-[10px] font-bold">Itens</span>
      </Link>

      {/* 3. BOTÃO DESTAQUE (NOVO ORÇAMENTO) */}
      <Link to="/app/new-budget" className="relative -top-5">
        <div className="bg-blue-600 text-white p-4 rounded-full shadow-lg border-4 border-gray-50 transform hover:scale-105 transition active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </div>
      </Link>

      {/* 4. DADOS */}
      <Link to="/app/my-data" className={`flex flex-col items-center gap-1 ${isActive("/app/my-data")}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        <span className="text-[10px] font-bold">Empresa</span>
      </Link>

      {/* 5. PERFIL/CONTA */}
      <Link to="/app/subscription" className={`flex flex-col items-center gap-1 ${isActive("/app/subscription")}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        <span className="text-[10px] font-bold">Conta</span>
      </Link>

    </div>
  );
}