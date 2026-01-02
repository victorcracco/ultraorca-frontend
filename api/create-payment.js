export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Agora pegamos também a 'description'
    const { customerName, customerCpf, value, description } = req.body;

    // 1. Cria ou Busca Cliente no Asaas
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
        throw new Error("Erro no Cliente: " + customerData.errors[0].description);
    }

    // 2. Cria a Cobrança (Pix ou Boleto)
    const paymentResponse = await fetch(`${process.env.ASAAS_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': process.env.ASAAS_API_KEY
      },
      body: JSON.stringify({
        customer: customerData.id,
        billingType: "UNDEFINED", // "UNDEFINED" deixa o cliente escolher entre PIX e Boleto na tela do Asaas
        value: value,
        dueDate: new Date().toISOString().split('T')[0],
        description: description || "Assinatura UltraOrça PRO" // Usa a descrição do plano
      })
    });

    const paymentData = await paymentResponse.json();

    if (paymentData.errors) {
        throw new Error("Erro na Cobrança: " + paymentData.errors[0].description);
    }

    return res.status(200).json({
      success: true,
      invoiceUrl: paymentData.invoiceUrl 
    });

  } catch (error) {
    console.error("Erro Asaas:", error);
    return res.status(500).json({ error: error.message });
  }
}