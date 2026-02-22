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
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("HS Accounts", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Textile Trader", margin, y);
  y += 10;

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
    y += 4;
  } else {
    doc.text("—", margin, y);
    y += 10;
  }

  // ----- Items table -----
  const headers = invoice.withGst
    ? ["#", "Description", "Qty", "Unit Price", "Amount", "GST%", "GST", "Total"]
    : ["#", "Description", "Qty", "Unit Price", "Amount"];
  const rows = invoice.lineItems.map((item, i) => {
    const amount = item.quantity * item.unitPrice;
    const gstAmt = item.gstAmount ?? 0;
    const total = amount + gstAmt;
    if (invoice.withGst) {
      return [
        String(i + 1),
        item.description,
        String(item.quantity),
        "₹" + formatNum(item.unitPrice),
        "₹" + formatNum(amount),
        (item.gstRate ?? 0) + "%",
        "₹" + formatNum(gstAmt),
        "₹" + formatNum(total),
      ];
    }
    return [
      String(i + 1),
      item.description,
      String(item.quantity),
      "₹" + formatNum(item.unitPrice),
      "₹" + formatNum(amount),
    ];
  });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: y,
    theme: "plain",
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: "auto" },
      ...(invoice.withGst
        ? {
            2: { halign: "right", cellWidth: 14 },
            3: { halign: "right", cellWidth: 22 },
            4: { halign: "right", cellWidth: 22 },
            5: { halign: "right", cellWidth: 12 },
            6: { halign: "right", cellWidth: 18 },
            7: { halign: "right", cellWidth: 22 },
          }
        : {
            2: { halign: "right", cellWidth: 18 },
            3: { halign: "right", cellWidth: 28 },
            4: { halign: "right", cellWidth: 28 },
          }),
    },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
  });

  const tableEndY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 20;

  // ----- Totals box (right-aligned, like template) -----
  const totalsLeft = pageWidth - margin - 70;
  let totY = tableEndY + 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Subtotal:", totalsLeft, totY);
  doc.text("₹" + formatNum(invoice.subtotal), pageWidth - margin, totY, {
    align: "right",
  });
  totY += 6;

  if (invoice.withGst && invoice.totalGst != null) {
    doc.text("GST:", totalsLeft, totY);
    doc.text("₹" + formatNum(invoice.totalGst), pageWidth - margin, totY, {
      align: "right",
    });
    totY += 6;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Total:", totalsLeft, totY);
  doc.text("₹" + formatNum(invoice.totalAmount), pageWidth - margin, totY, {
    align: "right",
  });
  totY += 12;

  // ----- Notes (centered) -----
  if (invoice.notes) {
    const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(noteLines, pageWidth / 2, totY, { align: "center" });
    totY += noteLines.length * 5 + 8;
  }

  // ----- Bottom: sender details left, thank you right -----
  totY += 6;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, totY, pageWidth - margin, totY);
  totY += 10;

  doc.setFontSize(10);
  doc.text("HS Accounts", margin, totY);
  totY += 5;
  doc.text("Textile Trader", margin, totY);
  totY += 8;
  doc.text("Thank you for your business.", pageWidth - margin, totY - 5, {
    align: "right",
  });

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
