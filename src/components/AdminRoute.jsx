import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../services/supabase";

const ADMIN_EMAIL = "SEU_EMAIL_AQUI@GMAIL.COM"; // Tem que ser igual ao do SQL

export default function AdminRoute() {
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
    checkUser();
  }, []);

  if (isAdmin === null) {
    // Loading enquanto verifica
    return <div className="h-screen flex items-center justify-center">Verificando permissões...</div>;
  }

  // Se for admin, deixa passar (Outlet renderiza a página filha)
  // Se não for, chuta para a página inicial
  return isAdmin ? <Outlet /> : <Navigate to="/app" />;
}