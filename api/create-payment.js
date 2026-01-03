import { createClient } from '@supabase/supabase-js';

// Conecta ao Supabase com privilégios de admin (SERVICE_ROLE) para poder salvar dados
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Agora recebemos também userId e planType
    const { 
      customerName, 
      customerCpf, 
      value, 
      description, 
      userId, 
      userEmail, 
      planType 
    } = req.body;

    // 1. Cria ou Busca Cliente no Asaas
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
    
    if (customerData.errors) {
        throw new Error("Erro no Cliente Asaas: " + customerData.errors[0].description);
    }

    // 2. CRUCIAL: Salva/Atualiza na tabela 'subscriptions' ANTES de cobrar
    // Assim, quando o webhook chegar, já sabemos quem é esse cliente
    const { error: dbError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        customer_id: customerData.id,
        plan_type: planType,
        status: 'pending', // Começa como pendente
        updated_at: new Date()
      }, { onConflict: 'user_id' }); // Se já existir, atualiza

    if (dbError) {
      console.error("Erro Supabase:", dbError);
      // Não vamos parar o pagamento por isso, mas é um erro grave
    }

    // 3. Cria a Cobrança
    const paymentResponse = await fetch(`${process.env.ASAAS_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': process.env.ASAAS_API_KEY
      },
      body: JSON.stringify({
        customer: customerData.id,
        billingType: "UNDEFINED",
        value: value,
        dueDate: new Date().toISOString().split('T')[0],
        description: description
      })
    });

    const paymentData = await paymentResponse.json();

    if (paymentData.errors) {
        throw new Error("Erro na Cobrança Asaas: " + paymentData.errors[0].description);
    }

    return res.status(200).json({
      success: true,
      invoiceUrl: paymentData.invoiceUrl 
    });

  } catch (error) {
    console.error("Erro Geral:", error);
    return res.status(500).json({ error: error.message });
  }
}