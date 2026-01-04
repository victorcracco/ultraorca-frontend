import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

export default function Subscription() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ name: "", cpf: "", email: "" });
  const [subscription, setSubscription] = useState(null); // Estado para guardar a assinatura
  const [billingCycle, setBillingCycle] = useState("annual"); // Começa com anual

  const plans = {
    monthly: {
      totalPrice: 19.99,
      displayPrice: "19,99",
      periodLabel: "/mês",
      description: "Assinatura Mensal - UltraOrça PRO",
      savings: null
    },
    annual: {
      totalPrice: 199.99,
      displayPrice: "16,66",
      periodLabel: "/mês*",
      subLabel: "Faturado R$ 199,99 anualmente",
      description: "Assinatura Anual - UltraOrça PRO (2 meses grátis)",
      savings: "Economize R$ 40,00/ano"
    }
  };

  const currentPlan = plans[billingCycle];

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Pega o Usuário Logado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserData(prev => ({ 
            ...prev, 
            name: user.user_metadata?.full_name || "",
            email: user.email 
          }));

          // 2. VERIFICAÇÃO DE ASSINATURA (A Mágica acontece aqui)
          const { data: subData, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active') // Só queremos saber se está ATIVO
            .single();

          if (subData) {
            setSubscription(subData); // Salva que o usuário é PRO
          }
        }
      } catch (error) {
        console.log("Erro ao carregar dados:", error);
      }
    }
    loadData();
  }, []);

  const handlePayment = async () => {
    if (!userData.cpf || !userData.name) {
      alert("Por favor, preencha nome e CPF para emitir a nota fiscal.");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado! Faça login novamente.");

      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: userData.email || user.email,
          customerName: userData.name,
          customerCpf: userData.cpf,
          value: currentPlan.totalPrice,
          description: currentPlan.description,
          planType: billingCycle
        })
      });

      const textResponse = await response.text(); 
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        throw new Error("Erro de comunicação com a API.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar pagamento");
      }

      if (data.invoiceUrl) {
        window.location.href = data.invoiceUrl;
      }

    } catch (error) {
      console.error(error);
      alert("Ops! " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- TELA DE ASSINANTE (Se já pagou, mostra isso) ---
  if (subscription) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex justify-center items-center">
        <div className="bg-white max-w-lg w-full rounded-3xl shadow-xl border border-blue-100 p-8 text-center relative overflow-hidden">
          
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💎</span>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Você é <span className="text-blue-600">PRO</span>!
          </h2>
          <p className="text-gray-500 mb-8">
            Sua assinatura está ativa e você tem acesso ilimitado.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 text-left space-y-3 mb-8">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 text-sm">Status</span>
              <span className="text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded text-xs uppercase">
                Ativo
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 text-sm">Plano</span>
              <span className="font-medium text-gray-900 capitalize">
                {subscription.plan_type === 'annual' ? 'Anual' : 'Mensal'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Desde</span>
              <span className="font-medium text-gray-900">
                {new Date(subscription.updated_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          <button 
            className="text-gray-400 text-sm hover:text-red-500 transition-colors underline"
            onClick={() => alert("Para cancelar, entre em contato com o suporte ou gerencie pelo painel do Asaas.")}
          >
            Gerenciar Assinatura
          </button>
        </div>
      </div>
    );
  }

  // --- TELA DE VENDAS (Se não pagou, mostra isso) ---
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex justify-center items-center">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Lado Esquerdo: Argumentos de Venda */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
              O melhor preço do mercado: <span className="text-blue-600">R$ 19,99</span>
            </h1>
            <p className="text-lg text-gray-600">
              Custo-benefício imbatível. Profissionalize seus orçamentos pelo preço de um lanche.
            </p>
          </div>

          <div className="space-y-5">
            {[
              "Orçamentos ILIMITADOS",
              "Cadastro de Clientes e Produtos",
              "Sua Logo e Cores nos PDFs",
              "Suporte Prioritário"
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="bg-green-100 p-1.5 rounded-full text-green-700 text-xs">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span className="text-gray-700 font-medium text-lg">{item}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <span className="text-2xl">🛡️</span>
            <p className="text-sm text-gray-500">
              <strong>Compra Segura.</strong> Seus dados protegidos.
            </p>
          </div>
        </div>

        {/* Lado Direito: Card de Preço */}
        <div className="bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden relative transform transition-all hover:scale-[1.01]">
          
          {billingCycle === "annual" && (
            <div className="bg-blue-600 text-white text-center text-xs font-bold py-2 tracking-widest uppercase">
              Melhor Custo-Benefício
            </div>
          )}

          <div className="p-8 text-center">
            {/* Toggle Switch */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-xl inline-flex relative w-full max-w-xs">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`w-1/2 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                    billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={`w-1/2 py-2 rounded-lg text-sm font-bold transition-all duration-300 relative ${
                    billingCycle === "annual" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Anual
                  <span className="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full border-2 border-white">
                    -17%
                  </span>
                </button>
              </div>
            </div>

            {/* Display do Preço */}
            <div className="mb-2">
              <div className="flex justify-center items-end gap-1">
                <span className="text-2xl font-bold text-gray-400 pb-2">R$</span>
                <span className="text-6xl font-extrabold text-gray-900 leading-none">
                  {currentPlan.displayPrice}
                </span>
                <span className="text-xl font-medium text-gray-500 pb-2">
                  {currentPlan.periodLabel}
                </span>
              </div>
            </div>

            <div className="h-12 mb-6">
              {billingCycle === "annual" ? (
                <>
                  <p className="text-sm text-gray-500">{currentPlan.subLabel}</p>
                  <p className="text-green-600 text-sm font-bold bg-green-50 inline-block px-3 py-1 rounded-full mt-1">
                    {currentPlan.savings}
                  </p>
                </>
              ) : (
                <p className="text-gray-400 text-sm mt-2">Cancele quando quiser.</p>
              )}
            </div>

            {/* Inputs */}
            <div className="space-y-3 text-left bg-gray-50 p-5 rounded-2xl mb-6 border border-gray-100">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={userData.name}
                  onChange={e => setUserData({...userData, name: e.target.value})}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">CPF</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-200 flex justify-center items-center gap-2"
            >
              {loading ? "Processando..." : (
                <><span>Assinar Agora</span><span>→</span></>
              )}
            </button>
            
            <p className="text-center text-xs text-gray-400 mt-4">
              Aceitamos Pix, Boleto e Cartão
            </p>
            
          </div>
        </div>
      </div>
    </div>
  );
}