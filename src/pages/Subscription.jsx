import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

export default function Subscription() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ name: "", cpf: "" });
  
  // Controle do Plano (monthly ou annual)
  const [billingCycle, setBillingCycle] = useState("monthly");

  // Configuração dos preços
  const plans = {
    monthly: {
      price: 29.90,
      label: "/mês",
      totalDisplay: "R$ 29,90",
      description: "Assinatura Mensal - UltraOrça PRO"
    },
    annual: {
      price: 299.00, // Equivalente a ~24,90/mês (2 meses grátis)
      label: "/ano",
      totalDisplay: "R$ 299,00",
      description: "Assinatura Anual - UltraOrça PRO (2 meses grátis)"
    }
  };

  const currentPlan = plans[billingCycle];

  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserData(prev => ({ 
            ...prev, 
            name: data.user.user_metadata?.full_name || "" 
          }));
        }
      } catch (error) {
        console.log("Usuário não logado", error);
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
          value: currentPlan.price, // Manda o valor correto (29.90 ou 299.00)
          description: currentPlan.description // Manda a descrição correta
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar pagamento");
      }

      if (data.invoiceUrl) {
        // Redireciona para o pagamento
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
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Lado Esquerdo: Texto e Benefícios */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Profissionalize seu negócio
            </h1>
            <p className="text-lg text-gray-600">
              Escolha o plano ideal e desbloqueie orçamentos ilimitados, gestão de clientes e sua marca em destaque.
            </p>
          </div>

          <div className="space-y-4">
            {[
              "Orçamentos e Clientes Ilimitados",
              "PDFs sem marca d'água do sistema",
              "Sua Logo e Cores nos documentos",
              "Acesso ao Painel de Gestão Avançado"
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="bg-green-100 p-1 rounded-full text-xs">✅</div>
                <span className="text-gray-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lado Direito: Card de Preço */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
          
          <div className="p-8 text-center">
            {/* Toggle Mensal/Anual */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-full inline-flex relative">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                    billingCycle === "monthly" 
                    ? "bg-white text-blue-900 shadow-sm" 
                    : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                    billingCycle === "annual" 
                    ? "bg-white text-blue-900 shadow-sm" 
                    : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Anual
                  <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">
                    -17% OFF
                  </span>
                </button>
              </div>
            </div>

            {/* Preço Grande */}
            <div className="mb-2">
              <span className="text-5xl font-extrabold text-gray-900">
                {currentPlan.totalDisplay}
              </span>
              <span className="text-gray-500 font-medium ml-2">
                {billingCycle === "monthly" ? "/mês" : "/ano"}
              </span>
            </div>
            
            {billingCycle === "annual" && (
              <p className="text-green-600 text-sm font-medium mb-6 animate-pulse">
                Economize R$ 60,00 por ano!
              </p>
            )}
             {billingCycle === "monthly" && (
              <p className="text-gray-400 text-sm font-medium mb-6">
                Cancele a qualquer momento.
              </p>
            )}

            {/* Formulário Rápido */}
            <div className="space-y-3 text-left bg-gray-50 p-4 rounded-xl mb-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nome na Nota</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-gray-200 rounded p-2 text-sm mt-1 focus:border-blue-500 outline-none"
                  value={userData.name}
                  onChange={e => setUserData({...userData, name: e.target.value})}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">CPF</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-gray-200 rounded p-2 text-sm mt-1 focus:border-blue-500 outline-none"
                  value={userData.cpf}
                  onChange={e => setUserData({...userData, cpf: e.target.value})}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-200"
            >
              {loading ? "Gerando Pagamento..." : `Assinar Plano ${billingCycle === 'monthly' ? 'Mensal' : 'Anual'}`}
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
}