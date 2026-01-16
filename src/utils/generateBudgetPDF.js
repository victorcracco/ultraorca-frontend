import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- FUNÇÕES AUXILIARES ---
const hexToRgb = (hex) => {
  if (!hex) return [41, 128, 185];
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return [r, g, b];
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const formatDate = (date) =>
  new Intl.DateTimeFormat("pt-BR").format(date);

const imageUrlToBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Erro imagem:", error);
    return null;
  }
};

// --- FUNÇÃO PRINCIPAL ---
export async function generateBudgetPDF({
  client,
  clientAddress = "",
  items = [],
  total = 0,
  primaryColor = "#2563eb",
  companyData = null,
  validityDays = 15,
  displayId = null 
}) {
  try {
    // 1. DEFINIR NOME DO ARQUIVO (Limpeza rigorosa)
    // Se não tiver cliente ainda, usa "Novo_Cliente" para não ficar vazio
    const cleanClient = (client || "Novo_Cliente").trim().replace(/[^a-zA-Z0-9À-ÿ\s]/g, "").replace(/\s+/g, "_");
    
    // Se não tiver ID (antes de salvar), usa data/hora para ficar único
    const idSufix = displayId ? `_${displayId}` : `_${new Date().getHours()}${new Date().getMinutes()}`;
    
    const fileName = `Orcamento_${cleanClient}${idSufix}.pdf`;

    // 2. Preparar Dados Empresa
    let company = companyData || {};
    if (!company.company_name && !company.nomeEmpresa) {
        const saved = localStorage.getItem("orcasimples_dados");
        if (saved) {
            const localData = JSON.parse(saved);
            company = { ...company, ...localData };
        }
    }
    
    const nomeEmpresa = company.company_name || company.nomeEmpresa || "Sua Empresa";
    const telefone = company.phone || company.telefone || "";
    const enderecoEmpresa = company.address || company.endereco || "";
    let logoImg = company.logo_url || company.logo; 

    // 3. Converter imagem (Mobile Fix)
    if (logoImg && logoImg.startsWith("http")) {
       const base64Logo = await imageUrlToBase64(logoImg);
       if (base64Logo) logoImg = base64Logo;
    }

    // 4. GERAÇÃO DO PDF
    const doc = new jsPDF();
    
    // METADADOS INTERNOS (Para o iOS ler corretamente)
    doc.setProperties({
        title: fileName, // Truque: O título interno deve ser igual ao nome do arquivo
        subject: `Orçamento para ${client}`,
        author: nomeEmpresa,
        creator: 'UltraOrça'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const marginX = 15;
    const PRIMARY_COLOR = hexToRgb(primaryColor);
    const TEXT_COLOR = [40, 40, 40];

    // --- LAYOUT DO PDF ---
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, pageWidth, 6, "F");

    let y = 20;

    if (logoImg) {
      try {
        const format = logoImg.includes("image/jpeg") ? "JPEG" : "PNG";
        doc.addImage(logoImg, format, marginX, y, 30, 30);
      } catch (e) {}
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("ORÇAMENTO", pageWidth - marginX, y + 10, { align: "right" });

    if (displayId) {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`#${displayId}`, pageWidth - marginX, y + 16, { align: "right" });
    }

    doc.setFontSize(10);
    doc.setTextColor(...TEXT_COLOR);
    let yEmpresa = displayId ? y + 24 : y + 18;

    doc.text(nomeEmpresa, pageWidth - marginX, yEmpresa, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(telefone, pageWidth - marginX, yEmpresa + 5, { align: "right" });
    const empAddressLines = doc.splitTextToSize(enderecoEmpresa, 80);
    doc.text(empAddressLines, pageWidth - marginX, yEmpresa + 10, { align: "right" });

    y = 70;
    doc.setDrawColor(220, 220, 220);
    doc.line(marginX, y - 5, pageWidth - marginX, y - 5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("CLIENTE:", marginX, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_COLOR);
    doc.text(client || "Cliente Novo", marginX, y + 12);

    if (clientAddress) {
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      const addressLines = doc.splitTextToSize(clientAddress, 90);
      doc.text(addressLines, marginX, y + 18);
    }

    const today = new Date();
    const validityDate = new Date();
    validityDate.setDate(today.getDate() + Number(validityDays || 7));

    doc.setFontSize(9);
    doc.setTextColor(...TEXT_COLOR);
    doc.text(`Emissão: ${formatDate(today)}`, pageWidth - marginX, y + 12, { align: "right" });
    doc.text(`Válido até: ${formatDate(validityDate)}`, pageWidth - marginX, y + 17, { align: "right" });

    autoTable(doc, {
      startY: y + 35,
      head: [["Descrição", "Qtd", "Valor Unit.", "Total"]],
      body: items.map((item) => [
        item.description || "Item",
        item.quantity || 1,
        formatCurrency(item.price),
        formatCurrency((item.quantity || 1) * (item.price || 0)),
      ]),
      theme: "grid",
      headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 4, textColor: [50, 50, 50] },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { halign: "center", cellWidth: 20 },
        2: { halign: "right", cellWidth: 35 },
        3: { halign: "right", fontStyle: "bold", cellWidth: 35 },
      },
      margin: { left: marginX, right: marginX },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    if (finalY > pageHeight - 30) {
        doc.addPage();
        doc.setFillColor(...PRIMARY_COLOR);
        doc.rect(0, 0, pageWidth, 6, "F");
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("TOTAL GERAL", pageWidth - marginX - 60, finalY + 5);
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(total), pageWidth - marginX, finalY + 5, { align: "right" });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("Gerado via UltraOrça", pageWidth / 2, pageHeight - 10, { align: "center" });

    /* ========================================================
       CORREÇÃO FINAL: SALVAR / COMPARTILHAR
       ======================================================== */
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile && navigator.share && navigator.canShare) {
        try {
            const blob = doc.output('blob');
            // TRUQUE 1: Criar File Object com o nome EXATO
            const file = new File([blob], fileName, { type: "application/pdf" });
            
            const shareData = {
                files: [file],
                // TRUQUE 2: O título no shareData DEVE ser idêntico ao nome do arquivo
                // para o iOS não substituir por "PREVIA"
                title: fileName, 
                // TRUQUE 3: Não envie 'text' se possível, alguns Androids preferem só o arquivo
            };

            if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                return; 
            }
        } catch (error) {
            console.warn("Share falhou, tentando download...", error);
        }
    }

    // Se for PC ou share falhar
    doc.save(fileName);

  } catch (error) {
    console.error("Erro PDF:", error);
    alert("Erro ao gerar PDF.");
  }
}