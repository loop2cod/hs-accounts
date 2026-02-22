import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/actions/invoices";
import { getCustomerById } from "@/lib/actions/customers";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ChevronLeft,
  Download,
  Printer,
  Share2,
  Receipt,
  Calendar,
  Building,
  User,
  BadgePercent,
  CreditCard
} from "lucide-react";

export default async function InvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();
  const customer = await getCustomerById(invoice.customerId);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Toolbar - hidden in print */}
      <div className="print:hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="secondary" size="sm" className="h-10 w-10 rounded-xl p-0">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice Detail</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4" /> {invoice.invoiceNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/invoices/${id}/pdf`}>
            <Button variant="secondary" className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </a>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Invoice Document Wrapper */}
      <div className="relative">
        {/* Background purely for visual depth on screen */}
        <div className="absolute inset-0 bg-primary/5 rounded-[2rem] blur-3xl -z-10 opacity-30" />

        <Card className="overflow-hidden border-none shadow-2xl">
          <CardContent className="p-0">
            {/* Professional Invoice Content */}
            <div className="invoice-doc px-8 py-12 md:px-16 md:py-20 lg:px-24">
              <div className="flex flex-col md:flex-row justify-between gap-10 mb-16">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground">
                      <CreditCard className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tighter uppercase italic">HS Accounts</h2>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Textile Trader Provider</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground pt-4 max-w-[200px]">
                    <p className="font-bold text-foreground">Sender Details</p>
                    <p>HS Accounts Office,</p>
                    <p>Gujarat, India</p>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <h2 className="text-4xl font-black tracking-tighter text-primary/20 uppercase mb-4">
                    {invoice.withGst ? "Tax Invoice" : "Invoice"}
                  </h2>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Invoice Reference</p>
                    <p className="font-bold text-xl">{invoice.invoiceNumber}</p>
                  </div>
                  <div className="flex flex-col gap-1 pt-2">
                    <div className="flex items-center justify-end gap-2 text-sm">
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span className="font-semibold">{formatDate(invoice.date)}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 text-sm">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="font-semibold">{formatDate(invoice.date)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border mb-16" />

              <div className="grid md:grid-cols-2 gap-10 mb-16">
                <div className="space-y-4 p-6 rounded-2xl bg-secondary/30">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                    <User className="h-3 w-3" /> Billed To
                  </div>
                  {customer ? (
                    <div className="space-y-1">
                      <p className="text-xl font-bold">{customer.name}</p>
                      <p className="font-semibold text-muted-foreground">{customer.shopName}</p>
                      {customer.address && (
                        <p className="text-sm text-muted-foreground pt-2 border-t border-border/50 mt-2">{customer.address}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-muted-foreground">Not Selected</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-hidden rounded-2xl border border-border mb-12">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-6 py-4 text-left">#</th>
                      <th className="px-6 py-4 text-left">Description</th>
                      <th className="px-6 py-4 text-right">Qty</th>
                      <th className="px-6 py-4 text-right">Price</th>
                      {invoice.withGst && (
                        <>
                          <th className="px-6 py-4 text-right">GST%</th>
                          <th className="px-6 py-4 text-right">GST</th>
                        </>
                      )}
                      <th className="px-6 py-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoice.lineItems.map((item, i) => (
                      <tr key={i} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4 text-muted-foreground font-medium">{i + 1}</td>
                        <td className="px-6 py-4 font-bold">{item.description}</td>
                        <td className="px-6 py-4 text-right tabular-nums">{item.quantity}</td>
                        <td className="px-6 py-4 text-right tabular-nums font-semibold">{formatCurrency(item.unitPrice)}</td>
                        {invoice.withGst && (
                          <>
                            <td className="px-6 py-4 text-right tabular-nums">{item.gstRate ?? 0}%</td>
                            <td className="px-6 py-4 text-right tabular-nums">{formatCurrency(item.gstAmount ?? 0)}</td>
                          </>
                        )}
                        <td className="px-6 py-4 text-right tabular-nums font-bold text-primary">
                          {formatCurrency(item.totalRow ?? item.amount + (item.gstAmount ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex flex-col md:flex-row justify-between gap-10">
                <div className="flex-1">
                  {invoice.notes && (
                    <div className="p-6 rounded-2xl bg-secondary/20 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Note / Comment</p>
                      <p className="text-sm font-medium leading-relaxed italic text-muted-foreground font-serif">"{invoice.notes}"</p>
                    </div>
                  )}
                </div>
                <div className="w-full md:w-64 space-y-4">
                  <div className="flex justify-between items-center text-sm px-2">
                    <span className="text-muted-foreground font-medium">Subtotal</span>
                    <span className="font-bold tabular-nums">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.withGst && (
                    <div className="flex justify-between items-center text-sm px-2">
                      <span className="text-muted-foreground font-medium">GST Amount</span>
                      <span className="font-bold tabular-nums">{formatCurrency(invoice.totalGst ?? 0)}</span>
                    </div>
                  )}
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between items-center p-4 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <span className="text-xs font-black uppercase tracking-widest text-white/70">Total Amount</span>
                    <span className="text-xl font-black tabular-nums">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-24 pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                <div className="space-y-1">
                  <p className="font-black text-xs uppercase tracking-widest text-primary">HS Accounts</p>
                  <p className="text-[10px] font-bold text-muted-foreground italic">Your trust is our priority. Thank you!</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center text-primary opacity-30">
                    <Share2 className="h-4 w-4" />
                  </div>
                  <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center text-primary opacity-30">
                    <BadgePercent className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
