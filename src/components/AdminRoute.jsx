import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../services/supabase";

// Coloque seu email aqui (tudo minúsculo para garantir)
const ADMIN_EMAIL = "seuemail@exemplo.com"; 

export default function AdminRoute() {
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log("--- DEBUG ADMIN ---");
      console.log("Email esperado:", ADMIN_EMAIL);
      console.log("Usuário logado:", user?.email);

      // Verificação mais robusta (ignora maiúsculas/minúsculas e espaços)
      if (user && user.email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase()) {
        console.log("✅ Acesso PERMITIDO");
        setIsAdmin(true);
      } else {
        console.log("❌ Acesso NEGADO");
        setIsAdmin(false);
      }
    }
    checkUser();
  }, []);

  if (isAdmin === null) {
    return <div className="p-10 text-center">Verificando permissões... (Olhe o Console F12)</div>;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/app" />;
}