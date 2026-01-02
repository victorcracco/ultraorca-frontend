import React from "react";
import { Helmet } from "react-helmet-async";

export default function AdminDashboard() {
  // Dados simulados (Futuramente virão do Supabase)
  const stats = {
    totalUsers: 124,
    activeSubs: 45,
    totalBudgets: 890,
    revenue: 12450.00
  };

  const recentUsers = [
    { id: 1, name: "João Silva", email: "joao@gmail.com", plan: "Free", date: "Hoje" },
    { id: 2, name: "Maria Elétrica", email: "maria@hotmail.com", plan: "Anual", date: "Ontem" },
    { id: 3, name: "Pedro Reformas", email: "pedro@uol.com.br", plan: "Mensal", date: "Ontem" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Helmet>
        <title>Admin | UltraOrça</title>
      </Helmet>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Painel Administrativo</h1>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Usuários Totais" value={stats.totalUsers} color="bg-blue-500" />
        <StatCard title="Assinantes Ativos" value={stats.activeSubs} color="bg-green-500" />
        <StatCard title="Orçamentos Gerados" value={stats.totalBudgets} color="bg-purple-500" />
        <StatCard title="Receita (Mês)" value={`R$ ${stats.revenue}`} color="bg-gray-800" />
      </div>

      {/* Lista Recente */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-bold text-gray-700">Últimos Cadastros</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">Email</th>
              <th className="p-4">Plano</th>
              <th className="p-4">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{u.name}</td>
                <td className="p-4 text-gray-500">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    u.plan === 'Free' ? 'bg-gray-100 text-gray-600' : 
                    u.plan === 'Anual' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {u.plan}
                  </span>
                </td>
                <td className="p-4 text-gray-400">{u.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`${color} text-white p-6 rounded-xl shadow-lg`}>
      <p className="text-blue-100 text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}