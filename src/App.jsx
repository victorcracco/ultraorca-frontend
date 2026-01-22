import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async"; // Opcional, mas recomendado para SEO

// Componentes Globais
import Layout from "./components/Layout";
import SupportButton from "./components/SupportButton";
import MobileNav from "./components/MobileNav";
import AdminRoute from "./components/AdminRoute";
import PrivateRoute from "./components/PrivateRoute"; // <--- NOVO

// Páginas Públicas
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword"; // <--- NOVO
import UpdatePassword from "./pages/UpdatePassword"; // <--- NOVO

// Páginas Legais
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";

// Páginas da Aplicação (SaaS)
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
    <HelmetProvider>
      <BrowserRouter>
        {/* Botão de Suporte flutuante */}
        <SupportButton />

        <Routes>
          {/* --- ROTAS PÚBLICAS --- */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          
          {/* Páginas Legais */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* --- ROTAS PROTEGIDAS DA APLICAÇÃO (SaaS) --- */}
          {/* O PrivateRoute protege tudo que está dentro dele */}
          <Route element={<PrivateRoute />}>
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
          </Route>
        </Routes>

        {/* --- BARRA DE NAVEGAÇÃO MOBILE (Fixa no Rodapé) --- */}
        <MobileNav /> 

      </BrowserRouter>
    </HelmetProvider>
  );
}