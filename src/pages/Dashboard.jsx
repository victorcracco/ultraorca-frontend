import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBudgets, deleteBudget } from "../services/budgetService";
import { supabase } from "../services/supabase";

export default function Dashboard() {
  const [empresa, setEmpresa] = useState("Visitante");
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Novo estado para a busca
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      // 1. Carregar nome do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_name')
          .eq('id', user.id)
          .single();
          
        if (profile?.company_name) {
          setEmpresa(profile.company_name);
        } else {
          setEmpresa(user.user_metadata.full_name || user.email.split("@")[0]);
        }
      }

      // 2. Carregar Orçamentos
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

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja excluir este orçamento?")) {
      try {
        await deleteBudget(id);
        setBudgets(budgets.filter((b) => b.id !== id));
      } catch (error) {
        alert("Erro ao excluir.");
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/app/new-budget?id=${id}`);
  };

  // --- LÓGICA DE FILTRO ---
  // Filtra por Nome do Cliente OU pelo ID (convertido para texto)
  const filteredBudgets = budgets.filter((b) => {
    const term = searchTerm.toLowerCase();
    const clientMatch = b.client_name?.toLowerCase().includes(term);
    const idMatch = String(b.display_id || "").includes(term);
    return clientMatch || idMatch;
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Olá, {empresa}!</h1>
        <p className="text-blue-100 text-lg">
          Bem-vindo ao seu painel de controle.
        </p>
      </div>

      {/* Atalhos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/app/new-budget" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col items-start group">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Novo Orçamento</h3>
        </Link>
        
        <Link to="/app/products" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col items-start group">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Meus Produtos</h3>
        </Link>

        <Link to="/app/my-data" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col items-start group">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Dados da Empresa</h3>
        </Link>
      </div>

      {/* Lista de Histórico */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Header da Tabela com Busca */}
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-3">
             <h2 className="text-lg font-bold text-gray-800">Histórico de Orçamentos</h2>
             <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{filteredBudgets.length}</span>
          </div>

          {/* BARRA DE PESQUISA */}
          <div className="relative w-full md:w-64">
             <input 
                type="text"
                placeholder="Buscar cliente ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
             />
             <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>
        
        {loading ? (
           <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-400 text-sm mt-4 font-medium animate-pulse">Carregando seus orçamentos...</p>
           </div>
        ) : budgets.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
               <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <p>Você ainda não criou nenhum orçamento.</p>
            <Link to="/app/new-budget" className="text-blue-600 font-semibold mt-2 hover:underline">Criar o primeiro agora</Link>
          </div>
        ) : filteredBudgets.length === 0 ? (
            // Caso a busca não encontre nada
            <div className="p-12 text-center text-gray-400">
                <p>Nenhum orçamento encontrado para "{searchTerm}".</p>
                <button onClick={() => setSearchTerm("")} className="text-blue-600 text-sm font-semibold mt-2 hover:underline">Limpar busca</button>
            </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                <tr>
                  {/* COLUNA ID ANTES DO NOME */}
                  <th className="p-4 pl-6 w-20">#</th> 
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Data</th>
                  <th className="p-4 text-right">Valor Total</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBudgets.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors group">
                    {/* Exibe o ID (ou - se não tiver) */}
                    <td className="p-4 pl-6 font-mono text-gray-500 font-bold">
                        {b.display_id ? `#${b.display_id}` : "-"}
                    </td>
                    
                    <td className="p-4 font-medium text-gray-800">{b.client_name}</td>
                    
                    <td className="p-4 text-gray-600 text-sm">
                      {new Date(b.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    
                    <td className="p-4 text-right font-bold text-gray-800">
                      {Number(b.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => handleEdit(b.id)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded text-sm font-semibold transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded text-sm font-semibold transition"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}