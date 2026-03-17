import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";

export default function UpdatePassword() {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/");
    });
  }, [navigate]);

  const isWeak = password.length > 0 && (password.length < 8 || !/\d/.test(password));
  const mismatch = confirm.length > 0 && password !== confirm;

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (!/\d/.test(password)) {
      toast.error("A senha deve conter pelo menos um número.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      toast.success("Senha atualizada com sucesso!");
      navigate("/app");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Definir Nova Senha</h1>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Nova senha (mín. 8 caracteres + 1 número)"
              className={`w-full p-3 border rounded-lg outline-none transition focus:ring-2 ${
                isWeak ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"
              }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            {isWeak && <p className="text-red-500 text-xs mt-1">Mínimo de 8 caracteres e pelo menos 1 número.</p>}
          </div>

          <div>
            <input
              type="password"
              placeholder="Confirme a nova senha"
              className={`w-full p-3 border rounded-lg outline-none transition focus:ring-2 ${
                mismatch ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"
              }`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {mismatch && <p className="text-red-500 text-xs mt-1">As senhas não coincidem.</p>}
          </div>

          <button
            disabled={loading || isWeak || mismatch}
            className={`w-full p-3 rounded-lg font-bold text-white transition ${
              loading || isWeak || mismatch ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Salvando..." : "Alterar Senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
