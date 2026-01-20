export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, name, cpf, email, planId } = req.body;
  
  // GARANTA QUE AS CHAVES ESTÃO SENDO LIDAS
  const apiKey = process.env.ASAAS_API_KEY; 
  const apiUrl = process.env.ASAAS_URL || 'https://www.asaas.com/api/v3';

  const prices = { starter: 19.99, pro: 29.99, annual: 299.00 };

  try {
    // 1. Criar Cliente
    const clientResponse = await fetch(`${apiUrl}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access_token": apiKey },
      body: JSON.stringify({ name, cpfCnpj: cpf, email, externalReference: userId })
    });

    const clientData = await clientResponse.json();
    
    // Tratamento de erro se cliente já existe
    let customerId = clientData.id;
    if (clientData.errors) {
        if (clientData.errors[0].code === 'CUSTOMER_EMAIL_ALREADY_EXIST') {
            // Se já existe, buscamos o ID dele (Fallback simples)
            const searchUser = await fetch(`${apiUrl}/customers?email=${email}`, {
                headers: { "access_token": apiKey }
            });
            const searchData = await searchUser.json();
            customerId = searchData.data[0].id;
        } else {
            throw new Error(`Erro ao criar cliente Asaas: ${clientData.errors[0].description}`);
        }
    }

    // 2. Criar Assinatura
    const subscriptionResponse = await fetch(`${apiUrl}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access_token": apiKey },
      body: JSON.stringify({
        customer: customerId,
        billingType: "BOLETO", // Boleto Híbrido (Tem Pix junto)
        value: prices[planId],
        nextDueDate: new Date().toISOString().split('T')[0],
        cycle: planId === 'annual' ? "YEARLY" : "MONTHLY",
        description: `Assinatura UltraOrça - ${planId}`,
        externalReference: userId
      })
    });

    const subData = await subscriptionResponse.json();

    if (subData.errors) {
        throw new Error(`Erro assinatura Asaas: ${subData.errors[0].description}`);
    }

    // O PULO DO GATO: Pegar invoiceUrl OU bankSlipUrl
    const finalUrl = subData.bankSlipUrl || subData.invoiceUrl;

    if (!finalUrl) {
        console.error("Retorno Asaas:", subData); // Para você ver no Log da Vercel
        throw new Error("O Asaas não retornou o link do boleto.");
    }

    return res.status(200).json({ invoiceUrl: finalUrl });

  } catch (error) {
    console.error("Erro API Asaas:", error);
    return res.status(500).json({ error: error.message });
  }
}