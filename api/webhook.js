import { createClient } from '@supabase/supabase-js';

// Conecta com permissão total (Service Role) para atualizar o banco
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // 1. Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    
    // Logs para você acompanhar na Vercel o que está chegando
    console.log("🔔 Evento Asaas Recebido:", event.event);

    // Eventos de Pagamento Confirmado (Pix, Boleto ou Cartão)
    if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
      const payment = event.payment;
      const customerId = payment.customer; 

      // Atualiza o status no banco de dados
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'active',
          updated_at: new Date()
        })
        .eq('customer_id', customerId); // Busca quem tem esse ID de cliente

      if (error) {
        console.error("❌ Erro ao atualizar Supabase:", error);
        throw error;
      }
      
      console.log(`✅ Cliente ${customerId} ativado com sucesso!`);
    } 
    
    // Se o pagamento vencer ou for estornado
    else if (event.event === 'PAYMENT_OVERDUE' || event.event === 'PAYMENT_REFUNDED') {
       await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('customer_id', event.payment.customer);
       
       console.log(`🚫 Assinatura cancelada/vencida para ${event.payment.customer}`);
    }

    // O Asaas exige que retornemos status 200
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("Erro Webhook:", error);
    return res.status(500).json({ error: error.message });
  }
}