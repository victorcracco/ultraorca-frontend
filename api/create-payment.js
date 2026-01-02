export default async function handler(req, res) {
  // 1. Segurança: Só aceita requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerName, customerCpf, value } = req.body;

    // 2. Cria o cliente no Asaas (ou busca se já existir - simplificado aqui cria novo)
    // O ideal seria salvar o customer_id no Supabase, mas faremos direto por enquanto
    const customerResponse = await fetch(`${process.env.ASAAS_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': process.env.ASAAS_API_KEY
      },
      body: JSON.stringify({
        name: customerName,
        cpfCnpj: customerCpf
      })
    });

    const customerData = await customerResponse.json();
    
    if (customerData.errors) {
        throw new Error(customerData.errors[0].description);
    }

    // 3. Cria a cobrança (Link de Pagamento / Boleto / PIX)
    const paymentResponse = await fetch(`${process.env.ASAAS_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': process.env.ASAAS_API_KEY
      },
      body: JSON.stringify({
        customer: customerData.id,
        billingType: "PIX", // Ou UNDEFINED para deixar o cliente escolher
        value: value,
        dueDate: new Date().toISOString().split('T')[0], // Vence hoje
        description: "Assinatura UltraOrça PRO"
      })
    });

    const paymentData = await paymentResponse.json();

    if (paymentData.errors) {
        throw new Error(paymentData.errors[0].description);
    }

    // 4. Devolve os dados do pagamento para o Front-end
    return res.status(200).json({
      success: true,
      paymentId: paymentData.id,
      invoiceUrl: paymentData.invoiceUrl, // Link para o cliente pagar
      pixQrcode: paymentData.bankSlipUrl // No sandbox as vezes varia, mas o invoiceUrl é garantido
    });

  } catch (error) {
    console.error("Erro Asaas:", error);
    return res.status(500).json({ error: error.message || "Erro ao criar pagamento" });
  }
}