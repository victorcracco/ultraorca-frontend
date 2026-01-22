import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBudgets, deleteBudget } from "../services/budgetService";
import { supabase } from "../services/supabase";

// Import do driver.js
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function Dashboard() {
  const [empresa, setEmpresa] = useState("Visitante");
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- NOVO: ESTADO PARA SELEÇÃO EM MASSA ---
  const [selectedIds, setSelectedIds] = useState([]);
  
  const navigate = useNavigate();

  // --- TUTORIAL (Mantido igual) ---
  const startTutorial = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Próximo →',
      prevBtnText: '← Anterior',
      doneBtnText: 'Entendi!',
      steps: [
        { element: '#welcome-card', popover: { title: 'Painel Principal 🚀', description: 'Aqui você tem uma visão geral do seu negócio.' } },
        { element: '#btn-new-budget', popover: { title: 'Criar Orçamento', description: 'Comece aqui! Crie propostas profissionais em segundos.' } },
        { element: '#btn-products', popover: { title: 'Seus Produtos', description: 'Cadastre seus serviços recorrentes para ganhar tempo.' } },
        { element: '#btn-subscription', popover: { title: 'Sua Assinatura', description: 'Gerencie seu plano, faça upgrades ou veja suas faturas.' } },
        { element: '#budget-list', popover: { title: 'Histórico', description: 'Todos os seus orçamentos salvos ficam aqui para consulta ou edição.' } }
      ],
      onDestroyStarted: () => {
        localStorage.setItem("tutorial_v1_completed", "true");
        driverObj.destroy();
      },
    });
    driverObj.drive();
  };

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("tutorial_v1_completed");
    if (!hasSeenTutorial) setTimeout(() => startTutorial(), 1000);
  }, []);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('company_name').eq('id', user.id).single();
        if (profile?.company_name) setEmpresa(profile.company_name);
        else setEmpresa(user.user_metadata.full_name || user.email.split("@")[0]);
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

  // --- LÓGICA DE SELEÇÃO ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Seleciona todos os visíveis no filtro atual
      const allIds = filteredBudgets.map(b => b.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // --- EXCLUSÃO INDIVIDUAL ---
  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja excluir este orçamento?")) {
      try {
        await deleteBudget(id);
        setBudgets(budgets.filter((b) => b.id !== id));
        // Remove da seleção se estiver lá
        setSelectedIds(selectedIds.filter(itemId => itemId !== id));
      } catch (error) {
        alert("Erro ao excluir.");
      }
    }
  };

  // --- EXCLUSÃO EM MASSA ---
  const handleBulkDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.length} orçamentos selecionados? Essa ação não pode ser desfeita.`)) return;

    setLoading(true);
    try {
      // Deleta um por um (ou você poderia criar uma função no service que aceita array)
      await Promise.all(selectedIds.map(id => deleteBudget(id)));
      
      // Atualiza a lista local removendo os deletados
      setBudgets(budgets.filter(b => !selectedIds.includes(b.id)));
      setSelectedIds([]); // Limpa seleção
      alert("Orçamentos excluídos com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir alguns itens.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/app/new-budget?id=${id}`);
  };

  const filteredBudgets = budgets.filter((b) => {
    const term = searchTerm.toLowerCase();
    const clientMatch = b.client_name?.toLowerCase().includes(term);
    const idMatch = String(b.display_id || "").includes(term);
    return clientMatch || idMatch;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 pb-24">
      
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

      {/* BARRA DE AÇÃO EM MASSA FLUTUANTE */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-6 z-50 animate-bounce-in">
            <div className="font-bold flex items-center gap-2">
                <span className="bg-white text-gray-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    {selectedIds.length}
                </span>
                Selecionados
            </div>
            <div className="h-6 w-px bg-gray-700"></div>
            <button 
                onClick={handleBulkDelete}
                className="text-red-400 hover:text-red-300 font-bold flex items-center gap-2 transition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Excluir Todos
            </button>
            <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-white">Cancelar</button>
        </div>
      )}

      {/* LISTA DE ORÇAMENTOS */}
      <div id="budget-list" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-3">
             <h2 className="text-lg font-bold text-gray-800">Histórico de Orçamentos</h2>
             <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{filteredBudgets.length}</span>
          </div>

          <div className="relative w-full md:w-72">
             <input 
               type="text"
               placeholder="Buscar cliente ou número..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-700"
             />
             <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>
        
        {loading ? (
           <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : budgets.length === 0 ? (
          <div className="p-16 text-center text-gray-400 flex flex-col items-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
               <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <p className="text-lg text-gray-600">Você ainda não criou nenhum orçamento.</p>
            <Link to="/app/new-budget" className="text-blue-600 font-semibold mt-2 hover:underline">Criar o primeiro agora</Link>
          </div>
        ) : filteredBudgets.length === 0 ? (
           <div className="p-12 text-center text-gray-400">
               <p>Nenhum orçamento encontrado para "{searchTerm}".</p>
               <button onClick={() => setSearchTerm("")} className="text-blue-600 text-sm font-semibold mt-2 hover:underline">Limpar busca</button>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                <tr>
                  {/* CHECKBOX SELECIONAR TUDO */}
                  <th className="p-4 pl-6 w-10">
                    <input 
                        type="checkbox" 
                        className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                        onChange={handleSelectAll}
                        checked={filteredBudgets.length > 0 && selectedIds.length === filteredBudgets.length}
                    />
                  </th>
                  <th className="p-4 w-24">#</th> 
                  <th className="p-4">Cliente</th>
                  <th className="p-4 text-right">Valor Total</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBudgets.map((b) => (
                  <tr key={b.id} className={`hover:bg-gray-50 transition group ${selectedIds.includes(b.id) ? 'bg-blue-50' : ''}`}>
                    {/* CHECKBOX INDIVIDUAL */}
                    <td className="p-4 pl-6">
                        <input 
                            type="checkbox" 
                            className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                            checked={selectedIds.includes(b.id)}
                            onChange={() => handleSelectOne(b.id)}
                        />
                    </td>
                    <td className="p-4 font-mono text-gray-500 font-bold">{b.display_id || "-"}</td>
                    <td className="p-4 font-medium text-gray-800">{b.client_name}</td>
                    <td className="p-4 text-right font-bold text-gray-800">
                      {Number(b.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button onClick={() => handleEdit(b.id)} className="text-blue-600 hover:underline text-sm font-medium">Editar</button>
                      <button onClick={() => handleDelete(b.id)} className="text-red-500 hover:underline text-sm font-medium">Excluir</button>
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