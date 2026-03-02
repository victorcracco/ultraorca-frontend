import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../services/supabase";

/**
 * C2 FIX: Admin verificado por coluna `is_admin` no banco (tabela profiles),
 * não por e-mail hardcoded no frontend. Garante que a verificação não pode ser
 * bypassada inspecionando o bundle JavaScript.
 *
 * Para definir um admin: UPDATE profiles SET is_admin = true WHERE id = '<user_id>';
 */
export default function AdminRoute() {
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAdmin() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) setIsAdmin(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (isMounted) {
          setIsAdmin(!error && profile?.is_admin === true);
        }
      } catch {
        if (isMounted) setIsAdmin(false);
      }
    }

    checkAdmin();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isAdmin === null) {
    return (
      <div className="p-10 text-center text-gray-500">
        Verificando permissões...
      </div>
    );
  }

  return isAdmin ? <Outlet /> : <Navigate to="/app" />;
}