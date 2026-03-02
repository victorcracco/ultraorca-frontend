import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

/**
 * M1: AuthContext global — centraliza a sessão do usuário em um único lugar.
 * Evita múltiplas chamadas supabase.auth.getUser() espalhadas pelos componentes.
 *
 * Uso:
 *   const { user, session, loading } = useAuth();
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Busca a sessão inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Escuta mudanças de sessão (login, logout, refresh de token)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, session, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook para acessar o contexto de autenticação.
 * @returns {{ user: import('@supabase/supabase-js').User|null, session: import('@supabase/supabase-js').Session|null, loading: boolean }}
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve ser usado dentro de um <AuthProvider>");
    }
    return context;
}
