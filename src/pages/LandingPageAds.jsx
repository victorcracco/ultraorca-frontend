import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PROFESSIONS = [
  "Eletricista",
  "Pintor",
  "Encanador",
  "Marceneiro",
  "Pedreiro",
  "Gesseiro",
  "Ar-condicionado",
];

const STATS = [
  { value: "2.800+", label: "Orçamentos gerados" },
  { value: "< 1 min", label: "Para criar um PDF" },
  { value: "4.9 ★", label: "Avaliação média" },
  { value: "R$ 0", label: "Para começar" },
];

const STEPS = [
  {
    number: "01",
    icon: "📋",
    title: "Preencha os dados",
    description: "Nome, serviço, itens e valores. Tudo em campos simples.",
  },
  {
    number: "02",
    icon: "💰",
    title: "Gere o PDF",
    description: "O sistema monta o orçamento com sua logo em segundos.",
  },
  {
    number: "03",
    icon: "📤",
    title: "Mande o link",
    description:
      "Compartilhe pelo WhatsApp. O cliente aceita online e você recebe a notificação.",
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MinimalHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <span className="text-xl font-extrabold text-blue-600 tracking-tight">
          🚀 UltraOrça
        </span>
        <Link
          to="/register"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors duration-150"
        >
          Começar Grátis
        </Link>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          ⚡ Grátis para começar — sem cartão
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
          Seu cliente fecha mais quando vê um orçamento profissional
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          Crie PDFs com logo, itens, total e prazo em menos de 1 minuto. Mande
          o link direto no WhatsApp.
        </p>

        {/* Primary CTA */}
        <Link
          to="/register"
          className="inline-block w-full sm:w-auto bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors duration-150 mb-4"
        >
          Criar meu primeiro orçamento grátis →
        </Link>

        {/* Trust line */}
        <p className="text-gray-400 text-sm mt-3">
          Mais de 2.800 orçamentos gerados • Sem cartão de crédito
        </p>

        {/* Profession tags */}
        <div className="flex flex-wrap justify-center gap-2 mt-10">
          {PROFESSIONS.map((p) => (
            <span
              key={p}
              className="bg-white/10 border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function BeforeAfterSection() {
  return (
    <section className="bg-white py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-12">
          A diferença que o cliente vê
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before — without UltraOrça */}
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h3 className="text-lg font-bold text-red-600 mb-4">
              ❌ Preço no WhatsApp
            </h3>

            {/* Simulated WhatsApp bubble */}
            <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4 mb-6 max-w-xs">
              <p className="font-mono text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {`oi, tá bom sim\nolha o serviço fica em torno\nde 800 a 1200 depende\ndo que precisar\nvc fala com minha esposa\nela passa os dados`}
              </p>
              <p className="text-right text-xs text-gray-400 mt-2">✓ 18:43</p>
            </div>

            {/* Problems list */}
            <ul className="space-y-2">
              {[
                "Sem logo nem identidade",
                "Sem descrição dos serviços",
                "Sem prazo nem condições",
                "Cliente não leva a sério",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-red-600 text-sm font-medium">
                  <span className="mt-0.5 shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* After — with UltraOrça */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <h3 className="text-lg font-bold text-blue-600 mb-4">
              ✅ PDF Profissional
            </h3>

            {/* Simulated PDF card */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6 text-sm">
              {/* PDF header */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <span className="font-extrabold text-blue-700 text-base">
                  🚀 João Elétrica
                </span>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                  ORÇAMENTO #047
                </span>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-gray-700 truncate">
                    Instalação de tomadas
                  </span>
                  <span className="text-gray-400 flex-1 border-b border-dotted border-gray-300 mx-1 mb-0.5" />
                  <span className="font-semibold text-gray-800 shrink-0">
                    R$ 380,00
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-gray-700 truncate">
                    Quadro de distribuição
                  </span>
                  <span className="text-gray-400 flex-1 border-b border-dotted border-gray-300 mx-1 mb-0.5" />
                  <span className="font-semibold text-gray-800 shrink-0">
                    R$ 520,00
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-extrabold text-blue-700 text-base">
                  R$ 900,00
                </span>
              </div>

              {/* Footer */}
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                Válido por 7 dias · Pagamento: 50% entrada
              </p>
            </div>

            {/* Benefits list */}
            <ul className="space-y-2">
              {[
                { text: "Logo e dados da empresa", color: "text-blue-600" },
                { text: "Itens detalhados com valores", color: "text-blue-600" },
                { text: "Prazo de validade e condições", color: "text-green-600" },
                { text: "Link para aceite online", color: "text-green-600" },
              ].map(({ text, color }) => (
                <li key={text} className={`flex items-start gap-2 text-sm font-medium ${color}`}>
                  <span className="mt-0.5 shrink-0">•</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="bg-gray-50 py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-12">
          3 passos. Menos de 1 minuto.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col items-start gap-4"
            >
              {/* Number badge */}
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-extrabold">{step.number}</span>
              </div>

              {/* Icon */}
              <span className="text-3xl">{step.icon}</span>

              {/* Content */}
              <div>
                <h3 className="font-bold text-gray-900 text-base mb-1">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="bg-white py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-200 shadow-sm bg-white p-6 text-center"
            >
              <p className="text-3xl font-extrabold text-blue-600 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Comece agora. É grátis.
        </h2>
        <p className="text-blue-100 text-lg mb-10">
          Sem cartão de crédito. Sem prazo. Cancela quando quiser.
        </p>
        <Link
          to="/register"
          className="inline-block w-full sm:w-auto bg-white hover:bg-gray-100 text-blue-600 font-bold px-8 py-4 rounded-xl text-lg transition-colors duration-150"
        >
          Criar minha conta grátis →
        </Link>
      </div>
    </section>
  );
}

function MinimalFooter() {
  return (
    <footer className="bg-gray-900 py-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto text-center text-sm text-gray-400 flex flex-wrap justify-center gap-1">
        <span>© 2025 UltraOrça</span>
        <span className="hidden sm:inline">·</span>
        <Link to="/terms" className="hover:text-white transition-colors">
          Termos
        </Link>
        <span>·</span>
        <Link to="/privacy" className="hover:text-white transition-colors">
          Privacidade
        </Link>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPageAds() {
  return (
    <>
      <Helmet>
        <title>UltraOrça — Orçamentos Profissionais em PDF para Prestadores de Serviço</title>
        <meta
          name="description"
          content="Crie orçamentos profissionais em PDF com logo, itens e total em menos de 1 minuto. Mande o link direto no WhatsApp. Grátis para começar."
        />
      </Helmet>

      <div className="min-h-screen font-sans">
        <MinimalHeader />
        <main>
          <HeroSection />
          <BeforeAfterSection />
          <HowItWorksSection />
          <StatsSection />
          <FinalCTASection />
        </main>
        <MinimalFooter />
      </div>
    </>
  );
}
