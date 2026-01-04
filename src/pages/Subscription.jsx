import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

export default function Subscription() {
  const [loading, setLoading] = useState(false); // Loading do botão de compra
  const [checkingStatus, setCheckingStatus] = useState(true); // Loading da tela inteira (NOVO)
  
  const [userData, setUserData] = useState({ name: "", cpf: "", email: "" });
  const [subscription, setSubscription] = useState(null);
  const [billingCycle, setBillingCycle] = useState("annual");

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

  // Função isolada para checar assinatura
  const checkSubscription = async (userId) => {
    try {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (subData) {
        setSubscription(subData);
        return true;
      }
    } catch (error) {
      // Erro silencioso
    }
    return false;
  };

  useEffect(() => {
    let intervalId;

    async function loadUserAndStartPolling() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserData(prev => ({ 
            ...prev, 
            name: user.user_metadata?.full_name || "",
            email: user.email 
          }));

          // 1. Verificação Inicial (Bloqueia a tela com Loading)
          const isPro = await checkSubscription(user.id);
          
          // AQUI ESTÁ A CORREÇÃO: Só tira o loading depois de checar
          setCheckingStatus(false);

          // 2. Se não for PRO, continua checando em segundo plano (Polling)
          if (!isPro) {
            intervalId = setInterval(async () => {
              const found = await checkSubscription(user.id);
              if (found) {
                clearInterval(intervalId);
              }
            }, 3000);
          }
        } else {
            setCheckingStatus(false); // Se não tem user, libera a tela
        }
      } catch (error) {
        console.log("Erro ao carregar:", error);
        setCheckingStatus(false);
      }
    }

    loadUserAndStartPolling();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handlePayment = async () => {
    if (!userData.cpf || !userData.name) {
      alert("Por favor, preencha nome e CPF para emitir a nota fiscal.");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Faça login novamente.");

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
      try { data = JSON.parse(textResponse); } catch (e) { throw new Error("Erro API."); }

      if (!response.ok) throw new Error(data.error || "Erro ao gerar pagamento");

      if (data.invoiceUrl) window.location.href = data.invoiceUrl;

    } catch (error) {
      alert("Ops! " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Tem certeza que deseja cancelar?")) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (response.ok) {
        alert("Assinatura cancelada.");
        window.location.reload();
      } else {
        throw new Error("Erro ao cancelar.");
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- TELA DE LOADING (EVITA O PISCA-PISCA) ---
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        {/* Spinner simples com CSS do Tailwind */}
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Verificando assinatura...</p>
      </div>
    );
  }

  // --- TELA DE ASSINANTE ---
  if (subscription) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex justify-center items-center">
        <div className="bg-white max-w-lg w-full rounded-3xl shadow-xl border border-blue-100 p-8 text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💎</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Você é <span className="text-blue-600">PRO</span>!</h2>
          <p className="text-gray-500 mb-8">Sua assinatura está ativa.</p>
          
          <div className="bg-gray-50 rounded-xl p-6 text-left space-y-3 mb-8">
             <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 text-sm">Status</span>
              <span className="text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded text-xs uppercase">Ativo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Plano</span>
              <span className="font-medium text-gray-900 capitalize">{subscription.plan_type === 'annual' ? 'Anual' : 'Mensal'}</span>
            </div>
          </div>

          <button onClick={handleCancel} disabled={loading} className="text-red-400 text-sm hover:text-red-600 underline w-full">
            {loading ? "Processando..." : "Cancelar Assinatura"}
          </button>
        </div>
      </div>
    );
  }

  // --- TELA DE VENDAS ---
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex justify-center items-center">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">O melhor preço: <span className="text-blue-600">R$ 19,99</span></h1>
            <p className="text-lg text-gray-600">Profissionalize seus orçamentos.</p>
          </div>
          <div className="space-y-4">
             {["Orçamentos ILIMITADOS", "Cadastro de Clientes", "Sua Logo nos PDFs", "Suporte Prioritário"].map((item, i) => (
               <div key={i} className="flex gap-3 items-center"><span className="text-green-500">✔</span><span>{item}</span></div>
             ))}
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-sm text-blue-700">
            <strong>ℹ️ Importante:</strong> A liberação ocorre automaticamente em alguns segundos após o pagamento.
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-8 text-center">
           <div className="flex justify-center mb-8 bg-gray-100 p-1 rounded-xl inline-flex">
              <button onClick={() => setBillingCycle("monthly")} className={`px-6 py-2 rounded-lg text-sm font-bold ${billingCycle === "monthly" ? "bg-white shadow" : "text-gray-500"}`}>Mensal</button>
              <button onClick={() => setBillingCycle("annual")} className={`px-6 py-2 rounded-lg text-sm font-bold ${billingCycle === "annual" ? "bg-white text-blue-900 shadow" : "text-gray-500"}`}>Anual (-17%)</button>
           </div>
           
           <div className="text-5xl font-extrabold text-gray-900 mb-2">R$ {currentPlan.displayPrice}</div>
           <p className="text-gray-500 mb-6">{currentPlan.periodLabel}</p>

           <div className="space-y-3 mb-6 text-left">
             <input className="w-full border rounded p-2" placeholder="Nome" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} />
             <input className="w-full border rounded p-2" placeholder="CPF" maxLength={14} value={userData.cpf} onChange={e => setUserData({...userData, cpf: e.target.value})} />
           </div>

           <button onClick={handlePayment} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition">
             {loading ? "Aguarde..." : "Assinar Agora →"}
           </button>
           <p className="text-xs text-gray-400 mt-4">Pix, Boleto e Cartão</p>
        </div>
      </div>
    </div>
  );
}