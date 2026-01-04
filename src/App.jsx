import React, { Suspense } from "react"; // Adicionado Suspense
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Componentes Globais
import Layout from "./components/Layout";
import SupportButton from "./components/SupportButton";
import AdminRoute from "./components/AdminRoute"; 

// Páginas Públicas (Site e Auth)
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Páginas Legais
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";

// Páginas da Aplicação (Área Logada)
import Dashboard from "./pages/Dashboard";
import NewBudget from "./pages/NewBudget";
import Products from "./pages/Products";
import MyData from "./pages/MyData";
import Tutorials from "./pages/Tutorials";
import Subscription from "./pages/Subscription";

// --- SEGURANÇA: LAZY LOADING ---
// O código do AdminDashboard não será baixado por usuários comuns.
// Ele só é carregado da rede quando a rota '/app/admin' é acessada.
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));

export default function App() {
  return (
    <BrowserRouter>
      {/* Botão de Suporte flutuante visível em todas as páginas */}
      <SupportButton />

      <Routes>
        {/* --- ROTAS PÚBLICAS (Site Institucional) --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Páginas Legais (Rodapé) */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* --- ROTAS DA APLICAÇÃO (Sistema SaaS) --- */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="new-budget" element={<NewBudget />} />
          <Route path="products" element={<Products />} />
          <Route path="my-data" element={<MyData />} />
          <Route path="tutorials" element={<Tutorials />} />
          <Route path="subscription" element={<Subscription />} />
          
          {/* --- ÁREA ADMINISTRATIVA SEGURA --- */}
          <Route element={<AdminRoute />}>
             <Route 
               path="admin" 
               element={
                 // O Suspense exibe um loading enquanto baixa o arquivo do AdminDashboard
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
    </BrowserRouter>
  );
}