import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import ProductSelector from "../components/ProductSelector";
import { supabase } from "../services/supabase";
import { generateBudgetPDF } from "../utils/generateBudgetPDF";
import { saveBudget, getBudgetById, checkPlanLimit, getUserPlan, toggleBudgetPublic } from "../services/budgetService";
import { useToast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

export default function NewBudget() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const editId = searchParams.get("id");
  const [confirmModal, setConfirmModal] = useState({ open: false, message: "", onConfirm: null });

  // --- ESTADOS DO ORÇAMENTO ---
  const [budgetId, setBudgetId] = useState(null);
  const [displayId, setDisplayId] = useState(null);

  const [client, setClient] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);

  // --- CONFIGURAÇÕES VISUAIS ---
  const [layout, setLayout] = useState("modern");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [validityDays, setValidityDays] = useState("15");

  // --- ESTADOS DE CONTROLE ---
  const [companyData, setCompanyData] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: "", text: "" });
  const [saveFeedback, setSaveFeedback] = useState("");

  // --- ESTADOS DE CARREGAMENTO E PLANO ---
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  const [publicLink, setPublicLink] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  const [userPlan, setUserPlan] = useState("free");
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [limitDetails, setLimitDetails] = useState({ title: "", msg: "" });
  const [draftRestored, setDraftRestored] = useState(false);

  const colorOptions = [
    { name: "Azul", value: "#2563eb" },
    { name: "Índigo", value: "#4f46e5" },
    { name: "Verde", value: "#16a34a" },
    { name: "Esmeralda", value: "#059669" },
    { name: "Vermelho", value: "#dc2626" },
    { name: "Laranja", value: "#ea580c" },
    { name: "Preto", value: "#111827" },
    { name: "Cinza", value: "#4b5563" },
  ];

  // ==================================================================================
  // 1. CARREGAMENTO INICIAL
  // ==================================================================================
  useEffect(() => {
    async function initializePage() {
      setIsVerifying(true);

      try {
        // A. Carrega dados em paralelo: plano do usuário + perfil da empresa
        const [plan, profileResult] = await Promise.all([
          getUserPlan(),
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return null;
            return supabase.from("profiles").select("*").eq("id", user.id).single()
              .then(({ data }) => data);
          })
        ]);

        setUserPlan(plan);

        if (profileResult) {
          setCompanyData(profileResult);
          if (profileResult.primary_color) setPrimaryColor(profileResult.primary_color);
        } else {
          // Fallback: LocalStorage
          const savedData = localStorage.getItem("orcasimples_dados");
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData);
              setCompanyData(parsed);
              if (parsed.corPadrao) setPrimaryColor(parsed.corPadrao);
              if (parsed.validadePadrao) setValidityDays(parsed.validadePadrao);
            } catch (e) { }
          }
        }

        // B. Verifica Limites (Apenas se for Novo Orçamento)
        if (!editId) {
          const check = await checkPlanLimit(plan);

          if (!check.allowed) {
            setIsLimitReached(true);
            localStorage.removeItem("budget_draft");

            if (check.plan === 'free') {
              setLimitDetails({
                title: "Fim do Teste Gratuito",
                msg: "Você já usou seus 3 orçamentos gratuitos. Para continuar usando, escolha um plano."
              });
            } else if (check.plan === 'starter') {
              setLimitDetails({
                title: "Limite Mensal Atingido",
                msg: "Você atingiu o limite de 30 orçamentos do plano Iniciante este mês."
              });
            }
          } else {
            // Se permitido, tenta recuperar rascunho
            const draft = localStorage.getItem("budget_draft");
            if (draft) {
              try {
                const parsedDraft = JSON.parse(draft);
                if (parsedDraft.client || parsedDraft.items?.length > 0) {
                  setClient(parsedDraft.client || "");
                  setClientAddress(parsedDraft.clientAddress || "");
                  setItems(parsedDraft.items || []);
                  if (parsedDraft.primaryColor) setPrimaryColor(parsedDraft.primaryColor);
                  setDraftRestored(true);
                }
              } catch (e) { }
            }
          }
        }

        // E. Se for Edição, carrega dados do banco
        if (editId) {
          const savedBudget = await getBudgetById(editId);
          if (savedBudget) {
            setBudgetId(savedBudget.id);
            setDisplayId(savedBudget.display_id);
            setClient(savedBudget.client_name);
            setClientAddress(savedBudget.client_address || "");
            setItems(savedBudget.items || []);
            if (savedBudget.primary_color) setPrimaryColor(savedBudget.primary_color);
            if (savedBudget.validity_days) setValidityDays(String(savedBudget.validity_days));
          }
        }

      } catch (error) {
        console.error("Erro na inicialização:", error);
      } finally {
        setIsVerifying(false); // Libera a tela
      }
    }

    initializePage();
  }, [editId]);

  // Carrega produtos do Supabase (C1 FIX: não usa mais localStorage)
  useEffect(() => {
    async function loadProducts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("products")
        .select("id, name, price, type")
        .eq("user_id", user.id)
        .order("name", { ascending: true });
      setProducts(data || []);
    }
    loadProducts();
  }, []);



  // ==================================================================================
  // 2. AUTO-SAVE (Rascunho)
  // ==================================================================================
  useEffect(() => {
    if (!editId && !budgetId && !isLimitReached && !isVerifying) {
      const draftData = { client, clientAddress, items, primaryColor };
      if (client || items.length > 0) {
        localStorage.setItem("budget_draft", JSON.stringify(draftData));
      }
    }
  }, [client, clientAddress, items, primaryColor, editId, budgetId, isLimitReached, isVerifying]);

  // ==================================================================================
  // 3. FUNÇÕES AUXILIARES E DE ITENS
  // ==================================================================================

  const handleClearForm = () => {
    const confirmMsg = editId ? "Sair da edição e criar novo?" : "Limpar todos os campos?";
    setConfirmModal({
      open: true,
      message: confirmMsg,
      onConfirm: () => {
        setClient("");
        setClientAddress("");
        setItems([]);
        setBudgetId(null);
        setDisplayId(null);
        setSaveFeedback("");
        localStorage.removeItem("budget_draft");
        navigate("/app/new-budget", { replace: true });
        setConfirmModal({ open: false, message: "", onConfirm: null });
      }
    });
  };


  function addEmptyItem() {
    setItems([...items, { id: crypto.randomUUID(), description: "", quantity: 1, price: "" }]);
  }

  function updateItem(id, field, value) {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function removeItem(id) {
    setItems(items.filter((item) => item.id !== id));
  }

  const handleProductSelect = (product) => {
    setItems([...items, { id: crypto.randomUUID(), description: product.name, quantity: 1, price: product.price }]);
  };

  const total = items.reduce((sum, item) => {
    return sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0));
  }, 0);

  // --- VALIDAÇÃO ---
  const validateForm = () => {
    if (!client.trim()) { toast.error("Preencha o nome do cliente."); return false; }
    if (items.length === 0) { toast.error("Adicione pelo menos um item."); return false; }
    if (items.some(i => !i.description.trim())) { toast.error("Preencha a descrição de todos os itens."); return false; }
    if (items.some(i => i.price === "" || i.price === null || i.price === undefined)) { toast.error("Preencha o valor de todos os itens."); return false; }
    if (items.some(i => Number(i.price) < 0)) { toast.error("O valor dos itens não pode ser negativo."); return false; }
    if (items.some(i => Number(i.quantity) <= 0)) { toast.error("A quantidade dos itens deve ser maior que zero."); return false; }
    return true;
  };

  // --- LÓGICA DE LAYOUT ---
  const isLayoutLocked = (targetLayout) => {
    // Regra: Starter só pode usar 'modern'
    if (userPlan === 'starter' && targetLayout !== 'modern') return true;
    return false;
  };

  const handleSetLayout = (newLayout) => {
    if (isLayoutLocked(newLayout)) {
      toast.warning("Plano Iniciante: Apenas o layout Moderno está disponível. Faça upgrade para liberar todos.");
      return;
    }
    setLayout(newLayout);
  };

  // ==================================================================================
  // 4. AÇÕES (PDF, ZAP, SALVAR)
  // ==================================================================================

  const handleShareWhatsApp = () => {
    if (isLimitReached) return;
    if (!validateForm()) return;

    let empresaNome = companyData?.company_name || companyData?.nomeEmpresa || "Sua Empresa";
    // Fallback de segurança
    if (empresaNome === "Sua Empresa") {
      try { const sn = localStorage.getItem("orcasimples_dados"); if (sn) empresaNome = JSON.parse(sn).company_name || "Sua Empresa"; } catch (e) { }
    }

    let message = `*ORÇAMENTO - ${empresaNome}*\n`;
    message += `-------------------------\n`;
    message += `👤 *Cliente:* ${client}\n`;
    if (displayId) message += `🔖 *Nº:* #${displayId}\n`;
    message += `-------------------------\n\n`;

    items.forEach(item => {
      const itemTotal = (Number(item.quantity) || 1) * (Number(item.price) || 0);
      message += `▪️ ${item.quantity}x ${item.description}\n`;
      message += `   R$ ${itemTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n`;
    });

    message += `\n-------------------------\n`;
    message += `💰 *TOTAL: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}*\n`;
    message += `-------------------------\n`;
    message += `📅 Validade: ${validityDays} dias.\n`;
    message += `_Gerado via UltraOrça_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleGenerateLink = async () => {
    if (!validateForm()) return;
    setLoadingLink(true);
    try {
      // Salva primeiro se ainda não foi salvo
      let id = budgetId || editId;
      if (!id) {
        const check = await checkPlanLimit();
        if (!check.allowed) {
          toast.warning("Limite atingido. Faça upgrade para continuar.");
          setLoadingLink(false);
          return;
        }
        id = await saveBudget({ client, clientAddress, items, total, layout, primaryColor, validityDays, status: "pending" });
        setBudgetId(id);
        localStorage.removeItem("budget_draft");
      } else {
        await saveBudget({ id, client, clientAddress, items, total, layout, primaryColor, validityDays });
        localStorage.removeItem("budget_draft");
      }
      await toggleBudgetPublic(id, true);
      const link = `${window.location.origin}/orcamento/${id}`;
      setPublicLink(link);
      toast.success("Link gerado e orçamento salvo!");
    } catch {
      toast.error("Erro ao gerar o link. Tente novamente.");
    } finally {
      setLoadingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publicLink) return;
    try {
      await navigator.clipboard.writeText(publicLink);
    } catch {}
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleGeneratePDF = async () => {
    if (isLimitReached) return;
    if (!validateForm()) return;
    setLoadingPDF(true);
    // Yield to event loop so React re-renders the spinner before blocking the main thread
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      await generateBudgetPDF({
        client, clientAddress, items, total, layout, primaryColor,
        companyData, validityDays, displayId: displayId || null
      });
      toast.success("PDF gerado com sucesso!");

      // Auto-save silently ao gerar PDF
      try {
        if (!budgetId && !editId) {
          const check = await checkPlanLimit();
          if (check.allowed) {
            const newId = await saveBudget({ client, clientAddress, items, total, layout, primaryColor, validityDays });
            setBudgetId(newId);
            localStorage.removeItem("budget_draft");
          }
        } else {
          await saveBudget({ id: budgetId || editId, client, clientAddress, items, total, layout, primaryColor, validityDays });
          localStorage.removeItem("budget_draft");
        }
      } catch {
        // silencioso — PDF já foi gerado
      }
    } catch (error) {
      console.error("Erro PDF:", error);
      toast.error("Erro ao gerar o PDF. Verifique os dados e tente novamente.");
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleSaveBudget = async () => {
    if (isLimitReached) return;
    if (!validateForm()) return;

    setLoadingSave(true);
    try {
      // Dupla verificação de limite antes de salvar
      if (!budgetId && !editId) {
        const check = await checkPlanLimit();
        if (!check.allowed) {
          setLoadingSave(false);
          setIsLimitReached(true);
          toast.warning("Limite atingido. Faça upgrade para continuar.");
          return;
        }
      }

      const budgetData = { id: budgetId || editId, client, clientAddress, items, total, layout, primaryColor, validityDays };

      const newId = await saveBudget(budgetData);
      setBudgetId(newId);
      localStorage.removeItem("budget_draft");

      setSaveFeedback("Salvo com sucesso!");
      setTimeout(() => setSaveFeedback(""), 3000);

      if (!displayId) {
        const updated = await getBudgetById(newId);
        if (updated) setDisplayId(updated.display_id);
      }

    } catch (error) {
      console.error("Erro save:", error);
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setLoadingSave(false);
    }
  };

  // ==================================================================================
  // 5. RENDERIZAÇÃO
  // ==================================================================================

  // Tela de Carregamento Inicial (Evita mostrar tela errada)
  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pb-20">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mb-4"></div>
          <h2 className="text-lg font-bold text-gray-800">Verificando Conta...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 md:p-6 relative pb-24">

      <ConfirmModal
        open={confirmModal.open}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ open: false, message: "", onConfirm: null })}
      />

      {/* Modal Bloqueio (Popup) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="bg-yellow-100 text-yellow-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{modalMessage.title}</h2>
            <p className="text-gray-600 mb-6">{modalMessage.text}</p>
            <Link to="/app/subscription" className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg mb-3">Ver Planos</Link>
            <button onClick={() => setShowUpgradeModal(false)} className="text-gray-400 text-sm underline">Cancelar</button>
          </div>
        </div>
      )}

      {/* Banner de rascunho restaurado */}
      {draftRestored && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-4 py-3 rounded-xl mb-4">
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Rascunho anterior restaurado automaticamente.
          </span>
          <button
            onClick={() => {
              setClient(""); setClientAddress(""); setItems([]);
              localStorage.removeItem("budget_draft");
              setDraftRestored(false);
            }}
            className="text-amber-600 hover:text-amber-800 font-bold text-xs underline whitespace-nowrap"
          >
            Limpar e começar do zero
          </button>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/app")} className="text-gray-500 hover:text-gray-700 transition">&larr; Voltar</button>
          <h1 className="text-3xl font-bold text-gray-800">
            {editId || budgetId ? "Editar Orçamento" : "Novo Orçamento"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase hidden md:inline-block ${userPlan === 'pro' || userPlan === 'annual' ? 'bg-purple-100 text-purple-700' : userPlan === 'starter' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            Plano {userPlan === 'starter' ? 'Iniciante' : (userPlan === 'pro' || userPlan === 'annual') ? 'Pro' : 'Grátis'}
          </span>

          <button onClick={handleClearForm} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50 hover:text-red-600 transition shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Limpar / Novo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- COLUNA ESQUERDA: FORMULÁRIO --- */}
        <div className="lg:col-span-2 space-y-5 order-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">1. Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  className={`w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 transition ${isLimitReached ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Ex: João da Silva"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  disabled={isLimitReached}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  className={`w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition ${isLimitReached ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Rua, Bairro..."
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  disabled={isLimitReached}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">2. Itens</h2>
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
              <label className="block text-sm font-medium text-gray-600 mb-2">Item rápido:</label>
              {isLimitReached ? (
                <div className="text-center text-gray-400 py-2 text-sm italic">Adição bloqueada pelo limite do plano.</div>
              ) : (
                <ProductSelector products={products} onSelect={handleProductSelect} />
              )}
            </div>

            {/* Cabeçalho das colunas (só desktop) */}
            {items.length > 0 && (
              <div className="hidden md:flex gap-3 items-center px-3 pb-1">
                <span className="w-6" />
                <div className="flex-grow">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Descrição</span>
                </div>
                <div className="w-24 text-center">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Qtd</span>
                </div>
                <div className="w-32 text-right">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Preço Unit.</span>
                </div>
                <div className="w-20 text-right">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Subtotal</span>
                </div>
                {!isLimitReached && <div className="w-9" />}
              </div>
            )}

            <div className="space-y-3">
              {items.map((item, index) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.price) || 0);
                return (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Número do item */}
                    <div className="flex items-center gap-2 px-3 pt-2.5 md:hidden">
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Item {index + 1}</span>
                      {!isLimitReached && (
                        <button onClick={() => removeItem(item.id)} className="ml-auto text-gray-300 hover:text-red-500 p-1 transition">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                    {/* Mobile: layout em grid */}
                    <div className="md:hidden grid grid-cols-2 gap-2 p-3 pt-1.5">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Descrição do serviço / produto</label>
                        <input
                          disabled={isLimitReached}
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-gray-50"
                          placeholder="Ex: Instalação elétrica"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Quantidade</label>
                        <input
                          disabled={isLimitReached}
                          type="number"
                          min="1"
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm text-center outline-none focus:border-blue-500 bg-gray-50"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Preço unitário (R$)</label>
                        <input
                          disabled={isLimitReached}
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm text-right outline-none focus:border-blue-500 bg-gray-50"
                          placeholder="0,00"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, "price", e.target.value)}
                        />
                      </div>
                      {lineTotal > 0 && (
                        <div className="col-span-2 bg-blue-50 rounded-lg px-3 py-2 flex justify-between items-center">
                          <span className="text-xs text-blue-500 font-medium">Subtotal</span>
                          <span className="text-sm font-bold text-blue-700">
                            {lineTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Desktop: layout em linha */}
                    <div className="hidden md:flex gap-3 items-center p-3">
                      <span className="text-gray-300 text-xs w-6 text-center font-bold">{index + 1}</span>
                      <div className="flex-grow">
                        <input
                          disabled={isLimitReached}
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-gray-50"
                          placeholder="Descrição do serviço ou produto"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        />
                      </div>
                      <div className="w-24">
                        <input
                          disabled={isLimitReached}
                          type="number"
                          min="1"
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm text-center outline-none focus:border-blue-500 bg-gray-50"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                        />
                      </div>
                      <div className="w-32">
                        <input
                          disabled={isLimitReached}
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm text-right outline-none focus:border-blue-500 bg-gray-50"
                          placeholder="0,00"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, "price", e.target.value)}
                        />
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-sm font-semibold text-gray-500">
                          {lineTotal > 0 ? lineTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                        </span>
                      </div>
                      {!isLimitReached && (
                        <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!isLimitReached && (
              <button onClick={addEmptyItem} className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded transition">+ Item Manual</button>
            )}
          </div>
        </div>

        {/* --- COLUNA DIREITA: RESUMO E AÇÕES --- */}
        <div className="lg:col-span-1 order-2">
          <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 lg:sticky lg:top-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Total: {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</h2>

            {saveFeedback && <div className="bg-green-100 text-green-700 text-sm p-3 rounded mb-4 text-center font-bold animate-fade-in-down">{saveFeedback}</div>}

            {/* CARD DE BLOQUEIO (SE LIMITE ATINGIDO) */}
            {isLimitReached ? (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 text-center shadow-sm animate-fade-in-up">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-orange-600">🔒</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{limitDetails.title}</h3>
                <p className="text-gray-600 text-sm mb-6">{limitDetails.msg}</p>
                <Link to="/app/subscription" className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg mb-2 transform transition hover:-translate-y-1">
                  Fazer Upgrade Agora
                </Link>
                <p className="text-xs text-gray-400">Libere acesso imediato.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                    Modelo do PDF
                    {userPlan === 'starter' && <span className="text-xs text-orange-500 font-bold">Restrito</span>}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleSetLayout("modern")} className={`p-3 rounded-lg border-2 text-left transition-all ${layout === "modern" ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 hover:border-blue-300"}`}>
                      <div className="h-2 w-full bg-blue-500 rounded-full mb-2"></div>
                      <span className="text-xs font-bold text-gray-700">Moderno</span>
                    </button>

                    <button onClick={() => handleSetLayout("executive")} className={`relative p-3 rounded-lg border-2 text-left transition-all ${layout === "executive" ? "border-blue-600 bg-blue-50" : "border-gray-200"} ${isLayoutLocked("executive") ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-blue-300"}`}>
                      {isLayoutLocked("executive") && <div className="absolute top-1 right-1 text-lg">🔒</div>}
                      <div className="h-4 w-full bg-gray-800 rounded mb-2"></div>
                      <span className="text-xs font-bold text-gray-700">Executivo</span>
                    </button>

                    <button onClick={() => handleSetLayout("minimal")} className={`relative p-3 rounded-lg border-2 text-left transition-all ${layout === "minimal" ? "border-blue-600 bg-blue-50" : "border-gray-200"} ${isLayoutLocked("minimal") ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-blue-300"}`}>
                      {isLayoutLocked("minimal") && <div className="absolute top-1 right-1 text-lg">🔒</div>}
                      <div className="h-2 w-1/2 bg-gray-300 rounded-full mb-2"></div>
                      <span className="text-xs font-bold text-gray-700">Clean</span>
                    </button>

                    <button onClick={() => handleSetLayout("classic")} className={`relative p-3 rounded-lg border-2 text-left transition-all ${layout === "classic" ? "border-blue-600 bg-blue-50" : "border-gray-200"} ${isLayoutLocked("classic") ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-blue-300"}`}>
                      {isLayoutLocked("classic") && <div className="absolute top-1 right-1 text-lg">🔒</div>}
                      <div className="border border-gray-400 h-4 w-full mb-2 px-1"></div>
                      <span className="text-xs font-bold text-gray-700">Clássico</span>
                    </button>
                  </div>
                </div>

                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Documento</label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {colorOptions.map((c) => (
                        <button
                          key={c.value}
                          title={c.name}
                          className={`w-7 h-7 rounded-full border-2 transition hover:scale-110 ${primaryColor === c.value ? "border-gray-800 ring-2 ring-gray-300 ring-offset-1 scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c.value }}
                          onClick={() => setPrimaryColor(c.value)}
                        />
                      ))}
                      {/* Color picker customizado */}
                      <label className="relative w-7 h-7 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer transition overflow-hidden flex items-center justify-center" title="Cor personalizada">
                        <span className="text-gray-400 text-xs font-bold">+</span>
                        <input
                          type="color"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: primaryColor }} />
                      <span className="text-xs text-gray-400 font-mono">{primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Validade</label>
                    <select value={validityDays} onChange={(e) => setValidityDays(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white">
                      <option value="7">7 dias</option>
                      <option value="15">15 dias</option>
                      <option value="30">30 dias</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleGenerateLink}
                    disabled={loadingLink}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition active:scale-95 ${loadingLink ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"}`}
                  >
                    {loadingLink ? (
                      <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full" />
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Gerar Link do Orçamento
                      </>
                    )}
                  </button>

                  {publicLink && (
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-3">
                      <p className="text-xs text-purple-700 font-mono truncate flex-1">{publicLink}</p>
                      <button
                        onClick={handleCopyLink}
                        className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition ${linkCopied ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}
                      >
                        {linkCopied ? "✓ Copiado!" : "Copiar"}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleGeneratePDF}
                    disabled={loadingPDF}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition active:scale-95 ${loadingPDF ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {loadingPDF ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Gerando PDF...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Gerar PDF
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full py-4 px-6 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 flex justify-center items-center gap-2 transition active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                    Enviar Texto no Zap
                  </button>

                  <button
                    onClick={handleSaveBudget}
                    className="w-full py-3 px-6 rounded-xl font-semibold text-blue-600 border border-blue-200 hover:bg-blue-100 transition"
                  >
                    {loadingSave ? <div className="animate-spin h-5 w-5 border-b-2 border-blue-600 rounded-full mx-auto"></div> : (editId || budgetId ? "Salvar Alterações" : "Salvar no Histórico")}
                  </button>
                </div>

                {!companyData?.nomeEmpresa && !companyData?.company_name && (
                  <p className="text-xs text-yellow-600 mt-4 bg-yellow-50 p-2 rounded border border-yellow-100">
                    ⚠ Seus dados de empresa estão incompletos. <Link to="/app/my-data" className="underline font-bold">Configurar</Link>.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}