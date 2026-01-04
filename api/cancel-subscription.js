import { createClient } from '@supabase/supabase-js';

// Inicializa o Supabase com a chave secreta para poder alterar dados
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ESSA LINHA ABAIXO É A QUE ESTAVA FALTANDO OU COM ERRO
export default async function handler(req, res) {
  
  // Permite CORS (opcional, mas bom para garantir que o front acesse)
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

    if (!userId) {
      throw new Error("User ID is required");
    }

    // 1. Busca o ID do cliente no Asaas (customer_id) guardado no Supabase
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .select('customer_id')
      .eq('user_id', userId)
      .single();

    if (subError || !subData) {
      throw new Error("Assinatura não encontrada no banco de dados.");
    }

    const customerId = subData.customer_id;

    // 2. Avisa o Asaas para cancelar cobranças PENDENTES (Não pagas)
    // Isso impede que o cliente receba cobranças futuras se tiver parcelado
    
    // Lista as cobranças pendentes
    const listResponse = await fetch(`${process.env.ASAAS_URL}/payments?customer=${customerId}&status=PENDING`, {
      method: 'GET',
      headers: { 
        'access_token': process.env.ASAAS_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const listData = await listResponse.json();

    // Loop para deletar/cancelar cada cobrança pendente
    if (listData.data) {
        for (const payment of listData.data) {
            await fetch(`${process.env.ASAAS_URL}/payments/${payment.id}`, {
                method: 'DELETE',
                headers: { 'access_token': process.env.ASAAS_API_KEY }
            });
        }
    }

    // 3. Atualiza o status no Supabase para 'canceled'
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true, message: "Assinatura cancelada com sucesso." });

  } catch (error) {
    console.error("Erro ao cancelar:", error);
    return res.status(500).json({ error: error.message });
  }
}