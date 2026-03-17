import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * C3 FIX: Valida o token de autenticação do Asaas antes de processar qualquer evento.
 * Configure o mesmo token em: Asaas Dashboard > Integrações > Webhooks > Access Token.
 * C4 FIX (parcial): o userId vem do campo externalReference que nós mesmos gravamos
 * no momento da criação da assinatura — não vem de input do usuário.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Valida o token de autenticação enviado pelo Asaas
  const asaasToken = req.headers["asaas-access-token"];
  if (!asaasToken || asaasToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
    console.warn("Webhook Asaas: token inválido ou ausente.");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { event, payment } = req.body;

  const eventosDeSucesso = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"];

  if (eventosDeSucesso.includes(event)) {
    const userId = payment?.externalReference;
    const subscriptionId = payment?.subscription;

    // Guard: ignora se não tiver userId válido (UUID)
    if (!userId || typeof userId !== "string" || userId.length < 10) {
      console.warn("Asaas webhook: externalReference ausente ou inválido.");
      return res.status(200).json({ received: true });
    }

    let planType = "pro";
    if (payment.description && payment.description.toLowerCase().includes("starter"))
      planType = "starter";
    if (payment.description && payment.description.toLowerCase().includes("anual"))
      planType = "annual";

    const { error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          status: "active",
          provider: "asaas",
          subscription_id: subscriptionId,
          plan_type: planType,
          updated_at: new Date(),
        },
        { onConflict: "user_id" }
      );

    if (error) console.error("Erro Supabase Asaas:", error.message);
  } else if (event === "PAYMENT_OVERDUE") {
    const userId = payment?.externalReference;
    // Guard: nunca atualiza sem userId válido
    if (userId && typeof userId === "string" && userId.length >= 10) {
      await supabase
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("user_id", userId);
    }
  }

  res.status(200).json({ received: true });
}