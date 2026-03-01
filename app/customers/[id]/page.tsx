import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCustomerById,
  getCustomerBalance,
} from "@/lib/actions/customers";
import { getInvoicesByCustomer } from "@/lib/actions/invoices";
import { getPaymentsByCustomer } from "@/lib/actions/payments";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatDate, ROUTE_WEEKDAYS } from "@/lib/utils";
import {
  User,
  MapPin,
  Phone,
  Hash,
  Calendar,
  ArrowLeft,
  Edit,
  Plus,
  Receipt,
  CreditCard,
  ChevronRight
} from "lucide-react";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, balance, invoices, payments] = await Promise.all([
    getCustomerById(id),
    getCustomerBalance(id),
    getInvoicesByCustomer(id),
    getPaymentsByCustomer(id),
  ]);
  if (!customer) notFound();

  const weekdayLabel =
    ROUTE_WEEKDAYS.find((w) => w.value === customer.routeWeekday)?.label ?? "";

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{customer.name || customer.shopName}</h1>
            <p className="text-slate-500 font-medium">{customer.shopName}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/customers/${id}/edit`}>
            <Button size="md" variant="outline" className="gap-2">
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Customer Profile</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-500 font-medium uppercase">Phone</p>
                  <p className="text-sm text-slate-900">{customer.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-500 font-medium uppercase">Address</p>
                  <p className="text-sm text-slate-900">{customer.address || "No address provided"}</p>
                </div>
              </div>

              {customer.gstNumber && (
                <div className="flex items-start gap-3">
                  <Hash className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-500 font-medium uppercase">GST Number</p>
                    <p className="text-sm text-slate-900">{customer.gstNumber}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-500 font-medium uppercase">Route Schedule</p>
                  <p className="text-sm font-semibold text-primary">{weekdayLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-white border-none shadow-lg shadow-primary/20">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 text-white">Financial Summary</h2>
              <div className="space-y-1">
                <p className="text-3xl font-bold">{formatCurrency(balance.balance)}</p>
                <p className="text-sm opacity-80">Current Outstanding Balance</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-60">Total Billable</p>
                  <p className="text-sm font-semibold">{formatCurrency(balance.due)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-60">Total Received</p>
                  <p className="text-sm font-semibold text-blue-100">{formatCurrency(balance.paid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-500" />
                Recent Invoices
              </h2>
              <Link href={`/invoices/new?customerId=${id}`}>
                <Button size="sm" variant="secondary" className="h-8 gap-2">
                  <Plus className="w-3.5 h-3.5" />
                  New Invoice
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No invoices found for this customer.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {invoices.slice(0, 5).map((inv) => (
                    <li key={inv._id}>
                      <Link
                        href={`/invoices/${inv._id}`}
                        className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="space-y-0.5">
                          <p className="font-mono text-xs font-bold text-slate-400 group-hover:text-primary transition-colors">#{inv.invoiceNumber}</p>
                          <p className="text-sm font-medium text-slate-900">{formatDate(inv.date)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    </li>
                  ))}
                  {invoices.length > 5 && (
                    <li className="p-3 text-center">
                      <Link href={`/invoices?customerId=${id}`} className="text-xs font-semibold text-primary hover:underline">View All Invoices</Link>
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-500" />
                Recent Payments
              </h2>
              <Link href={`/payments/new?customerId=${id}`}>
                <Button size="sm" variant="secondary" className="h-8 gap-2">
                  <Plus className="w-3.5 h-3.5" />
                  Add Payment
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No payment history found.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {payments.slice(0, 5).map((p) => (
                    <li
                      key={p._id}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{p.paymentMode}</p>
                        <p className="text-sm font-medium text-slate-900">{formatDate(p.date)}</p>
                      </div>
                      <span className="font-bold text-green-600">+{formatCurrency(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
