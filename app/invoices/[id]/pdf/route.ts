import { NextRequest } from "next/server";
import { getInvoiceById } from "@/lib/actions/invoices";
import { getCustomerById } from "@/lib/actions/customers";
import fs from "fs";
import path from "path";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatNum(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format number to 2 decimal places without rounding (truncate)
function formatNumNoRound(n: number): string {
  const truncated = Math.floor(n * 100) / 100;
  return truncated.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function generatePrintHtml(
  invoice: NonNullable<Awaited<ReturnType<typeof getInvoiceById>>>,
  customer: Awaited<ReturnType<typeof getCustomerById>>,
  logoBase64?: string,
  isPrint: boolean = false
): string {
  const { numberToWords } = require("@/lib/numberToWords");

  const custName = customer?.shopName || "—";
  
  // Generate line items HTML with vertical lines only (no horizontal lines between rows)
  const itemsHtml = invoice.lineItems.map((item: any, i: number) => `
    <tr>
      <td style="border-left:1px solid #000;border-right:1px solid #000;padding:4px;text-align:center">${i + 1}</td>
      <td style="border-left:1px solid #000;border-right:1px solid #000;padding:4px">${item.description}</td>
      ${invoice.withGst ? `<td style="border-left:1px solid #000;border-right:1px solid #000;padding:4px">${item.hsnSac || ""}</td>` : ""}
      <td style="border-left:1px solid #000;border-right:1px solid #000;padding:4px">${item.narration || ""}</td>
      <td style="border-left:1px solid #000;border-right:1px solid #000;padding:4px;text-align:right">${formatNumNoRound(item.unitPrice)}</td>
      <td style="border-left:1px solid #000;border-right:1px solid #000;padding:4px;text-align:right">${item.quantity}</td>
      <td style="border-left:1px solid #000;border-right:1px solid #000;padding:4px;text-align:right">${formatNumNoRound(item.amount)}</td>
    </tr>
  `).join("");

  // Calculate all totals consistently
  const gstRate = 0.025; // 2.5%
  const cgst = invoice.withGst ? invoice.subtotal * gstRate : 0;
  const sgst = invoice.withGst ? invoice.subtotal * gstRate : 0;
  const freight = invoice.freight || 0;
  const grandTotal = invoice.subtotal + cgst + sgst + freight;

  const subtotalRow = `<tr><td colspan="5" style="border:1px solid #ccc;padding:4px;text-align:right;font-weight:bold">Subtotal:</td><td style="border:1px solid #ccc;padding:4px;text-align:right">${formatNumNoRound(invoice.subtotal)}</td></tr>`;

  let totalsHtml = subtotalRow;
  
  // GST rows - calculate fresh from subtotal to avoid rounding issues
  if (invoice.withGst) {
    totalsHtml += `<tr><td colspan="5" style="border:1px solid #ccc;padding:4px;text-align:right">CGST-2.5%:</td><td style="border:1px solid #ccc;padding:4px;text-align:right">${formatNumNoRound(cgst)}</td></tr>`;
    totalsHtml += `<tr><td colspan="5" style="border:1px solid #ccc;padding:4px;text-align:right">SGST-2.5%:</td><td style="border:1px solid #ccc;padding:4px;text-align:right">${formatNumNoRound(sgst)}</td></tr>`;
  }
  
  // Freight shown after taxes (no tax on freight)
  if (freight > 0) {
    totalsHtml += `<tr><td colspan="5" style="border:1px solid #ccc;padding:4px;text-align:right">Freight:</td><td style="border:1px solid #ccc;padding:4px;text-align:right">${formatNumNoRound(freight)}</td></tr>`;
  }
  
  totalsHtml += `<tr><td colspan="5" style="border:1px solid #ccc;padding:4px;text-align:right;font-weight:bold">Grand Total:</td><td style="border:1px solid #ccc;padding:4px;text-align:right;font-weight:bold">${formatNum(grandTotal)}</td></tr>`;

  // Generate empty rows to fill table height (for visual extension)
  const emptyRowsHtml = Array(10).fill(0).map(() => `
    <tr>
      <td style="border-left:1px solid #000;border-right:1px solid #000;padding:4px">&nbsp;</td>
      <td style="border-left:1px solid #000;border-right:1px solid #000;padding:4px">&nbsp;</td>
      ${invoice.withGst ? `<td style="border-left:1px solid #000;border-right:1px solid #000;padding:4px">&nbsp;</td>` : ""}
      <td style="border-left:1px solid #000;border-right:1px solid #000;padding:4px">&nbsp;</td>
      <td style="border-left:1px solid #000;border-right:1px solid #000;padding:4px">&nbsp;</td>
      <td style="border-left:1px solid #000;border-right:1px solid #000;padding:4px">&nbsp;</td>
      <td style="border-left:1px solid #000;border-right:1px solid #000;padding:4px">&nbsp;</td>
    </tr>
  `).join("");

  const logoHtml = logoBase64 
    ? `<img src="data:image/png;base64,${logoBase64}" alt="Logo" style="width:120px;height:80px;object-fit:contain" />`
    : `<div style="width:120px;height:80px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#999;font-size:10px;">LOGO</div>`;

  const bodyOnload = isPrint ? ' onload="window.print()"' : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial,sans-serif; font-size: 13px; padding: 0; }
    .invoice-container { display: flex; flex-direction: column; min-height: 100vh; border: 2px solid #000; padding: 15px; }
    .invoice-content { flex: 1; display: flex; flex-direction: column; }
    .line-items-container { flex: 1; display: flex; flex-direction: column; }
    .line-items-table { width: 100%; border-collapse: collapse; border: 1px solid #000; }
    .line-items-table th { background: #f0f0f0; padding: 4px; text-align: left; font-weight: bold; font-size: 12px; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; }
    .line-items-table td { padding: 4px; border-left: 1px solid #000; border-right: 1px solid #000; }
    .line-items-table tbody { vertical-align: top; }
    .invoice-footer { margin-top: auto; page-break-inside: avoid; }
    .addresses { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .address { width: 48%; border: 1px solid #ccc; padding: 8px; }
    .totals { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .totals-left { width: 70%; border: 1px solid #ccc; padding: 8px; }
    .totals-right { width: 28%; }
    .totals-right table { width: 100%; border-collapse: collapse; }
    .totals-right td { border: 1px solid #ccc; padding: 4px; }
    .footer { border: 1px solid #ccc; padding: 8px; }
    @media print {
      body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { margin: 0.5cm; size: auto; }
      .invoice-container { display: flex; flex-direction: column; min-height: 100vh; border: 2px solid #000; padding: 15px; }
      .invoice-content { flex: 1; display: flex; flex-direction: column; }
      .line-items-container { flex: 1; display: flex; flex-direction: column; }
      .line-items-table { border: 1px solid #000; }
      .invoice-footer { margin-top: auto; page-break-inside: avoid; }
    }
  </style>
</head>
<body${bodyOnload}>
<div class="invoice-container">
<div class="invoice-content">
  <div style="margin-bottom:20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
      <div style="flex:1">
        ${invoice.withGst ? `
        <div style="font-size:9px;color:#666;line-height:1.3">
          <div>GSTIN: 32BECPH7018J1ZR</div>
          <div>State Code: 32</div>
        </div>
        ` : ""}
      </div>
      <div style="display:flex;align-items:center;justify-content:center">
        ${logoHtml}
      </div>
      <div style="flex:1;text-align:right">
        <div style="font-size:18px;font-weight:bold;margin-bottom:8px">${invoice.withGst ? "TAX INVOICE" : "INVOICE"}</div>
        <div style="font-size:11px">
          <div><strong>Invoice No.:</strong> ${invoice.invoiceNumber}</div>
          <div><strong>Date:</strong> ${formatDate(invoice.date)}</div>
        </div>
      </div>
    </div>
    <div style="text-align:center;font-size:10px;color:#666;line-height:1.5">
      <div>18/883 Pakker HajiComplex, Gandhi Park, Payyannur, Kannur</div>
      <div>Mob: 8078267673</div>
    </div>
  </div>
  
  <div class="addresses">
    <div class="address">
      NAME: <strong>${custName}</strong><br>
      ADDRESS: <strong>${customer?.address || "—"}</strong><br>
      ${invoice.withGst && customer?.gstNumber ? `GST: <strong>${customer.gstNumber}</strong><br>` : "GST: <strong>—</strong><br>"}

      Phone: <strong>${customer?.phone || "—"}</strong>
    </div>
    <div class="address">
      <strong>SHIPPING ADDRESS</strong><br>
      NAME: <strong>${custName}</strong><br>
      ADDRESS: <strong>${invoice.shippingAddress || customer?.address || "—"}</strong><br>
      State Code: <strong>32</strong>
    </div>
  </div>
  
  <div class="line-items-container">
    <table class="line-items-table">
      <thead>
        <tr>
          <th style="text-align:center;width:30px">#</th>
          <th>Commodity / Item</th>
          ${invoice.withGst ? `<th style="width:60px">HSN/SAC</th>` : ""}
          <th style="width:120px">Narration</th>
          <th style="text-align:right;width:70px">Unit Price</th>
          <th style="text-align:right;width:50px">Qty</th>
          <th style="text-align:right;width:80px">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        ${emptyRowsHtml}
      </tbody>
    </table>
  </div>
  </div>

  <div class="invoice-footer">
    <div class="totals">
      <div class="totals-left">
        <strong>Grand Total in words:</strong><br>
        <strong>${numberToWords(grandTotal).toLowerCase()}</strong>
        ${invoice.notes ? `<br><br><strong>Notes:</strong> ${invoice.notes}` : ""}
      </div>
      <div class="totals-right">
        <table>
          ${totalsHtml}
        </table>
      </div>
    </div>

    <div class="footer">
      <strong>DECLARATION:</strong> Certified that all the particulars shown in the above invoice are true and correct.
      <div style="text-align:right;margin-top:30px">
        <span>for <strong>HAJASS TRADERS</strong></span><br><br>
        <span>Authorised Signatory</span>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) {
    return new Response("Invoice not found", { status: 404 });
  }
  const customer = await getCustomerById(invoice.customerId);

  const isPrint = _request.nextUrl.searchParams.get("print") === "true";

  // Fetch logo as base64 from filesystem to avoid SSL issues
  let logoBase64: string | undefined;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = logoBuffer.toString("base64");
    }
  } catch (error) {
    // Ignore logo fetch errors
    console.error("Error reading logo:", error);
  }

  const html = generatePrintHtml(invoice!, customer, logoBase64, isPrint);

  if (isPrint) {
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  }

  // Generate PDF using jsPDF (no browser/chromium needed)
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 8;
    const contentWidth = pageWidth - 2 * margin;
    let y = margin;
    const { numberToWords } = require("@/lib/numberToWords");
    const custName = customer?.shopName || "—";

    // Calculate totals
    const gstRate = 0.025;
    const cgst = invoice.withGst ? invoice.subtotal * gstRate : 0;
    const sgst = invoice.withGst ? invoice.subtotal * gstRate : 0;
    const freight = invoice.freight || 0;
    const grandTotal = invoice.subtotal + cgst + sgst + freight;

    // Outer border
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - 2 * margin + 4);

    // --- HEADER SECTION ---
    // Left: GST info
    if (invoice.withGst) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("GSTIN: 32BECPH7018J1ZR", margin, y + 3);
      doc.text("State Code: 32", margin, y + 7);
    }

    // Center: Logo
    if (logoBase64) {
      try {
        doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", pageWidth / 2 - 15, y, 30, 20);
      } catch {
        // Skip logo if error
      }
    }

    // Right: Invoice Title and Info
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.withGst ? "TAX INVOICE" : "INVOICE", pageWidth - margin, y + 5, { align: "right" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No.: ${invoice.invoiceNumber}`, pageWidth - margin, y + 12, { align: "right" });
    doc.text(`Date: ${formatDate(invoice.date)}`, pageWidth - margin, y + 17, { align: "right" });

    y += 22;

    // Company Address (centered)
    doc.setFontSize(8);
    doc.text("18/883 Pakker HajiComplex, Gandhi Park, Payyannur, Kannur", pageWidth / 2, y, { align: "center" });
    y += 4;
    doc.text("Mob: 8078267673", pageWidth / 2, y, { align: "center" });
    y += 8;

    // --- ADDRESSES SECTION (Two columns) ---
    const boxHeight = 30;
    const halfWidth = (contentWidth - 4) / 2;

    // Bill To Box
    doc.setDrawColor(180);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, halfWidth, boxHeight);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", margin + 2, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(`NAME: ${custName}`, margin + 2, y + 10);
    doc.text(`ADDRESS: ${customer?.address || "—"}`, margin + 2, y + 15);
    doc.text(`Phone: ${customer?.phone || "—"}`, margin + 2, y + 20);
    if (invoice.withGst) {
      doc.text(`GST: ${customer?.gstNumber || "—"}`, margin + 2, y + 25);
    }

    // Ship To Box
    doc.rect(margin + halfWidth + 4, y, halfWidth, boxHeight);
    doc.setFont("helvetica", "bold");
    doc.text("SHIPPING ADDRESS", margin + halfWidth + 6, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(`NAME: ${custName}`, margin + halfWidth + 6, y + 10);
    doc.text(`ADDRESS: ${invoice.shippingAddress || customer?.address || "—"}`, margin + halfWidth + 6, y + 15);
    doc.text("State Code: 32", margin + halfWidth + 6, y + 20);

    y += boxHeight + 5;

    // --- LINE ITEMS TABLE ---
    const colWidths = invoice.withGst 
      ? [8, 45, 20, 30, 20, 12, 22]  // With HSN
      : [8, 55, 35, 25, 15, 22];     // Without HSN

    const headers = invoice.withGst
      ? ["#", "Commodity / Item", "HSN/SAC", "Narration", "Unit Price", "Qty", "Amount"]
      : ["#", "Commodity / Item", "Narration", "Unit Price", "Qty", "Amount"];

    const bodyData = invoice.lineItems.map((item, i) => {
      const row = [
        String(i + 1),
        item.description,
        item.narration || "",
        formatNumNoRound(item.unitPrice),
        String(item.quantity),
        formatNumNoRound(item.amount),
      ];
      if (invoice.withGst) {
        row.splice(2, 0, item.hsnSac || "");
      }
      return row;
    });

    // Add empty rows
    for (let i = 0; i < 8; i++) {
      const emptyRow = invoice.withGst 
        ? ["", "", "", "", "", "", ""]
        : ["", "", "", "", "", ""];
      bodyData.push(emptyRow);
    }

    autoTable(doc, {
      startY: y,
      head: [headers],
      body: bodyData,
      theme: "plain",
      headStyles: { 
        fillColor: [240, 240, 240], 
        textColor: 0, 
        fontStyle: "bold",
        fontSize: 8,
        lineWidth: 0,  // No internal borders
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 2,
        lineWidth: 0,  // No internal borders
      },
      columnStyles: {
        0: { halign: "center", cellWidth: colWidths[0] },
        [invoice.withGst ? 4 : 3]: { halign: "right" },
        [invoice.withGst ? 5 : 4]: { halign: "right" },
        [invoice.withGst ? 6 : 5]: { halign: "right" },
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      // Draw borders manually: vertical lines only + header top/bottom
      didDrawCell: (data) => {
        const { cell, row, column, table } = data;
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        
        // Draw left border for all cells
        doc.line(cell.x, cell.y, cell.x, cell.y + cell.height);
        
        // Draw right border for last column
        if (column.index === table.columns.length - 1) {
          doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height);
        }
        
        // For header row, draw top and bottom borders
        if (row.section === "head") {
          doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
          doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
        }
      },
    });

    const tableEndY = (doc as any).lastAutoTable.finalY || y + 50;
    
    // Draw bottom border for the table
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(margin, tableEndY, margin + contentWidth, tableEndY);

    // --- TOTALS SECTION ---
    let totalsY = tableEndY + 5;
    const totalsX = pageWidth - margin - 60;

    // Right side totals table
    const totalsData = [
      ["Subtotal:", formatNumNoRound(invoice.subtotal)],
    ];

    if (invoice.withGst) {
      totalsData.push(["CGST-2.5%:", formatNumNoRound(cgst)]);
      totalsData.push(["SGST-2.5%:", formatNumNoRound(sgst)]);
    }

    if (freight > 0) {
      totalsData.push(["Freight:", formatNumNoRound(freight)]);
    }

    totalsData.push(["Grand Total:", formatNum(grandTotal)]);

    autoTable(doc, {
      startY: totalsY,
      body: totalsData,
      theme: "grid",
      styles: { 
        fontSize: 9, 
        cellPadding: 2,
        lineWidth: 0.2,
        lineColor: [180, 180, 180],
      },
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "right" },
      },
      margin: { left: totalsX, right: margin },
      tableWidth: 60,
    });

    // Amount in words (left side)
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total in words:", margin, totalsY + 5);
    doc.setFont("helvetica", "normal");
    const words = numberToWords(grandTotal).toLowerCase();
    doc.text(words, margin, totalsY + 10);

    if (invoice.notes) {
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", margin, totalsY + 18);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.notes, margin, totalsY + 23);
    }

    // --- FOOTER SECTION ---
    const footerY = pageHeight - margin - 25;
    
    // Footer border
    doc.setDrawColor(180);
    doc.rect(margin, footerY, contentWidth, 23);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("DECLARATION:", margin + 2, footerY + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Certified that all the particulars shown in the above invoice are true and correct.", margin + 2, footerY + 10);
    
    doc.setFont("helvetica", "bold");
    doc.text("for HAJASS TRADERS", pageWidth - margin, footerY + 15, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text("Authorised Signatory", pageWidth - margin, footerY + 20, { align: "right" });

    // Generate PDF
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    const shopNameStr = (customer?.shopName || "Customer").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const dateObj = typeof invoice.date === "string" ? new Date(invoice.date) : invoice.date;
    const dateStr = dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, "-");
    const fileName = `invoice-${invoice.invoiceNumber}-${dateStr}-${shopNameStr}.pdf`;

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`, { status: 500 });
  }
}
