import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function Terms() {
  const APP_NAME = "UltraOrça";
  const CONTACT_EMAIL = "suporte@ultraorca.com.br";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Termos de Uso | {APP_NAME}</title>
      </Helmet>
      
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="mb-6 border-b pb-4">
          <Link to="/" className="text-blue-600 text-sm hover:underline">← Voltar para o início</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Termos de Uso</h1>
          <p className="text-gray-500 text-sm">Última atualização: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-blue max-w-none text-gray-700 space-y-4">
          <p>
            Bem-vindo ao <strong>{APP_NAME}</strong>. Ao acessar e utilizar nosso sistema (hospedado em ultraorca.com.br), você concorda com os termos descritos abaixo.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">1. O Serviço</h3>
          <p>
            O {APP_NAME} é uma plataforma SaaS que permite a criação, edição e exportação de orçamentos em formato PDF. 
            Nossa ferramenta visa profissionalizar a apresentação de propostas comerciais de autônomos e pequenas empresas.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">2. Responsabilidades</h3>
          <p>
            O usuário é inteiramente responsável pelos dados inseridos nos orçamentos. 
            O {APP_NAME} não se responsabiliza por erros de digitação, cálculos incorretos inseridos manualmente ou acordos comerciais realizados entre o usuário e seus clientes.
          </p>
          <p className="bg-yellow-50 p-3 border-l-4 border-yellow-400 text-sm">
            <strong>Importante:</strong> Os documentos gerados são orçamentos comerciais e <strong>não substituem Nota Fiscal</strong> ou documentos tributários oficiais.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">3. Pagamentos e Cancelamento</h3>
          <p>
            Oferecemos planos de assinatura (Mensais ou Anuais). A cobrança é recorrente (automática no cartão ou via envio de boleto/pix).
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Cancelamento:</strong> Você pode cancelar a qualquer momento pelo painel do usuário. O cancelamento interrompe a renovação futura, mas o acesso permanece ativo até o fim do período já pago.</li>
            <li><strong>Reembolso:</strong> Não oferecemos reembolso para períodos parciais não utilizados (ex: cancelamento no meio do mês), exceto nos casos previstos pelo Código de Defesa do Consumidor (7 dias após a primeira compra).</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">4. Propriedade Intelectual</h3>
          <p>
            Todo o código, design e marca {APP_NAME} são de propriedade exclusiva. Os dados dos seus orçamentos (textos e valores) pertencem a você.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">5. Disponibilidade</h3>
          <p>
            Nos esforçamos para manter o sistema online 99.9% do tempo, mas não nos responsabilizamos por interrupções temporárias causadas por manutenção, falhas de provedores de internet ou eventos de força maior.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">6. Foro</h3>
          <p>
            Fica eleito o foro da comarca de Bauru/SP (ou sua cidade), para dirimir quaisquer dúvidas oriundas deste termo.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">7. Contato</h3>
          <p>
            Dúvidas? Fale conosco: <strong>{CONTACT_EMAIL}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}