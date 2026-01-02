import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

// Ícone de Check simples e seguro (SVG interno para evitar dependências quebradas)
const CheckIcon = () => (
  <svg 
    className="w-5 h-5 text-green-500 flex-shrink-0" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      d="M5 13l4 4L19 7" 
    />
  </svg>
);

export default function Subscription() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ name: "", cpf: "" });

  // Tenta preencher o nome automaticamente
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserData(prev => ({ 
          ...prev, 
          name: user.user_metadata?.full_name || "" 
        }));
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
        
        {/* Lado Esquerdo: Benefícios */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Seja <span className="text-blue-600">PRO</span>
            </h1>
            <p className="text-lg text-gray-600">
              Desbloqueie todo o poder do sistema e profissionalize seu negócio.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckIcon />
              </div>
              <span className="text-gray-700 font-medium">Orçamentos Ilimitados</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                 <CheckIcon />
              </div>
              <span className="text-gray-700 font-medium">Sua Logo nos PDFs</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                 <CheckIcon />
              </div>
              <span className="text-gray-700 font-medium">Gestão de Clientes e Histórico</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                 <CheckIcon />
              </div>
              <span className="text-gray-700 font-medium">Suporte Prioritário</span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Pagamento */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            POPULAR
          </div>
          
          <div className="text-center mb-8">
            <span className="text-gray-500 text-sm uppercase tracking-wider font-semibold">
              Assinatura Mensal
            </span>
            <div className="flex justify-center items-baseline mt-2">
              <span className="text-5xl font-extrabold text-gray-900">R$ 29,90</span>
              <span className="text-gray-500 ml-1">/mês</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                placeholder="Seu nome"
                value={userData.name}
                onChange={e => setUserData({...userData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF (Apenas números)
              </label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                placeholder="000.000.000-00"
                maxLength={14}
                value={userData.cpf}
                onChange={e => setUserData({...userData, cpf: e.target.value})}
              />
              <p className="text-xs text-gray-400 mt-1">
                Necessário para emissão da nota fiscal.
              </p>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Processando..." : "Assinar Agora"}
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-4">
            Pagamento seguro. Cancele quando quiser.
          </p>
        </div>

      </div>
    </div>
  );
}