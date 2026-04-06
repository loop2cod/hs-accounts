import { NextRequest } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getInvoiceById } from "@/lib/actions/invoices";
import { getCustomerById } from "@/lib/actions/customers";

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

function generatePrintHtml(
  invoice: NonNullable<Awaited<ReturnType<typeof getInvoiceById>>>,
  customer: Awaited<ReturnType<typeof getCustomerById>>
): string {
  const { numberToWords } = require("@/lib/numberToWords");

  const custName = customer?.shopName || "—";
  const itemsHtml = invoice.lineItems.map((item: any, i: number) => `
    <tr>
      <td style="border:1px solid #ccc;padding:4px;text-align:center">${i + 1}</td>
      <td style="border:1px solid #ccc;padding:4px">${item.description}</td>
      ${invoice.withGst ? `<td style="border:1px solid #ccc;padding:4px">${item.hsnSac || ""}</td>` : ""}
      <td style="border:1px solid #ccc;padding:4px">${item.narration || ""}</td>
      <td style="border:1px solid #ccc;padding:4px;text-align:right">${formatNum(item.unitPrice)}</td>
      <td style="border:1px solid #ccc;padding:4px;text-align:right">${item.quantity}</td>
      <td style="border:1px solid #ccc;padding:4px;text-align:right">${formatNum(item.amount)}</td>
    </tr>
  `).join("");

  const subtotalRow = `<tr><td colspan="5" style="border:1px solid #ccc;padding:4px;text-align:right;font-weight:bold">Subtotal:</td><td style="border:1px solid #ccc;padding:4px;text-align:right">${formatNum(invoice.subtotal)}</td></tr>`;

  let totalsHtml = subtotalRow;
  if (invoice.freight != null && invoice.freight > 0) {
    totalsHtml += `<tr><td colspan="5" style="border:1px solid #ccc;padding:4px;text-align:right">Freight:</td><td style="border:1px solid #ccc;padding:4px;text-align:right">${formatNum(invoice.freight)}</td></tr>`;
    totalsHtml += `<tr><td colspan="5" style="border:1px solid #ccc;padding:4px;text-align:right">Taxable Amt:</td><td style="border:1px solid #ccc;padding:4px;text-align:right">${formatNum(invoice.subtotal + invoice.freight)}</td></tr>`;
  }
  if (invoice.withGst && invoice.totalGst != null) {
    const halfGst = invoice.totalGst / 2;
    totalsHtml += `<tr><td colspan="5" style="border:1px solid #ccc;padding:4px;text-align:right">CGST-2.5%:</td><td style="border:1px solid #ccc;padding:4px;text-align:right">${formatNum(halfGst)}</td></tr>`;
    totalsHtml += `<tr><td colspan="5" style="border:1px solid #ccc;padding:4px;text-align:right">SGST-2.5%:</td><td style="border:1px solid #ccc;padding:4px;text-align:right">${formatNum(halfGst)}</td></tr>`;
  }
  totalsHtml += `<tr><td colspan="5" style="border:1px solid #ccc;padding:4px;text-align:right;font-weight:bold">Grand Total:</td><td style="border:1px solid #ccc;padding:4px;text-align:right;font-weight:bold">${formatNum(invoice.totalAmount)}</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial,sans-serif; font-size: 13px; padding: 20px; }
    .invoice-container { display: flex; flex-direction: column; min-height: 100vh; border: 2px solid #000; padding: 15px; }
    .invoice-content { flex: 1; }
    .invoice-footer { margin-top: auto; page-break-inside: avoid; }
    .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .logo { height: 50px; }
    .meta { text-align: right; }
    .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
    .addresses { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .address { width: 48%; border: 1px solid #ccc; padding: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f0f0f0; border: 1px solid #ccc; padding: 4px; text-align: left; font-weight: bold; font-size: 12px; }
    .totals { display: flex; justify-content: space-between; }
    .totals-left { width: 70%; border: 1px solid #ccc; padding: 8px; }
    .totals-right { width: 28%; }
    .totals-right table { width: 100%; }
    .totals-right td { border: 1px solid #ccc; padding: 4px; }
    .footer { border: 1px solid #ccc; padding: 8px; margin-top: 20px; }
    @media print {
      body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { margin: 0.5cm; size: auto; }
      .invoice-container { display: flex; flex-direction: column; min-height: 100vh; border: 2px solid #000; padding: 15px; }
      .invoice-content { flex: 1; }
      .invoice-footer { margin-top: auto; page-break-inside: avoid; }
    }
  </style>
</head>
<body onload="window.print()">
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
        <img src="/logo.png" alt="Logo" style="width:120px;height:80px;object-fit:contain" />
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
      ${invoice.withGst && customer?.gstNumber ? `GST IN: <strong>${customer.gstNumber}</strong><br>` : "GST IN:"}

      Phone: <strong>${customer?.phone || "—"}</strong>
    </div>
    <div class="address">
      <strong>SHIPPING ADDRESS</strong><br>
      NAME: <strong>${custName}</strong><br>
      ADDRESS: <strong>${invoice.shippingAddress || customer?.address || "—"}</strong>
    </div>
  </div>
  
  <table>
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
    </tbody>
  </table>
  </div>

  <div class="invoice-footer">
    <div class="totals">
      <div class="totals-left">
        <strong>Grand Total in words:</strong><br>
        <strong>${numberToWords(invoice.totalAmount).toLowerCase()}</strong>
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

  if (isPrint) {
    const html = generatePrintHtml(invoice!, customer);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  }

  const doc = new jsPDF();
  const pageMargin = 10;
  const borderPadding = 5;
  const margin = pageMargin + borderPadding;
  const internal = (doc as unknown as { internal?: { pageSize?: { width: number } } }).internal;
  const pageWidth = internal?.pageSize?.width ?? 210;
  const pageHeight = (doc.internal.pageSize.getHeight ? doc.internal.pageSize.getHeight() : doc.internal.pageSize.height) as number;
  const contentWidth = pageWidth - margin * 2;

  // Draw border around entire page
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(pageMargin, pageMargin, pageWidth - pageMargin * 2, pageHeight - pageMargin * 2);

  let y = margin;

  // ----- Header: GSTIN (Left) + Centered Logo + Invoice Meta (Right) -----
  const logoUrl = `${_request.nextUrl.origin}/logo.png`;
  const logoSize = 24;
  const centerX = pageWidth / 2;

  // GSTIN and State Code on left (if GST invoice)
  if (invoice.withGst) {
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    let gstY = y + 3;
    doc.text("GSTIN: 32BECPH7018J1ZR", margin, gstY);
    gstY += 3.5;
    doc.text("State Code: 32", margin, gstY);
  }

  // Calculate logo position to center it
  const logoX = centerX - logoSize / 2;

  try {
    const logoRes = await fetch(logoUrl);
    if (logoRes.ok) {
      const logoBuffer = await logoRes.arrayBuffer();
      const logoBase64 = Buffer.from(logoBuffer).toString("base64");
      doc.addImage(logoBase64, "PNG", logoX, y, logoSize, logoSize);
    }
  } catch {
    // Logo placeholder - draw a simple box
    doc.setDrawColor(200, 200, 200);
    doc.rect(logoX, y, logoSize, logoSize);
  }

  // Invoice meta (right side)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(
    invoice.withGst ? "TAX INVOICE" : "INVOICE",
    pageWidth - margin,
    y + 6,
    { align: "right" }
  );

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Invoice No.: ${invoice.invoiceNumber}`,
    pageWidth - margin,
    y + 12,
    { align: "right" }
  );
  doc.text(`Date: ${formatDate(invoice.date)}`, pageWidth - margin, y + 15, {
    align: "right",
  });

  // Address below logo (centered)
  const addressY = y + logoSize + 4;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);

  doc.text("18/883 Pakker HajiComplex, Gandhi Park, Payyannur, Kannur", centerX, addressY, {
    align: "center"
  });
  doc.text("Mob: 8078267673", centerX, addressY + 3.5, {
    align: "center"
  });

  // Update y to account for logo + address
  y = addressY + 3.5 + 6;

  // ----- Two Address Boxes Side by Side -----
  const boxHeight = 25;
  const boxWidth = (contentWidth - 2) / 2;

  // Left box - Billing Address
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, y, boxWidth, boxHeight);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  let textY = y + 4;
  doc.text(`NAME: `, margin + 2, textY);
  doc.setFont("helvetica", "bold");
  doc.text(customer?.shopName || "—", margin + 12, textY);

  textY += 4;
  doc.setFont("helvetica", "normal");
  doc.text(`ADDRESS: `, margin + 2, textY);
  doc.setFont("helvetica", "bold");
  const billAddr = customer?.address || "—";
  const billAddrLines = doc.splitTextToSize(billAddr, boxWidth - 20);
  doc.text(billAddrLines, margin + 18, textY);
  textY += billAddrLines.length * 4;

  if (invoice.withGst && customer?.gstNumber) {
    doc.setFont("helvetica", "normal");
    doc.text(`GST IN: `, margin + 2, textY);
    doc.setFont("helvetica", "bold");
    doc.text(customer.gstNumber, margin + 14, textY);
    textY += 4;
  }

  doc.setFont("helvetica", "normal");
  doc.text(`Phone: `, margin + 2, textY);
  doc.setFont("helvetica", "bold");
  doc.text(customer?.phone || "—", margin + 12, textY);

  // Right box - Shipping Address
  const rightBoxX = margin + boxWidth + 2;
  doc.rect(rightBoxX, y, boxWidth, boxHeight);

  textY = y + 4;
  doc.setFont("helvetica", "bold");
  doc.text(`SHIPPING ADDRESS`, rightBoxX + 2, textY);

  textY += 4;
  doc.setFont("helvetica", "normal");
  doc.text(`NAME: `, rightBoxX + 2, textY);
  doc.setFont("helvetica", "bold");
  doc.text(customer?.shopName || "—", rightBoxX + 12, textY);

  textY += 4;
  doc.setFont("helvetica", "normal");
  doc.text(`ADDRESS: `, rightBoxX + 2, textY);
  doc.setFont("helvetica", "bold");
  const shipAddr = invoice.shippingAddress || customer?.address || "—";
  const shipAddrLines = doc.splitTextToSize(shipAddr, boxWidth - 20);
  doc.text(shipAddrLines, rightBoxX + 18, textY);

  y += boxHeight + 5;

  // ----- Items table -----
  const headers = ["#", "Commodity / Item", ...(invoice.withGst ? ["HSN/SAC"] : []), "Narration", "Unit Price", "Qty", "Amount"];

  const rows = invoice.lineItems.map((item, i) => {
    const row = [
      String(i + 1),
      item.description,
    ];
    if (invoice.withGst) {
      row.push(item.hsnSac || "");
    }
    row.push(
      item.narration || "",
      formatNum(item.unitPrice),
      String(item.quantity),
      formatNum(item.amount)
    );

    return row;
  });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: y,
    theme: "grid",
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 8,
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
      halign: "left",
    },
    bodyStyles: {
      fontSize: 7,
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
      textColor: [0, 0, 0],
    },
    columnStyles: invoice.withGst ? {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 18 },
      3: { cellWidth: 30 },
      4: { halign: "right", cellWidth: 22 },
      5: { halign: "right", cellWidth: 12 },
      6: { halign: "right", cellWidth: 25 },
    } : {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 30 }, // Narration
      3: { halign: "right", cellWidth: 22 }, // Unit Price
      4: { halign: "right", cellWidth: 12 }, // Qty
      5: { halign: "right", cellWidth: 25 }, // Amount
    },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
  });

  const tableEndY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 20;

  // ----- Calculate page height and position totals at bottom -----
  // Calculate heights for footer sections
  const { numberToWords } = await import("@/lib/numberToWords");
  const wordsBoxHeight = invoice.notes ? 35 : 25;
  const declarationBoxHeight = 22;
  const spacing = 3;
  const totalBottomSectionHeight = wordsBoxHeight + declarationBoxHeight + spacing;

  // Check if there's enough space on current page
  const minimumGapAfterTable = 5;
  const requiredY = tableEndY + minimumGapAfterTable + totalBottomSectionHeight;

  // If not enough space, add a new page
  if (requiredY > pageHeight - margin) {
    doc.addPage();
    // Draw border on new page
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(pageMargin, pageMargin, pageWidth - pageMargin * 2, pageHeight - pageMargin * 2);
    y = margin;
  } else {
    y = tableEndY + spacing;
  }

  // Position totals at bottom of page
  let totY = pageHeight - margin - totalBottomSectionHeight;

  // ----- Main Totals Box: Words on left (75%) + Totals table on right (25%) -----
  const wordsBoxWidth = contentWidth * 0.75 - 1;
  const totalsBoxWidth = contentWidth * 0.25;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);

  // Left box - Grand Total in Words
  doc.rect(margin, totY, wordsBoxWidth, wordsBoxHeight);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total in words:", margin + 2, totY + 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const wordsStr = numberToWords(invoice.totalAmount).toLowerCase();
  const wordLines = doc.splitTextToSize(wordsStr, wordsBoxWidth - 4);
  doc.text(wordLines, margin + 2, totY + 8);

  if (invoice.notes) {
    const notesY = totY + wordsBoxHeight - 12;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin + 1, notesY, margin + wordsBoxWidth - 1, notesY);
    doc.setDrawColor(200, 200, 200);

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("Notes:", margin + 2, notesY + 4);
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(invoice.notes, wordsBoxWidth - 4);
    doc.text(noteLines, margin + 2, notesY + 7);
    doc.setTextColor(0, 0, 0);
  }

  // Right box - Totals breakdown
  const totalsBoxX = margin + wordsBoxWidth + 2;
  doc.rect(totalsBoxX, totY, totalsBoxWidth, wordsBoxHeight);

  // Draw totals as rows within the box
  let rowY = totY;
  const rowHeight = 5;

  doc.setFontSize(7);

  // Subtotal/Amount row
  doc.setFillColor(250, 250, 250);
  doc.rect(totalsBoxX, rowY, totalsBoxWidth, rowHeight, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsBoxX, rowY + rowHeight, totalsBoxX + totalsBoxWidth, rowY + rowHeight);

  doc.setFont("helvetica", "bold");
  doc.text("Amount", totalsBoxX + 2, rowY + 3.5);
  doc.setFont("helvetica", "normal");
  doc.text(formatNum(invoice.subtotal), totalsBoxX + totalsBoxWidth - 2, rowY + 3.5, { align: "right" });
  rowY += rowHeight;

  // Freight row
  if (invoice.freight != null && invoice.freight > 0) {
    doc.setFillColor(250, 250, 250);
    doc.rect(totalsBoxX, rowY, totalsBoxWidth, rowHeight, 'F');
    doc.line(totalsBoxX, rowY + rowHeight, totalsBoxX + totalsBoxWidth, rowY + rowHeight);

    doc.setFont("helvetica", "bold");
    doc.text("Freight", totalsBoxX + 2, rowY + 3.5);
    doc.setFont("helvetica", "normal");
    doc.text(formatNum(Math.abs(invoice.freight)), totalsBoxX + totalsBoxWidth - 2, rowY + 3.5, { align: "right" });
    rowY += rowHeight;

    // Taxable amount row
    doc.setFillColor(250, 250, 250);
    doc.rect(totalsBoxX, rowY, totalsBoxWidth, rowHeight, 'F');
    doc.line(totalsBoxX, rowY + rowHeight, totalsBoxX + totalsBoxWidth, rowY + rowHeight);

    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text("Taxable Amt", totalsBoxX + 2, rowY + 3.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(formatNum(invoice.subtotal + invoice.freight), totalsBoxX + totalsBoxWidth - 2, rowY + 3.5, { align: "right" });
    rowY += rowHeight;
  }

  // GST rows
  if (invoice.withGst && invoice.totalGst != null) {
    const halfGst = invoice.totalGst / 2;

    // CGST row
    doc.setFillColor(250, 250, 250);
    doc.rect(totalsBoxX, rowY, totalsBoxWidth, rowHeight, 'F');
    doc.line(totalsBoxX, rowY + rowHeight, totalsBoxX + totalsBoxWidth, rowY + rowHeight);

    doc.setFont("helvetica", "bold");
    doc.text("CGST (2.5%)", totalsBoxX + 2, rowY + 3.5);
    doc.setFont("helvetica", "normal");
    doc.text(formatNum(halfGst), totalsBoxX + totalsBoxWidth - 2, rowY + 3.5, { align: "right" });
    rowY += rowHeight;

    // SGST row
    doc.setFillColor(250, 250, 250);
    doc.rect(totalsBoxX, rowY, totalsBoxWidth, rowHeight, 'F');
    doc.line(totalsBoxX, rowY + rowHeight, totalsBoxX + totalsBoxWidth, rowY + rowHeight);

    doc.setFont("helvetica", "bold");
    doc.text("SGST (2.5%)", totalsBoxX + 2, rowY + 3.5);
    doc.setFont("helvetica", "normal");
    doc.text(formatNum(halfGst), totalsBoxX + totalsBoxWidth - 2, rowY + 3.5, { align: "right" });
    rowY += rowHeight;
  }

  // Grand Total row - fill remaining space and make it bold
  const remainingHeight = totY + wordsBoxHeight - rowY;
  doc.setFillColor(235, 235, 235);
  doc.rect(totalsBoxX, rowY, totalsBoxWidth, remainingHeight, 'F');

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total", totalsBoxX + 2, rowY + remainingHeight / 2 + 1);
  doc.setFontSize(9);
  doc.text(formatNum(invoice.totalAmount), totalsBoxX + totalsBoxWidth - 2, rowY + remainingHeight / 2 + 1, { align: "right" });

  // ----- Declaration Box -----
  const declY = totY + wordsBoxHeight + spacing;
  doc.rect(margin, declY, contentWidth, declarationBoxHeight);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("DECLARATION: Certified that all the particulars shown in the above invoice are true and correct.", margin + 2, declY + 4);

  // Signature section (right aligned)
  doc.setFontSize(7);
  const sigY = declY + 10;
  doc.text("for", pageWidth - margin - 30, sigY);
  doc.setFont("helvetica", "bold");
  doc.text("HAJASS TRADERS", pageWidth - margin - 2, sigY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text("Authorised Signatory", pageWidth - margin - 2, declY + declarationBoxHeight - 3, { align: "right" });

  const shopNameStr = (customer?.shopName || "Customer").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  
  const dateObj = typeof invoice.date === "string" ? new Date(invoice.date) : invoice.date;
  const dateStr = dateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, "-");
  
  const fileName = `invoice-${invoice.invoiceNumber}-${dateStr}-${shopNameStr}.pdf`;

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
