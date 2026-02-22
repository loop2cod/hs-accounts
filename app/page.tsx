import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  UserPlus,
  FilePlus,
  Wallet,
  BarChart,
  BookOpen,
  ArrowUpRight
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here's what's happening today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <ArrowUpRight className="w-5 h-5" />
              </span>
              Quick Actions
            </h2>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/customers/new">
              <Button size="md" variant="outline" className="w-full justify-start gap-3">
                <UserPlus className="w-4 h-4" />
                New Customer
              </Button>
            </Link>
            <Link href="/invoices/new">
              <Button size="md" className="w-full justify-start gap-3">
                <FilePlus className="w-4 h-4" />
                New Invoice
              </Button>
            </Link>
            <Link href="/payments/new">
              <Button size="md" variant="outline" className="w-full justify-start gap-3">
                <Wallet className="w-4 h-4" />
                Record Payment
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <BarChart className="w-5 h-5" />
              </span>
              Analytics & Reports
            </h2>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/reports/due-balance">
              <Button size="md" variant="secondary" className="w-full justify-start gap-3">
                <BookOpen className="w-4 h-4" />
                Due & Balance
              </Button>
            </Link>
            <Link href="/reports/ledger">
              <Button size="md" variant="secondary" className="w-full justify-start gap-3">
                <BarChart className="w-4 h-4" />
                Ledger Report
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Recent Activity</h3>
          <p className="text-slate-500 max-w-sm mt-1">
            Total customers, outstanding dues, and recent activity will appear here once you start adding data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper to keep FileText import available
const FileText = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);
