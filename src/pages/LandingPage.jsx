import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function LandingPage() {
  return (
    <div className="font-sans text-gray-800 bg-white">
      {/* --- SEO CONFIG --- */}
      <Helmet>
        <title>UltraOrça | Orçamentos Profissionais em PDF</title>
        <meta 
          name="description" 
          content="Crie orçamentos profissionais em PDF em segundos com o UltraOrça. Ideal para eletricistas, técnicos e freelancers. Teste grátis!" 
        />
        <meta name="keywords" content="orçamento pdf, gerador de orçamento, prestador de serviço, modelo de orçamento, ultraorca" />
      </Helmet>

      {/* --- HERO SECTION --- */}
      <header className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white pb-20 pt-6">
        <nav className="max-w-6xl mx-auto px-6 flex justify-between items-center mb-16">
          <div className="text-2xl font-bold tracking-tight flex items-center gap-2">
            🚀 UltraOrça
          </div>
          <div className="space-x-4">
            <Link to="/login" className="hover:text-blue-200 transition">Entrar</Link>
            <Link 
              to="/register" 
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full font-bold transition shadow-lg hover:shadow-xl"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Seus orçamentos prontos na velocidade <span className="text-green-400">Ultra</span>.
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Gere PDFs profissionais, envie pelo WhatsApp e feche mais serviços. Simples, rápido e direto ao ponto.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4 pt-4">
            <Link 
              to="/register" 
              className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-4 rounded-lg font-bold transition shadow-lg hover:shadow-green-500/50 transform hover:-translate-y-1"
            >
              Começar Agora
            </Link>
            <a href="#precos" className="bg-white/10 hover:bg-white/20 text-white text-lg px-8 py-4 rounded-lg font-semibold transition backdrop-blur-sm">
              Ver Planos
            </a>
          </div>
          <p className="text-sm text-blue-200 opacity-80">
            ✓ Sem cartão de crédito para testar &nbsp; • &nbsp; ✓ Cancele quando quiser
          </p>
        </div>
      </header>

      {/* --- VANTAGENS --- */}
      <section id="como-funciona" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Por que escolher o UltraOrça?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A ferramenta feita para quem não tem tempo a perder com planilhas complicadas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="⚡" 
              title="Ultra Rápido" 
              desc="Preencha os dados e gere o PDF instantaneamente. Menos tempo no computador, mais tempo trabalhando." 
            />
            <FeatureCard 
              icon="💼" 
              title="Mais Profissionalismo" 
              desc="Entregue propostas organizadas, com sua logo e cores. Passe confiança e justifique seu preço." 
            />
            <FeatureCard 
              icon="📲" 
              title="Pronto para WhatsApp" 
              desc="O PDF sai formatado perfeitamente para ser enviado direto no WhatsApp do seu cliente." 
            />
          </div>
        </div>
      </section>

      {/* --- PREÇOS (Atualizado) --- */}
      <section id="precos" className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Investimento que se paga no primeiro serviço</h2>
          <p className="text-center text-gray-500 mb-12">Escolha o plano ideal para você.</p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Mensal */}
            <div className="border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition relative flex flex-col">
              <h3 className="text-xl font-semibold text-gray-600">Mensal</h3>
              <div className="text-4xl font-bold text-gray-900 my-4">R$ 19,99<span className="text-lg font-normal text-gray-500">/mês</span></div>
              <p className="text-gray-400 text-sm mb-4">Menos de R$ 0,70 por dia.</p>
              <ul className="space-y-3 mb-8 text-gray-600 flex-grow">
                <li>✓ Orçamentos ilimitados</li>
                <li>✓ Todos os modelos de PDF</li>
                <li>✓ Histórico salvo na nuvem</li>
                <li>✓ Suporte via WhatsApp</li>
              </ul>
              <Link to="/register" className="w-full block text-center border-2 border-blue-600 text-blue-600 font-bold py-3 rounded-lg hover:bg-blue-50 transition">
                Assinar Mensal
              </Link>
            </div>

            {/* Anual (Destaque) */}
            <div className="border-2 border-green-500 rounded-2xl p-8 shadow-lg relative bg-green-50/30 flex flex-col">
              <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                MELHOR OPÇÃO
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Anual</h3>
              <div className="text-4xl font-bold text-gray-900 my-4">R$ 199,00<span className="text-lg font-normal text-gray-500">/ano</span></div>
              <p className="text-green-600 font-semibold text-sm mb-4">Economize R$ 40,00 (2 meses grátis)</p>
              <ul className="space-y-3 mb-8 text-gray-600 flex-grow">
                <li>✓ <strong>Tudo do plano mensal</strong></li>
                <li>✓ Sem preocupação com renovação</li>
                <li>✓ Acesso antecipado a novas funções</li>
              </ul>
              <Link to="/register" className="w-full block text-center bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition shadow-md">
                Assinar Anual
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-white text-xl font-bold mb-4">UltraOrça</div>
            <p className="text-sm">A ferramenta essencial para o prestador de serviço moderno.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white">Entrar</Link></li>
              <li><Link to="/register" className="hover:text-white">Criar Conta</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="hover:text-white">Termos de Uso</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Política de Privacidade</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contato</h4>
            <p className="text-sm">suporte@ultraorca.com.br</p>
          </div>
        </div>
        <div className="text-center mt-12 text-xs border-t border-gray-800 pt-8">
          © {new Date().getFullYear()} UltraOrça. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}