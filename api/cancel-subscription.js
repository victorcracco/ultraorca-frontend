import { createClient } from "@supabase/supabase-js";
import { handlePreflight } from "./_cors.js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

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

  const userId = user.id;

  try {
    // 1. Busca a assinatura ativa do usuário
    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .single();

    if (error || !sub) {
      return res.status(404).json({ error: "Nenhuma assinatura ativa encontrada." });
    }

    // 2. Cancela no Asaas
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
    if (json.errors) throw new Error(`Erro Asaas: ${json.errors[0].description}`);

    // 3. Atualiza o banco
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "canceled" })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: "Assinatura cancelada com sucesso.",
    });
  } catch (err) {
    console.error("Erro cancelamento:", err);
    return res.status(500).json({ error: "Erro ao cancelar assinatura. Tente novamente." });
  }
}
