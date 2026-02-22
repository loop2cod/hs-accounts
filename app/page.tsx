import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  UserPlus,
  FilePlus,
  PlusCircle,
  ArrowUpRight,
  History,
  Wallet,
  TrendingUp,
  Users
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your accounts today.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-white/20 p-2 text-white">
                <Wallet className="h-5 w-5" />
              </div>
              <TrendingUp className="h-4 w-4 text-white/60" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Total Outstanding</p>
              <h3 className="text-2xl font-bold tracking-tight">Rs. 1,24,500.00</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
              <h3 className="text-2xl font-bold tracking-tight">42</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
                <History className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg. Collection Day</p>
              <h3 className="text-2xl font-bold tracking-tight">12 Days</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Actions & Recent Activity Layout */}
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/customers/new">
              <Button className="w-full h-24 text-lg justify-start gap-4 px-6 rounded-2xl" variant="secondary">
                <div className="bg-white rounded-xl p-3 shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                New Customer
              </Button>
            </Link>
            <Link href="/invoices/new">
              <Button className="w-full h-24 text-lg justify-start gap-4 px-6 rounded-2xl">
                <div className="bg-white/20 rounded-xl p-3 shadow-sm">
                  <FilePlus className="h-6 w-6" />
                </div>
                New Invoice
              </Button>
            </Link>
            <Link href="/payments/new" className="sm:col-span-2">
              <Button className="w-full h-24 text-lg justify-start gap-4 px-6 rounded-2xl" variant="secondary">
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <PlusCircle className="h-6 w-6 text-green-600" />
                </div>
                Record Payment Received
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Reports</h2>
            <Link href="/reports" className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <Card className="border-none shadow-none bg-secondary/30">
            <CardContent className="p-4 space-y-2">
              <Link href="/reports/due-balance" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors group">
                <div className="bg-white rounded-lg p-2 shadow-sm group-hover:bg-orange-50 transition-colors text-orange-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Due & Balance</span>
              </Link>
              <Link href="/reports/ledger" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors group">
                <div className="bg-white rounded-lg p-2 shadow-sm group-hover:bg-blue-50 transition-colors text-primary">
                  <History className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Detailed Ledger</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
