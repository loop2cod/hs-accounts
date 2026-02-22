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

  const doc = new jsPDF();
  const margin = 20;
  const internal = (doc as unknown as { internal?: { pageSize?: { width: number } } }).internal;
  const pageWidth = internal?.pageSize?.width ?? 595;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ----- Header: company left, invoice meta right -----
  const logoUrl = `${_request.nextUrl.origin}/logo.png`;
  try {
    const logoRes = await fetch(logoUrl);
    if (logoRes.ok) {
      const logoBuffer = await logoRes.arrayBuffer();
      const logoBase64 = Buffer.from(logoBuffer).toString("base64");
      doc.addImage(logoBase64, "PNG", margin, y, 20, 20); // 20x20 size
      y += 20; // adjust y for the next sections based on image height
    } else {
      throw new Error("Logo fetch failed");
    }
  } catch {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("HS", margin, y);
    doc.setTextColor(0, 0, 0);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(115, 115, 115);
    doc.text("Hajass Traders", margin, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
  }

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(
    invoice.withGst ? "TAX INVOICE" : "INVOICE",
    pageWidth - margin,
    margin,
    { align: "right" }
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    `Invoice No.: ${invoice.invoiceNumber}`,
    pageWidth - margin,
    margin + 8,
    { align: "right" }
  );
  doc.text(`Date: ${formatDate(invoice.date)}`, pageWidth - margin, margin + 14, {
    align: "right",
  });
  doc.text(`Due Date: ${formatDate(invoice.date)}`, pageWidth - margin, margin + 20, {
    align: "right",
  });

  y = Math.max(y, margin + 24) + 8;

  // ----- Recipient (Bill To) -----
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  if (customer) {
    doc.text(customer.name, margin, y);
    y += 5;
    doc.text(customer.shopName, margin, y);
    y += 5;
    if (customer.address) {
      const addrLines = doc.splitTextToSize(customer.address, contentWidth);
      doc.text(addrLines, margin, y);
      y += addrLines.length * 5;
    }
    if (customer.gstNumber) {
      doc.text(`GST: ${customer.gstNumber}`, margin, y);
      y += 5;
    }
    if (customer.panNumber) {
      doc.text(`PAN: ${customer.panNumber}`, margin, y);
      y += 5;
    }
    y += 4;
  } else {
    doc.text("—", margin, y);
    y += 10;
  }

  // ----- Items table -----
  const headers = ["#", "Commodity / Item", "HSN/SAC", "Narration", "Unit Price", "Qty", "Amount"];

  let totalQty = 0;

  const rows = invoice.lineItems.map((item, i) => {
    const amount = item.quantity * item.unitPrice;
    const gstAmt = item.gstAmount ?? 0;
    const total = amount + gstAmt;
    totalQty += item.quantity;

    return [
      String(i + 1),
      item.description,
      item.hsnSac || "",
      item.narration || "",
      formatNum(item.unitPrice),
      String(item.quantity),
      formatNum(total),
    ];
  });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: y,
    theme: "grid",
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 9,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    bodyStyles: {
      fontSize: 8,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 18 },
      3: { cellWidth: 25 },
      4: { halign: "right", cellWidth: 20 },
      5: { halign: "right", cellWidth: 15 },
      6: { halign: "right", cellWidth: 25 },
    },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
  });

  const tableEndY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 20;

  // ----- Totals box & Words Box (placed side-by-side) -----
  const totalsLeft = pageWidth - margin - 70;
  let totY = tableEndY;

  // Draw Grand Total Words Box
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, totY, totalsLeft - margin, 40);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total in words:", margin + 2, totY + 5);
  doc.setFont("helvetica", "bold");
  const { numberToWords } = await import("@/lib/numberToWords");
  const wordsStr = numberToWords(invoice.totalAmount).toLowerCase();
  const wordLines = doc.splitTextToSize(wordsStr, totalsLeft - margin - 4);
  doc.text(wordLines, margin + 2, totY + 10);

  if (invoice.notes) {
    doc.line(margin, totY + 20, totalsLeft, totY + 20);
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", margin + 2, totY + 24);
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(invoice.notes, totalsLeft - margin - 4);
    doc.text(noteLines, margin + 2, totY + 28);
  }

  // Draw Totals Box
  doc.rect(totalsLeft, totY, 70, 40);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Amount", totalsLeft + 2, totY + 5);
  doc.setFont("helvetica", "normal");
  doc.text(formatNum(invoice.subtotal), pageWidth - margin - 2, totY + 5, { align: "right" });
  totY += 6;

  if (invoice.freight != null && invoice.freight > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Freight", totalsLeft + 2, totY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(formatNum(Math.abs(invoice.freight)), pageWidth - margin - 2, totY + 5, { align: "right" });
    totY += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Taxable Amt", totalsLeft + 2, totY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(formatNum(invoice.subtotal + invoice.freight), pageWidth - margin - 2, totY + 5, { align: "right" });
    totY += 6;
  }

  if (invoice.withGst && invoice.totalGst != null) {
    const halfGst = invoice.totalGst / 2;
    doc.setFont("helvetica", "bold");
    doc.text("CGST-2.5%", totalsLeft + 2, totY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(formatNum(halfGst), pageWidth - margin - 2, totY + 5, { align: "right" });
    totY += 6;

    doc.setFont("helvetica", "bold");
    doc.text("SGST-2.5%", totalsLeft + 2, totY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(formatNum(halfGst), pageWidth - margin - 2, totY + 5, { align: "right" });
    totY += 6;
  }

  // Reset totY to draw Grand Total at the bottom of the 40px bounding box
  totY = tableEndY + 40;
  doc.line(totalsLeft, totY - 8, pageWidth - margin, totY - 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Grand Total", totalsLeft + 2, totY - 3);
  doc.text(formatNum(invoice.totalAmount), pageWidth - margin - 2, totY - 3, { align: "right" });

  // ----- Bottom: sender details left, thank you right -----
  totY += 10;
  doc.rect(margin, totY, contentWidth, 20);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("DECLARATION : Certified that all the particulars shown in the above invoice are true and correct", margin + 2, totY + 5);

  doc.text("for", pageWidth - margin - 40, totY + 12);
  doc.setFont("helvetica", "bold");
  doc.text("HS Hajass Traders", pageWidth - margin - 2, totY + 12, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text("Authorised Signatory", pageWidth - margin - 2, totY + 18, { align: "right" });

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
