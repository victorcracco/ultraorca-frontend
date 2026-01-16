import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lista de profissões (SEM "Técnicos")
  const professions = [
    "Eletricistas", 
    "Freelancers", 
    "Montadores",
    "Maridos de Aluguel",
    "Prestadores de Serviço"
  ];

  return (
    <div className="font-sans text-gray-800 bg-white selection:bg-blue-500 selection:text-white">
      <Helmet>
        <title>UltraOrça | Orçamentos Profissionais em Segundos</title>
        <meta 
          name="description" 
          content="O sistema definitivo para prestadores de serviço. Crie orçamentos em PDF, envie no WhatsApp e feche mais negócios." 
        />
      </Helmet>

      {/* --- HERO SECTION DARK --- */}
      <header className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden pb-12">
        {/* Padrão de fundo sutil */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        {/* NAVBAR */}
        <nav className="relative z-50 max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
          <div className="flex items-center gap-2 text-2xl font-extrabold tracking-tighter cursor-pointer">
            <span className="text-blue-400">🚀</span> UltraOrça
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 font-medium text-blue-100">
            <a href="#como-funciona" className="hover:text-white transition">Como funciona</a>
            <a href="#precos" className="hover:text-white transition">Planos</a>
            <a href="#faq" className="hover:text-white transition">Dúvidas</a>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="font-semibold text-white hover:text-blue-200 transition">Entrar</Link>
            <Link 
              to="/register" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
            >
              Testar Grátis
            </Link>
          </div>

           {/* Mobile Menu Button */}
           <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </nav>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-24 left-0 w-full bg-blue-900/95 backdrop-blur-sm z-40 p-6 border-t border-blue-800 animate-fade-in-down">
             <div className="flex flex-col gap-6 text-center font-medium text-lg">
                <a href="#como-funciona" onClick={()=>setIsMobileMenuOpen(false)}>Como funciona</a>
                <a href="#precos" onClick={()=>setIsMobileMenuOpen(false)}>Planos</a>
                <Link to="/login" className="bg-white/10 py-2 rounded-lg">Entrar</Link>
                <Link to="/register" className="bg-blue-500 py-2 rounded-lg">Criar Conta</Link>
             </div>
          </div>
        )}

        {/* HERO CONTENT */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-12 pb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-blue-200 text-sm font-medium mb-8 border border-white/20 animate-fade-in-up">
            <span className="animate-pulse">✨</span> A ferramenta nº 1 para prestadores de serviço
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight animate-fade-in-up delay-100">
            Profissionalize seus orçamentos e <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">feche mais negócios.</span>
          </h1>
          
          <p className="text-xl text-blue-100/80 max-w-2xl mx-auto mb-8 leading-relaxed font-light animate-fade-in-up delay-200">
            Chega de enviar preços pelo WhatsApp sem formatação. Crie PDFs incríveis com sua marca em segundos e passe confiança para o cliente.
          </p>

          {/* LISTA DE PROFISSÕES (Restaurada, sem 'Técnicos') */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-in-up delay-300 max-w-3xl mx-auto">
            {professions.map((item, index) => (
              <span key={index} className="px-4 py-2 rounded-full bg-white/10 text-blue-200 text-sm font-semibold border border-white/10 backdrop-blur-sm hover:bg-white/20 transition cursor-default">
                {item}
              </span>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-5 animate-fade-in-up delay-500">
            <Link 
              to="/register" 
              className="bg-blue-500 hover:bg-blue-600 text-white text-lg px-8 py-4 rounded-xl font-bold transition shadow-xl shadow-blue-500/30 transform hover:-translate-y-1"
            >
              Começar Agora (É Grátis)
            </Link>
            <a 
              href="#como-funciona" 
              className="bg-white/5 text-white border border-white/20 hover:bg-white/10 text-lg px-8 py-4 rounded-xl font-bold transition flex items-center justify-center gap-3 backdrop-blur-sm"
            >
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
               Ver vídeo rápido
            </a>
          </div>
        </div>

        {/* Onda de transição (Altura Reduzida) */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] rotate-180">
            <svg className="relative block w-full h-[30px] md:h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#ffffff"></path>
            </svg>
        </div>
      </header>

      {/* --- FEATURES --- */}
      <section id="como-funciona" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
             <h2 className="text-gray-400 font-bold tracking-widest uppercase text-sm mb-4">Como funciona</h2>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Simples como deve ser.</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Focamos no essencial. Sem menus complexos ou configurações difíceis. Você entra e faz.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard 
              number="01"
              title="Cadastre seus dados" 
              desc="Insira as informações da sua empresa, sua logo e escolha a cor principal do documento uma única vez." 
            />
            <FeatureCard 
              number="02"
              title="Adicione os itens" 
              desc="Descreva os serviços ou produtos, quantidades e valores. O sistema calcula o total automaticamente." 
            />
            <FeatureCard 
              number="03"
              title="Baixe o PDF" 
              desc="Pronto! Um documento profissional é gerado na hora, perfeito para enviar por WhatsApp ou e-mail." 
            />
          </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="precos" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Planos para cada fase do seu negócio</h2>
            <p className="text-gray-600 text-lg">Evolua seu plano conforme sua demanda aumenta.</p>
          </div>
          
          {/* Grid de Preços */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-end">
            
            {/* PLANO BÁSICO */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition h-fit">
              <h3 className="text-xl font-bold text-gray-900">Iniciante</h3>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-gray-900">R$ 19,99</span>
                <span className="text-gray-500">/mês</span>
              </div>
              <p className="text-gray-500 text-sm mb-6 pb-6 border-b border-gray-100">Para quem faz poucos orçamentos por semana.</p>
              <ul className="space-y-4 text-sm text-gray-700 mb-8">
                <li className="flex gap-3"><span className="text-blue-500">✓</span> <strong>30 orçamentos</strong>/mês</li>
                <li className="flex gap-3"><span className="text-blue-500">✓</span> Cadastro de Clientes</li>
                <li className="flex gap-3"><span className="text-blue-500">✓</span> PDF Profissional</li>
                <li className="flex gap-3 text-gray-400"><span className="text-gray-300">✕</span> Sem cadastro de produtos</li>
              </ul>
               <Link to="/register" className="block w-full py-3 px-6 bg-white border-2 border-gray-200 hover:border-gray-400 text-gray-700 font-bold rounded-xl text-center transition">
                Começar
              </Link>
            </div>

            {/* PLANO PRO (DESTAQUE) */}
            <div className="bg-gray-900 border-2 border-blue-500 rounded-3xl p-8 text-white shadow-2xl transform scale-105 relative z-10 h-full pb-12">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-sm font-bold px-6 py-2 rounded-full uppercase tracking-wider shadow-lg">
                Recomendado
              </div>
              <h3 className="text-2xl font-bold mt-4">Profissional</h3>
              <div className="my-6">
                <span className="text-5xl font-extrabold">R$ 29,99</span>
                <span className="text-blue-200">/mês</span>
              </div>
              <p className="text-blue-200/80 text-sm mb-6 pb-6 border-b border-white/10">A escolha certa para quem quer crescer sem travas.</p>
              <ul className="space-y-4 text-sm text-white mb-10 font-medium">
                <li className="flex gap-3"><span className="text-blue-400">✓</span> <strong>Orçamentos ILIMITADOS</strong></li>
                <li className="flex gap-3"><span className="text-blue-400">✓</span> Cadastro de Produtos/Serviços</li>
                <li className="flex gap-3"><span className="text-blue-400">✓</span> Remoção da marca "Feito com..."</li>
                <li className="flex gap-3"><span className="text-blue-400">✓</span> Suporte Prioritário</li>
              </ul>
              <Link to="/register" className="block w-full py-4 px-6 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-center transition shadow-lg shadow-blue-500/20">
                Quero ser PRO
              </Link>
            </div>

            {/* PLANO ANUAL */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:border-green-400 transition h-fit relative overflow-hidden">
              <div className="absolute top-0 right-0 text-white bg-green-500 px-3 py-1 rounded-bl-xl text-xs font-bold">
                MAIOR DESCONTO
              </div>
              <h3 className="text-xl font-bold text-gray-900">Anual PRO</h3>
               <div className="my-6">
                <span className="text-4xl font-extrabold text-gray-900">R$ 299</span>
                <span className="text-gray-500">/ano</span>
              </div>
               <p className="text-green-600 text-sm mb-6 pb-6 border-b border-gray-100 font-medium">Equivalente a R$ 24,90/mês.</p>
              
              <ul className="space-y-4 text-sm text-gray-700 mb-8">
                <li className="flex gap-3"><span className="text-green-500">✓</span> <strong>Todos os recursos PRO</strong></li>
                <li className="flex gap-3"><span className="text-green-500">✓</span> 2 meses grátis</li>
                <li className="flex gap-3"><span className="text-green-500">✓</span> Pagamento único</li>
              </ul>
               <Link to="/register" className="block w-full py-3 px-6 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-xl text-center transition">
                Assinar Anual
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-24 bg-white">
         <div className="max-w-4xl mx-auto px-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-center text-white shadow-2xl relative overflow-hidden">
                {/* Bolhas de fundo */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl"></div>

                <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">Faça seu primeiro orçamento profissional agora.</h2>
                <p className="text-blue-100 text-lg mb-10 relative z-10 max-w-xl mx-auto">Leva menos de 2 minutos e você não precisa colocar cartão de crédito para começar.</p>
                <Link to="/register" className="relative z-10 inline-block bg-white text-blue-900 text-xl px-12 py-5 rounded-xl font-bold hover:bg-blue-50 transition shadow-xl transform hover:-translate-y-1">
                  Criar Conta Gratuita
                </Link>
            </div>
         </div>
      </section>

 {/* --- FOOTER --- */}
      <footer className="bg-gray-50 py-12 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Logo */}
          <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
             <span className="text-2xl">🚀</span> UltraOrça
          </div>

          {/* Links Centrais */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm font-medium text-gray-600">
            <Link to="/terms" className="hover:text-blue-600 transition">Termos de Uso</Link>
            <Link to="/privacy" className="hover:text-blue-600 transition">Privacidade</Link>
            
            {/* INSTAGRAM (Novo) */}
            <a 
              href="https://www.instagram.com/ultraorcabr/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-blue-600 transition flex items-center gap-1"
            >
              Instagram
            </a>

            <a href="mailto:suporte@ultraorca.com" className="hover:text-blue-600 transition">Contato</a>
          </div>

          {/* Copyright e Créditos */}
          <div className="text-gray-400 text-sm text-center md:text-right">
             <p>© 2024 UltraOrça. Feito no Brasil 🇧🇷</p>
             <p className="text-xs mt-1">
               Desenvolvido por <a href="https://www.devstarter.com.br/" target="_blank" rel="noopener noreferrer" className="font-bold text-gray-500 hover:text-blue-600 transition">DevStarter</a>
             </p>
          </div>

        </div>
      </footer>
    </div>
  );
}

// Componente de Feature
function FeatureCard({ number, title, desc }) {
  return (
    <div className="relative p-8 rounded-3xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-xl transition-all duration-300 group">
      <div className="text-6xl font-black text-gray-100 absolute top-4 right-6 select-none group-hover:text-blue-50 transition-colors">
         {number}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-4 relative z-10">{title}</h3>
      <p className="text-gray-600 leading-relaxed relative z-10">{desc}</p>
    </div>
  );
}