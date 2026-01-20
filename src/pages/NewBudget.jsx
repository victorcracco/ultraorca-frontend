import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../services/supabase"; 
import ProductSelector from "../components/ProductSelector";
import { getProducts } from "../services/storage";
import { generateBudgetPDF } from "../utils/generateBudgetPDF"; 
// Importação dos serviços (incluindo getUserPlan)
import { saveBudget, getBudgetById, checkPlanLimit, getUserPlan } from "../services/budgetService";

export default function NewBudget() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get("id");

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
  const [loading, setLoading] = useState(false);
  
  // ESTADO DO PLANO DO USUÁRIO
  const [userPlan, setUserPlan] = useState("free"); 

  const colorOptions = [
    { name: "Azul", value: "#2563eb", bgClass: "bg-blue-600" },
    { name: "Verde", value: "#16a34a", bgClass: "bg-green-600" },
    { name: "Preto", value: "#000000", bgClass: "bg-black" },
    { name: "Cinza", value: "#4b5563", bgClass: "bg-gray-600" },
  ];

  // --- 1. CARREGAMENTO INICIAL ---
  useEffect(() => {
    // Carrega produtos do cadastro
    setProducts(getProducts());

    // Carrega dados da empresa (Local) para o PDF e WhatsApp
    const savedData = localStorage.getItem("orcasimples_dados");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCompanyData(parsed);
        if (parsed.corPadrao) setPrimaryColor(parsed.corPadrao);
        if (parsed.validadePadrao) setValidityDays(parsed.validadePadrao);
      } catch (e) {}
    }

    // Identifica o Plano do Usuário (Usando a função centralizada)
    async function fetchPlan() {
        try {
            const plan = await getUserPlan();
            setUserPlan(plan);
        } catch (error) {
            console.error("Erro ao carregar plano", error);
        }
    }
    fetchPlan();

    // Carrega Orçamento (se for edição ou rascunho)
    async function loadBudget() {
      if (editId) {
        setLoading(true);
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
        setLoading(false);
      } 
      else {
        // Rascunho automático
        const draft = localStorage.getItem("budget_draft");
        if (draft) {
          try {
            const parsedDraft = JSON.parse(draft);
            if (parsedDraft.client || parsedDraft.items?.length > 0) {
              setClient(parsedDraft.client || "");
              setClientAddress(parsedDraft.clientAddress || "");
              setItems(parsedDraft.items || []);
              if (parsedDraft.primaryColor) setPrimaryColor(parsedDraft.primaryColor);
            }
          } catch (e) {}
        }
      }
    }
    loadBudget();
  }, [editId]);

  // --- 2. AUTO-SAVE (Salvar Rascunho no navegador) ---
  useEffect(() => {
    if (!editId && !budgetId) {
      const draftData = { client, clientAddress, items, primaryColor };
      if (client || items.length > 0) {
        localStorage.setItem("budget_draft", JSON.stringify(draftData));
      }
    }
  }, [client, clientAddress, items, primaryColor, editId, budgetId]);

  // --- FUNÇÃO: LIMPAR TUDO / NOVO ---
  const handleClearForm = () => {
    const confirmText = editId 
        ? "Deseja sair da edição e começar um NOVO orçamento?" 
        : "Deseja limpar todos os campos?";

    if (window.confirm(confirmText)) {
        setClient("");
        setClientAddress("");
        setItems([]);
        setBudgetId(null);
        setDisplayId(null);
        setSaveFeedback("");
        localStorage.removeItem("budget_draft");
        navigate("/app/new-budget");
    }
  };

  // --- FUNÇÕES DE MANIPULAÇÃO DE ITENS ---
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

  // --- VALIDAÇÃO DE CAMPOS ---
  const validateForm = () => {
    if (!client.trim()) { alert("Preencha o nome do cliente."); return false; }
    if (items.length === 0) { alert("Adicione pelo menos um item."); return false; }
    if (items.some(i => !i.description)) { alert("Preencha a descrição dos itens."); return false; }
    return true;
  };

  // --- LÓGICA DE BLOQUEIO DE LAYOUT (Plano Iniciante) ---
  const isLayoutLocked = (targetLayout) => {
      // Regra: Starter só pode Moderno. Free e Pro liberados.
      if (userPlan === 'starter' && targetLayout !== 'modern') return true;
      return false;
  };

  const handleSetLayout = (newLayout) => {
      if (isLayoutLocked(newLayout)) {
          alert("🔒 Plano Iniciante: Apenas o layout Moderno está disponível.\nFaça upgrade para o Profissional para liberar todos.");
          return;
      }
      setLayout(newLayout);
  };

  // --- COMPARTILHAR WHATSAPP ---
  const handleShareWhatsApp = () => {
    if (!validateForm()) return;
    
    // Busca nome da empresa (State ou Fallback LocalStorage)
    let empresaNome = companyData?.company_name || companyData?.nomeEmpresa;
    if(!empresaNome) {
         try {
            const sn = localStorage.getItem("orcasimples_dados");
            if(sn) empresaNome = JSON.parse(sn).company_name;
         } catch(e){}
    }
    empresaNome = empresaNome || "Sua Empresa";

    let message = `*ORÇAMENTO - ${empresaNome}*\n`;
    message += `-------------------------\n`;
    message += `👤 *Cliente:* ${client}\n`;
    if(displayId) message += `🔖 *Nº:* #${displayId}\n`;
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

  // --- GERAR PDF ---
  const handleGeneratePDF = () => {
    if (!validateForm()) return;
    generateBudgetPDF({ 
        client, clientAddress, items, total, layout, primaryColor, 
        companyData, validityDays, displayId: displayId || null 
    });
  };

  // --- SALVAR (Com verificação de limite) ---
  const handleSaveBudget = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Verifica limite APENAS se for NOVO orçamento
      if (!budgetId && !editId) {
        const check = await checkPlanLimit();
        
        if (!check.allowed) {
          setLoading(false);
          let msg = "";
          let title = "Limite Atingido";
          
          if (check.plan === 'free') {
              title = "Limite Gratuito (3/3)";
              msg = "Você já utilizou seus 3 orçamentos gratuitos de teste.";
          } else if (check.plan === 'starter') {
              title = "Limite Mensal (30/30)";
              msg = "Você atingiu o limite de 30 orçamentos do plano Iniciante este mês.";
          }
          
          setModalMessage({ title, text: msg });
          setShowUpgradeModal(true);
          return;
        }
      }

      const budgetData = { 
        id: budgetId || editId, 
        client, clientAddress, items, total, primaryColor, validityDays 
      };
      
      const newId = await saveBudget(budgetData);
      setBudgetId(newId);
      localStorage.removeItem("budget_draft");
      
      setSaveFeedback("Salvo com sucesso!");
      setTimeout(() => setSaveFeedback(""), 3000);

      // Atualiza o Display ID na tela
      if (!displayId) {
         const updated = await getBudgetById(newId);
         if (updated) setDisplayId(updated.display_id);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && editId && !client) {
      return (
        <div className="flex flex-col items-center justify-center h-screen text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p>Carregando...</p>
        </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 relative pb-24">
      
      {/* --- MODAL DE UPGRADE --- */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in-up">
            <div className="bg-yellow-100 text-yellow-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{modalMessage.title}</h2>
            <p className="text-gray-600 mb-6">{modalMessage.text}</p>
            <Link to="/app/subscription" className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg mb-3">Ver Planos</Link>
            <button onClick={() => setShowUpgradeModal(false)} className="text-gray-400 text-sm hover:text-gray-600 underline">Cancelar</button>
          </div>
        </div>
      )}

      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate("/app")} className="text-gray-500 hover:text-gray-700 transition">&larr; Voltar</button>
            <h1 className="text-3xl font-bold text-gray-800">
                {editId || budgetId ? "Editar Orçamento" : "Novo Orçamento"}
            </h1>
         </div>
         
         <div className="flex items-center gap-3">
             {/* Badge do Plano */}
             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase hidden md:inline-block ${userPlan === 'pro' || userPlan === 'annual' ? 'bg-purple-100 text-purple-700' : userPlan === 'starter' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                Plano {userPlan === 'starter' ? 'Iniciante' : (userPlan === 'pro' || userPlan === 'annual') ? 'Pro' : 'Grátis'}
             </span>

             {/* BOTÃO LIMPAR / NOVO */}
             <button 
                onClick={handleClearForm} 
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition shadow-sm"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Limpar / Novo
             </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- COLUNA ESQUERDA: FORMULÁRIO --- */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dados do Cliente */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">1. Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input 
                    className={`w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 transition ${!client ? 'border-gray-300' : 'border-blue-500 bg-blue-50'}`} 
                    placeholder="Ex: João da Silva" 
                    value={client} 
                    onChange={(e) => setClient(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input 
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition" 
                    placeholder="Rua, Bairro..." 
                    value={clientAddress} 
                    onChange={(e) => setClientAddress(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Dados dos Itens */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">2. Itens</h2>
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
              <label className="block text-sm font-medium text-gray-600 mb-2">Item rápido:</label>
              <ProductSelector products={products} onSelect={handleProductSelect} />
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className={`flex flex-col md:flex-row gap-3 items-end md:items-center bg-white p-3 rounded-lg border hover:border-blue-300 transition-colors ${(!item.description) ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                  <span className="hidden md:block text-gray-400 text-xs w-6 text-center">{index + 1}.</span>
                  
                  <div className="flex-grow w-full">
                    <label className="md:hidden text-xs text-gray-500 font-bold mb-1">Descrição</label>
                    <input 
                      className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500" 
                      placeholder="Descrição (Obrigatório)" 
                      value={item.description} 
                      onChange={(e) => updateItem(item.id, "description", e.target.value)} 
                    />
                  </div>
                  
                  <div className="w-full md:w-24">
                    <label className="md:hidden text-xs text-gray-500 font-bold mb-1">Qtd</label>
                    <input type="number" className="w-full p-2 border border-gray-300 rounded text-sm text-center outline-none focus:border-blue-500" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", e.target.value)} />
                  </div>
                  
                  <div className="w-full md:w-32">
                    <label className="md:hidden text-xs text-gray-500 font-bold mb-1">Valor</label>
                    <input type="number" placeholder="0,00" className="w-full p-2 border border-gray-300 rounded text-sm text-right outline-none focus:border-blue-500" value={item.price} onChange={(e) => updateItem(item.id, "price", e.target.value)} />
                  </div>
                  
                  <div className="flex justify-end md:w-auto">
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 p-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addEmptyItem} className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded transition">+ Item Manual</button>
          </div>
        </div>

        {/* --- COLUNA DIREITA: AÇÕES E RESUMO --- */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Total: {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</h2>
            
            {saveFeedback && <div className="bg-green-100 text-green-700 text-sm p-3 rounded mb-4 text-center font-bold animate-fade-in-down">{saveFeedback}</div>}

            {/* SELETOR DE MODELOS COM LÓGICA DE BLOQUEIO */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Modelo do PDF</label>
                <div className="grid grid-cols-2 gap-3">
                    
                    {/* Moderno (Sempre Liberado) */}
                    <button onClick={() => handleSetLayout("modern")} className={`p-3 rounded-lg border-2 text-left transition-all ${layout === "modern" ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 hover:border-blue-300"}`}>
                        <div className="h-2 w-full bg-blue-500 rounded-full mb-2"></div>
                        <span className="text-xs font-bold text-gray-700">Moderno</span>
                    </button>

                    {/* Executivo (Bloqueado no Starter) */}
                    <button onClick={() => handleSetLayout("executive")} className={`relative p-3 rounded-lg border-2 text-left transition-all ${layout === "executive" ? "border-blue-600 bg-blue-50" : "border-gray-200"} ${isLayoutLocked("executive") ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-blue-300"}`}>
                        {isLayoutLocked("executive") && <div className="absolute top-1 right-1 text-lg">🔒</div>}
                        <div className="h-4 w-full bg-gray-800 rounded mb-2"></div>
                        <span className="text-xs font-bold text-gray-700">Executivo</span>
                    </button>

                    {/* Minimal (Bloqueado no Starter) */}
                    <button onClick={() => handleSetLayout("minimal")} className={`relative p-3 rounded-lg border-2 text-left transition-all ${layout === "minimal" ? "border-blue-600 bg-blue-50" : "border-gray-200"} ${isLayoutLocked("minimal") ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-blue-300"}`}>
                        {isLayoutLocked("minimal") && <div className="absolute top-1 right-1 text-lg">🔒</div>}
                        <div className="h-2 w-1/2 bg-gray-300 rounded-full mb-2"></div>
                        <span className="text-xs font-bold text-gray-700">Clean</span>
                    </button>

                    {/* Classico (Bloqueado no Starter) */}
                    <button onClick={() => handleSetLayout("classic")} className={`relative p-3 rounded-lg border-2 text-left transition-all ${layout === "classic" ? "border-blue-600 bg-blue-50" : "border-gray-200"} ${isLayoutLocked("classic") ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-blue-300"}`}>
                        {isLayoutLocked("classic") && <div className="absolute top-1 right-1 text-lg">🔒</div>}
                        <div className="border border-gray-400 h-4 w-full mb-2 px-1"></div>
                        <span className="text-xs font-bold text-gray-700">Clássico</span>
                    </button>
                </div>
                {userPlan === 'starter' && <p className="text-xs text-orange-500 mt-2 font-bold">✨ Plano Iniciante: Acesso apenas ao layout Moderno.</p>}
            </div>

            {/* Configurações Visuais */}
            <div className="mb-6 space-y-4">
               <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Documento</label>
                   <div className="flex gap-3">
                      {colorOptions.map((c) => (
                        <button key={c.value} className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 ${c.bgClass} ${primaryColor === c.value ? "border-gray-800 ring-2 ring-gray-200 ring-offset-1" : "border-transparent"}`} onClick={() => setPrimaryColor(c.value)} />
                      ))}
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

            {/* BOTÕES FINAIS */}
            <div className="space-y-3">
              <button 
                onClick={handleGeneratePDF} 
                className="w-full py-4 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 flex justify-center items-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Gerar PDF
              </button>
              
              <button 
                onClick={handleShareWhatsApp} 
                className="w-full py-4 px-6 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 flex justify-center items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                Enviar Texto no Zap
              </button>

              <button 
                onClick={handleSaveBudget} 
                className="w-full py-3 px-6 rounded-xl font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50"
              >
                {loading ? <div className="animate-spin h-5 w-5 border-b-2 border-blue-600 rounded-full mx-auto"></div> : (editId || budgetId ? "Salvar Alterações" : "Salvar no Histórico")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}