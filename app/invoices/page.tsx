import Link from "next/link";
import { getInvoices } from "@/lib/actions/invoices";
import { Invoice } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";
import { FileText, Plus, Download, ChevronRight, Calendar, BadgeCheck, Package } from "lucide-react";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; customerId?: string; page?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter; // "all" | "gst" | "nogst"
  const page = parseInt(params.page ?? "1", 10);
  const limit = 10;

  const withGstFilter =
    filter === "gst" ? true : filter === "nogst" ? false : undefined;

  const { invoices, totalPages } = await getInvoices({
    withGst: withGstFilter,
    customerId: params.customerId,
    page,
    limit,
  });

  const baseUrl = `/invoices${filter ? `?filter=${filter}` : ""}${params.customerId ? `${filter ? "&" : "?"}customerId=${params.customerId}` : ""}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="text-slate-500">Manage and track your sales invoices.</p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/api/export/excel?type=invoices${params.filter ? `&filter=${params.filter}` : ""}`}
            download="invoices.xlsx"
          >
            <Button size="md" variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </Button>
          </a>
          <Link href="/invoices/new">
            <Button size="md" className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </header>

      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm p-0">
        <CardContent className="flex flex-wrap gap-2 p-0">
          {[
            { id: "all", label: "All Invoices" },
            { id: "gst", label: "GST Only" },
            { id: "nogst", label: "Non-GST" },
          ].map((f) => {
            const isSelected = (!filter && f.id === "all") || filter === f.id;
            return (
              <Link
                key={f.id}
                href={f.id === "all" ? "/invoices" : `/invoices?filter=${f.id}`}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${isSelected
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
              >
                {f.label}
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50 p-0">
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No invoices found</h3>
              <p className="text-slate-500 mt-1 max-w-xs mx-auto">Try adjusting your filters or create a new invoice to get started.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {invoices.map((inv: any) => (
                  <Link
                    key={inv._id}
                    href={`/invoices/${inv._id}`}
                    className="flex items-center justify-between p-2 sm:p-6 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${inv.withGst ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'} rounded-xl flex items-center justify-center`}>
                        {inv.withGst ? <BadgeCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900 font-mono tracking-tight">
                          {inv.invoiceNumber}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3" />
                            {formatDate(inv.date)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[7.5px] ${inv.withGst ? 'bg-blue-100/50 text-blue-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                            {inv.withGst ? "GST" : "Non-GST"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-base font-bold text-slate-900">
                        {formatCurrency(inv.totalAmount)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
              <div className="border-t border-slate-50 px-6">
                <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

