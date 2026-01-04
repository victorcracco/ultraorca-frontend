import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS (Permite que seu site acesse essa API)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      userId, 
      userEmail, 
      customerName, 
      customerCpf, 
      value, 
      description, 
      planType 
    } = req.body;

    // 1. Verifica/Cria o Cliente no Asaas
    // (Para simplificar, vamos criar um novo sempre ou você pode buscar pelo CPF antes se quiser otimizar)
    const customerResponse = await fetch(`${process.env.ASAAS_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': process.env.ASAAS_API_KEY
      },
      body: JSON.stringify({
        name: customerName,
        cpfCnpj: customerCpf,
        email: userEmail
      })
    });

    const customerData = await customerResponse.json();
    
    // Se der erro ao criar cliente (ex: CPF inválido), retorna o erro
    if (customerData.errors) {
      throw new Error(customerData.errors[0].description);
    }
    
    // Se o cliente já existe, o Asaas retorna o ID dele mesmo assim, ou pegamos do 'id' criado
    const asaasCustomerId = customerData.id;

    // 2. Cria a Cobrança no Asaas com REDIRECIONAMENTO (Callback)
    const paymentBody = {
      customer: asaasCustomerId,
      billingType: "UNDEFINED", // Deixa o cliente escolher (Pix, Cartão, Boleto)
      value: value,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Vence em 3 dias
      description: description,
      // AQUI ESTÁ A MÁGICA DO REDIRECIONAMENTO 👇
      callback: {
        successUrl: "https://ultraorca-frontend.vercel.app/app/subscription", // Para onde ele volta
        autoRedirect: true // Força a volta automática
      }
    };

    const paymentResponse = await fetch(`${process.env.ASAAS_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': process.env.ASAAS_API_KEY
      },
      body: JSON.stringify(paymentBody)
    });

    const paymentData = await paymentResponse.json();

    if (paymentData.errors) {
      throw new Error(paymentData.errors[0].description);
    }

    // 3. Salva no Banco de Dados como "PENDING"
    // Isso garante que você tenha o registro mesmo antes do Webhook chegar
    const { error: dbError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        customer_id: asaasCustomerId,
        status: 'pending', // Começa pendente
        plan_type: planType,
        updated_at: new Date()
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error("Erro ao salvar no banco:", dbError);
      // Não paramos o fluxo se der erro no banco, pois o link de pagamento já foi gerado
    }

    // 4. Retorna o Link para o Frontend
    return res.status(200).json({ 
      invoiceUrl: paymentData.invoiceUrl 
    });

  } catch (error) {
    console.error("Erro API Pagamento:", error);
    return res.status(500).json({ error: error.message });
  }
}