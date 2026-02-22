import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  BarChart3,
  BookOpen,
  ArrowRight,
  TrendingDown,
  History
} from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports</h1>
        <p className="text-slate-500">Analyze your business performance and financial history.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/reports/due-balance" className="group">
          <Card className="h-full transition-all group-hover:border-primary/30 group-hover:shadow-md active:scale-[0.995]">
            <CardHeader>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingDown className="w-6 h-6" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900 flex items-center justify-between">
                Due & Balance
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
              </h2>
              <p className="text-sm text-slate-500">
                View outstanding amounts and credit balances for all customers.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/ledger" className="group">
          <Card className="h-full transition-all group-hover:border-indigo/30 group-hover:shadow-md active:scale-[0.995]">
            <CardHeader>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <History className="w-6 h-6" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900 flex items-center justify-between">
                General Ledger
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </h2>
              <p className="text-sm text-slate-500">
                Complete transaction history for auditing and reconciliation.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="bg-slate-50/50 border-dashed">
        <CardContent className="py-8 text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm text-slate-500">More advanced analytics coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
