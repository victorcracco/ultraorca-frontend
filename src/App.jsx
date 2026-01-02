import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Componentes Globais
import Layout from "./components/Layout";
import SupportButton from "./components/SupportButton";

// Páginas Públicas (Site e Auth)
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Páginas Legais
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";

// Páginas da Aplicação (Área Logada - prefixo /app)
import Dashboard from "./pages/Dashboard";
import NewBudget from "./pages/NewBudget";
import Products from "./pages/Products";
import MyData from "./pages/MyData";
import Tutorials from "./pages/Tutorials";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Subscription from "./pages/Subscription"; // Importado apenas uma vez agora

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
        {/* O Layout contém a Barra Lateral (Sidebar) */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="new-budget" element={<NewBudget />} />
          <Route path="products" element={<Products />} />
          <Route path="my-data" element={<MyData />} />
          <Route path="tutorials" element={<Tutorials />} />
          
          {/* Rota corrigida: acessível em /app/subscription */}
          <Route path="subscription" element={<Subscription />} />
          
          {/* Rota Admin */}
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}