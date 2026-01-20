import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Configuração para o Next.js NÃO processar o corpo da requisição como JSON
// O Stripe precisa do corpo "bruto" para validar a segurança
export const config = {
  api: {
    bodyParser: false,
  },
};

// Função auxiliar para ler o corpo bruto
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // 1. Valida se o aviso veio mesmo do Stripe
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 2. Processa o evento
  if (event.type === "checkout.session.completed" || event.type === "invoice.payment_succeeded") {
    const session = event.data.object;

    // Recupera dados importantes
    const userId = session.client_reference_id || session.metadata?.userId; // ID do usuário no Supabase
    const subscriptionId = session.subscription; // ID da assinatura no Stripe
    const planType = session.metadata?.planType || 'pro'; // starter/pro

    if (userId) {
      console.log(`💰 Pagamento Stripe confirmado para User: ${userId}`);

      // 3. Atualiza o Supabase
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          status: 'active',
          provider: 'stripe',
          external_id: subscriptionId,
          plan_type: planType,
          updated_at: new Date()
        }, { onConflict: 'user_id' });

      if (error) console.error("Erro ao atualizar Supabase:", error);
    }
  }

  res.status(200).json({ received: true });
}