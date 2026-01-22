import React, { useState, useRef } from "react"; // <--- 1. Adicionado useRef
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "../services/supabase";
import ReCAPTCHA from "react-google-recaptcha"; // <--- 2. Import do ReCAPTCHA

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // --- NOVO: Estado do Captcha ---
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);

  // Estado para a Logo
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Novos campos adicionados no estado
  const [formData, setFormData] = useState({
    personalName: "", // Nome da Pessoa (Dono)
    companyName: "",  // Nome da Empresa (Vai no PDF)
    address: "",      // Endereço (Vai no PDF)
    whatsapp: "",
    email: "",
    password: "",
    confirmPassword: "" // Campo de validação
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // --- NOVO: Validação do Captcha ---
    if (!captchaToken) {
        alert("Por favor, confirme que você não é um robô.");
        return;
    }

    // 1. Validação de Senha (Double Check)
    if (formData.password !== formData.confirmPassword) {
      alert("As senhas não conferem. Por favor, digite novamente.");
      return;
    }

    setLoading(true);

    try {
      // 2. Cria o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          captchaToken: captchaToken, // <--- Envia o token para o Supabase
          // Salvamos tudo no metadata para facilitar
          data: {
            full_name: formData.personalName,   // Nome do usuário
            company_name: formData.companyName, // Nome da empresa
            address: formData.address,          // Endereço
            whatsapp: formData.whatsapp,
            avatar_url: null 
          },
        },
      });

      if (authError) throw authError;

      const userId = authData.user?.id;

      // 3. Upload da Logo (se houver)
      if (userId && logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${userId}/logo.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(fileName, logoFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('company-logos')
            .getPublicUrl(fileName);

          // Atualiza o usuário com a URL da logo
          await supabase.auth.updateUser({
            data: { avatar_url: publicUrl }
          });
        }
      }

      // 4. Sucesso
      alert("Conta criada com sucesso! Bem-vindo ao UltraOrça.");
      navigate("/app");

    } catch (error) {
      console.error("Erro no cadastro:", error);
      alert(error.message || "Erro ao criar conta. Tente novamente.");
      
      // Reseta o captcha se der erro para o usuário tentar de novo
      if (captchaRef.current) captchaRef.current.reset();
      setCaptchaToken(null);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <Helmet>
        <title>Criar Conta | UltraOrça</title>
      </Helmet>

      {/* --- LADO ESQUERDO: FORMULÁRIO --- */}
      <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-12 lg:px-20 py-8 overflow-y-auto h-screen custom-scrollbar">
        
        {/* Botão Voltar */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition text-sm font-medium gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para o site
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto pb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dados da Empresa</h1>
          <p className="text-gray-500 mb-8">Preencha para que seus orçamentos já saiam prontos.</p>

          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* LOGO */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
              <div className="relative w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-gray-300">📷</span>
                )}
              </div>
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700">Logo da Empresa (Opcional)</label>
                <label className="cursor-pointer text-blue-600 text-xs font-bold hover:underline">
                  Carregar imagem
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
              </div>
            </div>

            {/* DADOS PESSOAIS E EMPRESA (Lado a Lado) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Seu Nome</label>
                <input
                  type="text"
                  name="personalName"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: João Silva"
                  value={formData.personalName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  name="companyName"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Silva Elétrica"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* ENDEREÇO */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Endereço Comercial</label>
              <input
                type="text"
                name="address"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Rua, Número, Bairro e Cidade"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            {/* CONTATO (Lado a Lado) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp</label>
                <input
                  type="tel"
                  name="whatsapp"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail (Login)</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* SENHAS (Lado a Lado) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Senha</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Mínimo 6 dígitos"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Confirmar Senha</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword 
                      ? "border-red-300 focus:ring-red-200" 
                      : "border-gray-200"
                  }`}
                  placeholder="Repita a senha"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* --- NOVO: RECAPTCHA --- */}
            <div className="flex justify-center mt-4">
                <ReCAPTCHA
                    ref={captchaRef}
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={(token) => setCaptchaToken(token)}
                />
            </div>

            <button
              type="submit"
              disabled={loading || !captchaToken} // Trava se não tiver token
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-lg mt-4 flex justify-center items-center gap-2 transform active:scale-[0.98] ${loading || !captchaToken ? "opacity-70 cursor-not-allowed bg-gray-400" : ""}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Criando cadastro...</span>
                </>
              ) : "Finalizar Cadastro →"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>

      {/* --- LADO DIREITO: VISUAL (Mantido igual) --- */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 to-slate-900 relative overflow-hidden items-center justify-center p-12 h-screen sticky top-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 max-w-lg text-white">
          <div className="mb-8 flex items-center gap-2">
             <span className="text-4xl">🚀</span>
             <span className="text-2xl font-bold">UltraOrça</span>
          </div>
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Tudo pronto para você trabalhar.
          </h2>
          <p className="text-blue-200 text-lg mb-8">
            Ao preencher seus dados ao lado, nós já configuramos o seu modelo de PDF automaticamente. Seu primeiro orçamento sai em menos de 1 minuto.
          </p>
          
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
             <div className="flex gap-4 items-start">
                <div className="bg-green-500/20 p-2 rounded-lg text-green-400">🛡️</div>
                <div>
                   <h3 className="font-bold text-white">Seus dados estão seguros</h3>
                   <p className="text-sm text-gray-400 mt-1">Seguimos rigorosos padrões de segurança e privacidade. Você está no controle.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}