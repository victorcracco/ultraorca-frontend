import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

export default function MyData() {
  const [loading, setLoading] = useState(true); // Controla o "Carregando..."
  const [saving, setSaving] = useState(false);  // Controla o botão de salvar
  const [feedback, setFeedback] = useState("");

  const [formData, setFormData] = useState({
    company_name: "",
    phone: "",
    address: "",
    default_validity: "15",
    primary_color: "#2563eb",
    logo_url: "",
  });

  const colorOptions = [
    { name: "Preto", value: "#000000", bgClass: "bg-black" },
    { name: "Cinza", value: "#4b5563", bgClass: "bg-gray-600" },
    { name: "Azul", value: "#2563eb", bgClass: "bg-blue-600" },
    { name: "Verde", value: "#16a34a", bgClass: "bg-green-600" },
  ];

  // 1. Buscar dados do Supabase ao carregar a página
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (data) {
            setFormData({
              company_name: data.company_name || "",
              phone: data.phone || data.whatsapp || "", // Usa whats do cadastro se não tiver fone
              address: data.address || "",
              default_validity: data.default_validity || "15",
              primary_color: data.primary_color || "#2563eb",
              logo_url: data.logo_url || "",
            });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false); // Desliga o carregamento
      }
    }
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) { // Limite de 500KB para não pesar o banco
        alert("A imagem deve ter no máximo 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");

      const updates = {
        id: user.id,
        company_name: formData.company_name,
        phone: formData.phone,
        address: formData.address,
        default_validity: parseInt(formData.default_validity),
        primary_color: formData.primary_color,
        logo_url: formData.logo_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      // Salva também no localStorage para o NewBudget ter acesso rápido (opcional, mas ajuda)
      localStorage.setItem("orcasimples_dados", JSON.stringify({
        nomeEmpresa: formData.company_name,
        telefone: formData.phone,
        endereco: formData.address,
        corPadrao: formData.primary_color,
        validadePadrao: formData.default_validity,
        logo: formData.logo_url
      }));

      setFeedback("Dados salvos com sucesso na nuvem!");
      setTimeout(() => setFeedback(""), 3000);

    } catch (error) {
      console.error("Erro ao salvar:", error);
      setFeedback("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-500 font-medium">Carregando seus dados...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Meus Dados</h1>
        {feedback && (
          <div className={`px-4 py-2 rounded shadow text-sm font-semibold ${feedback.includes("Erro") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {feedback}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Informações da Empresa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
              <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Identidade Visual</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              <div className="flex items-start space-x-4">
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                  {formData.logo_url ? <img src={formData.logo_url} className="w-full h-full object-contain" /> : <span className="text-gray-400 text-xs">Sem logo</span>}
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 text-center">
                    Carregar
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
                  {formData.logo_url && <button type="button" onClick={() => setFormData(p => ({...p, logo_url: ""}))} className="text-sm text-red-600">Remover</button>}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cor Principal</label>
              <div className="flex space-x-3">
                {colorOptions.map((c) => (
                  <button key={c.value} type="button" onClick={() => setFormData(p => ({...p, primary_color: c.value}))} className={`w-10 h-10 rounded-full border-2 ${c.bgClass} ${formData.primary_color === c.value ? "border-gray-800 ring-2" : "border-transparent"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
           <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Preferências</h2>
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Validade Padrão (Dias)</label>
            <select name="default_validity" value={formData.default_validity} onChange={handleChange} className="w-full md:w-1/3 p-2 border border-gray-300 rounded">
              <option value="7">7 dias</option>
              <option value="15">15 dias</option>
              <option value="30">30 dias</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className={`bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 shadow-lg ${saving ? "opacity-70 cursor-not-allowed" : ""}`}>
            {saving ? "Salvando..." : "Salvar Meus Dados"}
          </button>
        </div>
      </form>
    </div>
  );
}