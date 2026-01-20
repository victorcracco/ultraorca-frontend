export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, name, cpf, email, planId } = req.body;
  
  const apiKey = process.env.ASAAS_API_KEY; 
  const apiUrl = process.env.ASAAS_URL || 'https://www.asaas.com/api/v3';

  // Configuração de Preços
  const prices = { starter: 19.99, pro: 29.99, annual: 299.00 };

  try {
    // ---------------------------------------------------------
    // 1. CRIAR OU RECUPERAR CLIENTE
    // ---------------------------------------------------------
    const clientResponse = await fetch(`${apiUrl}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access_token": apiKey },
      body: JSON.stringify({ name, cpfCnpj: cpf, email, externalReference: userId })
    });

    const clientData = await clientResponse.json();
    
    let customerId = clientData.id;

    // Tratamento se email já existe
    if (clientData.errors) {
        if (clientData.errors[0].code === 'CUSTOMER_EMAIL_ALREADY_EXIST') {
            const search = await fetch(`${apiUrl}/customers?email=${email}`, {
                headers: { "access_token": apiKey }
            });
            const searchRes = await search.json();
            if (searchRes.data && searchRes.data.length > 0) {
                customerId = searchRes.data[0].id; 
            } else {
                throw new Error("Email duplicado no Asaas e não recuperável.");
            }
        } else {
            throw new Error(`Erro Cliente Asaas: ${clientData.errors[0].description}`);
        }
    }

    // ---------------------------------------------------------
    // 2. CRIAR ASSINATURA (CONTRATO)
    // ---------------------------------------------------------
    const subscriptionResponse = await fetch(`${apiUrl}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access_token": apiKey },
      body: JSON.stringify({
        customer: customerId,
        billingType: "BOLETO", // Gera boleto com Pix embutido
        value: prices[planId],
        nextDueDate: new Date().toISOString().split('T')[0], // Vence hoje
        cycle: planId === 'annual' ? "YEARLY" : "MONTHLY",
        description: `Plano ${planId} - UltraOrça`,
        externalReference: userId
      })
    });

    const subData = await subscriptionResponse.json();

    if (subData.errors) {
        throw new Error(`Erro Assinatura Asaas: ${subData.errors[0].description}`);
    }

    const subscriptionId = subData.id;

    // ---------------------------------------------------------
    // 3. O PULO DO GATO: BUSCAR A COBRANÇA GERADA
    // ---------------------------------------------------------
    // A assinatura em si não tem o link. Precisamos listar as cobranças dela.
    const paymentsResponse = await fetch(`${apiUrl}/subscriptions/${subscriptionId}/payments`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "access_token": apiKey }
    });

    const paymentsData = await paymentsResponse.json();

    if (!paymentsData.data || paymentsData.data.length === 0) {
        throw new Error("Assinatura criada, mas nenhuma cobrança foi gerada imediatamente.");
    }

    // Pega a primeira cobrança (a atual)
    const firstPayment = paymentsData.data[0];
    const finalUrl = firstPayment.bankSlipUrl || firstPayment.invoiceUrl;

    return res.status(200).json({ invoiceUrl: finalUrl });

  } catch (error) {
    console.error("ERRO ASAAS:", error.message);
    return res.status(500).json({ error: error.message });
  }
}