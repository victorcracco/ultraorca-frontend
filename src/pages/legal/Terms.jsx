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
            Nossa ferramenta visa profissionalizar a apresentação de propostas comerciais.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">2. Responsabilidades</h3>
          <p>
            O usuário é inteiramente responsável pelos dados inseridos nos orçamentos. 
            O {APP_NAME} não se responsabiliza por erros de digitação ou acordos comerciais realizados entre o usuário e seus clientes.
          </p>
          <p className="bg-yellow-50 p-3 border-l-4 border-yellow-400 text-sm">
            <strong>Importante:</strong> Os documentos gerados são orçamentos e <strong>não substituem Nota Fiscal</strong>.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">3. Pagamentos</h3>
          <p>
            Oferecemos planos Mensais (R$ 19,99) e Anuais (R$ 199,00). A cobrança é recorrente e pode ser cancelada a qualquer momento pelo painel do usuário, interrompendo a renovação futura.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">4. Propriedade Intelectual</h3>
          <p>
            Todo o código e marca {APP_NAME} são de propriedade exclusiva. Os dados dos seus orçamentos pertencem a você.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6">5. Contato</h3>
          <p>
            Dúvidas? Fale conosco: <strong>{CONTACT_EMAIL}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}