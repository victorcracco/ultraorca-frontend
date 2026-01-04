import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Componentes Globais
import Layout from "./components/Layout";
import SupportButton from "./components/SupportButton";
import AdminRoute from "./components/AdminRoute"; // <--- NOVO IMPORT

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
import Subscription from "./pages/Subscription";

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
          
          {/* --- ROTA ADMIN PROTEGIDA --- */}
          {/* Só acessa se passar pelo AdminRoute */}
          <Route element={<AdminRoute />}>
             <Route path="admin" element={<AdminDashboard />} />
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}