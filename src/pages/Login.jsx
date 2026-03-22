import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "../services/supabase";
import ReCAPTCHA from "react-google-recaptcha";
import { useToast } from "../components/Toast";

const RECAPTCHA_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Se não há chave configurada, captcha é ignorado (dev/sem chave)
  const [captchaToken, setCaptchaToken] = useState(RECAPTCHA_KEY ? null : "bypass");
  const captchaRef = useRef(null);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (RECAPTCHA_KEY && !captchaToken) {
      toast.error("Confirme que você não é um robô.");
      return;
    }

    setLoading(true);
    setLoginError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: RECAPTCHA_KEY ? { captchaToken } : undefined,
      });

      if (error) throw error;
      navigate("/app");

    } catch (error) {
      console.error("Erro login:", error);
      const msg = "E-mail ou senha incorretos. Verifique seus dados.";
      setLoginError(msg);
      toast.error(msg);

      if (captchaRef.current) captchaRef.current.reset();
      setCaptchaToken(RECAPTCHA_KEY ? null : "bypass");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <Helmet>
        <title>Entrar | UltraOrça</title>
      </Helmet>

      {/* --- LADO ESQUERDO: FORMULÁRIO --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative">
        
        {/* Botão Voltar */}
        <div className="absolute top-8 left-8 sm:left-12 lg:left-24">
          <Link to="/" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition text-sm font-medium gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto mt-10">
          <div className="mb-10">
            <Link to="/" className="text-2xl font-extrabold tracking-tighter text-blue-900 flex items-center gap-2">
              <span className="text-3xl">🚀</span> UltraOrça
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo de volta!</h1>
          <p className="text-gray-500 mb-8">Acesse sua conta para gerenciar seus orçamentos.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setLoginError(""); }}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-gray-700">Senha</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
              />
            </div>

            {/* ReCAPTCHA — só renderiza se a chave estiver configurada */}
            {RECAPTCHA_KEY && (
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={captchaRef}
                  sitekey={RECAPTCHA_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !captchaToken}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-lg hover:shadow-blue-200 flex justify-center items-center gap-2 transform active:scale-[0.98] ${loading || !captchaToken ? "opacity-70 cursor-not-allowed bg-gray-400" : ""}`}
            >
              {loading ? (
                 <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Entrando...</span>
                </>
              ) : "Acessar Painel →"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Ainda não tem conta?{" "}
            <Link to="/register" className="text-blue-600 font-bold hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 to-blue-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 max-w-lg text-white">
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Continue fechando negócios.
          </h2>
          <p className="text-blue-200 text-lg mb-8 leading-relaxed">
            Seu painel administrativo centraliza todos os orçamentos, clientes e histórico financeiro. Mantenha o foco no que importa: executar o serviço.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <div className="text-2xl mb-2">📄</div>
                <div className="font-bold">Meus Orçamentos</div>
                <div className="text-xs text-blue-200">Acesse e edite</div>
             </div>
             <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <div className="text-2xl mb-2">💎</div>
                <div className="font-bold">Assinatura</div>
                <div className="text-xs text-blue-200">Gerencie seu plano</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}