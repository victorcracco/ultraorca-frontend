import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Certifique-se que SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão no .env da Vercel
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed" || event.type === "invoice.payment_succeeded") {
    const session = event.data.object;

    const userId = session.client_reference_id || session.metadata?.userId;
    const subscriptionId = session.subscription; 
    const planType = session.metadata?.planType || 'pro';

    if (userId) {
      console.log(`💰 Pagamento Stripe confirmado para User: ${userId}`);

      // ATUALIZAÇÃO: Usando 'subscription_id' em vez de 'external_id'
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          status: 'active',
          provider: 'stripe',
          subscription_id: subscriptionId, // <--- NOME CORRIGIDO AQUI
          plan_type: planType,
          updated_at: new Date()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error("Erro ao atualizar Supabase:", error);
        return res.status(500).json({ error: error.message });
      }
    }
  }

  res.status(200).json({ received: true });
}