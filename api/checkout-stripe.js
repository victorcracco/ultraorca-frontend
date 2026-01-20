import Stripe from "stripe";

// Lê a chave secreta do .env da Vercel
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { planId, email, userId } = req.body;

  // IDs dos produtos que você criou no painel da Stripe
  // Certifique-se que essas variáveis estão no seu .env
  const prices = {
    starter: process.env.STRIPE_PRICE_STARTER, 
    pro: process.env.STRIPE_PRICE_PRO,
    annual: process.env.STRIPE_PRICE_ANNUAL,
  };

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: prices[planId], quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      success_url: `${req.headers.origin}/app?payment=success`,
      cancel_url: `${req.headers.origin}/app/subscription?payment=canceled`,
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}