import { createClient } from '@supabase/supabase-js';

// Configura o Supabase com a chave ADMIN (Service Role) 
// para poder escrever na tabela sem estar logado como usuário
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ATENÇÃO: Você precisará pegar essa chave no painel
);

export default async function handler(req, res) {
  // 1. Segurança: Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Segurança básica: Verifica se tem token do Asaas (Opcional mas recomendado)
  const asaasToken = req.headers['asaas-access-token'];
  if (asaasToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
     // Por enquanto vamos deixar passar se não tiver token configurado, 
     // mas em produção isso é vital.
     // return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const event = req.body;
    
    // O Asaas manda vários tipos de evento. Queremos saber de PAGAMENTOS.
    // Tipos comuns: PAYMENT_CONFIRMED, PAYMENT_RECEIVED
    
    if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
      const payment = event.payment;
      const customerId = payment.customer; // ID do cliente no Asaas (cus_xxx)

      console.log(`💰 Pagamento recebido! Cliente: ${customerId}, Valor: ${payment.value}`);

      // 3. Achar o usuário no Supabase pelo customer_id do Asaas
      // (Isso assume que salvamos o customer_id na tabela subscriptions antes)
      // Se não tivermos o customer_id linkado, teremos que buscar pelo CPF/Email
      
      // Lógica Simplificada:
      // Vamos atualizar a tabela subscriptions baseada no customer_id
      
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'active',
          updated_at: new Date()
        })
        .eq('customer_id', customerId); // Atualiza quem tiver esse ID do Asaas

      if (error) throw error;
    } 
    
    else if (event.event === 'PAYMENT_OVERDUE') {
      // Se venceu e não pagou -> status: overdue
       await supabase
        .from('subscriptions')
        .update({ status: 'overdue' })
        .eq('customer_id', event.payment.customer);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("Erro Webhook:", error);
    return res.status(500).json({ error: error.message });
  }
}