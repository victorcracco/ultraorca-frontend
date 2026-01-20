import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- HELPERS ---
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
  if (!url) return null;
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error("Falha ao buscar imagem");
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Erro logo:", error);
    return null;
  }
};

// --- FUNÇÃO PRINCIPAL ---
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
    // 1. DADOS
    const cleanClient = (client || "Novo_Cliente").trim().replace(/[^a-zA-Z0-9À-ÿ\s]/g, "").replace(/\s+/g, "_");
    const idSufix = displayId ? `_${displayId}` : `_${new Date().getHours()}${new Date().getMinutes()}`;
    const fileName = `Orcamento_${cleanClient}${idSufix}.pdf`;

    let company = companyData || {};
    if (!company.company_name && !company.nomeEmpresa) {
        const saved = localStorage.getItem("orcasimples_dados");
        if (saved) company = { ...company, ...JSON.parse(saved) };
    }
    
    const nomeEmpresa = company.company_name || company.nomeEmpresa || "Sua Empresa";
    const cnpj = company.cnpj || ""; 
    const telefone = company.phone || company.telefone || "";
    // Endereço completo formatado vindo do MyData
    const enderecoEmpresa = company.address || company.endereco || ""; 
    let logoImg = company.logo_url || company.logo; 

    if (logoImg && logoImg.startsWith("http")) {
       const base64Logo = await imageUrlToBase64(logoImg);
       if (base64Logo) logoImg = base64Logo;
    }

    // 2. SETUP PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const marginX = 20;
    
    const PRIMARY_RGB = hexToRgb(primaryColor);
    
    let headStyles = {};
    let tableTheme = "grid";

    // ============================================================
    // LAYOUT 1: MODERN
    // ============================================================
    if (layout === "modern") {
        doc.setFillColor(...PRIMARY_RGB);
        doc.rect(0, 0, pageWidth, 6, "F");

        let y = 25;
        if (logoImg) {
            try { doc.addImage(logoImg, logoImg.includes("png")?"PNG":"JPEG", marginX, y, 30, 30); } catch(e){}
        }

        // Título
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(...PRIMARY_RGB);
        doc.text("ORÇAMENTO", pageWidth - marginX, y + 10, { align: "right" });
        if (displayId) {
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text(`#${displayId}`, pageWidth - marginX, y + 18, { align: "right" });
        }

        // Dados Empresa
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        
        let yInfo = y + 26;
        doc.text(nomeEmpresa, pageWidth - marginX, yInfo, { align: "right" });
        
        if (cnpj) {
            yInfo += 5;
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`CNPJ: ${cnpj}`, pageWidth - marginX, yInfo, { align: "right" });
        }
        
        if (telefone) {
            yInfo += 5;
            doc.text(telefone, pageWidth - marginX, yInfo, { align: "right" });
        }

        if (enderecoEmpresa) {
            yInfo += 5;
            doc.setFontSize(8);
            const addressLines = doc.splitTextToSize(enderecoEmpresa, 80);
            doc.text(addressLines, pageWidth - marginX, yInfo, { align: "right" });
        }
        
        // Cliente
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...PRIMARY_RGB);
        doc.setFontSize(12);
        doc.text("CLIENTE:", marginX, y + 50);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);
        doc.text(client || "-", marginX, y + 56);
        if (clientAddress) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            const caLines = doc.splitTextToSize(clientAddress, 100);
            doc.text(caLines, marginX, y + 62);
        }
        
        headStyles = { fillColor: PRIMARY_RGB, textColor: 255, fontStyle: "bold" };
    }

    // ============================================================
    // LAYOUT 2: EXECUTIVE (Fundo escuro)
    // ============================================================
    else if (layout === "executive") {
        doc.setFillColor(30, 30, 30);
        doc.rect(0, 0, pageWidth, 65, "F"); // Aumentei um pouco a altura para caber o endereço

        let y = 20;
        if (logoImg) {
             try { doc.addImage(logoImg, logoImg.includes("png")?"PNG":"JPEG", marginX, y, 25, 25); } catch(e){}
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text("ORÇAMENTO", pageWidth - marginX, y + 10, { align: "right" });
        
        // Dados Empresa (Texto Branco/Cinza Claro)
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        let yExec = y + 20;
        doc.text(nomeEmpresa, pageWidth - marginX, yExec, { align: "right" });
        
        doc.setTextColor(200, 200, 200); // Cinza claro
        if (cnpj) {
            yExec += 5;
            doc.setFontSize(9);
            doc.text(cnpj, pageWidth - marginX, yExec, { align: "right" });
        }
        if (telefone) {
            yExec += 5;
            doc.text(telefone, pageWidth - marginX, yExec, { align: "right" });
        }
        if (enderecoEmpresa) {
            yExec += 5;
            doc.setFontSize(8);
            const addressLines = doc.splitTextToSize(enderecoEmpresa, 90);
            doc.text(addressLines, pageWidth - marginX, yExec, { align: "right" });
        }

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("PREPARADO PARA:", marginX, 80);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(client || "-", marginX, 87);
        if (clientAddress) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(clientAddress, marginX, 93);
        }

        headStyles = { fillColor: [50, 50, 50], textColor: 255, fontStyle: "bold" };
    }

    // ============================================================
    // LAYOUT 3: MINIMAL (Centralizado)
    // ============================================================
    else if (layout === "minimal") {
        let y = 20;
        if (logoImg) {
            try { doc.addImage(logoImg, logoImg.includes("png")?"PNG":"JPEG", (pageWidth/2) - 15, y, 30, 30); } catch(e){}
            y += 35;
        } else {
            y += 10;
        }

        doc.setFont("courier", "bold");
        doc.setFontSize(26);
        doc.setTextColor(0, 0, 0);
        doc.text("ORÇAMENTO", pageWidth / 2, y, { align: "center" });

        y += 10;
        doc.setFontSize(10);
        doc.setFont("courier", "normal");
        doc.text(nomeEmpresa, pageWidth / 2, y, { align: "center" });
        
        y += 5;
        let infoLine = "";
        if (cnpj) infoLine += `CNPJ: ${cnpj}  `;
        if (telefone) infoLine += `${telefone}`;
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(infoLine, pageWidth / 2, y, { align: "center" });

        if (enderecoEmpresa) {
            y += 4;
            const addressLines = doc.splitTextToSize(enderecoEmpresa, 150);
            doc.text(addressLines, pageWidth / 2, y, { align: "center" });
            y += (addressLines.length * 3); // Ajusta Y baseado nas linhas do endereço
        }

        y += 8;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Cliente: ${client}`, pageWidth / 2, y, { align: "center" });
        
        y += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(marginX, y, pageWidth - marginX, y);

        headStyles = { fillColor: 255, textColor: 0, fontStyle: "bold", lineWidth: 0.1, lineColor: 0 };
        tableTheme = "plain";
    }

    // ============================================================
    // LAYOUT 4: CLASSIC (Bordas e Serifado)
    // ============================================================
    else if (layout === "classic") {
        doc.setDrawColor(...PRIMARY_RGB);
        doc.setLineWidth(1);
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

        let y = 30;
        if (logoImg) {
            try { doc.addImage(logoImg, logoImg.includes("png")?"PNG":"JPEG", marginX + 5, y - 5, 20, 20); } catch(e){}
        }

        doc.setFont("times", "bold");
        doc.setFontSize(20);
        doc.setTextColor(0, 0, 0);
        doc.text("Proposta Comercial", pageWidth - marginX - 10, y + 5, { align: "right" });

        // Dados Empresa (Direita)
        doc.setFontSize(10);
        doc.setFont("times", "italic");
        let yClass = y + 15;
        doc.text(nomeEmpresa, pageWidth - marginX - 10, yClass, { align: "right" });
        
        if(cnpj) {
            yClass += 5;
            doc.text(`CNPJ: ${cnpj}`, pageWidth - marginX - 10, yClass, { align: "right" });
        }
        if(telefone) {
            yClass += 5;
            doc.text(telefone, pageWidth - marginX - 10, yClass, { align: "right" });
        }
        if (enderecoEmpresa) {
            yClass += 5;
            doc.setFontSize(9);
            const addressLines = doc.splitTextToSize(enderecoEmpresa, 70);
            doc.text(addressLines, pageWidth - marginX - 10, yClass, { align: "right" });
        }
        
        // Caixa do Cliente
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.rect(marginX, yClass + 15, pageWidth - (marginX*2), 25);
        doc.setFont("times", "bold");
        doc.setFontSize(11);
        doc.text("Dados do Cliente:", marginX + 5, yClass + 25);
        doc.setFont("times", "normal");
        doc.text(`${client}`, marginX + 5, yClass + 33);
        if (clientAddress) {
             doc.setFontSize(9);
             doc.setTextColor(80, 80, 80);
             doc.text(clientAddress, marginX + 5, yClass + 38);
        }

        headStyles = { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold", lineColor: 200, lineWidth: 0.1 };
        tableTheme = "grid";
    }

    // --- POSIÇÃO TABELA ---
    let startY = 90;
    if (layout === "executive") startY = 105;
    if (layout === "minimal") startY = logoImg ? 110 : 80;
    if (layout === "classic") startY = 110;

    // --- DATAS E VALIDADE ---
    const today = new Date();
    const validityDate = new Date();
    validityDate.setDate(today.getDate() + Number(validityDays || 7));
    
    if (layout !== "classic" && layout !== "minimal") {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Emissão: ${formatDate(today)} | Validade: ${formatDate(validityDate)}`, pageWidth - marginX, startY - 5, { align: "right" });
    }

    // --- TABELA ---
    autoTable(doc, {
      startY: startY,
      head: [["Descrição", "Qtd", "Valor Unit.", "Total"]],
      body: items.map((item) => [
        item.description || "Item",
        item.quantity || 1,
        formatCurrency(item.price),
        formatCurrency((item.quantity || 1) * (item.price || 0)),
      ]),
      theme: tableTheme,
      headStyles: headStyles,
      styles: { 
          fontSize: 10, 
          cellPadding: 4, 
          textColor: layout === "executive" ? [50, 50, 50] : [40, 40, 40],
          font: layout === "classic" ? "times" : (layout === "minimal" ? "courier" : "helvetica")
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
    if (finalY > pageHeight - 40) doc.addPage();

    // --- TOTAIS ---
    doc.setFontSize(14);
    doc.setFont(layout === "classic" ? "times" : "helvetica", "bold");
    
    const valorFormatado = formatCurrency(total);
    const larguraDoValor = doc.getTextWidth(valorFormatado);
    
    doc.setTextColor(0, 0, 0);
    doc.text(valorFormatado, pageWidth - marginX, finalY + 10, { align: "right" });

    // Correção da cor (sem spread operator no ternário)
    if (layout === "minimal") {
        doc.setTextColor(0, 0, 0);
    } else {
        doc.setTextColor(...PRIMARY_RGB);
    }
    
    doc.text("TOTAL GERAL", pageWidth - marginX - larguraDoValor - 5, finalY + 10, { align: "right" });

    // --- RODAPÉ ---
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    const footerText = `Gerado via UltraOrça`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });

    // --- SALVAR ---
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && navigator.share && navigator.canShare) {
        try {
            const blob = doc.output('blob');
            const file = new File([blob], fileName, { type: "application/pdf" });
            const shareData = { files: [file], title: fileName };
            if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                return; 
            }
        } catch (error) {}
    }
    doc.save(fileName);

  } catch (error) {
    console.error("Erro PDF:", error);
    alert("Erro ao gerar PDF.");
  }
}