import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Verifica se o usuário chegou aqui logado (o link do email faz o login automático)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/"); 
    });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      alert("Erro: " + error.message);
    } else {
      alert("Senha atualizada com sucesso!");
      navigate("/app"); // Manda pro Dashboard
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Definir Nova Senha</h1>
        <form onSubmit={handleUpdate} className="space-y-4">
          <input 
            type="password" 
            placeholder="Nova senha segura" 
            className="w-full p-3 border rounded-lg"
            value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
          />
          <button disabled={loading} className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700">
            {loading ? "Salvando..." : "Alterar Senha"}
          </button>
        </form>
      </div>
    </div>
  );
}