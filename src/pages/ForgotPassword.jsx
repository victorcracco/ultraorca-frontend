import { useState, useRef } from "react";
import { supabase } from "../services/supabase";
import { Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { useToast } from "../components/Toast";

const RECAPTCHA_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const ERROR_MESSAGES = {
  "User not found": "E-mail não encontrado em nossa base.",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos.",
  "For security purposes, you can only request this once every 60 seconds":
    "Aguarde 60 segundos antes de solicitar novamente.",
};

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(RECAPTCHA_KEY ? null : "bypass");
  const captchaRef = useRef(null);

  const handleReset = async (e) => {
    e.preventDefault();

    if (RECAPTCHA_KEY && !captchaToken) {
      toast.error("Por favor, confirme que você não é um robô.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
      ...(RECAPTCHA_KEY ? { captchaToken } : {}),
    });

    setLoading(false);

    if (captchaRef.current) captchaRef.current.reset();
    setCaptchaToken(RECAPTCHA_KEY ? null : "bypass");

    if (error) {
      const friendlyMsg = ERROR_MESSAGES[error.message] || "Erro ao enviar o link. Tente novamente.";
      toast.error(friendlyMsg);
    } else {
      toast.success("Se este e-mail estiver cadastrado, você receberá o link em instantes.");
      setEmail("");
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

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
            disabled={loading || !captchaToken}
            className={`w-full p-3 rounded-lg font-bold text-white transition ${
              loading || !captchaToken ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Enviando..." : "Enviar Link"}
          </button>
        </form>

        <Link to="/login" className="block text-center mt-4 text-sm text-gray-500 hover:underline">
          Voltar ao Login
        </Link>
      </div>
    </div>
  );
}
