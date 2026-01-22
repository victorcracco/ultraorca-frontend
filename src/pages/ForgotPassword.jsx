import { useState, useRef } from "react";
import { supabase } from "../services/supabase";
import { Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  
  // Referência para resetar o captcha se der erro
  const captchaRef = useRef(null);

  const handleReset = async (e) => {
    e.preventDefault();
    
    if (!captchaToken) {
      alert("Por favor, confirme que você não é um robô.");
      return;
    }

    setLoading(true);
    
    // Passamos o captchaToken para o Supabase
    // Isso garante segurança extra se você ativar 'Enable Captcha' no painel do Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.ultraorca.com.br/update-password',
      captchaToken: captchaToken
    });

    setLoading(false);
    
    // Reseta o captcha para obrigar validação se tentar de novo
    if (captchaRef.current) captchaRef.current.reset();
    setCaptchaToken(null);

    if (error) {
        // Tratamento para evitar dar dicas se o email não existe (Segurança)
        // Mas se for erro de captcha, o Supabase avisa
        alert("Erro: " + error.message);
    } else {
        alert("Se este e-mail estiver cadastrado, você receberá um link em instantes.");
        setEmail(""); // Limpa o campo
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Recuperar Senha</h1>
        <p className="text-gray-500 mb-6">Digite seu e-mail para receber o link.</p>
        
        <form onSubmit={handleReset} className="space-y-4">
          <input 
            type="email" 
            placeholder="seu@email.com" 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={email} onChange={e => setEmail(e.target.value)} required
          />
          
          {/* ÁREA DO RECAPTCHA */}
          <div className="flex justify-center">
            <ReCAPTCHA
                ref={captchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
            />
          </div>

          <button 
            disabled={loading || !captchaToken} 
            className={`w-full p-3 rounded-lg font-bold text-white transition ${
                loading || !captchaToken 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Enviando..." : "Enviar Link"}
          </button>
        </form>
        <Link to="/login" className="block text-center mt-4 text-sm text-gray-500 hover:underline">Voltar ao Login</Link>
      </div>
    </div>
  );
}