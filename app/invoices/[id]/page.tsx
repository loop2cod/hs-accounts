import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/actions/invoices";
import { getCustomerById } from "@/lib/actions/customers";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PrintButton } from "@/components/invoices/PrintButton";
import {
  ArrowLeft,
  Edit,
  Download,
  Printer,
  User,
  MapPin,
  Calendar,
  FileText,
  BadgeCheck,
  Package,
  ChevronRight,
  TrendingDown
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { numberToWords } from "@/lib/numberToWords";

// Format currency without rounding (truncate to 2 decimal places)
function formatCurrencyNoRound(value: number): string {
  const truncated = Math.floor(value * 100) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(truncated);
}

export default async function InvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();
  const customer = await getCustomerById(invoice.customerId);

  // Calculate GST fresh from subtotal (same as PDF)
  const gstRate = 0.025;
  const cgst = invoice.withGst ? invoice.subtotal * gstRate : 0;
  const sgst = invoice.withGst ? invoice.subtotal * gstRate : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 py-8">
      {/* Toolbar - hidden in print */}
      <header className="print:hidden flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Invoice <span className="text-slate-400 font-mono text-xl">#{invoice.invoiceNumber}</span>
              </h1>
              {invoice.withGst && (
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-blue-100">
                  Tax Invoice
                </span>
              )}
            </div>
            <p className="text-slate-500 font-medium">Issued on {formatDate(invoice.date)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/invoices/${id}/edit`}>
            <Button size="md" variant="outline" className="gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </Link>
          <a href={`/invoices/${id}/pdf`}>
            <Button size="md" variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              PDF
            </Button>
          </a>
          <PrintButton invoiceId={id} />
        </div>
      </header>

      {/* Main View - Dashboard Style */}
      <div className="print:hidden grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Line Items and Totals */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                Line Items
              </h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {invoice.lineItems.length} items
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="text-left font-bold text-slate-400 uppercase tracking-widest text-[10px] px-6 py-3">Description</th>
                      <th className="text-left font-bold text-slate-400 uppercase tracking-widest text-[10px] px-6 py-3">Narration</th>
                      <th className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px] px-6 py-3">Qty</th>
                      <th className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px] px-6 py-3">Rate</th>
                      <th className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px] px-6 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.lineItems.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{item.description}</p>
                          {invoice.withGst && item.hsnSac && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HSN: {item.hsnSac}</p>}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{item.narration || "-"}</td>
                        <td className="px-6 py-4 text-right tabular-nums text-slate-600">{item.quantity}</td>
                        <td className="px-6 py-4 text-right tabular-nums text-slate-600">{formatCurrencyNoRound(item.unitPrice)}</td>
                        <td className="px-6 py-4 text-right tabular-nums font-bold text-slate-900">
                          {formatCurrencyNoRound(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-50/50 border-dashed">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount in Words</p>
                    <p className="text-sm font-medium text-slate-700 capitalize italic bg-white px-3 py-2 rounded-lg border border-slate-200">
                      {numberToWords(invoice.totalAmount)} only
                    </p>
                  </div>
                  {invoice.notes && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notes</p>
                      <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {invoice.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 w-full md:w-64">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{formatCurrencyNoRound(invoice.subtotal)}</span>
                  </div>
                  {invoice.freight != null && invoice.freight > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Freight</span>
                      <span className="font-semibold text-slate-900 tabular-nums">{formatCurrencyNoRound(invoice.freight)}</span>
                    </div>
                  )}
                  {invoice.withGst && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium tracking-tight">CGST (2.5%)</span>
                        <span className="font-semibold text-slate-600 tabular-nums">{formatCurrencyNoRound(cgst)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium tracking-tight">SGST (2.5%)</span>
                        <span className="font-semibold text-slate-600 tabular-nums">{formatCurrencyNoRound(sgst)}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200">
                    <span className="text-slate-900 font-bold uppercase tracking-wider text-xs">Grand Total</span>
                    <span className="text-xl font-bold text-primary tabular-nums">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Information Cards */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Customer Contact</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                  {(customer?.shopName || "?").charAt(0).toUpperCase()}
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">{customer?.shopName || "-"}</p>
                  
                </div>
              </div>

              <div className="flex items-start gap-3 pl-1">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Billing Address</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{customer?.address || "No address provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pl-1 border-t border-slate-100 pt-4">
                <TrendingDown className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Shipping Destination</p>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {invoice.shippingAddress || customer?.address || "Same as billing"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/10">
            <CardHeader>
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Meta Information</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Payment Due</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold uppercase tracking-wider text-[10px]">On Receipt</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Declaration</span>
                <BadgeCheck className="w-4 h-4 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice Document - PRINT ONLY TEMPLATE */}
      <div className="invoice-doc invoice-print-template mx-auto max-w-none px-0 py-0 bg-white hidden print:block">
        <div className="invoice-print-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', border: '2px solid #000', padding: '15px' }}>
          <div className="invoice-print-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="inv-header mb-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  {invoice.withGst && (
                    <div className="text-[10px] text-gray-600 leading-tight">
                      <div>GSTIN: 32BECPH7018J1ZR</div>
                      <div>State Code: 32</div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center">
                  <img src="/logo" alt="Logo" className="w-24 h-24 object-contain" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-xl font-bold mb-2">
                    {invoice.withGst ? "TAX INVOICE" : "INVOICE"}
                  </div>
                  <div className="text-xs">
                    <div><strong>Invoice No.:</strong> {invoice.invoiceNumber}</div>
                    <div><strong>Date:</strong> {formatDate(invoice.date)}</div>
                  </div>
                </div>
              </div>
              <div className="text-center text-xs text-gray-600 leading-relaxed">
                <div>18/883 Pakker HajiComplex, Gandhi Park, Payyannur, Kannur</div>
                <div>Mob: 8078267673</div>
              </div>
            </div>

            <div className="flex justify-between mb-4 text-sm">
              <div className="inv-recipient border border-neutral-300 p-2 w-[48%] min-h-30">
                NAME: <strong>{customer?.shopName || "—"}</strong>
                <br />
                ADDRESS: <strong>{customer?.address || "—"}</strong>
                <br />
                {invoice.withGst && (
                  <>
                    GST: <strong>{customer?.gstNumber || "—"}</strong>
                    <br />
                  </>
                )}
                Phone: <strong>{customer?.phone || "—"}</strong>
              </div>

              <div className="inv-recipient border border-neutral-300 p-2 w-[48%] min-h-30">
                <strong>SHIPPING ADDRESS</strong>
                <br />
                NAME: <strong>{customer?.shopName || "—"}</strong>
                <br />
                ADDRESS: <strong>{invoice.shippingAddress || customer?.address || "—"}</strong>
                <br />
                State Code: <strong>32</strong>
              </div>
            </div>

            {/* Line Items Table - Full height with vertical lines only */}
            <div className="line-items-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <table className="line-items-table w-full text-sm" style={{ borderCollapse: 'collapse', border: '1px solid #000', height: '100%' }}>
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="p-1 w-8 text-center" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>#</th>
                    <th className="p-1 text-left" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>Commodity / Item</th>
                    {invoice.withGst && <th className="p-1 w-20 text-left" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>HSN/SAC</th>}
                    <th className="p-1 w-32 text-left" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>Narration</th>
                    <th className="p-1 w-24 text-right" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>Unit Price</th>
                    <th className="p-1 w-16 text-right" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>Qty</th>
                    <th className="p-1 w-28 text-right" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>Amount</th>
                  </tr>
                </thead>
                <tbody style={{ verticalAlign: 'top' }}>
                  {invoice.lineItems.map((item, i) => (
                    <tr key={i}>
                      <td className="p-1 text-center" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000' }}>{i + 1}</td>
                      <td className="p-1" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000' }}>{item.description}</td>
                      {invoice.withGst && <td className="p-1" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000' }}>{item.hsnSac || ""}</td>}
                      <td className="p-1" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000' }}>{item.narration || ""}</td>
                      <td className="p-1 text-right" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000' }}>{formatCurrencyNoRound(item.unitPrice)}</td>
                      <td className="p-1 text-right" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000' }}>{item.quantity}</td>
                      <td className="p-1 text-right" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000' }}>
                        {formatCurrencyNoRound(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="invoice-print-footer" style={{ marginTop: 'auto', pageBreakInside: 'avoid' }}>
            <div className="flex text-sm border border-neutral-300 mb-4">
              <div className="p-2 w-3/4 border-r border-neutral-300 flex flex-col justify-between">
                <div>
                  <strong>Grand Total in words:</strong>
                  <div className="font-semibold text-neutral-800 lowercase">
                    {numberToWords(invoice.totalAmount)}
                  </div>
                </div>
                {invoice.notes && (
                  <div className="mt-4 pt-2 border-t border-neutral-200 text-neutral-600">
                    <strong>Notes:</strong> {invoice.notes}
                  </div>
                )}
              </div>
              <div className="w-1/4">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-neutral-300">
                      <td className="p-1 font-medium bg-neutral-50/50">Amount</td>
                      <td className="p-1 text-right">{formatCurrencyNoRound(invoice.subtotal)}</td>
                    </tr>
                    {invoice.freight != null && invoice.freight > 0 && (
                      <tr className="border-b border-neutral-300">
                        <td className="p-1 font-medium bg-neutral-50/50">Freight</td>
                        <td className="p-1 text-right">{formatCurrencyNoRound(Math.abs(invoice.freight))}</td>
                      </tr>
                    )}
                    {invoice.withGst && (
                      <>
                        <tr className="border-b border-neutral-300">
                          <td className="p-1 font-medium bg-neutral-50/50">CGST (2.5%)</td>
                          <td className="p-1 text-right">
                            {formatCurrencyNoRound(cgst)}
                          </td>
                        </tr>
                        <tr className="border-b border-neutral-300">
                          <td className="p-1 font-medium bg-neutral-50/50">SGST (2.5%)</td>
                          <td className="p-1 text-right">
                            {formatCurrencyNoRound(sgst)}
                          </td>
                        </tr>
                      </>
                    )}
                    <tr>
                      <td className="p-2 font-bold bg-neutral-200/50">Grand Total</td>
                      <td className="p-2 text-right font-bold text-lg bg-neutral-200/50">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-xs border border-neutral-300 p-2 flex justify-between">
              <div>
                <strong>DECLARATION:</strong> Certified that all the particulars shown in the above invoice are true and correct.
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="mb-8">for <strong>HAJASS TRADERS</strong></span>
                <span>Authorised Signatory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
