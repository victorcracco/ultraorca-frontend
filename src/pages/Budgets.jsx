import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBudgets, deleteBudget, toggleBudgetPublic, updateBudgetStatus, duplicateBudget, getUserPlan } from "../services/budgetService";
import { useToast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

export default function Budgets() {
  const toast = useToast();
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sortBy, setSortBy] = useState("date_desc");
  const [viewBudget, setViewBudget] = useState(null); // modal de detalhes
  const [copiedId, setCopiedId] = useState(null); // feedback inline do botão compartilhar
  const [plan, setPlan] = useState("free");
  const [statusDropdown, setStatusDropdown] = useState(null); // id do orçamento com dropdown aberto
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    fetchBudgets();
    getUserPlan().then(setPlan);
  }, []);

  // Fecha dropdown de status ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchBudgets() {
    setLoading(true);
    const data = await getBudgets();
    setBudgets(data);
    setLoading(false);
  }

  const STATUS_OPTIONS = [
    { value: null, label: "Pendente", color: "text-gray-500 bg-gray-100" },
    { value: "accepted", label: "✓ Aceito", color: "text-green-700 bg-green-100" },
    { value: "rejected", label: "✗ Recusado", color: "text-red-700 bg-red-100" },
    { value: "in_negotiation", label: "↔ Em Negociação", color: "text-yellow-700 bg-yellow-100" },
  ];

  const getStatusStyle = (status) => {
    if (status === "accepted") return "text-green-700 bg-green-100";
    if (status === "rejected") return "text-red-700 bg-red-100";
    if (status === "in_negotiation") return "text-yellow-700 bg-yellow-100";
    return "text-gray-400 bg-gray-100";
  };

  const getStatusLabel = (status) => {
    if (status === "accepted") return "✓ Aceito";
    if (status === "rejected") return "✗ Recusado";
    if (status === "in_negotiation") return "↔ Em Negociação";
    return "Pendente";
  };

  const handleStatusChange = async (budgetId, newStatus) => {
    setStatusDropdown(null);
    try {
      await updateBudgetStatus(budgetId, newStatus);
      setBudgets((prev) => prev.map((b) => b.id === budgetId ? { ...b, status: newStatus } : b));
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleDuplicate = async (budget) => {
    try {
      const newBudget = await duplicateBudget(budget.id);
      setBudgets((prev) => [newBudget, ...prev]);
      toast.success("Orçamento duplicado com sucesso!");
    } catch {
      toast.error("Não foi possível duplicar o orçamento.");
    }
  };

  const filteredBudgets = budgets
    .filter((b) => {
      const term = searchTerm.toLowerCase().replace(/^#/, "");
      return (
        b.client_name?.toLowerCase().includes(term) ||
        String(b.display_id || "").includes(term)
      );
    })
    .sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "date_asc") return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "value_desc") return Number(b.total) - Number(a.total);
      if (sortBy === "value_asc") return Number(a.total) - Number(b.total);
      if (sortBy === "client") return (a.client_name || "").localeCompare(b.client_name || "");
      return 0;
    });

  const handleSelectAll = (e) =>
    setSelectedIds(e.target.checked ? filteredBudgets.map((b) => b.id) : []);

  const handleSelectOne = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleDelete = (id) => setConfirmDelete({ id, bulk: false });
  const handleBulkDelete = () => setConfirmDelete({ ids: selectedIds, bulk: true });

  const executeDelete = async () => {
    const { id, ids, bulk } = confirmDelete;
    setConfirmDelete(null);
    setLoading(true);
    try {
      if (bulk) {
        await Promise.all(ids.map((i) => deleteBudget(i)));
        setBudgets((prev) => prev.filter((b) => !ids.includes(b.id)));
        setSelectedIds([]);
        toast.success(`${ids.length} orçamentos excluídos.`);
      } else {
        await deleteBudget(id);
        setBudgets((prev) => prev.filter((b) => b.id !== id));
        setSelectedIds((prev) => prev.filter((x) => x !== id));
        toast.success("Orçamento excluído.");
      }
    } catch {
      toast.error("Erro ao excluir.");
    } finally {
      setLoading(false);
    }
  };

  const ensurePublicLink = async (budget) => {
    if (plan === "free") {
      toast.warning("Link público é uma funcionalidade PRO. Faça upgrade para compartilhar orçamentos com seus clientes.");
      return null;
    }
    if (!budget.is_public) {
      try {
        await toggleBudgetPublic(budget.id, true);
        setBudgets((prev) =>
          prev.map((b) => (b.id === budget.id ? { ...b, is_public: true } : b))
        );
      } catch {
        toast.error("Não foi possível gerar o link.");
        return null;
      }
    }
    return `${window.location.origin}/orcamento/${budget.id}`;
  };

  const handleShareLink = async (budget) => {
    const link = await ensurePublicLink(budget);
    if (!link) return;
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(link);
    } catch (e) {}
    toast.success("Link copiado! Compartilhe com seu cliente.");
    setCopiedId(budget.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleWhatsAppShare = async (budget) => {
    const link = await ensurePublicLink(budget);
    if (!link) return;
    const text = `Olá, ${budget.client_name}! Segue o orçamento *#${budget.display_id}* para sua análise.\n\nSe desejar aceitar esta proposta, clique no link abaixo:\n${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const totalValue = filteredBudgets.reduce((acc, b) => acc + Number(b.total || 0), 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const acceptedLast30 = budgets.filter((b) => b.status === "accepted" && new Date(b.created_at) >= thirtyDaysAgo);
  const acceptedLast30Value = acceptedLast30.reduce((acc, b) => acc + Number(b.total || 0), 0);
  const rejectedLast30 = budgets.filter((b) => b.status === "rejected" && new Date(b.created_at) >= thirtyDaysAgo);
  const rejectedLast30Value = rejectedLast30.reduce((acc, b) => acc + Number(b.total || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-6 pb-24 space-y-6">
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

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Meus Orçamentos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? "Carregando..." : `${budgets.length} orçamento${budgets.length !== 1 ? "s" : ""} no total`}
          </p>
        </div>
        <Link
          to="/app/new-budget"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl shadow transition active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo Orçamento
        </Link>
      </div>

      {/* Filtros e busca */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-grow w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar por cliente ou número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="py-2.5 px-3 bg-gray-50 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
        >
          <option value="date_desc">Mais recentes</option>
          <option value="date_asc">Mais antigos</option>
          <option value="value_desc">Maior valor</option>
          <option value="value_asc">Menor valor</option>
          <option value="client">Cliente (A-Z)</option>
        </select>

        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold px-4 py-2.5 rounded-xl text-sm transition whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Excluir {selectedIds.length} selecionados
          </button>
        )}
      </div>

      {/* Resumo financeiro */}
      {!loading && filteredBudgets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs text-blue-600 font-medium mb-1">Exibindo</p>
            <p className="text-2xl font-bold text-blue-700">{filteredBudgets.length}</p>
            <p className="text-xs text-blue-400">orçamentos</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <p className="text-xs text-green-600 font-medium mb-1">Valor Total</p>
            <p className="text-xl font-bold text-green-700">
              {totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            <p className="text-xs text-green-400">dos resultados</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
            <p className="text-xs text-purple-600 font-medium mb-1">Ticket Médio</p>
            <p className="text-xl font-bold text-purple-700">
              {filteredBudgets.length > 0
                ? (totalValue / filteredBudgets.length).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                : "R$ 0,00"}
            </p>
            <p className="text-xs text-purple-400">por orçamento</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <p className="text-xs text-emerald-600 font-medium mb-1">✓ Aceitos (30d)</p>
            <p className="text-lg font-bold text-emerald-700">
              {acceptedLast30Value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            <p className="text-xs text-emerald-500 mt-0.5">{acceptedLast30.length} orçamento{acceptedLast30.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-xs text-red-600 font-medium mb-1">✗ Recusados (30d)</p>
            <p className="text-lg font-bold text-red-700">
              {rejectedLast30Value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            <p className="text-xs text-red-500 mt-0.5">{rejectedLast30.length} orçamento{rejectedLast30.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : budgets.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="bg-gray-50 p-5 rounded-full mb-4">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-gray-700 mb-2">Nenhum orçamento ainda</p>
            <p className="text-gray-400 text-sm mb-6">Crie seu primeiro orçamento e ele aparecerá aqui.</p>
            <Link to="/app/new-budget" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition">
              Criar agora
            </Link>
          </div>
        ) : filteredBudgets.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg">Nenhum resultado para "{searchTerm}"</p>
            <button onClick={() => setSearchTerm("")} className="text-blue-600 text-sm font-semibold mt-3 hover:underline">
              Limpar busca
            </button>
          </div>
        ) : (
          <>
            {/* ===== CARDS MOBILE (visível apenas em telas < md) ===== */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredBudgets.map((b) => (
                <div key={b.id} className={`p-4 ${selectedIds.includes(b.id) ? "bg-blue-50" : "bg-white"}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 w-4 h-4 cursor-pointer shrink-0"
                        checked={selectedIds.includes(b.id)}
                        onChange={() => handleSelectOne(b.id)}
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 truncate">{b.client_name}</p>
                        <p className="text-xs text-gray-400 font-mono">#{b.display_id || "—"} · {new Date(b.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-800 text-base shrink-0">
                      {Number(b.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>

                  <div className="mb-3">
                    {statusDropdown === b.id ? (
                      <div className="flex flex-wrap gap-1.5">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value ?? "null"}
                            onClick={() => handleStatusChange(b.id, opt.value)}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-full border-2 transition ${
                              (b.status === opt.value || (!b.status && !opt.value))
                                ? `${opt.color} border-current`
                                : `${opt.color} border-transparent opacity-60`
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                        <button
                          onClick={() => setStatusDropdown(null)}
                          className="text-xs text-gray-400 px-2 py-1.5 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setStatusDropdown(b.id)}
                          className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusStyle(b.status)}`}
                        >
                          {getStatusLabel(b.status)} ▾
                        </button>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                          {b.validity_days || 15} dias
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botões de ação — mínimo 44px para facilitar toque */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setViewBudget(b)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-xs font-semibold"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver
                    </button>
                    <button
                      onClick={() => navigate(`/app/new-budget?id=${b.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-xs font-semibold"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => handleWhatsAppShare(b)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition text-xs font-semibold"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="flex items-center justify-center p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ===== TABELA DESKTOP (visível apenas em md+) ===== */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-4 pl-6 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                        onChange={handleSelectAll}
                        checked={filteredBudgets.length > 0 && selectedIds.length === filteredBudgets.length}
                      />
                    </th>
                    <th className="p-4 w-16">#</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4 text-right">Valor</th>
                    <th className="p-4 hidden md:table-cell">Data</th>
                    <th className="p-4 hidden md:table-cell">Validade</th>
                    <th className="p-4 hidden md:table-cell">Status</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBudgets.map((b) => (
                    <tr
                      key={b.id}
                      className={`hover:bg-gray-50 transition group ${selectedIds.includes(b.id) ? "bg-blue-50" : ""}`}
                    >
                      <td className="p-4 pl-6">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                          checked={selectedIds.includes(b.id)}
                          onChange={() => handleSelectOne(b.id)}
                        />
                      </td>
                      <td className="p-4 font-mono text-gray-400 font-bold text-sm">
                        #{b.display_id || "—"}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-gray-800">{b.client_name}</p>
                        {b.client_address && (
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{b.client_address}</p>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-gray-800">
                          {Number(b.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-400 hidden md:table-cell">
                        {new Date(b.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {b.validity_days || 15} dias
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell relative">
                        <div className="relative inline-block" ref={statusDropdown === b.id ? statusDropdownRef : null}>
                          <button
                            onClick={() => setStatusDropdown(statusDropdown === b.id ? null : b.id)}
                            className={`text-xs font-bold px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition ${getStatusStyle(b.status)}`}
                            title="Alterar status"
                          >
                            {getStatusLabel(b.status)} ▾
                          </button>
                          {statusDropdown === b.id && (
                            <div className="absolute left-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[160px]">
                              {STATUS_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value ?? "null"}
                                  onClick={() => handleStatusChange(b.id, opt.value)}
                                  className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-gray-50 transition ${b.status === opt.value || (!b.status && !opt.value) ? "opacity-50 cursor-default" : ""}`}
                                >
                                  <span className={`px-2 py-0.5 rounded-full ${opt.color}`}>{opt.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewBudget(b)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                            title="Ver detalhes"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => navigate(`/app/new-budget?id=${b.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleShareLink(b)}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition text-xs font-semibold ${copiedId === b.id ? "bg-green-100 text-green-700" : b.is_public ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                            title={b.is_public ? "Link ativo — copiar" : "Gerar link público"}
                          >
                            {copiedId === b.id ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleDuplicate(b)}
                            className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition"
                            title="Duplicar orçamento"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Excluir"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* fim tabela desktop */}

            <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
              Mostrando {filteredBudgets.length} de {budgets.length} orçamentos
            </div>
          </>
        )}
      </div>

      {/* Modal de detalhes do orçamento */}
      {viewBudget && <BudgetDetailModal budget={viewBudget} onClose={() => setViewBudget(null)} onEdit={(id) => navigate(`/app/new-budget?id=${id}`)} />}
    </div>
  );
}

function BudgetDetailModal({ budget, onClose, onEdit }) {
  const issueDate = new Date(budget.created_at);
  const expiryDate = new Date(issueDate);
  expiryDate.setDate(expiryDate.getDate() + (budget.validity_days || 15));
  const isExpired = new Date() > expiryDate;
  const items = Array.isArray(budget.items) ? budget.items : [];
  const total = Number(budget.total || 0);
  const primaryColor = budget.primary_color || "#2563eb";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-scale-in" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho colorido */}
        <div className="p-5 text-white flex justify-between items-start" style={{ backgroundColor: primaryColor }}>
          <div>
            <p className="text-white/70 text-xs font-medium mb-1">Orçamento #{budget.display_id || "—"}</p>
            <h2 className="text-xl font-bold">{budget.client_name}</h2>
            {budget.client_address && <p className="text-white/80 text-sm mt-0.5">{budget.client_address}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {budget.status === "accepted" && (
              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Aceito</span>
            )}
            {isExpired && budget.status !== "accepted" && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Expirado</span>
            )}
            <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg transition mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Datas */}
          <div className="flex gap-6 text-sm text-gray-500">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Emissão</p>
              <p>{issueDate.toLocaleDateString("pt-BR")}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Validade</p>
              <p className={isExpired ? "text-red-500 font-medium" : ""}>{expiryDate.toLocaleDateString("pt-BR")}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Dias</p>
              <p>{budget.validity_days || 15} dias</p>
            </div>
          </div>

          {/* Itens */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Itens</p>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="p-3 text-left">Descrição</th>
                    <th className="p-3 text-center w-14">Qtd</th>
                    <th className="p-3 text-right w-28">Unit.</th>
                    <th className="p-3 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => {
                    const qty = Number(item.quantity || 1);
                    const price = Number(item.price || 0);
                    return (
                      <tr key={idx}>
                        <td className="p-3 text-gray-800">{item.description}</td>
                        <td className="p-3 text-center text-gray-500">{qty}</td>
                        <td className="p-3 text-right text-gray-500">
                          {price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="p-3 text-right font-semibold text-gray-800">
                          {(qty * price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center p-4 rounded-xl text-white font-bold" style={{ backgroundColor: primaryColor }}>
            <span>Total Geral</span>
            <span className="text-xl">{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { onClose(); onEdit(budget.id); }}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar Orçamento
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-xl transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
