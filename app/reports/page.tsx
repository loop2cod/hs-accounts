import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  BarChart3,
  TrendingUp,
  History,
  ArrowUpRight,
  FileText
} from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-orange-50 p-3 text-orange-600">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Gain insights into your business performance and outstanding books.</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link href="/reports/due-balance" className="group">
          <Card className="h-full transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
            <CardContent className="pt-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <TrendingUp className="h-7 w-7" />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">Due & Balance</h3>
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                    View outstanding amounts for all customers. Useful for collection planning and risk assessment.
                  </p>
                </div>
                <div className="flex items-center text-sm font-bold text-primary gap-1">
                  Generate Report <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/ledger" className="group">
          <Card className="h-full transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
            <CardContent className="pt-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <History className="h-7 w-7" />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">Detailed Ledger</h3>
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                    A comprehensive transaction history for your entire business. Track every invoice and payment.
                  </p>
                </div>
                <div className="flex items-center text-sm font-bold text-primary gap-1">
                  View Ledger <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Feature Section/Tip */}
      <Card className="bg-secondary/30 border-none shadow-none">
        <CardContent className="flex items-center gap-6 p-8">
          <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm text-primary">
            <FileText className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-lg">Exporting Data</p>
            <p className="text-sm text-muted-foreground">
              All reports can be exported to Excel format for advanced calculations and offline storage.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
