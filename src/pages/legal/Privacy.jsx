import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function Privacy() {
  const APP_NAME = "UltraOrça";
  const CONTACT_EMAIL = "suporte@ultraorca.com.br";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Política de Privacidade | {APP_NAME}</title>
      </Helmet>

      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="mb-6 border-b pb-4">
          <Link to="/" className="text-blue-600 text-sm hover:underline">← Voltar para o início</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Política de Privacidade</h1>
          <p className="text-gray-500 text-sm">Em conformidade com a LGPD</p>
        </div>

        <div className="prose prose-blue max-w-none text-gray-700 space-y-4">
          <p>
            Sua privacidade é prioridade no <strong>{APP_NAME}</strong>. Esta política descreve como tratamos seus dados pessoais e financeiros.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">1. Coleta de Dados Pessoais</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Cadastro:</strong> Coletamos seu Nome, E-mail, Telefone (WhatsApp) e CPF para criar sua conta e emitir suas cobranças de assinatura.</li>
            <li><strong>Seus Clientes:</strong> Os dados que você insere nos orçamentos (nome do cliente, endereço, valores) são armazenados para formar seu histórico. Nós não entramos em contato com seus clientes.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">2. Dados Financeiros e Sensíveis</h3>
          <p className="bg-green-50 p-3 border-l-4 border-green-500 text-sm">
            <strong>Nós NÃO armazenamos dados completos do seu cartão de crédito.</strong>
          </p>
          <p>
            Para processar pagamentos, utilizamos gateways seguros de nível mundial: <strong>Stripe</strong> (para cartões) e <strong>Asaas</strong> (para PIX/Boletos).
            Quando você assina um plano, seus dados de pagamento são enviados diretamente e de forma criptografada para estes parceiros.
            O {APP_NAME} recebe apenas a confirmação de que o pagamento foi realizado e tokens de segurança para renovação.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">3. Uso das Informações</h3>
          <p>
            Utilizamos seus dados para manter o serviço funcionando, liberar seu acesso após o pagamento, enviar notificações de renovação e prestar suporte técnico.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">4. Compartilhamento</h3>
          <p>
            Seus dados pessoais nunca são vendidos. Compartilhamos estritamente o necessário com:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Processadores de Pagamento:</strong> Stripe e Asaas, para viabilizar as cobranças.</li>
            <li><strong>Infraestrutura:</strong> Servidores de hospedagem seguros (como Vercel e Supabase) para manter o site online.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">5. Seus Direitos e Exclusão</h3>
          <p>
            Você é o dono dos seus dados. A qualquer momento, você pode solicitar a exportação ou exclusão completa da sua conta e de todos os orçamentos gerados, enviando um e-mail para <strong>{CONTACT_EMAIL}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}