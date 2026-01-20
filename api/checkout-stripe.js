import Stripe from "stripe";

// Inicializa o Stripe com a chave secreta do servidor
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { planId, email, userId } = req.body;

  // IDs dos Preços (Devem estar no seu .env da Vercel)
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
    // Cria a sessão de Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      client_reference_id: userId,
      // URLs de retorno
      success_url: `${req.headers.origin}/app?payment=success`,
      cancel_url: `${req.headers.origin}/app/subscription?payment=canceled`,
      metadata: {
        userId: userId,
        planType: planId
      },
    });

    // --- CORREÇÃO AQUI: Retorna a URL direta para o Frontend ---
    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("Erro Stripe:", err);
    res.status(500).json({ error: err.message });
  }
}