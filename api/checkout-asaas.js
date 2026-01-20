export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, name, cpf, email, planId } = req.body;
  
  const apiKey = process.env.ASAAS_API_KEY; 
  const apiUrl = process.env.ASAAS_URL || 'https://www.asaas.com/api/v3';

  // Verifica chaves
  if (!apiKey) return res.status(500).json({ error: "Chave ASAAS_API_KEY não configurada." });

  const prices = { starter: 19.99, pro: 29.99, annual: 299.00 };

  try {
    // 1. Criar/Buscar Cliente
    // Nota: O Asaas exige que o CPF seja válido (mesmo em Sandbox as vezes)
    const clientResponse = await fetch(`${apiUrl}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access_token": apiKey },
      body: JSON.stringify({ name, cpfCnpj: cpf, email, externalReference: userId })
    });

    const clientData = await clientResponse.json();
    
    // Tratamento de erro detalhado na criação do cliente
    if (clientData.errors) {
        // Se o erro for "Email já existe", tentamos buscar o ID desse email
        if (clientData.errors[0].code === 'CUSTOMER_EMAIL_ALREADY_EXIST') {
            const search = await fetch(`${apiUrl}/customers?email=${email}`, {
                headers: { "access_token": apiKey }
            });
            const searchRes = await search.json();
            if (searchRes.data && searchRes.data.length > 0) {
                // Recuperamos o ID do cliente existente
                clientData.id = searchRes.data[0].id; 
            } else {
                throw new Error("Email duplicado no Asaas, mas não foi possível recuperar o ID.");
            }
        } else {
            // Outro erro (ex: CPF inválido)
            console.error("Erro Asaas Cliente:", clientData.errors);
            throw new Error(`Asaas: ${clientData.errors[0].description}`);
        }
    }

    const customerId = clientData.id;

    // 2. Criar Cobrança (Assinatura)
    // Importante: Usamos BOLETO pois ele gera o QR Code Pix junto
    const subscriptionResponse = await fetch(`${apiUrl}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access_token": apiKey },
      body: JSON.stringify({
        customer: customerId,
        billingType: "BOLETO", 
        value: prices[planId],
        nextDueDate: new Date().toISOString().split('T')[0],
        cycle: planId === 'annual' ? "YEARLY" : "MONTHLY",
        description: `Plano ${planId} - UltraOrça`,
        externalReference: userId
      })
    });

    const subData = await subscriptionResponse.json();

    if (subData.errors) {
        console.error("Erro Asaas Assinatura:", subData.errors);
        throw new Error(`Asaas: ${subData.errors[0].description}`);
    }

    // Tenta pegar qualquer URL de pagamento disponível
    const finalUrl = subData.bankSlipUrl || subData.invoiceUrl || subData.ticketUrl;

    if (!finalUrl) {
        console.log("Resposta completa Asaas (Debug):", JSON.stringify(subData));
        throw new Error("Assinatura criada, mas URL de pagamento não retornada pelo Asaas.");
    }

    return res.status(200).json({ invoiceUrl: finalUrl });

  } catch (error) {
    console.error("ERRO BACKEND ASAAS:", error.message);
    return res.status(500).json({ error: error.message });
  }
}