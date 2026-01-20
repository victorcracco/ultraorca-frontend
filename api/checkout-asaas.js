export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // 1. Pega os dados que vieram do Frontend
  const { userId, name, cpf, email, planId } = req.body;

  // 2. Lê as chaves que JÁ ESTÃO no seu .env da Vercel/Local
  const apiKey = process.env.ASAAS_API_KEY; 
  const apiUrl = process.env.ASAAS_URL || 'https://www.asaas.com/api/v3';

  if (!apiKey) {
    console.error("ERRO: Chave do Asaas não encontrada no .env");
    return res.status(500).json({ error: "Configuração de servidor inválida." });
  }

  // Define os valores (Garante que o backend controla o preço)
  const prices = {
    starter: 19.99,
    pro: 29.99,
    annual: 299.00
  };

  try {
    // --- PASSO A: Criar/Buscar Cliente no Asaas ---
    // (Simplificando: tenta criar direto. Se o CPF já existe, o Asaas avisa ou retorna o existente dependendo da config, 
    // mas o ideal é listar clientes antes. Para manter simples, vamos mandar criar)
    const clientResponse = await fetch(`${apiUrl}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": apiKey
      },
      body: JSON.stringify({
        name: name,
        cpfCnpj: cpf,
        email: email,
        externalReference: userId // Linkamos com o ID do Supabase
      })
    });

    const clientData = await clientResponse.json();
    
    // Se der erro porque já existe, tentamos buscar pelo email (tratamento básico de erro)
    let customerId = clientData.id;
    
    if (clientData.errors && clientData.errors[0].code === 'CUSTOMER_EMAIL_ALREADY_EXIST') {
        // Se já existe, precisaria buscar o ID desse cliente. 
        // Para simplificar agora, vamos assumir que o usuário vai pagar.
        // Num cenário ideal, você faria um fetch GET /customers?email=...
        return res.status(400).json({ error: "Email já cadastrado no Asaas. Entre em contato com suporte." });
    } else if (clientData.errors) {
        throw new Error(clientData.errors[0].description);
    }

    // --- PASSO B: Criar a Assinatura ---
    const subscriptionResponse = await fetch(`${apiUrl}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": apiKey
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: "PIX", // Força PIX como você pediu
        value: prices[planId],
        nextDueDate: new Date().toISOString().split('T')[0], // Vence hoje
        cycle: planId === 'annual' ? "YEARLY" : "MONTHLY",
        description: `Assinatura UltraOrça - Plano ${planId}`,
        externalReference: userId
      })
    });

    const subData = await subscriptionResponse.json();

    if (subData.errors) {
        throw new Error(subData.errors[0].description);
    }

    // --- SUCESSO: Retorna o link para o Frontend redirecionar ---
    return res.status(200).json({ 
        invoiceUrl: subData.invoiceUrl, // Link da fatura/Pix
        id: subData.id 
    });

  } catch (error) {
    console.error("Erro Asaas:", error);
    return res.status(500).json({ error: error.message || "Erro ao processar no Asaas" });
  }
}