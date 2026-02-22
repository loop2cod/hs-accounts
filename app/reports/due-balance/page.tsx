import Link from "next/link";
import { getDueBalanceReport } from "@/lib/actions/reports";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  Download,
  ChevronLeft,
  Store,
  User,
  ArrowUpRight,
  TrendingDown,
  BarChart3
} from "lucide-react";

export default async function DueBalanceReportPage() {
  const rows = await getDueBalanceReport();

  const totalDue = rows.reduce((acc, r) => acc + (r.due || 0), 0);
  const totalPaid = rows.reduce((acc, r) => acc + (r.paid || 0), 0);
  const totalBalance = rows.reduce((acc, r) => acc + (r.balance || 0), 0);

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
            <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Due & Balance</h1>
              <p className="text-sm text-muted-foreground">Detailed overview of outstanding receivables.</p>
            </div>
          </div>
        </div>
        <a href="/api/export/excel?type=due-balance" download="due-balance.xlsx">
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </a>
      </div>

      {/* Summary Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-orange-50/50 border-orange-100">
          <CardContent className="pt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600/70 mb-2">Total Outstanding</p>
            <p className="text-2xl font-black text-orange-600 tabular-nums">{formatCurrency(totalBalance)}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30 border-none">
          <CardContent className="pt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Cumulative Due</p>
            <p className="text-2xl font-black tabular-nums">{formatCurrency(totalDue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30 border-none">
          <CardContent className="pt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Collections</p>
            <p className="text-2xl font-black tabular-nums">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="overflow-hidden border-none shadow-xl">
        <CardHeader className="bg-secondary/20 border-b font-bold flex flex-row items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Customer-wise Breakdown
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/10 text-muted-foreground font-black uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4 text-left">Customer / Shop</th>
                  <th className="px-6 py-4 text-right">Total Due</th>
                  <th className="px-6 py-4 text-right">Total Paid</th>
                  <th className="px-6 py-4 text-right">Outstanding</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.customerId} className="hover:bg-secondary/10 transition-colors group">
                    <td className="px-6 py-5">
                      <Link href={`/customers/${r.customerId}`} className="block">
                        <p className="font-bold text-base group-hover:text-primary transition-colors">{r.customerName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                          <Store className="h-3 w-3" /> {r.shopName}
                        </p>
                      </Link>
                    </td>
                    <td className="px-6 py-5 text-right tabular-nums text-muted-foreground">{formatCurrency(r.due)}</td>
                    <td className="px-6 py-5 text-right tabular-nums text-muted-foreground">{formatCurrency(r.paid)}</td>
                    <td className="px-6 py-5 text-right tabular-nums">
                      <span className={`font-bold text-base ${r.balance > 0 ? "text-orange-600" : "text-green-600"}`}>
                        {formatCurrency(r.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Link href={`/customers/${r.customerId}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <div className="py-20 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-4">
                <BarChart3 className="h-6 w-6" />
              </div>
              <p className="text-muted-foreground font-medium">No financial data available yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
