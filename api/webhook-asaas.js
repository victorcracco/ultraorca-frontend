import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { event, payment } = req.body;
  
  const eventosDeSucesso = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'];

  if (eventosDeSucesso.includes(event)) {
    const userId = payment.externalReference;
    const subscriptionId = payment.subscription;
    
    let planType = 'pro';
    if (payment.description && payment.description.toLowerCase().includes('starter')) planType = 'starter';
    if (payment.description && payment.description.toLowerCase().includes('anual')) planType = 'annual';

    if (userId) {
      console.log(`💠 Pagamento Asaas confirmado para User: ${userId}`);

      // ATUALIZAÇÃO: Usando 'subscription_id' em vez de 'external_id'
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          status: 'active',
          provider: 'asaas',
          subscription_id: subscriptionId, // <--- NOME CORRIGIDO AQUI
          plan_type: planType,
          updated_at: new Date()
        }, { onConflict: 'user_id' });

        if (error) console.error("Erro Supabase Asaas:", error);
    }
  } 
  
  else if (event === 'PAYMENT_OVERDUE') {
     const userId = payment.externalReference;
     if (userId) {
         await supabase.from('subscriptions').update({ status: 'past_due' }).eq('user_id', userId);
     }
  }

  res.status(200).json({ received: true });
}