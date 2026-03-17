import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const STATS = [
  { value: "2.800+", label: "Orçamentos gerados" },
  { value: "4.9★", label: "Avaliação média" },
  { value: "< 1 min", label: "Para criar um PDF" },
  { value: "100%", label: "Seguro e na nuvem" },
];

const FAQS = [
  {
    q: "Preciso de cartão de crédito para começar?",
    a: "Não. Você cria sua conta e já pode gerar até 3 orçamentos completamente grátis, sem precisar cadastrar nenhum meio de pagamento.",
  },
  {
    q: "Posso colocar o logo e as cores da minha empresa?",
    a: "Sim! No plano Profissional você personaliza logo, cor principal e escolhe entre 4 modelos diferentes de PDF. No plano Iniciante o layout é fixo.",
  },
  {
    q: "O PDF fica com cara de empresa de verdade?",
    a: "Exatamente esse é o ponto. O documento sai com seu nome, CNPJ, endereço, logo, tabela de itens e total formatado — idêntico ao que uma empresa grande enviaria.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sem fidelidade, sem multa. Cancele direto pelo painel com um clique e o plano continua ativo até o fim do período pago.",
  },
  {
    q: "Funciona no celular?",
    a: "Sim, o sistema é 100% responsivo e funciona em qualquer smartphone. No celular, o PDF é compartilhado direto pelo menu nativo do aparelho.",
  },
  {
    q: "Os dados dos meus clientes ficam seguros?",
    a: "Todos os dados são armazenados com criptografia em servidores de nível empresarial (Supabase / AWS). Seguimos a LGPD.",
  },
];

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="font-sans text-gray-800 bg-white selection:bg-blue-500 selection:text-white">
      <Helmet>
        <title>UltraOrça | Orçamentos Profissionais em Segundos</title>
        <meta
          name="description"
          content="O sistema definitivo para prestadores de serviço. Crie orçamentos em PDF, envie no WhatsApp e feche mais negócios."
        />
      </Helmet>

      {/* ─── HERO ─────────────────────────────────────────── */}
      <header className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

        {/* NAV */}
        <nav className="relative z-50 max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 text-2xl font-extrabold tracking-tighter">
            <span className="text-blue-400">🚀</span> UltraOrça
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium text-blue-100">
            <a href="#como-funciona" className="hover:text-white transition">Como funciona</a>
            <a href="#precos" className="hover:text-white transition">Planos</a>
            <a href="#faq" className="hover:text-white transition">Dúvidas</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="font-semibold text-white hover:text-blue-200 transition">Entrar</Link>
            <Link
              to="/register"
              className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transform"
            >
              Testar Grátis
            </Link>
          </div>

          <button className="md:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
            </svg>
          </button>
        </nav>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-slate-900/98 backdrop-blur-sm z-40 p-6 border-t border-white/10">
            <div className="flex flex-col gap-4 text-center font-medium text-lg">
              <a href="#como-funciona" onClick={() => setIsMobileMenuOpen(false)} className="text-blue-200 hover:text-white py-2">Como funciona</a>
              <a href="#precos" onClick={() => setIsMobileMenuOpen(false)} className="text-blue-200 hover:text-white py-2">Planos</a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-blue-200 hover:text-white py-2">Dúvidas</a>
              <hr className="border-white/10" />
              <Link to="/login" className="py-3 rounded-xl bg-white/10 text-white font-semibold">Entrar</Link>
              <Link to="/register" className="py-3 rounded-xl bg-blue-500 text-white font-bold">Criar Conta Grátis</Link>
            </div>
          </div>
        )}

        {/* HERO CONTENT */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-16 pb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-blue-200 text-sm font-medium mb-8 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Mais de 2.800 orçamentos gerados
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight">
            Orçamentos profissionais{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              em menos de 1 minuto.
            </span>
          </h1>

          <p className="text-xl text-blue-100/80 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Chega de mandar preço no WhatsApp sem formatação. Gere PDFs com sua marca, envie pro cliente e feche o negócio na hora.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link
              to="/register"
              className="bg-blue-500 hover:bg-blue-400 text-white text-lg px-8 py-4 rounded-xl font-bold transition shadow-xl shadow-blue-500/30 hover:-translate-y-1 transform"
            >
              Começar Grátis — Sem Cartão
            </Link>
            <a
              href="#como-funciona"
              className="bg-white/5 text-white border border-white/20 hover:bg-white/10 text-lg px-8 py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-300">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Ver como funciona
            </a>
          </div>

          {/* PROFISSÕES */}
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {["Eletricistas", "Encanadores", "Pintores", "Freelancers", "Montadores", "Maridos de Aluguel", "Marceneiros", "Arquitetos"].map((p) => (
              <span key={p} className="px-3 py-1.5 rounded-full bg-white/10 text-blue-200 text-xs font-semibold border border-white/10 hover:bg-white/20 transition cursor-default">
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* WAVE */}
        <div className="absolute bottom-0 left-0 w-full leading-[0] rotate-180">
          <svg className="relative block w-full h-[40px] md:h-[60px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#ffffff" />
          </svg>
        </div>
      </header>

      {/* ─── STATS BAR ────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-blue-600">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ANTES vs. DEPOIS ─────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">A diferença que o cliente percebe</h2>
            <p className="text-gray-500 text-lg">Um orçamento bonito transmite profissionalismo antes de você falar qualquer palavra.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* ANTES */}
            <div className="rounded-2xl border-2 border-red-100 bg-red-50/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold">✕</span>
                <p className="font-bold text-red-600 text-sm uppercase tracking-wide">Sem UltraOrça</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-red-100 font-mono text-sm text-gray-500 space-y-1 leading-relaxed">
                <p>serviço de instalacao - 150</p>
                <p>material - 80</p>
                <p>mao de obra - 200</p>
                <p className="pt-2 font-bold text-gray-700">total fica 430 reais</p>
                <p className="text-xs text-gray-400 pt-1">prazo 15 dias</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Sem logo</span>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Sem CNPJ</span>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Parece informal</span>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Facilita barganha</span>
              </div>
            </div>

            {/* DEPOIS */}
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/30 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">✓</span>
                <p className="font-bold text-blue-600 text-sm uppercase tracking-wide">Com UltraOrça</p>
              </div>
              <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-sm">
                <div className="bg-blue-600 p-3 flex justify-between items-center">
                  <div>
                    <p className="text-white text-xs font-bold">Silva Elétrica</p>
                    <p className="text-blue-200 text-[10px]">CNPJ 00.000.000/0001-00</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-xs font-bold">ORÇAMENTO #12</p>
                    <p className="text-blue-200 text-[10px]">Válido por 15 dias</p>
                  </div>
                </div>
                <div className="p-3">
                  <table className="w-full text-xs text-gray-700">
                    <thead><tr className="bg-gray-50 text-gray-400 text-[10px] uppercase"><th className="p-1.5 text-left">Serviço</th><th className="p-1.5 text-right">Total</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      <tr><td className="p-1.5">Instalação elétrica</td><td className="p-1.5 text-right font-medium">R$ 150,00</td></tr>
                      <tr><td className="p-1.5">Material</td><td className="p-1.5 text-right font-medium">R$ 80,00</td></tr>
                      <tr><td className="p-1.5">Mão de obra</td><td className="p-1.5 text-right font-medium">R$ 200,00</td></tr>
                    </tbody>
                  </table>
                  <div className="bg-blue-600 text-white text-xs font-bold flex justify-between p-2 rounded-lg mt-2">
                    <span>TOTAL</span><span>R$ 430,00</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Com logo</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">CNPJ visível</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Parece empresa</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Menos questionamento</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ────────────────────────────────── */}
      <section id="como-funciona" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-3">Como funciona</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simples como deve ser.</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Sem menus complexos. Você entra e faz — do zero ao PDF em menos de 1 minuto.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard number="01" title="Cadastre sua empresa" desc="Insira nome, logo e endereço uma única vez. Todos os orçamentos já saem com seus dados automaticamente." />
            <StepCard number="02" title="Adicione os serviços" desc="Descreva os itens, coloque as quantidades e valores. O sistema calcula o total na hora." />
            <StepCard number="03" title="Baixe e envie" desc="Um PDF profissional é gerado em segundos. Compartilhe direto pelo WhatsApp ou baixe para o e-mail." />
          </div>
        </div>
      </section>

      {/* ─── PREÇOS ───────────────────────────────────────── */}
      <section id="precos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-3">Planos</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Comece grátis, evolua quando quiser</h2>
            <p className="text-gray-500 text-lg">Sem fidelidade. Cancele a qualquer momento.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-5 max-w-6xl mx-auto items-end">

            {/* GRÁTIS */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition">
              <h3 className="text-lg font-bold text-gray-700 mb-1">Grátis</h3>
              <div className="my-5">
                <span className="text-4xl font-extrabold text-gray-900">R$ 0</span>
              </div>
              <p className="text-gray-400 text-sm mb-5 pb-5 border-b border-gray-100">Para testar sem compromisso.</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-7">
                <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> <strong>3 orçamentos</strong> no total</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> PDF profissional</li>
                <li className="flex gap-2 text-gray-300"><span>✕</span> Sem cadastro de produtos</li>
              </ul>
              <Link to="/register" className="block w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-center transition text-sm">
                Criar conta grátis
              </Link>
            </div>

            {/* INICIANTE */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Iniciante</h3>
              <div className="my-5">
                <span className="text-4xl font-extrabold text-gray-900">R$ 19,99</span>
                <span className="text-gray-500 text-sm">/mês</span>
              </div>
              <p className="text-gray-400 text-sm mb-5 pb-5 border-b border-gray-100">Para quem está começando.</p>
              <ul className="space-y-3 text-sm text-gray-700 mb-7">
                <li className="flex gap-2"><span className="text-blue-500 font-bold">✓</span> <strong>30 orçamentos</strong>/mês</li>
                <li className="flex gap-2"><span className="text-blue-500 font-bold">✓</span> Cadastro de produtos</li>
                <li className="flex gap-2"><span className="text-blue-500 font-bold">✓</span> PDF profissional</li>
                <li className="flex gap-2 text-gray-300"><span>✕</span> Personalização de cor</li>
              </ul>
              <Link to="/register" className="block w-full py-3 border-2 border-gray-200 hover:border-blue-400 text-gray-700 font-bold rounded-xl text-center transition text-sm">
                Começar
              </Link>
            </div>

            {/* PRO — DESTAQUE */}
            <div className="bg-gray-900 border-2 border-blue-500 rounded-3xl p-7 text-white shadow-2xl transform md:scale-105 relative z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-5 py-1.5 rounded-full uppercase tracking-wider shadow-lg whitespace-nowrap">
                ⭐ Mais escolhido
              </div>
              <h3 className="text-xl font-bold mt-3 mb-1">Profissional</h3>
              <div className="my-5 flex items-baseline gap-1 flex-wrap">
                <span className="text-4xl font-extrabold">R$</span>
                <span className="text-4xl font-extrabold">29,99</span>
                <span className="text-blue-200 text-sm">/mês</span>
              </div>
              <p className="text-blue-200/70 text-sm mb-5 pb-5 border-b border-white/10">Liberdade total para sua marca.</p>
              <ul className="space-y-3 text-sm text-white mb-8">
                <li className="flex gap-2"><span className="text-blue-400 font-bold">✓</span> <strong>Ilimitado</strong> de orçamentos</li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold">✓</span> Cadastro de produtos</li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold">✓</span> Escolha cor e modelo do PDF</li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold">✓</span> Link público para aceite</li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold">✓</span> Suporte prioritário</li>
              </ul>
              <Link to="/register" className="block w-full py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-center transition shadow-lg">
                Quero ser PRO
              </Link>
            </div>

            {/* ANUAL */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm hover:border-green-400 transition relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wide">
                Melhor custo
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Anual PRO</h3>
              <div className="my-5">
                <span className="text-4xl font-extrabold text-gray-900">R$ 299</span>
                <span className="text-gray-500 text-sm">/ano</span>
              </div>
              <p className="text-green-600 text-sm font-semibold mb-5 pb-5 border-b border-gray-100">= R$ 24,90/mês · 2 meses grátis</p>
              <ul className="space-y-3 text-sm text-gray-700 mb-7">
                <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> <strong>Tudo do PRO</strong></li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Pagamento único</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> 2 meses economizados</li>
              </ul>
              <Link to="/register" className="block w-full py-3 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-xl text-center transition text-sm">
                Assinar Anual
              </Link>
            </div>

          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            Todos os planos incluem cancelamento gratuito a qualquer momento. Sem taxa de saída.
          </p>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-3">Dúvidas frequentes</p>
            <h2 className="text-4xl font-bold text-gray-900">Perguntas comuns</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-5 flex justify-between items-center gap-4 hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-800">{faq.q}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-600 leading-relaxed text-sm border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-10 md:p-14 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

            <div className="relative z-10">
              <p className="text-blue-200 font-semibold uppercase tracking-widest text-sm mb-4">Comece agora</p>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                Seu próximo orçamento sai em menos de 1 minuto.
              </h2>
              <p className="text-blue-100/80 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                Crie sua conta agora, é grátis e não precisa de cartão de crédito.
              </p>
              <Link
                to="/register"
                className="inline-block bg-white text-blue-700 text-lg px-10 py-4 rounded-xl font-extrabold hover:bg-blue-50 transition shadow-xl hover:-translate-y-1 transform"
              >
                Criar Conta Gratuita →
              </Link>
              <p className="text-blue-200/60 text-sm mt-5">Sem cartão. Sem burocracia. Funciona em 2 minutos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────── */}
      <footer className="bg-gray-50 py-10 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <span className="text-2xl">🚀</span> UltraOrça
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-500">
            <Link to="/terms" className="hover:text-blue-600 transition">Termos de Uso</Link>
            <Link to="/privacy" className="hover:text-blue-600 transition">Privacidade</Link>
            <a href="https://www.instagram.com/ultraorcabr/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition">Instagram</a>
            <a href="mailto:suporte@ultraorca.com" className="hover:text-blue-600 transition">Contato</a>
          </div>

          <div className="text-gray-400 text-sm text-center md:text-right">
            <p>© 2026 UltraOrça. Feito no Brasil 🇧🇷</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ number, title, desc }) {
  return (
    <div className="relative p-8 rounded-3xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-xl transition-all duration-300 group">
      <div className="text-7xl font-black text-gray-100 absolute top-4 right-5 select-none group-hover:text-blue-50 transition-colors leading-none">
        {number}
      </div>
      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-extrabold text-lg mb-5 relative z-10 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        {number.replace("0", "")}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">{title}</h3>
      <p className="text-gray-500 leading-relaxed relative z-10 text-sm">{desc}</p>
    </div>
  );
}
