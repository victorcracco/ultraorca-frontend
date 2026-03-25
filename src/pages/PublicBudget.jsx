import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicBudget, acceptBudget } from "../services/budgetService";

export default function PublicBudget() {
  const { id } = useParams();
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getPublicBudget(id);
      if (!data) {
        setNotFound(true);
      } else {
        // Verifica se o orçamento já expirou
        const issueDate = new Date(data.created_at);
        const expiry = new Date(issueDate);
        expiry.setDate(expiry.getDate() + (data.validity_days || 15));
        if (new Date() > expiry && data.status !== "accepted") {
          setExpired(true);
          setBudget(data);
        } else {
          setBudget(data);
          if (data.status === "accepted") setAccepted(true);
        }
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleAccept = async () => {
    if (accepted || accepting) return;
    setAccepting(true);
    try {
      await acceptBudget(id);
      setAccepted(true);
      setBudget((prev) => ({ ...prev, status: "accepted" }));
    } catch (e) {
      console.error("Erro ao aceitar orçamento:", e);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Orçamento não encontrado</h1>
        <p className="text-gray-500 mb-6">Este link não existe ou o orçamento não é público.</p>
        <Link to="/" className="text-blue-600 hover:underline font-medium">Voltar ao início</Link>
      </div>
    );
  }

  if (expired && budget) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">⏰</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Orçamento expirado</h1>
        <p className="text-gray-500 mb-2">O orçamento <strong>#{budget.display_id}</strong> para <strong>{budget.client_name}</strong> não está mais disponível.</p>
        <p className="text-gray-400 text-sm mb-6">Entre em contato com o fornecedor para solicitar um novo orçamento.</p>
        <Link to="/" className="text-blue-600 hover:underline font-medium">Voltar ao início</Link>
      </div>
    );
  }

  const issueDate = new Date(budget.created_at);
  const expiryDate = new Date(issueDate);
  expiryDate.setDate(expiryDate.getDate() + (budget.validity_days || 15));
  const isExpired = new Date() > expiryDate;
  const primaryColor = budget.primary_color || "#2563eb";

  const items = Array.isArray(budget.items) ? budget.items : [];
  const total = Number(budget.total || 0);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500">Orçamento compartilhado via</p>
          <Link to="/" className="text-blue-600 font-bold text-lg hover:underline">UltraOrça</Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Cabeçalho colorido */}
          <div className="p-6 text-white" style={{ backgroundColor: primaryColor }}>
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  Orçamento #{budget.display_id || "—"}
                </h1>
                <p className="text-white/80 text-sm">
                  Emitido em {issueDate.toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {accepted ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white flex items-center gap-1">
                    ✓ Aceito
                  </span>
                ) : isExpired ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                    Expirado
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
                    Válido até {expiryDate.toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Cliente */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Cliente</p>
              <p className="font-semibold text-gray-800 text-lg">{budget.client_name}</p>
              {budget.client_address && (
                <p className="text-sm text-gray-500">{budget.client_address}</p>
              )}
            </div>

            {/* Itens */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-3">Itens do Orçamento</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="p-3 text-left">Descrição</th>
                      <th className="p-3 text-center">Qtd</th>
                      <th className="p-3 text-right">Unit.</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => {
                      const qty = Number(item.quantity || item.qty || 1);
                      const price = Number(item.price || item.unitPrice || 0);
                      const lineTotal = qty * price;
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-3 text-gray-800">{item.description || item.name}</td>
                          <td className="p-3 text-center text-gray-600">{qty}</td>
                          <td className="p-3 text-right text-gray-600">
                            {price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                          <td className="p-3 text-right font-medium text-gray-800">
                            {lineTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total */}
            <div
              className="flex justify-between items-center p-4 rounded-xl text-white font-bold text-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Total</span>
              <span className="text-2xl">
                {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>

            {/* Botão aceitar */}
            {!isExpired && (
              <div className="pt-2">
                {accepted ? (
                  <div className="flex items-center justify-center gap-3 bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                    <div className="text-3xl">✅</div>
                    <div>
                      <p className="font-bold text-green-700 text-lg">Orçamento aceito!</p>
                      <p className="text-green-600 text-sm">O fornecedor foi notificado da sua aprovação.</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full py-4 px-6 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-3 transition active:scale-[0.98] shadow-lg"
                    style={{ backgroundColor: accepting ? "#9ca3af" : "#16a34a" }}
                  >
                    {accepting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Aceitar Orçamento
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Rodapé */}
            <p className="text-center text-xs text-gray-400 pt-2">
              Orçamento gerado com <Link to="/" className="text-blue-500 hover:underline">UltraOrça</Link>
            </p>
          </div>
        </div>

        {/* CTA para novos usuários */}
        <div className="mt-6 bg-blue-600 text-white rounded-2xl p-6 text-center">
          <h3 className="font-bold text-lg mb-1">Crie orçamentos profissionais como este</h3>
          <p className="text-blue-100 text-sm mb-4">Grátis para começar. Sem cartão.</p>
          <Link
            to="/register"
            className="bg-white text-blue-600 font-bold px-6 py-2.5 rounded-xl hover:bg-blue-50 transition inline-block"
          >
            Criar minha conta grátis
          </Link>
        </div>
      </div>
    </div>
  );
}
