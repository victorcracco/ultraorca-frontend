import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

export default function Subscription() {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  const [userData, setUserData] = useState({ name: "", cpf: "", email: "" });
  const [subscription, setSubscription] = useState(null);
  
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("pro"); 
  
  // Controle do Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Configuração dos Planos
  const plans = {
    starter: {
      id: "starter",
      name: "Iniciante",
      price: 19.99,
      period: "/mês",
      description: "Plano Iniciante",
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
      description: "Plano Anual",
      features: ["Tudo do PRO", "2 Meses Grátis", "Pagamento Único"],
      color: "green",
      badge: "Economize R$ 60"
    }
  };

  const selectedPlan = plans[selectedPlanId];

  // =========================================================
  // 1. VERIFICAÇÃO DE ASSINATURA (Atualizado)
  // =========================================================
  const checkSubscription = async (userId) => {
    try {
      // Usamos .maybeSingle() para evitar erro 406 se não tiver assinatura
      const { data: subData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        // MUDANÇA AQUI: Aceita 'active', 'canceling' (cancelado mas com dias sobrando) e 'trialing'
        .in('status', ['active', 'canceling', 'trialing']) 
        .maybeSingle();

      if (error) {
        console.warn("Erro ao buscar assinatura:", error.message);
        return null;
      }

      if (subData) {
        setSubscription(subData);
        return true; // Encontrou e é válida
      }
    } catch (err) {
      console.error("Erro conexão:", err);
    }
    return false; // Não encontrou
  };

  // Efeito de Inicialização + Polling Inteligente
  useEffect(() => {
    let intervalId;
    let attempts = 0;

    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserData(prev => ({ 
            ...prev, 
            name: user.user_metadata?.full_name || "",
            email: user.email 
          }));

          // Primeira verificação imediata
          const isActive = await checkSubscription(user.id);
          setCheckingStatus(false);

          // Se NÃO estiver ativo, inicia o polling (verifica a cada 3s)
          // Mas com limite de tentativas para não travar o navegador
          if (!isActive) {
            intervalId = setInterval(async () => {
              attempts++;
              const found = await checkSubscription(user.id);
              
              // Se achou a assinatura OU se já tentou por 1 minuto (20x3s), para.
              if (found || attempts > 20) {
                clearInterval(intervalId);
              }
            }, 3000);
          }

        } else {
            setCheckingStatus(false);
        }
      } catch (error) {
        console.error(error);
        setCheckingStatus(false);
      }
    }

    init();

    // Limpeza ao sair da tela
    return () => { if (intervalId) clearInterval(intervalId); };
  }, []);

  // =========================================================
  // 2. VALIDAÇÃO E MODAL
  // =========================================================
  const handleOpenPaymentModal = () => {
    if (!userData.cpf || !userData.name) {
      alert("Por favor, preencha nome e CPF para emitir a nota fiscal.");
      return;
    }
    setShowPaymentModal(true);
  };

  // =========================================================
  // 3. PROCESSAMENTO DE PAGAMENTO
  // =========================================================
  const processPayment = async (method) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada. Faça login novamente.");

      const payload = {
        userId: user.id,
        email: userData.email,
        name: userData.name,
        cpf: userData.cpf,
        planId: selectedPlan.id,
        isUpgrade: isUpgrading
      };

      // Define qual rota chamar
      let endpoint = method === 'stripe' ? '/api/checkout-stripe' : '/api/checkout-asaas';

      const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });

      // Verifica se a Vercel devolveu HTML de erro (Tela branca)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") === -1) {
          const text = await response.text();
          console.error("Erro Servidor:", text);
          throw new Error("Erro interno no servidor de pagamento. Tente novamente.");
      }

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.error || "Falha ao processar pagamento");
      }

      // REDIRECIONAMENTOS
      if (method === 'stripe') {
          if (data.url) {
              window.location.href = data.url; 
          } else {
              throw new Error("Link do Stripe não gerado.");
          }
      } 
      else if (method === 'asaas') {
          if (data.invoiceUrl) {
              window.location.href = data.invoiceUrl;
          } else {
              throw new Error("Link do boleto/pix não gerado pelo Asaas.");
          }
      }

    } catch (error) {
      console.error(error);
      alert(`Ops! ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // 4. CANCELAMENTO
  // =========================================================
  const handleCancel = async () => {
    // Se já estiver agendado para cancelar, avisamos e não fazemos nada
    if (subscription.status === 'canceling') {
        alert("Seu cancelamento já está agendado. Você pode continuar usando até o fim do período.");
        return;
    }

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
        const data = await response.json();
        alert(data.message || "Assinatura cancelada.");
        window.location.reload();
      } else {
        const err = await response.json();
        throw new Error(err.error || "Erro ao cancelar.");
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // 5. RENDERIZAÇÃO DA TELA
  // =========================================================

  // Tela de Loading Inicial
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Carregando plano...</p>
      </div>
    );
  }

  // >>> CASO 1: USUÁRIO JÁ É ASSINANTE (Ativo ou Cancelando) <<<
  if (subscription && !isUpgrading) {
    // Mapeia o nome do plano baseado no ID salvo no banco
    const planKey = subscription.plan_type === 'starter' ? 'starter' : 
                    subscription.plan_type === 'pro' ? 'pro' : 
                    subscription.plan_type === 'annual' ? 'annual' : 'starter'; // fallback
    
    const currentPlanName = plans[planKey]?.name || subscription.plan_type;
    const isStarter = subscription.plan_type === 'starter';
    const providerName = subscription.provider === 'stripe' ? 'Cartão de Crédito' : 'Boleto/Pix Asaas';

    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Minha Assinatura</h1>
        
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">Plano {currentPlanName}</h2>
                  
                  {/* MUDANÇA VISUAL AQUI: Etiqueta diferente se estiver cancelando */}
                  {subscription.status === 'canceling' ? (
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-orange-200">
                        Cancelamento Agendado
                      </span>
                  ) : (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        Ativo
                      </span>
                  )}
                </div>

                <p className="text-gray-500 text-sm">
                  Gerenciado via {providerName}
                </p>
                {subscription.updated_at && (
                    <p className="text-xs text-gray-400 mt-1">
                        Última atualização: {new Date(subscription.updated_at).toLocaleDateString()}
                    </p>
                )}
                
                {subscription.status === 'canceling' && (
                    <p className="text-xs text-orange-600 mt-2 font-medium">
                        Seu acesso continua liberado até o fim do período atual.
                    </p>
                )}
              </div>

              {isStarter && subscription.status !== 'canceling' ? (
                <button 
                  onClick={() => { setIsUpgrading(true); setSelectedPlanId('pro'); }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg animate-pulse transform hover:scale-105 flex flex-col items-center"
                >
                  <span>Fazer Upgrade para PRO 🚀</span>
                  <span className="text-xs font-normal opacity-90">Liberar tudo agora</span>
                </button>
              ) : (
                <div className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                  {subscription.status === 'canceling' ? 'Assinatura encerrada.' : 'Você já tem o melhor plano! 🚀'}
                </div>
              )}
            </div>

            <hr className="my-8 border-gray-100" />

            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
               <span className="text-xs text-gray-400 font-mono">ID: {subscription.id.slice(0,8)}...</span>
               
               {/* Esconde botão de cancelar se já estiver cancelando */}
               {subscription.status !== 'canceling' && (
                   <button onClick={handleCancel} disabled={loading} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition">
                     {loading ? "Processando..." : "Cancelar Assinatura"}
                   </button>
               )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // >>> CASO 2: TELA DE VENDAS / UPGRADE <<<
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 relative">
      
      {/* MODAL DE PAGAMENTO */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                <button 
                    onClick={() => setShowPaymentModal(false)} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                >✕</button>

                <h2 className="text-xl font-bold text-gray-800 mb-2">Forma de Pagamento</h2>
                <p className="text-gray-500 mb-6 text-sm">Escolha como deseja manter sua assinatura.</p>

                <div className="space-y-3">
                    {/* CARTÃO */}
                    <button 
                        onClick={() => processPayment('stripe')}
                        disabled={loading}
                        className="w-full border-2 border-blue-600 bg-blue-50 hover:bg-blue-100 p-4 rounded-xl flex items-center justify-between transition group"
                    >
                        <div className="text-left">
                            <span className="block font-bold text-blue-700">Cartão de Crédito</span>
                            <span className="text-xs text-blue-600">Liberação imediata + Renovação automática</span>
                        </div>
                        <div className="text-2xl">💳</div>
                    </button>

                    {/* PIX / BOLETO */}
                    <button 
                        onClick={() => processPayment('asaas')}
                        disabled={loading}
                        className="w-full border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 p-4 rounded-xl flex items-center justify-between transition"
                    >
                        <div className="text-left">
                            <span className="block font-bold text-gray-700">Pix ou Boleto</span>
                            <span className="text-xs text-gray-500">Enviamos o código mensalmente no Zap</span>
                        </div>
                        <div className="text-2xl">💠</div>
                    </button>
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center rounded-2xl z-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                        <p className="text-sm font-bold text-gray-700">Gerando cobrança segura...</p>
                    </div>
                )}
                
                <p className="text-center text-xs text-gray-400 mt-6 flex justify-center gap-2 items-center">
                   🔒 Pagamento processado em ambiente seguro
                </p>
            </div>
        </div>
      )}

      {isUpgrading && (
        <button onClick={() => setIsUpgrading(false)} className="mb-6 flex items-center text-gray-500 hover:text-gray-800 transition font-medium">
            ← Voltar para minha assinatura
        </button>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {isUpgrading ? "Evolua seu plano hoje" : "Escolha o plano ideal"}
        </h1>
        <p className="text-lg text-gray-500">
          {isUpgrading ? "Desbloqueie todos os recursos imediatamente." : "Comece grátis ou profissionalize seu negócio agora."}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {Object.values(plans).map((plan) => {
          // Se for upgrade, esconde o plano Starter
          if (isUpgrading && plan.id === 'starter') return null;

          const isSelected = selectedPlanId === plan.id;

          return (
            <div 
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`
                relative p-8 rounded-2xl cursor-pointer transition-all duration-300 border-2 flex flex-col
                ${isSelected 
                  ? `border-${plan.color}-500 bg-white shadow-xl transform scale-105 z-10` 
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                }
              `}
            >
              {(plan.recommended || plan.badge) && (
                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl rounded-tr-xl text-xs font-bold text-white bg-${plan.color}-500`}>
                  {plan.badge || "RECOMENDADO"}
                </div>
              )}

              <h3 className={`text-xl font-bold mb-2 text-${plan.color === 'gray' ? 'gray-700' : `${plan.color}-600`}`}>
                {plan.name}
              </h3>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-gray-900">
                    {plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="text-xs font-bold text-gray-500 uppercase">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className={`text-${plan.color}-500 font-bold`}>✓</span> {feature}
                  </li>
                ))}
              </ul>

              <div className={`w-full py-3 rounded-xl text-center font-bold transition-colors ${isSelected ? `bg-${plan.color}-600 text-white` : "bg-gray-100 text-gray-600"}`}>
                {isSelected ? "Selecionado" : "Escolher este"}
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
            <input 
                type="text" 
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 transition" 
                value={userData.name} 
                onChange={e => setUserData({...userData, name: e.target.value})} 
                placeholder="Nome na Nota Fiscal" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CPF</label>
            <input 
                type="text" 
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 transition" 
                value={userData.cpf} 
                onChange={e => setUserData({...userData, cpf: e.target.value})} 
                placeholder="000.000.000-00" 
                maxLength={14} 
            />
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