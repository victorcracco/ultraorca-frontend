import React, { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "../../services/supabase";

// C6 FIX: Preços reais por plan_type (correspondendo ao que é salvo no banco)
const PLAN_PRICES = {
  starter: 19.99,
  pro: 29.99,
  annual: 299.0,
};

// M5 FIX: formatDate com proteção contra valores inválidos
const formatDate = (date, fallback = "—") => {
  if (!date) return fallback;
  try {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
  } catch {
    return fallback;
  }
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBudgets: 0,
    activeSubs: 0,
    totalSubs: 0,
    revenue: 0,
  });
  const [recentSubs, setRecentSubs] = useState([]);

  // P1 FIX: fetchAdminData extraída do useEffect para poder ser chamada pelo botão Atualizar
  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const { count: budgetCount } = await supabase
        .from("budgets")
        .select("*", { count: "exact", head: true });

      const { data: subsData, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const activeSubs = subsData.filter((s) => s.status === "active");

      // C6 FIX: usa PLAN_PRICES com plan_type corretos do banco (starter/pro/annual)
      const revenue = activeSubs.reduce(
        (acc, sub) => acc + (PLAN_PRICES[sub.plan_type] || 0),
        0
      );

      setStats({
        totalBudgets: budgetCount || 0,
        activeSubs: activeSubs.length,
        totalSubs: subsData.length,
        revenue,
      });

      setRecentSubs(subsData.slice(0, 10));
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)] text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Helmet>
        <title>Admin | UltraOrça</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
        <div className="text-sm text-blue-800 bg-blue-100 px-3 py-1 rounded-full border border-blue-200 font-semibold">
          🛡️ Acesso Seguro
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Assinaturas Totais" value={stats.totalSubs} color="bg-blue-600" icon="👥" />
        <StatCard title="Assinantes Ativos" value={stats.activeSubs} color="bg-green-600" icon="💎" />
        <StatCard title="Orçamentos Globais" value={stats.totalBudgets} color="bg-purple-600" icon="📄" />
        <StatCard
          title="Receita Estimada"
          value={stats.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          color="bg-gray-800"
          icon="💰"
          obs="(Assinantes ativos)"
        />
      </div>

      {/* Tabela de Assinaturas Recentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-bold text-gray-700">Últimas Assinaturas / Pagamentos</h2>
          {/* P1 FIX: chama fetchAdminData diretamente em vez de recarregar a página */}
          <button
            onClick={fetchAdminData}
            className="text-blue-600 text-sm hover:underline font-medium"
          >
            ↻ Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="p-4">User ID</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Status</th>
                <th className="p-4">Atualizado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSubs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-400">
                    Nenhuma assinatura encontrada.
                  </td>
                </tr>
              ) : (
                recentSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-mono text-xs text-gray-500">
                      {sub.user_id?.slice(0, 8)}…
                    </td>
                    <td className="p-4 capitalize font-medium">
                      {sub.plan_type === "annual"
                        ? "Anual"
                        : sub.plan_type === "pro"
                          ? "Pro"
                          : "Starter"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${sub.status === "active"
                            ? "bg-green-100 text-green-700"
                            : sub.status === "canceled"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    {/* M5 FIX: formatDate com proteção contra null */}
                    <td className="p-4 text-gray-400">{formatDate(sub.updated_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, icon, obs }) {
  return (
    <div
      className={`${color} text-white p-6 rounded-xl shadow-lg relative overflow-hidden group transition-transform hover:scale-[1.02]`}
    >
      <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:opacity-20 transition select-none">
        {icon}
      </div>
      <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
      {obs && <p className="text-xs text-white/50 mt-1">{obs}</p>}
    </div>
  );
}