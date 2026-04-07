import { NextRequest } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { getInvoiceById } from "@/lib/actions/invoices";
import { getCustomerById } from "@/lib/actions/customers";
import fs from "fs";
import path from "path";

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

  // Generate PDF using Puppeteer
  let browser;
  try {
    // Determine executable path based on environment
    let executablePath: string | undefined;
    
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
      // Running on Vercel or AWS Lambda - use @sparticuz/chromium
      executablePath = await chromium.executablePath();
    } else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      // Custom path from env
      executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    } else if (process.platform === "darwin") {
      // macOS - try common Chrome/Chromium locations
      const macPaths = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        "/opt/homebrew/bin/chromium",
        "/usr/local/bin/chromium",
      ];
      for (const p of macPaths) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }
    } else if (process.platform === "linux") {
      // Linux paths
      const linuxPaths = [
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
      ];
      for (const p of linuxPaths) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }
    }

    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: chromium.args || ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    
    await page.setContent(html, { waitUntil: "networkidle0" });
    
    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    const shopNameStr = (customer?.shopName || "Customer").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const dateObj = typeof invoice.date === "string" ? new Date(invoice.date) : invoice.date;
    const dateStr = dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, "-");
    const fileName = `invoice-${invoice.invoiceNumber}-${dateStr}-${shopNameStr}.pdf`;

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response("Failed to generate PDF", { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
