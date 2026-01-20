import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { loadStripe } from "@stripe/stripe-js";

// COLOQUE SUA CHAVE PÚBLICA DO STRIPE AQUI (Começa com pk_test_ ou pk_live_)
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

export default function Subscription() {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  const [userData, setUserData] = useState({ name: "", cpf: "", email: "" });
  const [subscription, setSubscription] = useState(null);
  
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("pro"); 
  
  // Controle do Modal de Pagamento
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const plans = {
    starter: {
      id: "starter",
      name: "Iniciante",
      price: 19.99,
      period: "/mês",
      description: "Plano Iniciante (30 orçamentos)",
      features: ["30 orçamentos/mês", "PDF Padrão", "Suporte Básico"],
      color: "gray"
    },
    pro: {
      id: "pro",
      name: "Profissional",
      price: 29.99,
      period: "/mês",
      description: "Plano PRO - Ilimitado",
      features: ["Orçamentos Ilimitados", "Sem marca d'água", "Cadastro de Produtos", "Suporte Prioritário"],
      color: "blue",
      recommended: true
    },
    annual: {
      id: "annual",
      name: "Anual PRO",
      price: 299.00,
      period: "/ano",
      description: "Plano Anual (2 meses grátis)",
      features: ["Tudo do PRO", "2 Meses Grátis", "Pagamento Único"],
      color: "green",
      badge: "Economize R$ 60"
    }
  };

  const selectedPlan = plans[selectedPlanId];

  // --- 1. VERIFICAÇÃO DE ASSINATURA ---
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
    } catch (error) {}
    return false;
  };

  useEffect(() => {
    let intervalId;
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserData(prev => ({ 
            ...prev, 
            name: user.user_metadata?.full_name || "",
            email: user.email 
          }));

          const isPro = await checkSubscription(user.id);
          setCheckingStatus(false);

          // Polling para verificar se o pagamento caiu (após voltar do checkout)
          if (!isPro) {
            intervalId = setInterval(async () => {
              const found = await checkSubscription(user.id);
              if (found) clearInterval(intervalId);
            }, 3000);
          }
        } else {
            setCheckingStatus(false);
        }
      } catch (error) {
        setCheckingStatus(false);
      }
    }
    init();
    return () => { if (intervalId) clearInterval(intervalId); };
  }, []);

  // --- 2. VALIDAÇÃO ANTES DE ABRIR MODAL ---
  const handleOpenPaymentModal = () => {
    if (!userData.cpf || !userData.name) {
      alert("Por favor, preencha nome e CPF para emitir a nota fiscal.");
      return;
    }
    setShowPaymentModal(true);
  };

  // --- 3. PROCESSAMENTO DE PAGAMENTO (HÍBRIDO) ---
  const processPayment = async (method) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Faça login novamente.");

      const payload = {
        userId: user.id,
        email: userData.email,
        name: userData.name,
        cpf: userData.cpf,
        planId: selectedPlan.id,
        isUpgrade: isUpgrading
      };

      // >>>> OPÇÃO A: CARTÃO (STRIPE) <<<<
      if (method === 'stripe') {
          const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
          
          const response = await fetch('/api/checkout-stripe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          
          const { sessionId, error } = await response.json();
          if (error) throw new Error(error);
          
          // Redireciona para o Checkout Seguro do Stripe
          await stripe.redirectToCheckout({ sessionId });
      } 
      
      // >>>> OPÇÃO B: PIX (ASAAS) <<<<
      else if (method === 'asaas') {
          const response = await fetch('/api/checkout-asaas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Erro no Asaas");

          // Redireciona para a fatura do Asaas ou mostra Pix Copia e Cola
          if (data.invoiceUrl) {
              window.location.href = data.invoiceUrl;
          }
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao iniciar pagamento: " + error.message);
      setLoading(false); // Só tira loading se der erro, senão espera redirect
    }
  };

  // --- 4. CANCELAMENTO ---
  const handleCancel = async () => {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura?")) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        alert("Assinatura cancelada com sucesso.");
        window.location.reload();
      } else {
        throw new Error("Erro ao processar cancelamento.");
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZAÇÃO ---

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Carregando informações...</p>
      </div>
    );
  }

  // >>> TELA DE ASSINANTE (DASHBOARD) <<<
  if (subscription && !isUpgrading) {
    const currentPlanName = plans[subscription.plan_type]?.name || "Personalizado";
    const isStarter = subscription.plan_type === 'starter';

    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Minha Assinatura</h1>
        
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">Plano {currentPlanName}</h2>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Ativo</span>
                </div>
                <p className="text-gray-500">
                  {subscription.provider === 'stripe' ? 'Cobrança automática no Cartão' : 'Cobrança via Boleto/Pix'}
                </p>
              </div>

              {isStarter ? (
                <button 
                  onClick={() => { setIsUpgrading(true); setSelectedPlanId('pro'); }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg animate-pulse transform hover:scale-105 flex flex-col items-center"
                >
                  <span>Fazer Upgrade para PRO 🚀</span>
                  <span className="text-xs font-normal opacity-90">Liberar tudo agora</span>
                </button>
              ) : (
                <div className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                  Você já tem o melhor plano! 🚀
                </div>
              )}
            </div>

            <hr className="my-8 border-gray-100" />

            <div className="flex justify-between items-center">
               <span className="text-sm text-gray-400">ID: {subscription.id.slice(0,8)}</span>
               <button onClick={handleCancel} disabled={loading} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition">
                 {loading ? "Processando..." : "Cancelar Assinatura"}
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // >>> TELA DE VENDAS / UPGRADE <<<
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 relative">
      
      {/* --- MODAL DE PAGAMENTO (O PULO DO GATO) --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                <button 
                    onClick={() => setShowPaymentModal(false)} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >✕</button>

                <h2 className="text-xl font-bold text-gray-800 mb-2">Como você prefere pagar?</h2>
                <p className="text-gray-500 mb-6 text-sm">Escolha a melhor opção para sua recorrência.</p>

                <div className="space-y-3">
                    {/* OPÇÃO 1: STRIPE (CARTÃO) */}
                    <button 
                        onClick={() => processPayment('stripe')}
                        disabled={loading}
                        className="w-full border-2 border-blue-600 bg-blue-50 hover:bg-blue-100 p-4 rounded-xl flex items-center justify-between transition group"
                    >
                        <div className="text-left">
                            <span className="block font-bold text-blue-700">Cartão de Crédito</span>
                            <span className="text-xs text-blue-600">Cobrança automática todo mês (Recomendado)</span>
                        </div>
                        <div className="text-2xl">💳</div>
                    </button>

                    {/* OPÇÃO 2: ASAAS (PIX) */}
                    <button 
                        onClick={() => processPayment('asaas')}
                        disabled={loading}
                        className="w-full border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 p-4 rounded-xl flex items-center justify-between transition"
                    >
                        <div className="text-left">
                            <span className="block font-bold text-gray-700">Pix Mensal</span>
                            <span className="text-xs text-gray-500">Enviamos o código todo mês no seu Zap</span>
                        </div>
                        <div className="text-2xl">💠</div>
                    </button>
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center rounded-2xl">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p className="text-sm text-gray-600 mt-2">Criando assinatura segura...</p>
                    </div>
                )}
                
                <p className="text-center text-xs text-gray-400 mt-6 flex justify-center gap-2">
                    🔒 Ambiente Seguro SSL
                </p>
            </div>
        </div>
      )}

      {isUpgrading && (
        <button onClick={() => setIsUpgrading(false)} className="mb-6 flex items-center text-gray-500 hover:text-gray-800 transition">← Voltar</button>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {isUpgrading ? "Evolua seu plano hoje" : "Escolha o plano ideal"}
        </h1>
        <p className="text-lg text-gray-500">
          {isUpgrading ? "Desbloqueie recursos profissionais imediatamente." : "Comece grátis ou profissionalize seu negócio."}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {Object.values(plans).map((plan) => {
          if (isUpgrading && plan.id === 'starter') return null;

          return (
            <div 
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative p-8 rounded-2xl cursor-pointer transition-all duration-300 border-2 flex flex-col ${selectedPlanId === plan.id ? `border-${plan.color}-500 bg-white shadow-xl transform scale-105 z-10` : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"}`}
            >
              {(plan.recommended || plan.badge) && (
                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl rounded-tr-xl text-xs font-bold text-white bg-${plan.color}-500`}>
                  {plan.badge || "RECOMENDADO"}
                </div>
              )}

              <h3 className={`text-xl font-bold mb-2 text-${plan.color === 'gray' ? 'gray-700' : `${plan.color}-600`}`}>{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-gray-900">{plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                <span className="text-xs font-bold text-gray-500 uppercase">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-600"><span className={`text-${plan.color}-500 font-bold`}>✓</span> {feature}</li>
                ))}
              </ul>

              <div className={`w-full py-3 rounded-xl text-center font-bold transition-colors ${selectedPlanId === plan.id ? `bg-${plan.color}-600 text-white` : "bg-gray-100 text-gray-600"}`}>
                {selectedPlanId === plan.id ? "Selecionado" : "Escolher"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100 max-w-3xl mx-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">✓</span>
          {isUpgrading ? "Confirmar Upgrade para:" : "Finalizar Assinatura:"} 
          <span className="text-blue-600 ml-1">{selectedPlan?.name}</span>
        </h3>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} placeholder="Nome na Nota Fiscal" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CPF</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500" value={userData.cpf} onChange={e => setUserData({...userData, cpf: e.target.value})} placeholder="000.000.000-00" maxLength={14} />
          </div>
        </div>

        <button
          onClick={handleOpenPaymentModal}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4 rounded-xl transition shadow-lg hover:shadow-green-200 flex justify-center items-center gap-2"
        >
          {loading ? "Carregando..." : "Ir para Pagamento Seguro →"}
        </button>
      </div>
    </div>
  );
}