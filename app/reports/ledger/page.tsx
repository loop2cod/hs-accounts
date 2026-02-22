import Link from "next/link";
import { getLedgerReport } from "@/lib/actions/reports";
import { getCustomers } from "@/lib/actions/customers";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  History,
  Download,
  ChevronLeft,
  Filter,
  ArrowUpRight,
  Receipt,
  CreditCard,
  FileSpreadsheet
} from "lucide-react";

export default async function LedgerReportPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const params = await searchParams;
  const customerId = params.customerId ?? undefined;
  const [entries, customers] = await Promise.all([
    getLedgerReport(customerId),
    getCustomers(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="secondary" size="sm" className="h-10 w-10 rounded-xl p-0">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-100 p-3 text-primary">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Detailed Ledger</h1>
              <p className="text-sm text-muted-foreground">Comprehensive transaction history and tracking.</p>
            </div>
          </div>
        </div>
        <a
          href={`/api/export/excel?type=ledger${customerId ? `&customerId=${customerId}` : ""}`}
          download="ledger.xlsx"
        >
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export Ledger
          </Button>
        </a>
      </div>

      {/* Filter Section */}
      <Card className="bg-secondary/20 border-none shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground mr-2">
              <Filter className="h-3 w-3" /> Filter By Customer
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/reports/ledger">
                <Button
                  variant={!customerId ? "primary" : "secondary"}
                  size="sm"
                  className="rounded-xl px-4"
                >
                  All
                </Button>
              </Link>
              {customers.map((c) => (
                <Link key={c._id} href={`/reports/ledger?customerId=${c._id}`}>
                  <Button
                    variant={customerId === c._id ? "primary" : "secondary"}
                    size="sm"
                    className="rounded-xl px-4"
                  >
                    {c.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="overflow-hidden border-none shadow-xl">
        <CardHeader className="bg-secondary/20 border-b font-bold flex flex-row items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          Transaction History
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/10 text-muted-foreground font-black uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-left">Description / Reference</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {entries.map((e, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {formatDate(e.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${e.type === 'invoice'
                          ? "bg-blue-50 text-primary"
                          : "bg-green-50 text-green-600"
                        }`}>
                        {e.type === 'invoice' ? <Receipt className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                        {e.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground font-semibold">
                      {e.reference}
                    </td>
                    <td className={`px-6 py-4 text-right tabular-nums font-bold ${e.amount >= 0 ? "text-green-600" : "text-primary"
                      }`}>
                      {e.amount >= 0 ? "+" : ""}
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums font-black text-foreground">
                      {formatCurrency(e.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {entries.length === 0 && (
            <div className="py-20 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-4">
                <History className="h-6 w-6" />
              </div>
              <p className="text-muted-foreground font-medium">No transactions found for this selection.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
