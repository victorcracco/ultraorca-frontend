import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Componentes Globais
import Layout from "./components/Layout";
import SupportButton from "./components/SupportButton";
import MobileNav from "./components/MobileNav";
import AdminRoute from "./components/AdminRoute";
import PrivateRoute from "./components/PrivateRoute";

// Páginas Públicas
import LandingPage from "./pages/LandingPage";
import LandingPageAds from "./pages/LandingPageAds";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";

// Páginas Legais
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";

// Página pública
import PublicBudget from "./pages/PublicBudget";
import NotFound from "./pages/NotFound";

// Páginas da Aplicação (SaaS)
import Dashboard from "./pages/Dashboard";
import Budgets from "./pages/Budgets";
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
        <Route path="/comecar" element={<LandingPageAds />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/cadastro" element={<Navigate to="/register" replace />} />

        {/* Páginas Legais */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Orçamento público (sem auth) */}
        <Route path="/orcamento/:id" element={<PublicBudget />} />

        {/* --- ROTAS PROTEGIDAS DA APLICAÇÃO (SaaS) --- */}
        <Route element={<PrivateRoute />}>
          <Route path="/app" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="budgets" element={<Budgets />} />
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
                  <Suspense
                    fallback={
                      <div className="flex h-[80vh] items-center justify-center text-gray-400">
                        <div className="animate-pulse">Carregando módulo seguro...</div>
                      </div>
                    }
                  >
                    <AdminDashboard />
                  </Suspense>
                }
              />
            </Route>
          </Route>
        </Route>
        {/* --- 404 CATCH-ALL --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* --- BARRA DE NAVEGAÇÃO MOBILE (Fixa no Rodapé) --- */}
      <MobileNav />
    </BrowserRouter>
  );
}