import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { getUserPlan } from "../services/budgetService";

/**
 * C1 FIX: Produtos agora são salvos no Supabase (tabela `products`),
 * não no localStorage. Garante persistência entre dispositivos e
 * isolamento por usuário via RLS.
 *
 * SQL para criar a tabela no Supabase:
 * CREATE TABLE products (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *   name TEXT NOT NULL,
 *   price NUMERIC(12, 2) NOT NULL DEFAULT 0,
 *   type TEXT NOT NULL DEFAULT 'service' CHECK (type IN ('service', 'product')),
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 * ALTER TABLE products ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "users_own_products" ON products
 *   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
 */
export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState("free");
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    getUserPlan().then((p) => {
      setPlan(p);
      setPlanLoading(false);
    });
  }, []);

  // Estados do Formulário
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("service");
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  // Seleção em massa
  const [selectedIds, setSelectedIds] = useState([]);

  // --- FETCH ---
  const loadProducts = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const showFeedback = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback({ msg: "", type: "success" }), 3000);
  };

  // --- ADD ---
  async function addProduct(e) {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      showFeedback("Informe um valor válido.", "error");
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("products")
      .insert([{ user_id: user.id, name: name.trim(), price: numericPrice, type }])
      .select()
      .single();

    if (error) {
      showFeedback("Erro ao salvar item. Tente novamente.", "error");
    } else {
      setProducts((prev) => [data, ...prev]);
      setName("");
      setPrice("");
      setType("service");
      showFeedback("Item adicionado com sucesso!");
    }
    setSaving(false);
  }

  // --- REMOVE ---
  async function removeProduct(id) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    } else {
      showFeedback("Erro ao excluir item.", "error");
    }
  }

  // --- BULK DELETE ---
  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? products.map((p) => p.id) : []);
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Tem certeza que deseja apagar ${selectedIds.length} itens?`)) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .in("id", selectedIds);

    if (!error) {
      setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      showFeedback(`${selectedIds.length} itens excluídos.`);
    } else {
      showFeedback("Erro ao excluir itens.", "error");
    }
  };

  if (planLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600" />
      </div>
    );
  }

  if (plan === "free") {
    return (
      <div className="max-w-5xl mx-auto p-6 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/app" className="text-gray-500 hover:text-gray-700">&larr; Voltar</Link>
          <h1 className="text-2xl font-bold text-gray-800">Catálogo</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-yellow-100 text-yellow-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Funcionalidade exclusiva dos planos pagos</h2>
          <p className="text-gray-500 max-w-md mb-8">
            O cadastro de produtos e serviços está disponível a partir do plano <strong>Iniciante</strong>.
            Salve seus itens mais usados e agilize a criação de orçamentos.
          </p>
          <Link
            to="/app/subscription"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition active:scale-95"
          >
            Ver planos e fazer upgrade
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/app" className="text-gray-500 hover:text-gray-700">
          &larr; Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Catálogo</h1>
      </div>

      {feedback.msg && (
        <div
          className={`px-4 py-3 rounded-lg shadow-sm text-sm font-semibold mb-6 flex items-center gap-2 ${feedback.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
            }`}
        >
          {feedback.type === "error" ? "⚠️" : "✅"} {feedback.msg}
        </div>
      )}

      {/* Formulário de Cadastro */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 p-1.5 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </span>
          Novo Item
        </h2>

        <form onSubmit={addProduct} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("service")}
                className={`flex-1 py-2.5 rounded-lg border flex justify-center items-center gap-2 transition-all ${type === "service"
                    ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500"
                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-xs font-bold">Serviço</span>
              </button>
              <button
                type="button"
                onClick={() => setType("product")}
                className={`flex-1 py-2.5 rounded-lg border flex justify-center items-center gap-2 transition-all ${type === "product"
                    ? "bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500"
                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-xs font-bold">Produto</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Nome do item..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="0,00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg transition-colors shadow flex justify-center items-center h-[46px]"
            >
              {saving ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : "Salvar"}
            </button>
          </div>
        </form>
      </div>

      {/* Barra de ação em massa */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-6 z-50">
          <div className="font-bold flex items-center gap-2">
            <span className="bg-white text-gray-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">
              {selectedIds.length}
            </span>
            Selecionados
          </div>
          <div className="h-6 w-px bg-gray-700" />
          <button onClick={handleBulkDelete} className="text-red-400 hover:text-red-300 font-bold flex items-center gap-2 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Excluir
          </button>
          <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-white">
            Cancelar
          </button>
        </div>
      )}

      {/* Listagem */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block p-4 rounded-full bg-gray-100 text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Nenhum item cadastrado.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-semibold">
              <tr>
                <th className="p-4 pl-6 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={products.length > 0 && selectedIds.length === products.length}
                  />
                </th>
                <th className="p-4">Descrição</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 text-center w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(product.id) ? "bg-blue-50" : ""
                    }`}
                >
                  <td className="p-4 pl-6">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => handleSelectOne(product.id)}
                    />
                  </td>
                  <td className="p-4 font-medium text-gray-800 flex items-center gap-3">
                    <span
                      className={`p-1.5 rounded-md flex items-center justify-center ${product.type === "product"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-blue-100 text-blue-600"
                        }`}
                    >
                      {product.type === "product" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      )}
                    </span>
                    {product.name}
                  </td>
                  <td className="p-4 text-right font-mono text-gray-600">
                    {Number(product.price).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}