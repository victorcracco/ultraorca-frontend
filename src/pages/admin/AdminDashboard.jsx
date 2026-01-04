import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "../../services/supabase";
import { useNavigate } from "react-router-dom";

// ⚠️ IMPORTANTE: Coloque aqui o SEU email de admin para bloquear intrusos
const ADMIN_EMAILS = ["victorcracco@gmail.com", "admin@ultraorca.com"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalBudgets: 0,
    activeSubs: 0,
    totalSubs: 0,
    revenue: 0,
  });

  const [recentSubs, setRecentSubs] = useState([]);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        // 1. Verificação de Segurança (Client-Side)
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user || !ADMIN_EMAILS.includes(user.email)) {
          alert("Acesso negado. Área restrita.");
          navigate("/app");
          return;
        }

        // 2. Buscar Contagem de Orçamentos
        const { count: budgetCount } = await supabase
          .from('budgets')
          .select('*', { count: 'exact', head: true });

        // 3. Buscar Assinaturas (Todas)
        const { data: subsData } = await supabase
          .from('subscriptions')
          .select('*')
          .order('updated_at', { ascending: false });

        // 4. Processar Métricas
        const activeSubs = subsData.filter(s => s.status === 'active');
        
        // Calcular Receita Estimada (Baseado nos planos ativos)
        const revenue = activeSubs.reduce((acc, sub) => {
          if (sub.plan_type === 'annual') return acc + 199.99;
          if (sub.plan_type === 'monthly') return acc + 19.99;
          return acc;
        }, 0);

        setStats({
          totalBudgets: budgetCount || 0,
          activeSubs: activeSubs.length,
          totalSubs: subsData.length,
          revenue: revenue
        });

        setRecentSubs(subsData.slice(0, 10)); // Pegar as 10 últimas

      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
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
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
          Modo Admin
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Assinaturas Totais" 
          value={stats.totalSubs} 
          color="bg-blue-600" 
          icon="👥"
        />
        <StatCard 
          title="Assinantes Ativos" 
          value={stats.activeSubs} 
          color="bg-green-600" 
          icon="💎"
        />
        <StatCard 
          title="Orçamentos Criados" 
          value={stats.totalBudgets} 
          color="bg-purple-600" 
          icon="📄"
        />
        <StatCard 
          title="Receita Estimada" 
          value={stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          color="bg-gray-800" 
          icon="💰"
          obs="(Baseado em ativos)"
        />
      </div>

      {/* Lista Recente */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-bold text-gray-700">Últimas Movimentações de Assinatura</h2>
          <button onClick={() => window.location.reload()} className="text-blue-600 text-sm hover:underline">
            Atualizar
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="p-4">User ID</th>
                <th className="p-4">Customer ID (Asaas)</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Status</th>
                <th className="p-4">Última Atualização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSubs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    Nenhuma assinatura encontrada.
                  </td>
                </tr>
              ) : (
                recentSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-mono text-xs text-gray-600" title={sub.user_id}>
                      {sub.user_id.slice(0, 8)}...
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-500">
                      {sub.customer_id || "-"}
                    </td>
                    <td className="p-4 capitalize font-medium">
                      {sub.plan_type === 'annual' ? 'Anual' : 'Mensal'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                        sub.status === 'active' ? 'bg-green-100 text-green-700' : 
                        sub.status === 'canceled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {new Date(sub.updated_at).toLocaleDateString('pt-BR')} <span className="text-xs">{new Date(sub.updated_at).toLocaleTimeString('pt-BR')}</span>
                    </td>
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
    <div className={`${color} text-white p-6 rounded-xl shadow-lg relative overflow-hidden group`}>
      <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:opacity-20 transition select-none">
        {icon}
      </div>
      <p className="text-white text-opacity-80 text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
      {obs && <p className="text-xs text-white text-opacity-50 mt-1">{obs}</p>}
    </div>
  );
}