import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId } = req.body;

  try {
    // 1. Busca a assinatura ativa
    const { data: sub, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing']) // Aceita active ou trialing
      .single();

    if (error || !sub) {
      return res.status(404).json({ error: "Nenhuma assinatura ativa encontrada." });
    }

    let novoStatus = 'canceled'; // Padrão (corta na hora)

    // 2. Lógica Stripe (Padrão Netflix: usa até acabar)
    if (sub.provider === 'stripe') {
        // Agenda o cancelamento para o fim do ciclo
        await stripe.subscriptions.update(sub.subscription_id, {
          cancel_at_period_end: true 
        });
        
        // Marcamos como 'canceling' para o Front saber que está acabando, mas ainda libera acesso
        novoStatus = 'canceling';
    } 
    
    // 3. Lógica Asaas (Corta na hora para garantir que não gere boleto novo)
    else if (sub.provider === 'asaas') {
        const apiKey = process.env.ASAAS_API_KEY;
        const apiUrl = process.env.ASAAS_URL || 'https://www.asaas.com/api/v3';

        const response = await fetch(`${apiUrl}/subscriptions/${sub.subscription_id}`, {
            method: 'DELETE',
            headers: { access_token: apiKey, "Content-Type": "application/json" }
        });

        const json = await response.json();
        if (json.errors) throw new Error(`Erro Asaas: ${json.errors[0].description}`);
        
        novoStatus = 'canceled'; // Asaas corta na hora
    }

    // 4. Atualiza o banco
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ status: novoStatus })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return res.status(200).json({ 
        success: true, 
        message: novoStatus === 'canceling' 
            ? "Cancelamento agendado. Seu acesso continua até o fim do período." 
            : "Assinatura cancelada com sucesso."
    });

  } catch (err) {
    console.error("Erro cancelamento:", err);
    return res.status(500).json({ error: err.message });
  }
}