import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Inicializa os clientes
// Nota: Precisamos da SERVICE_ROLE_KEY para poder buscar e editar a assinatura de qualquer usuário
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  // Aceita apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.body;

  try {
    // 1. Busca a assinatura ativa no Supabase
    const { data: sub, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !sub) {
      return res.status(404).json({ error: "Nenhuma assinatura ativa encontrada para cancelar." });
    }

    // 2. Verifica quem é o provedor (Stripe ou Asaas) e cancela
    if (sub.provider === 'stripe') {
        // --- CANCELAMENTO STRIPE ---
        // Configurado para cancelar ao fim do período (o usuário usa até acabar o mês pago)
        // Se quiser cancelar IMEDIATAMENTE, troque por: stripe.subscriptions.cancel(sub.subscription_id);
        await stripe.subscriptions.update(sub.subscription_id, {
          cancel_at_period_end: true 
        });
    } 
    else if (sub.provider === 'asaas') {
        // --- CANCELAMENTO ASAAS ---
        const apiKey = process.env.ASAAS_API_KEY;
        const apiUrl = process.env.ASAAS_URL || 'https://www.asaas.com/api/v3';

        const response = await fetch(`${apiUrl}/subscriptions/${sub.subscription_id}`, {
            method: 'DELETE', // Asaas usa DELETE para cancelar
            headers: { 
                access_token: apiKey,
                "Content-Type": "application/json"
            }
        });

        const json = await response.json();
        
        // Se der erro no Asaas (ex: ID não existe), lançamos erro
        if (json.errors) {
            throw new Error(`Erro Asaas: ${json.errors[0].description}`);
        }
    }

    // 3. Atualiza o status no Supabase
    // Marcamos como 'canceled' para o botão de cancelar sumir da tela
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Retorna JSON de sucesso
    return res.status(200).json({ success: true, message: "Assinatura cancelada com sucesso." });

  } catch (err) {
    console.error("Erro no cancelamento:", err);
    return res.status(500).json({ error: err.message || "Erro ao processar cancelamento." });
  }
}