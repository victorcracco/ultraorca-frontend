import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getBudgets, deleteBudget } from "../services/budgetService";
import { supabase } from "../services/supabase";
import { useToast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import Confetti from "react-confetti";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function Dashboard() {
  const toast = useToast();
  const [empresa, setEmpresa] = useState("Visitante");
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, bulk }
  const [searchParams] = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();

  // Confete pós-pagamento
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 8000);
      window.history.replaceState({}, document.title, "/app");
    }
  }, [searchParams]);

  // Tutorial
  const startTutorial = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: "Próximo →",
      prevBtnText: "← Anterior",
      doneBtnText: "Entendi!",
      steps: [
        { element: "#welcome-card", popover: { title: "Painel Principal", description: "Aqui você tem uma visão geral do seu negócio." } },
        { element: "#btn-new-budget", popover: { title: "Criar Orçamento", description: "Crie propostas profissionais em segundos." } },
        { element: "#stats-cards", popover: { title: "Suas Métricas", description: "Acompanhe o volume e valor dos seus orçamentos." } },
        { element: "#budget-list", popover: { title: "Histórico", description: "Todos os seus orçamentos salvos ficam aqui." } },
      ],
      onDestroyStarted: () => {
        localStorage.setItem("tutorial_v1_completed", "true");
        driverObj.destroy();
      },
    });
    driverObj.drive();
  };

  useEffect(() => {
    if (!localStorage.getItem("tutorial_v1_completed")) setTimeout(() => startTutorial(), 1000);
  }, []);

  // Carregamento
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("company_name").eq("id", user.id).single();
        setEmpresa(profile?.company_name || user.user_metadata?.full_name || user.email.split("@")[0]);
      }
      await fetchBudgets();
    }
    loadData();
  }, []);

  async function fetchBudgets() {
    setLoading(true);
    const data = await getBudgets();
    setBudgets(data);
    setLoading(false);
  }

  // Métricas calculadas a partir dos dados já carregados
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const budgetsThisMonth = budgets.filter((b) => new Date(b.created_at) >= startOfMonth);
  const totalValue = budgets.reduce((acc, b) => acc + Number(b.total || 0), 0);
  const totalValueMonth = budgetsThisMonth.reduce((acc, b) => acc + Number(b.total || 0), 0);

  // Exclusão
  const handleDelete = (id) => setConfirmDelete({ id, bulk: false });

  const executeDelete = async () => {
    const { id } = confirmDelete;
    setConfirmDelete(null);
    setLoading(true);
    try {
      await deleteBudget(id);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      toast.success("Orçamento excluído.");
    } catch {
      toast.error("Erro ao excluir.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => navigate(`/app/new-budget?id=${id}`);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 pb-24">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      <ConfirmModal
        open={!!confirmDelete}
        message={
          confirmDelete?.bulk
            ? `Excluir ${confirmDelete?.ids?.length} orçamentos selecionados?`
            : "Excluir este orçamento?"
        }
        confirmLabel="Excluir"
        danger
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* CARD DE BOAS VINDAS */}
      <div id="welcome-card" className="relative bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Olá, {empresa}!</h1>
          <p className="text-blue-100 text-lg">Gerencie seu negócio com profissionalismo.</p>
        </div>
      </div>

      {/* GRADE DE AÇÕES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Link id="btn-new-budget" to="/app/new-budget" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all flex flex-col items-center text-center group">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          </div>
          <h3 className="font-bold text-gray-800">Novo Orçamento</h3>
        </Link>
        <Link id="btn-products" to="/app/products" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all flex flex-col items-center text-center group">
          <div className="p-3 bg-green-100 text-green-600 rounded-full mb-3 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <h3 className="font-bold text-gray-800">Meus Produtos</h3>
        </Link>
        <Link id="btn-my-data" to="/app/my-data" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all flex flex-col items-center text-center group">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h3 className="font-bold text-gray-800">Minha Empresa</h3>
        </Link>
        <Link id="btn-subscription" to="/app/subscription" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-pink-200 transition-all flex flex-col items-center text-center group">
          <div className="p-3 bg-pink-100 text-pink-600 rounded-full mb-3 group-hover:bg-pink-600 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </div>
          <h3 className="font-bold text-gray-800">Assinatura</h3>
        </Link>
        <button onClick={startTutorial} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-yellow-200 transition-all flex flex-col items-center text-center group cursor-pointer">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full mb-3 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <h3 className="font-bold text-gray-800">Ajuda / Tutorial</h3>
        </button>
      </div>

      {/* CARDS DE MÉTRICAS */}
      {!loading && budgets.length > 0 && (
        <div id="stats-cards" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total de Orçamentos"
            value={budgets.length}
            icon="📄"
            color="blue"
          />
          <StatCard
            label="Este Mês"
            value={budgetsThisMonth.length}
            icon="📅"
            color="purple"
          />
          <StatCard
            label="Valor Total"
            value={totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            icon="💰"
            color="green"
            small
          />
          <StatCard
            label="Valor Este Mês"
            value={totalValueMonth.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            icon="📈"
            color="orange"
            small
          />
        </div>
      )}

      {/* RECENTES */}
      <div id="budget-list" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-800">Orçamentos Recentes</h2>
          <Link to="/app/budgets" className="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1">
            Ver todos
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
          </div>
        ) : budgets.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-3">
            <div className="text-4xl">📄</div>
            <p className="text-gray-600 font-medium">Nenhum orçamento ainda.</p>
            <Link to="/app/new-budget" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
              Criar o primeiro agora
            </Link>
          </div>
        ) : (
          <div>
            {budgets.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                    #{b.display_id || "—"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{b.client_name}</p>
                    <p className="text-xs text-gray-400">{new Date(b.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {b.status === "accepted" && (
                    <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full hidden sm:inline">✓ Aceito</span>
                  )}
                  <span className="font-bold text-gray-800 text-sm">
                    {Number(b.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                  <button onClick={() => handleEdit(b.id)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold transition">
                    Editar
                  </button>
                </div>
              </div>
            ))}
            {budgets.length > 5 && (
              <div className="p-4 text-center">
                <Link to="/app/budgets" className="text-sm text-blue-600 font-semibold hover:underline">
                  Ver todos os {budgets.length} orçamentos →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, small }) {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
    green: "bg-green-50 border-green-100 text-green-700",
    orange: "bg-orange-50 border-orange-100 text-orange-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className={`font-bold ${small ? "text-lg" : "text-2xl"}`}>{value}</p>
    </div>
  );
}
