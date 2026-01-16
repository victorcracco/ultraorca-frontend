import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Função auxiliar para converter HEX (#RRGGBB) para array RGB [r, g, b]
const hexToRgb = (hex) => {
  if (!hex) return [41, 128, 185]; // Default Blue
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return [r, g, b];
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const formatDate = (date) =>
  new Intl.DateTimeFormat("pt-BR").format(date);

// ⚠️ ATENÇÃO: Adicionei 'async' aqui no início da função
export async function generateBudgetPDF({
  client,
  clientAddress = "",
  items = [],
  total = 0,
  layout = "modern",
  primaryColor = "#2563eb",
  companyData = null,
  validityDays = 15,
  displayId = null 
}) {
  try {
    // 1. Tenta usar os dados passados, se não, busca do localStorage
    let company = companyData || {};
    if (!company.company_name && !company.nomeEmpresa) {
        const saved = localStorage.getItem("orcasimples_dados");
        if (saved) {
            const localData = JSON.parse(saved);
            company = { ...company, ...localData };
        }
    }
    
    // Normaliza os nomes dos campos
    const nomeEmpresa = company.company_name || company.nomeEmpresa || "Sua Empresa";
    const telefone = company.phone || company.telefone || "";
    const enderecoEmpresa = company.address || company.endereco || "";
    const logoImg = company.logo_url || company.logo; 

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const marginX = 15;

    // Converte a cor HEX para RGB
    const PRIMARY_COLOR = hexToRgb(primaryColor);
    const TEXT_COLOR = [40, 40, 40];

    /* ================= CABEÇALHO ================= */
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, pageWidth, 6, "F");

    let y = 20;

    // LOGO
    if (logoImg && logoImg.startsWith("data:image")) {
      try {
        doc.addImage(logoImg, "PNG", marginX, y, 30, 30);
      } catch (e) {
        console.warn("Erro ao carregar logo:", e);
      }
    }

    // NOME DA EMPRESA E TÍTULO
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("ORÇAMENTO", pageWidth - marginX, y + 10, { align: "right" });

    // ID do Orçamento
    if (displayId) {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`#${displayId}`, pageWidth - marginX, y + 16, { align: "right" });
    }

    // Info da Empresa
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

    /* ================= CLIENTE ================= */
    y = 70;
    doc.setDrawColor(220, 220, 220);
    doc.line(marginX, y - 5, pageWidth - marginX, y - 5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("CLIENTE:", marginX, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_COLOR);
    doc.text(client || "Consumidor Final", marginX, y + 12);

    if (clientAddress) {
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      const addressLines = doc.splitTextToSize(clientAddress, 90);
      doc.text(addressLines, marginX, y + 18);
    }

    // DATAS
    const today = new Date();
    const validityDate = new Date();
    validityDate.setDate(today.getDate() + Number(validityDays || 7));

    doc.setFontSize(9);
    doc.setTextColor(...TEXT_COLOR);
    doc.text(`Emissão: ${formatDate(today)}`, pageWidth - marginX, y + 12, { align: "right" });
    doc.text(`Válido até: ${formatDate(validityDate)}`, pageWidth - marginX, y + 17, { align: "right" });

    /* ================= TABELA ================= */
    autoTable(doc, {
      startY: y + 35,
      head: [["Descrição", "Qtd", "Valor Unit.", "Total"]],
      body: items.map((item) => [
        item.description || "Item sem descrição",
        item.quantity || 1,
        formatCurrency(item.price),
        formatCurrency((item.quantity || 1) * (item.price || 0)),
      ]),
      theme: "grid",
      headStyles: {
        fillColor: PRIMARY_COLOR,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        textColor: [50, 50, 50],
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { halign: "center", cellWidth: 20 },
        2: { halign: "right", cellWidth: 35 },
        3: { halign: "right", fontStyle: "bold", cellWidth: 35 },
      },
      margin: { left: marginX, right: marginX },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    /* ================= TOTAL ================= */
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

    /* ================= RODAPÉ ================= */
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    const footerText = "Gerado via UltraOrça - ultraorca.com.br";
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });

    /* ================= SALVAR / COMPARTILHAR ================= */
// 1. Limpeza rigorosa do nome do arquivo
    const cleanClient = (client || "cliente").trim().replace(/[^a-zA-Z0-9À-ÿ\s]/g, "").replace(/\s+/g, "_");
    // Exemplo: Orcamento_1050_Joao_Silva.pdf
    const fileName = `Orcamento_${displayId ? displayId + '_' : ''}${cleanClient}.pdf`;

    // 2. Tenta Compartilhamento Nativo (Celular)
    if (navigator.share && navigator.canShare) {
        try {
            // Gera o Blob do PDF
            const blob = doc.output('blob');
            
            // Cria um Arquivo Real com o nome correto
            // 'type' application/pdf é crucial para o WhatsApp reconhecer
            const file = new File([blob], fileName, { type: "application/pdf" });

            const shareData = {
                files: [file],
                title: fileName, // Alguns Androids usam isso
                text: `Segue orçamento para ${client}.`,
            };

            // Verifica se o navegador aceita esse arquivo
            if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                return; // Sucesso, não faz download
            }
        } catch (error) {
            // Se o usuário cancelar ou o navegador não suportar, ignora e cai pro download
            if (error.name !== 'AbortError') {
                console.warn("Share falhou, tentando download tradicional...", error);
            }
        }
    }

    // 3. Fallback: Download Tradicional (Desktop ou se o Share falhar)
    doc.save(fileName);

  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Erro ao gerar o PDF. Verifique o console.");
  }
}