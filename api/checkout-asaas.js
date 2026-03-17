import { createClient } from "@supabase/supabase-js";
import { handlePreflight } from "./_cors.js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * C4 FIX: Valida o JWT do usuário antes de criar a assinatura Asaas.
 * O userId agora vem do token JWT, não do body da requisição.
 */
export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

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

  const { name, cpf, email, planId } = req.body;
  const userId = user.id; // Usa o ID do JWT, não do body

  // Validação server-side dos campos obrigatórios
  if (!name || typeof name !== "string" || name.trim().length < 3) {
    return res.status(400).json({ error: "Nome inválido." });
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "E-mail inválido." });
  }
  const cpfClean = typeof cpf === "string" ? cpf.replace(/\D/g, "") : "";
  if (cpfClean.length !== 11 || /^(\d)\1{10}$/.test(cpfClean)) {
    return res.status(400).json({ error: "CPF inválido." });
  }

  const apiKey = process.env.ASAAS_API_KEY;
  const apiUrl = process.env.ASAAS_URL || "https://www.asaas.com/api/v3";

  const prices = { starter: 19.99, pro: 29.99, annual: 299.0 };

  if (!prices[planId]) {
    return res.status(400).json({ error: "Plano inválido." });
  }

  try {
    // 1. CRIAR OU RECUPERAR CLIENTE
    const clientResponse = await fetch(`${apiUrl}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: apiKey },
      body: JSON.stringify({
        name,
        cpfCnpj: cpf,
        email,
        externalReference: userId,
      }),
    });

    const clientData = await clientResponse.json();
    let customerId = clientData.id;

    // Tratamento se e-mail já existe no Asaas
    if (clientData.errors) {
      if (clientData.errors[0].code === "CUSTOMER_EMAIL_ALREADY_EXIST") {
        const search = await fetch(`${apiUrl}/customers?email=${email}`, {
          headers: { access_token: apiKey },
        });
        const searchRes = await search.json();
        if (searchRes.data && searchRes.data.length > 0) {
          customerId = searchRes.data[0].id;
        } else {
          throw new Error("Email duplicado no Asaas e não recuperável.");
        }
      } else {
        throw new Error(
          `Erro Cliente Asaas: ${clientData.errors[0].description}`
        );
      }
    }

    // 2. CRIAR ASSINATURA
    const subscriptionResponse = await fetch(`${apiUrl}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: apiKey },
      body: JSON.stringify({
        customer: customerId,
        billingType: "BOLETO",
        value: prices[planId],
        nextDueDate: new Date().toISOString().split("T")[0],
        cycle: planId === "annual" ? "YEARLY" : "MONTHLY",
        description: `Plano ${planId} - UltraOrça`,
        externalReference: userId,
      }),
    });

    const subData = await subscriptionResponse.json();

    if (subData.errors) {
      throw new Error(
        `Erro Assinatura Asaas: ${subData.errors[0].description}`
      );
    }

    const subscriptionId = subData.id;

    // 3. BUSCAR A COBRANÇA GERADA
    const paymentsResponse = await fetch(
      `${apiUrl}/subscriptions/${subscriptionId}/payments`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json", access_token: apiKey },
      }
    );

    const paymentsData = await paymentsResponse.json();

    if (!paymentsData.data || paymentsData.data.length === 0) {
      throw new Error(
        "Assinatura criada, mas nenhuma cobrança foi gerada imediatamente."
      );
    }

    const firstPayment = paymentsData.data[0];
    const finalUrl = firstPayment.bankSlipUrl || firstPayment.invoiceUrl;

    return res.status(200).json({ invoiceUrl: finalUrl });
  } catch (error) {
    console.error("ERRO ASAAS:", error.message);
    return res.status(500).json({ error: "Erro ao processar pagamento. Tente novamente." });
  }
}