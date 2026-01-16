import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import ProductSelector from "../components/ProductSelector";
import { getProducts } from "../services/storage";
// CERTIFIQUE-SE que o arquivo na pasta utils se chama 'pdfGenerator.js'
import { generateBudgetPDF } from "../utils/generateBudgetPDF.js"; 
import { saveBudget, getBudgetById, checkPlanLimit } from "../services/budgetService";

export default function NewBudget() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get("id");

  // Estado do formulário
  const [budgetId, setBudgetId] = useState(null);
  const [displayId, setDisplayId] = useState(null);
  
  const [client, setClient] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Configurações visuais
  const [layout, setLayout] = useState("modern");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [validityDays, setValidityDays] = useState("15");

  // Estados de UI e Dados Auxiliares
  const [companyData, setCompanyData] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: "", text: "" }); // Novo estado para mensagem dinâmica
  const [saveFeedback, setSaveFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  // Opções de Cores
  const colorOptions = [
    { name: "Preto", value: "#000000", bgClass: "bg-black" },
    { name: "Cinza", value: "#4b5563", bgClass: "bg-gray-600" },
    { name: "Azul", value: "#2563eb", bgClass: "bg-blue-600" },
    { name: "Verde", value: "#16a34a", bgClass: "bg-green-600" },
  ];

  // --- 1. CARREGAMENTO INICIAL (Banco ou Rascunho) ---
  useEffect(() => {
    setProducts(getProducts());

    // Carrega dados da empresa do cache
    const savedData = localStorage.getItem("orcasimples_dados");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setCompanyData(parsed);
      if (parsed.corPadrao) setPrimaryColor(parsed.corPadrao);
      if (parsed.validadePadrao) setValidityDays(parsed.validadePadrao);
    }

    async function loadBudget() {
      // CENÁRIO A: Edição (Vem do Banco)
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
      // CENÁRIO B: Novo (Tenta pegar do Rascunho Local)
      else {
        const draft = localStorage.getItem("budget_draft");
        if (draft) {
          try {
            const parsedDraft = JSON.parse(draft);
            // Só restaura se tiver conteúdo útil
            if (parsedDraft.client || parsedDraft.items?.length > 0) {
              setClient(parsedDraft.client || "");
              setClientAddress(parsedDraft.clientAddress || "");
              setItems(parsedDraft.items || []);
              if (parsedDraft.primaryColor) setPrimaryColor(parsedDraft.primaryColor);
            }
          } catch (e) {
            console.error("Erro ao ler rascunho", e);
          }
        }
      }
    }
    loadBudget();
  }, [editId]);

  // --- 2. AUTO-SAVE (Salva no navegador a cada digitação) ---
  useEffect(() => {
    // Só salva rascunho se for um orçamento novo (não estamos editando um salvo)
    if (!editId && !budgetId) {
      const draftData = {
        client,
        clientAddress,
        items,
        primaryColor
      };
      
      // Salva se tiver pelo menos nome ou itens
      if (client || items.length > 0) {
        localStorage.setItem("budget_draft", JSON.stringify(draftData));
      }
    }
  }, [client, clientAddress, items, primaryColor, editId, budgetId]);

  // --- Funções de Itens ---
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
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return sum + (qty * price);
  }, 0);

  // --- AÇÕES ---
  
  const handleGeneratePDF = () => {
    generateBudgetPDF({
      client,
      clientAddress,
      items,
      total,
      layout,
      primaryColor,
      companyData,
      validityDays,
      // ⚠️ AQUI ESTÁ A CORREÇÃO DO "PRÉVIA":
      // Passamos null se não tiver ID. O pdfGenerator vai criar um nome com data/hora.
      displayId: displayId || null 
    });
  };

  const handleSaveBudget = async () => {
    setLoading(true);
    try {
      // 1. VERIFICAÇÃO DE PLANO (Limites)
      if (!budgetId && !editId) {
        const check = await checkPlanLimit();
        
        if (!check.allowed) {
          setLoading(false);
          // Mensagem personalizada baseada no plano
          if (check.plan === 'starter') {
            setModalMessage({
              title: "Limite Mensal Atingido",
              text: "Você atingiu o limite de 30 orçamentos do plano Iniciante neste mês. Faça o upgrade para o PRO e tenha acesso ilimitado."
            });
          } else {
            setModalMessage({
              title: "Limite Gratuito Atingido",
              text: "Você já usou seus 3 orçamentos gratuitos de teste. Assine um plano para continuar criando."
            });
          }
          setShowUpgradeModal(true);
          return;
        }
      }

      const budgetData = {
        id: budgetId || editId,
        client,
        clientAddress,
        items,
        total,
        primaryColor,
        validityDays
      };

      const newId = await saveBudget(budgetData);
      setBudgetId(newId);
      
      // --- 3. LIMPEZA DO RASCUNHO APÓS SALVAR ---
      localStorage.removeItem("budget_draft");

      setSaveFeedback("Orçamento salvo na nuvem!");
      setTimeout(() => setSaveFeedback(""), 3000);

      if (!displayId) {
         const updated = await getBudgetById(newId);
         if (updated) setDisplayId(updated.display_id);
      }

    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar orçamento. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && editId && !client) {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p>Carregando orçamento...</p>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 relative">
      
      {/* MODAL UPGRADE / LIMITE */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in-up">
            <div className="bg-yellow-100 text-yellow-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{modalMessage.title || "Limite Atingido"}</h2>
            <p className="text-gray-600 mb-6">
              {modalMessage.text || "Faça um upgrade para continuar criando orçamentos."}
            </p>
            <Link to="/app/subscription" className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg mb-3">
              Ver Planos
            </Link>
            <button onClick={() => setShowUpgradeModal(false)} className="text-gray-400 text-sm hover:text-gray-600 underline">Cancelar</button>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate("/app")} className="text-gray-500 hover:text-gray-700 transition">&larr; Voltar</button>
            <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    {editId || budgetId ? "Editar Orçamento" : "Novo Orçamento"}
                    {displayId ? (
                        <span className="bg-blue-100 text-blue-700 text-lg px-3 py-1 rounded-full font-mono">
                            #{displayId}
                        </span>
                    ) : (
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded uppercase tracking-wide">
                            Rascunho
                        </span>
                    )}
                </h1>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ESQUERDA: FORMULÁRIO */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">1. Dados do Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input 
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition" 
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

          {/* Itens */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-gray-700">2. Itens</h2>
              <span className="text-sm text-gray-500">{items.length} itens</span>
            </div>

            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
              <label className="block text-sm font-medium text-gray-600 mb-2">Item rápido:</label>
              <ProductSelector products={products} onSelect={handleProductSelect} />
            </div>

            {items.length > 0 && (
                <div className="hidden md:flex gap-3 px-3 py-2 text-sm font-bold text-gray-500 uppercase">
                    <div className="w-6 text-center">#</div>
                    <div className="flex-grow">Descrição</div>
                    <div className="w-24 text-center">Qtd</div>
                    <div className="w-32 text-right">Valor Unit.</div>
                    <div className="w-10"></div> 
                </div>
            )}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                  <span className="hidden md:block text-gray-400 text-xs w-6 text-center">{index + 1}.</span>
                  
                  <div className="flex-grow w-full">
                    <label className="md:hidden text-xs text-gray-500 font-bold mb-1">Descrição</label>
                    <input 
                        className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500" 
                        placeholder="Descrição" 
                        value={item.description} 
                        onChange={(e) => updateItem(item.id, "description", e.target.value)} 
                    />
                  </div>
                  
                  <div className="w-full md:w-24">
                    <label className="md:hidden text-xs text-gray-500 font-bold mb-1">Qtd</label>
                    <input 
                        type="number" 
                        className="w-full p-2 border border-gray-300 rounded text-sm text-center outline-none focus:border-blue-500" 
                        value={item.quantity} 
                        onChange={(e) => updateItem(item.id, "quantity", e.target.value)} 
                    />
                  </div>
                  
                  <div className="w-full md:w-32">
                    <label className="md:hidden text-xs text-gray-500 font-bold mb-1">Valor Unit.</label>
                    <input 
                        type="number" 
                        placeholder="0,00"
                        className="w-full p-2 border border-gray-300 rounded text-sm text-right outline-none focus:border-blue-500" 
                        value={item.price} 
                        onChange={(e) => updateItem(item.id, "price", e.target.value)} 
                    />
                  </div>
                  
                  <div className="flex justify-end md:w-auto">
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 p-2 rounded hover:bg-red-50 transition" title="Remover item">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addEmptyItem} className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded transition">
                + Item Manual
            </button>
          </div>
        </div>

        {/* DIREITA: RESUMO */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Resumo</h2>
            
            {saveFeedback && <div className="bg-green-100 text-green-700 text-sm p-3 rounded mb-4 text-center font-bold animate-fade-in-down">{saveFeedback}</div>}

            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
              <span className="block text-gray-500 text-sm mb-1">Total Estimado</span>
              <span className="block text-3xl font-bold text-gray-900">{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>

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
                   <label className="block text-sm font-medium text-gray-700 mb-2">Validade (Dias)</label>
                   <select 
                     value={validityDays} 
                     onChange={(e) => setValidityDays(e.target.value)}
                     className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                   >
                       <option value="7">7 dias</option>
                       <option value="15">15 dias</option>
                       <option value="30">30 dias</option>
                   </select>
               </div>
            </div>

            <div className="space-y-3">
              <button 
                className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg flex justify-center items-center gap-2 transition-transform active:scale-95 ${(!client || items.length === 0) ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 hover:shadow-green-200"}`}
                disabled={!client || items.length === 0}
                onClick={handleGeneratePDF}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Gerar PDF
              </button>

              <button 
                className={`w-full py-3 px-6 rounded-xl font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all flex justify-center items-center gap-2 ${(!client || items.length === 0) ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!client || items.length === 0}
                onClick={handleSaveBudget}
              >
                {loading ? <div className="animate-spin h-5 w-5 border-b-2 border-blue-600 rounded-full"></div> : (
                    <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        {editId || budgetId ? "Salvar Alterações" : "Salvar no Histórico"}
                    </>
                )}
              </button>
            </div>
            
            {!companyData?.nomeEmpresa && !companyData?.company_name && (
              <p className="text-xs text-yellow-600 mt-4 bg-yellow-50 p-2 rounded border border-yellow-100">
                ⚠ Seus dados de empresa estão incompletos. <Link to="/app/my-data" className="underline font-bold">Configurar</Link>.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}