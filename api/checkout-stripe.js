import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * C4 FIX: Valida o JWT do usuário antes de criar a sessão de checkout.
 * O userId agora vem do token JWT, não do body da requisição.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Valida o JWT
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Token de autorização ausente." });
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }

  const { planId, email } = req.body;
  const userId = user.id; // Usa o ID do JWT, não do body

  const plans = {
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    annual: process.env.STRIPE_PRICE_ANNUAL,
  };

  const priceId = plans[planId];

  if (!priceId) {
    return res.status(400).json({ error: "Plano inválido ou não configurado." });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      success_url: `${req.headers.origin}/app?payment=success`,
      cancel_url: `${req.headers.origin}/app/subscription?payment=canceled`,
      metadata: { userId, planType: planId },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Erro Stripe:", err);
    res.status(500).json({ error: err.message });
  }
}