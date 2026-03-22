import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabase";
import { useToast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

export default function Subscription() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const [userData, setUserData] = useState({ name: "", cpf: "", email: "" });
  const [cpfError, setCpfError] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("pro");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const realtimeChannelRef = useRef(null);

  const plans = {
    starter: {
      id: "starter",
      name: "Iniciante",
      price: 19.99,
      period: "/mês",
      features: ["30 orçamentos/mês", "PDF Padrão", "Suporte Básico"],
      color: "gray",
    },
    pro: {
      id: "pro",
      name: "Profissional",
      price: 29.99,
      period: "/mês",
      features: ["Orçamentos Ilimitados", "Todos os layouts de PDF", "Cadastro de Produtos", "Suporte Prioritário"],
      color: "blue",
      recommended: true,
    },
    annual: {
      id: "annual",
      name: "Anual PRO",
      price: 299.00,
      period: "/ano",
      features: ["Tudo do PRO", "2 Meses Grátis", "Pagamento Único"],
      color: "green",
      badge: "Economize R$ 60",
    },
  };

  const planStyles = {
    starter: { name: "bg-gray-500", text: "text-gray-700", border: "border-gray-500", badge: "bg-gray-500", check: "text-gray-500", btn: "bg-gray-500" },
    pro:     { name: "bg-blue-500", text: "text-blue-600", border: "border-blue-500", badge: "bg-blue-500", check: "text-blue-500", btn: "bg-blue-600" },
    annual:  { name: "bg-green-500", text: "text-green-600", border: "border-green-500", badge: "bg-green-500", check: "text-green-500", btn: "bg-green-600" },
  };

  const formatCPF = (v) =>
    v.replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .substr(0, 14);

  const validateCPF = (cpf) => {
    const cleaned = cpf.replace(/\D/g, "");
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleaned)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
    let r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== parseInt(cleaned[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
    r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === parseInt(cleaned[10]);
  };

  const selectedPlan = plans[selectedPlanId];

  // =========================================================
  // 1. INICIALIZAÇÃO + REALTIME (substitui polling)
  // =========================================================
  useEffect(() => {
    let userId = null;

    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setCheckingStatus(false); return; }

        userId = user.id;
        setUserData((prev) => ({
          ...prev,
          name: user.user_metadata?.full_name || "",
          email: user.email,
        }));

        // Busca assinatura existente
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .in("status", ["active", "canceling", "trialing"])
          .maybeSingle();

        if (subData) setSubscription(subData);
        setCheckingStatus(false);

        // Realtime: escuta INSERT/UPDATE na tabela subscriptions para este usuário
        realtimeChannelRef.current = supabase
          .channel(`sub-status-${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "subscriptions",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              const updated = payload.new;
              if (updated && ["active", "canceling", "trialing"].includes(updated.status)) {
                setSubscription(updated);
                if (updated.status === "active") {
                  toast.success("Pagamento confirmado! Bem-vindo ao plano " + (plans[updated.plan_type]?.name || updated.plan_type) + "!");
                }
              } else if (updated?.status === "canceled") {
                setSubscription(null);
              }
            }
          )
          .subscribe();
      } catch (error) {
        console.error(error);
        setCheckingStatus(false);
      }
    }

    init();

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  // =========================================================
  // 2. VALIDAÇÃO E MODAL
  // =========================================================
  const handleOpenPaymentModal = () => {
    if (!userData.name.trim()) {
      toast.error("Por favor, preencha seu nome completo.");
      return;
    }
    if (!userData.cpf) {
      setCpfError("Por favor, preencha seu CPF.");
      toast.error("Por favor, preencha seu CPF.");
      return;
    }
    if (!validateCPF(userData.cpf)) {
      setCpfError("CPF inválido. Verifique os dígitos e tente novamente.");
      toast.error("CPF inválido. Verifique os dígitos e tente novamente.");
      return;
    }
    setCpfError("");
    setShowPaymentModal(true);
  };

  // =========================================================
  // 3. PROCESSAMENTO DE PAGAMENTO (100% Asaas)
  // =========================================================
  const processPayment = async (paymentMethod) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");

      const payload = {
        email: userData.email,
        name: userData.name,
        cpf: userData.cpf,
        planId: selectedPlan.id,
        paymentMethod, // "CREDIT_CARD" ou "PIX"
      };

      const response = await fetch("/api/checkout-asaas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Erro Servidor:", text);
        throw new Error("Erro interno no servidor de pagamento. Tente novamente.");
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao processar pagamento");

      if (data.invoiceUrl) {
        window.location.href = data.invoiceUrl;
      } else {
        throw new Error("Link de pagamento não gerado. Tente novamente.");
      }
    } catch (error) {
      console.error(error);
      toast.error(`Ops! ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // 4. CANCELAMENTO
  // =========================================================
  const handleCancel = async () => {
    if (subscription?.status === "canceling") {
      toast.info("Seu cancelamento já está agendado. Você pode continuar usando até o fim do período.");
      return;
    }
    setConfirmCancel(true);
  };

  const confirmCancelSubscription = async () => {
    setConfirmCancel(false);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "Assinatura cancelada.");
        setSubscription((prev) => ({ ...prev, status: "canceling" }));
      } else {
        const err = await response.json();
        throw new Error(err.error || "Erro ao cancelar.");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // 5. RENDERIZAÇÃO
  // =========================================================
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Carregando plano...</p>
      </div>
    );
  }

  // CASO 1: JÁ É ASSINANTE
  if (subscription && !isUpgrading) {
    const planKey = ["starter", "pro", "annual"].includes(subscription.plan_type)
      ? subscription.plan_type
      : "starter";
    const currentPlanName = plans[planKey]?.name || subscription.plan_type;
    const isStarter = subscription.plan_type === "starter";

    return (
      <>
        <ConfirmModal
          open={confirmCancel}
          message="Tem certeza que deseja cancelar sua assinatura?"
          confirmLabel="Cancelar Assinatura"
          danger
          onConfirm={confirmCancelSubscription}
          onCancel={() => setConfirmCancel(false)}
        />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Minha Assinatura</h1>
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">Plano {currentPlanName}</h2>
                    {subscription.status === "canceling" ? (
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-orange-200">
                        Cancelamento Agendado
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">Gerenciado via Asaas</p>
                  {subscription.updated_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      Última atualização: {new Date(subscription.updated_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  {subscription.status === "canceling" && (
                    <p className="text-xs text-orange-600 mt-2 font-medium">
                      Seu acesso continua liberado até o fim do período atual.
                    </p>
                  )}
                </div>

                {isStarter && subscription.status !== "canceling" ? (
                  <button
                    onClick={() => { setIsUpgrading(true); setSelectedPlanId("pro"); }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg animate-pulse transform hover:scale-105 flex flex-col items-center"
                  >
                    <span>Fazer Upgrade para PRO</span>
                    <span className="text-xs font-normal opacity-90">Liberar tudo agora</span>
                  </button>
                ) : (
                  <div className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                    {subscription.status === "canceling" ? "Assinatura encerrada em breve." : "Você já tem o melhor plano!"}
                  </div>
                )}
              </div>

              <hr className="my-8 border-gray-100" />

              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                <span className="text-xs text-gray-400 font-mono">ID: {subscription.id?.slice(0, 8)}...</span>
                {subscription.status !== "canceling" && (
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    {loading ? "Processando..." : "Cancelar Assinatura"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // CASO 2: TELA DE VENDAS / UPGRADE
  return (
    <>
      <ConfirmModal
        open={confirmCancel}
        message="Tem certeza que deseja cancelar sua assinatura?"
        confirmLabel="Cancelar Assinatura"
        danger
        onConfirm={confirmCancelSubscription}
        onCancel={() => setConfirmCancel(false)}
      />

      <div className="max-w-7xl mx-auto py-12 px-4 relative">
        {/* MODAL DE PAGAMENTO */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              >✕</button>

              <h2 className="text-xl font-bold text-gray-800 mb-2">Forma de Pagamento</h2>
              <p className="text-gray-500 mb-6 text-sm">Escolha como deseja pagar sua assinatura.</p>

              <div className="space-y-3">
                <button
                  onClick={() => processPayment("CREDIT_CARD")}
                  disabled={loading}
                  className="w-full border-2 border-blue-600 bg-blue-50 hover:bg-blue-100 p-4 rounded-xl flex items-center justify-between transition"
                >
                  <div className="text-left">
                    <span className="block font-bold text-blue-700">Cartão de Crédito</span>
                    <span className="text-xs text-blue-500">Liberação imediata · Renovação automática</span>
                  </div>
                  <div className="text-2xl">💳</div>
                </button>

                <button
                  onClick={() => processPayment("PIX")}
                  disabled={loading}
                  className="w-full border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 p-4 rounded-xl flex items-center justify-between transition"
                >
                  <div className="text-left">
                    <span className="block font-bold text-gray-700">PIX</span>
                    <span className="text-xs text-gray-500">Pagamento instantâneo · QR Code gerado agora</span>
                  </div>
                  <div className="text-2xl">⚡</div>
                </button>
              </div>

              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center rounded-2xl z-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                  <p className="text-sm font-bold text-gray-700">Gerando cobrança segura...</p>
                </div>
              )}

              <p className="text-center text-xs text-gray-400 mt-6">
                🔒 Pagamento processado em ambiente seguro
              </p>
            </div>
          </div>
        )}

        {isUpgrading && (
          <button
            onClick={() => setIsUpgrading(false)}
            className="mb-6 flex items-center text-gray-500 hover:text-gray-800 transition font-medium"
          >
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
            if (isUpgrading && plan.id === "starter") return null;
            const isSelected = selectedPlanId === plan.id;
            const styles = planStyles[plan.id];

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative p-8 rounded-2xl cursor-pointer transition-all duration-300 border-2 flex flex-col
                  ${isSelected
                    ? `${styles.border} bg-white shadow-xl transform scale-105 z-10`
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                  }`}
              >
                {(plan.recommended || plan.badge) && (
                  <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl rounded-tr-xl text-xs font-bold text-white ${styles.badge}`}>
                    {plan.badge || "RECOMENDADO"}
                  </div>
                )}
                <h3 className={`text-xl font-bold mb-2 ${styles.text}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {plan.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                  <span className="text-xs font-bold text-gray-500 uppercase">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                      <span className={`${styles.check} font-bold`}>✓</span> {feature}
                    </li>
                  ))}
                </ul>
                <div className={`w-full py-3 rounded-xl text-center font-bold transition-colors ${isSelected ? `${styles.btn} text-white` : "bg-gray-100 text-gray-600"}`}>
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
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                placeholder="Nome na Nota Fiscal"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CPF</label>
              <input
                type="text"
                className={`w-full border rounded-lg p-3 outline-none focus:border-blue-500 transition ${cpfError ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                value={userData.cpf}
                onChange={(e) => {
                  setCpfError("");
                  setUserData({ ...userData, cpf: formatCPF(e.target.value) });
                }}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {cpfError && <p className="text-red-500 text-xs mt-1 font-medium">{cpfError}</p>}
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
    </>
  );
}
