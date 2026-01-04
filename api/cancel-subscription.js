import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Configuração CORS
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
    const { userId } = req.body;

    if (!userId) throw new Error("User ID is required");

    // 1. Busca dados da assinatura
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .select('customer_id')
      .eq('user_id', userId)
      .single();

    if (subError || !subData) throw new Error("Assinatura não encontrada.");

    const customerId = subData.customer_id;

    // 2. Busca cobranças pendentes no Asaas
    const listResponse = await fetch(`${process.env.ASAAS_URL}/payments?customer=${customerId}&status=PENDING`, {
      method: 'GET',
      headers: { 
        'access_token': process.env.ASAAS_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const listData = await listResponse.json();

    // 3. Cancela cada cobrança pendente
    if (listData.data) {
        for (const payment of listData.data) {
            await fetch(`${process.env.ASAAS_URL}/payments/${payment.id}`, {
                method: 'DELETE',
                headers: { 'access_token': process.env.ASAAS_API_KEY }
            });
        }
    }

    // 4. Atualiza status no banco
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Erro API Cancelar:", error);
    return res.status(500).json({ error: error.message });
  }
}