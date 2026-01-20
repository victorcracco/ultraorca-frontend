import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Componentes Globais
import Layout from "./components/Layout";
import SupportButton from "./components/SupportButton";
import MobileNav from "./components/MobileNav"; // <--- 1. Importei a barra mobile
import AdminRoute from "./components/AdminRoute"; 

// Páginas Públicas
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Páginas Legais
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";

// Páginas da Aplicação
import Dashboard from "./pages/Dashboard";
import NewBudget from "./pages/NewBudget";
import Products from "./pages/Products";
import MyData from "./pages/MyData";
import Tutorials from "./pages/Tutorials";
import Subscription from "./pages/Subscription";

// --- LAZY LOADING ---
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));

export default function App() {
  return (
    <BrowserRouter>
      {/* Botão de Suporte flutuante */}
      <SupportButton />

      <Routes>
        {/* --- ROTAS PÚBLICAS --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Páginas Legais */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* --- ROTAS DA APLICAÇÃO (SaaS) --- */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="new-budget" element={<NewBudget />} />
          <Route path="products" element={<Products />} />
          <Route path="my-data" element={<MyData />} />
          <Route path="tutorials" element={<Tutorials />} />
          <Route path="subscription" element={<Subscription />} />
          
          {/* --- ADMIN --- */}
          <Route element={<AdminRoute />}>
             <Route 
               path="admin" 
               element={
                 <Suspense fallback={
                   <div className="flex h-[80vh] items-center justify-center text-gray-400">
                     <div className="animate-pulse">Carregando módulo seguro...</div>
                   </div>
                 }>
                   <AdminDashboard />
                 </Suspense>
               } 
             />
          </Route>

        </Route>
      </Routes>

      {/* --- 2. BARRA DE NAVEGAÇÃO MOBILE (Fixa no Rodapé) --- */}
      {/* Ela usa useLocation internamente, então funciona aqui dentro */}
      <MobileNav /> 

    </BrowserRouter>
  );
}