import Link from "next/link";
import { getInvoices } from "@/lib/actions/invoices";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FileText,
  Download,
  FilePlus,
  Search,
  ChevronRight,
  Receipt,
  BadgePercent,
  Calendar
} from "lucide-react";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; customerId?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter; // "all" | "gst" | "nogst"
  const withGstFilter =
    filter === "gst" ? true : filter === "nogst" ? false : undefined;
  const invoices = await getInvoices({
    withGst: withGstFilter,
    customerId: params.customerId,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
            <p className="text-sm text-muted-foreground">Track and manage your billing history.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/excel?type=invoices${params.filter ? `&filter=${params.filter}` : ""}`}
            download="invoices.xlsx"
          >
            <Button variant="secondary" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </a>
          <Link href="/invoices/new">
            <Button className="gap-2">
              <FilePlus className="h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/invoices"
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${!filter || filter === "all"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
              : "bg-card hover:bg-secondary text-muted-foreground"
            }`}
        >
          All Invoices
        </Link>
        <Link
          href="/invoices?filter=gst"
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filter === "gst"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
              : "bg-card hover:bg-secondary text-muted-foreground"
            }`}
        >
          <BadgePercent className="h-4 w-4" />
          GST Only
        </Link>
        <Link
          href="/invoices?filter=nogst"
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filter === "nogst"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
              : "bg-card hover:bg-secondary text-muted-foreground"
            }`}
        >
          Non-GST
        </Link>
      </div>

      {/* Invoice List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {invoices.length} {invoices.length === 1 ? "Invoice" : "Invoices"} recorded
          </h2>
        </div>

        {invoices.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent shadow-none">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">No invoices found</h3>
              <p className="text-sm text-muted-foreground">Get started by creating your first invoice.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {invoices.map((inv) => (
              <Link key={inv._id} href={`/invoices/${inv._id}`} className="group">
                <Card className="transition-all duration-200 hover:shadow-lg overflow-hidden">
                  <CardContent className="flex items-center justify-between p-0">
                    <div className="flex items-center gap-4 p-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors">
                        <Receipt className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold truncate group-hover:text-primary transition-colors">{inv.invoiceNumber}</h3>
                          {inv.withGst ? (
                            <span className="rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700 uppercase">GST</span>
                          ) : (
                            <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600 uppercase">Plain</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(inv.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 px-6 border-l border-border h-20 bg-secondary/20 group-hover:bg-transparent transition-colors">
                      <div className="text-right">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</p>
                        <p className="font-bold text-lg tabular-nums">{formatCurrency(inv.totalAmount)}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
