import { useState } from "react";
import { supabase } from "../services/supabase";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // O trque é o redirectTo apontando para a rota que criaremos a seguir
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.ultraorca.com.br/update-password',
    });

    setLoading(false);
    if (error) alert("Erro: " + error.message);
    else alert("Verifique seu e-mail! Enviamos um link de recuperação.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Recuperar Senha</h1>
        <p className="text-gray-500 mb-6">Digite seu e-mail para receber o link.</p>
        
        <form onSubmit={handleReset} className="space-y-4">
          <input 
            type="email" 
            placeholder="seu@email.com" 
            className="w-full p-3 border rounded-lg"
            value={email} onChange={e => setEmail(e.target.value)} required
          />
          <button disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700">
            {loading ? "Enviando..." : "Enviar Link"}
          </button>
        </form>
        <Link to="/" className="block text-center mt-4 text-sm text-gray-500 hover:underline">Voltar ao Login</Link>
      </div>
    </div>
  );
}