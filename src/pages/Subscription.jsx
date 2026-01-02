import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

export default function Subscription() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ name: "", cpf: "" });

  useEffect(() => {
    async function loadUser() {
      // Proteção contra falhas no Supabase
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserData(prev => ({ 
            ...prev, 
            name: data.user.user_metadata?.full_name || "" 
          }));
        }
      } catch (error) {
        console.log("Usuário não logado ou erro no supabase", error);
      }
    }
    loadUser();
  }, []);

  const handlePayment = async () => {
    if (!userData.cpf || !userData.name) {
      alert("Por favor, preencha nome e CPF para emitir a nota fiscal.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: userData.name,
          customerCpf: userData.cpf,
          value: 29.90
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar pagamento");
      }

      if (data.invoiceUrl) {
        window.location.href = data.invoiceUrl;
      } else {
        alert("Erro: Link de pagamento não gerado.");
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao processar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex justify-center items-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Lado Esquerdo */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Seja <span className="text-blue-600">PRO</span>
            </h1>
            <p className="text-lg text-gray-600">
              Desbloqueie todo o poder do sistema.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            {/* USANDO EMOJIS PARA NÃO DAR ERRO DE SVG */}
            <div className="flex items-center gap-3">
              <span className="text-green-500 font-bold text-xl">✅</span>
              <span className="text-gray-700 font-medium">Orçamentos Ilimitados</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500 font-bold text-xl">✅</span>
              <span className="text-gray-700 font-medium">Sua Logo nos PDFs</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500 font-bold text-xl">✅</span>
              <span className="text-gray-700 font-medium">Gestão de Clientes</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500 font-bold text-xl">✅</span>
              <span className="text-gray-700 font-medium">Suporte Prioritário</span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Pagamento */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100 relative">
          <div className="text-center mb-8">
            <span className="text-gray-500 text-sm uppercase font-semibold">
              Assinatura Mensal
            </span>
            <div className="flex justify-center items-baseline mt-2">
              <span className="text-5xl font-extrabold text-gray-900">R$ 29,90</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Seu nome"
              value={userData.name}
              onChange={e => setUserData({...userData, name: e.target.value})}
            />
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="CPF (apenas números)"
              value={userData.cpf}
              onChange={e => setUserData({...userData, cpf: e.target.value})}
            />
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl"
          >
            {loading ? "Processando..." : "Assinar Agora"}
          </button>
        </div>

      </div>
    </div>
  );
}