import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * C4 FIX: Valida o JWT do usuário autenticado antes de cancelar a assinatura.
 * Isso impede que um usuário cancele a assinatura de outro usuário.
 */
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // Extrai e valida o JWT do cabeçalho Authorization
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

  // Usa o userId do JWT, NÃO do body — impede IDOR
  const userId = user.id;

  try {
    // 1. Busca a assinatura ativa do usuário autenticado
    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .single();

    if (error || !sub) {
      return res
        .status(404)
        .json({ error: "Nenhuma assinatura ativa encontrada." });
    }

    let novoStatus = "canceled";

    // 2. Lógica Stripe (agenda cancelamento para o fim do ciclo)
    if (sub.provider === "stripe") {
      await stripe.subscriptions.update(sub.subscription_id, {
        cancel_at_period_end: true,
      });
      novoStatus = "canceling";
    }

    // 3. Lógica Asaas (cancela imediatamente)
    else if (sub.provider === "asaas") {
      const apiKey = process.env.ASAAS_API_KEY;
      const apiUrl = process.env.ASAAS_URL || "https://www.asaas.com/api/v3";

      const response = await fetch(
        `${apiUrl}/subscriptions/${sub.subscription_id}`,
        {
          method: "DELETE",
          headers: {
            access_token: apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      const json = await response.json();
      if (json.errors)
        throw new Error(`Erro Asaas: ${json.errors[0].description}`);

      novoStatus = "canceled";
    }

    // 4. Atualiza o banco
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: novoStatus })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message:
        novoStatus === "canceling"
          ? "Cancelamento agendado. Seu acesso continua até o fim do período."
          : "Assinatura cancelada com sucesso.",
    });
  } catch (err) {
    console.error("Erro cancelamento:", err);
    return res.status(500).json({ error: err.message });
  }
}