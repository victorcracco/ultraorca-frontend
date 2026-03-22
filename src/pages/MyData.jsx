import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { Link } from "react-router-dom";
import { useToast } from "../components/Toast";

export default function MyData() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  // Estado para os campos separados
  const [formData, setFormData] = useState({
    company_name: "",
    cnpj: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    logo_url: null
  });

  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // 1. Tenta carregar do Supabase (Prioridade)
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFormData({
          company_name: profile.company_name || user.user_metadata?.company_name || "",
          cnpj: profile.cnpj || "",
          phone: profile.phone || user.user_metadata?.whatsapp || "",
          cep: profile.cep || "",
          street: profile.street || "",
          number: profile.number || "",
          neighborhood: profile.neighborhood || "",
          city: profile.city || "",
          state: profile.state || "",
          logo_url: profile.logo_url || user.user_metadata?.avatar_url || null
        });
        setPreviewUrl(profile.logo_url || user.user_metadata?.avatar_url || null);
      } else {
        // Perfil ainda não existe — usa dados do cadastro
        setFormData(prev => ({
          ...prev,
          company_name: user.user_metadata?.company_name || "",
          phone: user.user_metadata?.whatsapp || "",
          logo_url: user.user_metadata?.avatar_url || null,
        }));
        setPreviewUrl(user.user_metadata?.avatar_url || null);
      }
    } else {
      // 2. Fallback: LocalStorage
      const localData = localStorage.getItem("orcasimples_dados_granulares");
      if (localData) {
        const parsed = JSON.parse(localData);
        setFormData(parsed);
        setPreviewUrl(parsed.logo_url);
      }
    }
    setLoading(false);
  }

  // --- BUSCA CEP (ViaCEP) ---
  const handleCepBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');

    if (cep.length === 8) {
      setCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
          // Foca no número após carregar
          document.getElementById("numberInput").focus();
        } else {
          toast.warning("CEP não encontrado.");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setCepLoading(false);
      }
    }
  };

  // --- VALIDAÇÃO CNPJ ---
  const validateCNPJ = (cnpj) => {
    const c = cnpj.replace(/\D/g, '');
    if (c.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(c)) return false;
    const calc = (weights) => {
      let sum = 0;
      for (let i = 0; i < weights.length; i++) sum += parseInt(c[i]) * weights[i];
      const r = sum % 11;
      return r < 2 ? 0 : 11 - r;
    };
    const d1 = calc([5,4,3,2,9,8,7,6,5,4,3,2]);
    if (d1 !== parseInt(c[12])) return false;
    const d2 = calc([6,5,4,3,2,9,8,7,6,5,4,3,2]);
    return d2 === parseInt(c[13]);
  };

  // --- MÁSCARAS ---
  const formatCNPJ = (v) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').substr(0, 18);
  const formatPhone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substr(0, 15);
  const formatCEP = (v) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substr(0, 9);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cnpj') formattedValue = formatCNPJ(value);
    if (name === 'phone') formattedValue = formatPhone(value);
    if (name === 'cep') formattedValue = formatCEP(value);

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  // --- C5 / M9 FIX: Upload da logo para Supabase Storage (não base64) + revogar ObjectURL ---
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Mostra preview local imediatamente
    const objectUrl = URL.createObjectURL(file);
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(objectUrl);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split('.').pop();
      const path = `${user.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(path);

      // Atualiza o estado com a URL pública permanente (não base64)
      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      // Atualiza o preview para a URL pública (libera o blob da memória)
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(publicUrl);
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error);
      toast.error('Erro ao enviar a imagem. Tente novamente.');
      // Mantém o preview local em caso de erro
    }
  };

  // M9 FIX: garante limpeza do blob ao desmontar
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- SALVAR ---
  const handleSave = async () => {
    if (!formData.company_name.trim()) {
      toast.error("O nome da empresa é obrigatório.");
      return;
    }
    if (formData.cnpj && !validateCNPJ(formData.cnpj)) {
      toast.error("CNPJ inválido. Verifique os dígitos e tente novamente.");
      return;
    }

    setLoading(true);

    try {
      // 1. Monta o Endereço Completo (String única para o PDF ler facilmente)
      const fullAddress = `${formData.street}, ${formData.number}${formData.neighborhood ? ` - ${formData.neighborhood}` : ''} - ${formData.city}/${formData.state} - CEP: ${formData.cep}`;

      // 2. Prepara dados
      const profileData = {
        company_name: formData.company_name,
        cnpj: formData.cnpj,
        phone: formData.phone,
        // Dados granulares (para reabrir o form)
        cep: formData.cep,
        street: formData.street,
        number: formData.number,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        // Endereço completo (para o PDF)
        address: fullAddress,
        logo_url: formData.logo_url,
        updated_at: new Date()
      };

      // 3. Salva no Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('profiles').upsert({ id: user.id, ...profileData });
        if (error) throw error;
      }

      // 4. Salva no LocalStorage (Backup e Offline)
      localStorage.setItem("orcasimples_dados_granulares", JSON.stringify(formData));

      // Salva formato legado para o PDF
      localStorage.setItem("orcasimples_dados", JSON.stringify({
        ...profileData,
        nomeEmpresa: formData.company_name,
        telefone: formData.phone,
        logo: formData.logo_url
      }));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast.success("Dados salvos com sucesso!");

    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/app" className="text-gray-500 hover:text-gray-700">&larr; Voltar</Link>
        <h1 className="text-3xl font-bold text-gray-800">Dados da Empresa</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        {/* LOGO */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
            <h3 className="font-bold text-gray-700 mb-4">Sua Logo</h3>

            <div className="w-40 h-40 mx-auto bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden mb-4 relative group">
              {previewUrl ? (
                <img src={previewUrl} alt="Logo Preview" className="w-full h-full object-contain" />
              ) : (
                <span className="text-4xl text-gray-300">📷</span>
              )}
              <label htmlFor="logo-upload" className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-sm font-bold opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                Alterar
              </label>
            </div>

            <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <label htmlFor="logo-upload" className="text-sm text-blue-600 font-bold cursor-pointer hover:underline">
              {previewUrl ? "Trocar imagem" : "Carregar imagem"}
            </label>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="md:col-span-2 space-y-6">

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Informações Básicas</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                <input name="company_name" value={formData.company_name} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" placeholder="Ex: Soluções Elétricas LTDA" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ <span className="text-gray-400 text-xs font-normal">(Opcional)</span></label>
                  <input name="cnpj" value={formData.cnpj} onChange={handleChange} maxLength={18} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" placeholder="00.000.000/0000-00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Telefone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} maxLength={15} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" placeholder="(00) 00000-0000" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Endereço Completo</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <div className="relative">
                  <input name="cep" value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} maxLength={9} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" placeholder="00000-000" />
                  {cepLoading && <div className="absolute right-3 top-3.5 animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
                </div>
              </div>
              <div className="md:col-span-2 flex gap-4">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input name="city" value={formData.city} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg" />
                </div>
                <div className="w-20">
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <input name="state" value={formData.state} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-center" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
                <input name="street" value={formData.street} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" placeholder="Nome da rua" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº</label>
                <input id="numberInput" name="number" value={formData.number} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" placeholder="123" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <input name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" placeholder="Bairro" />
            </div>

          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className={`w-full text-white text-lg font-bold py-4 rounded-xl shadow-lg transition transform active:scale-95 flex justify-center items-center gap-2 ${saveSuccess ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700 hover:shadow-xl"}`}
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : saveSuccess ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Dados Salvos!
              </>
            ) : "Salvar Alterações"}
          </button>

        </div>
      </div>
    </div>
  );
}