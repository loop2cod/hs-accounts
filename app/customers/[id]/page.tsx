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
  ChevronRight,
  ChevronLeft,
  Edit3,
  Store,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  ArrowUpRight,
  Receipt,
  CreditCard,
  Plus
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
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="secondary" size="sm" className="h-10 w-10 rounded-xl p-0">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Store className="h-4 w-4" /> {customer.shopName}
            </p>
          </div>
        </div>
        <Link href={`/customers/${id}/edit`}>
          <Button className="gap-2">
            <Edit3 className="h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Info & Balance */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>General Information</CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-secondary p-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact</p>
                  <p className="font-semibold">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-secondary p-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Route</p>
                  <p className="font-semibold">{weekdayLabel}</p>
                </div>
              </div>
              {customer.address && (
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-secondary p-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Address</p>
                    <p className="text-sm font-medium leading-relaxed">{customer.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground border-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="rounded-xl bg-white/20 p-2">
                  <Wallet className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">Current Balance</span>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-3xl font-bold">{formatCurrency(balance.balance)}</h3>
                  <p className="text-white/60 text-xs font-bold uppercase mt-1">Net Outstanding</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-white/50">Total Due</p>
                    <p className="font-bold">{formatCurrency(balance.due)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-white/50">Total Paid</p>
                    <p className="font-bold">{formatCurrency(balance.paid)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoices */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Recent Invoices</h2>
              <Link href={`/invoices/new?customerId=${id}`}>
                <Button size="sm" variant="ghost" className="text-primary hover:text-primary gap-1">
                  <Plus className="h-4 w-4" /> Create
                </Button>
              </Link>
            </div>
            {invoices.length === 0 ? (
              <Card className="bg-transparent border-dashed border-2 shadow-none py-8 text-center text-muted-foreground text-sm font-medium">
                No invoices recorded for this customer.
              </Card>
            ) : (
              <div className="grid gap-3">
                {invoices.slice(0, 5).map((inv) => (
                  <Link key={inv._id} href={`/invoices/${inv._id}`} className="group">
                    <Card className="hover:shadow-md transition-all">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-secondary p-2 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Receipt className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold group-hover:text-primary transition-colors">{inv.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {formatDate(inv.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <span className="font-bold tabular-nums">{formatCurrency(inv.totalAmount)}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Payments */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Payment History</h2>
              <Link href={`/payments/new?customerId=${id}`}>
                <Button size="sm" variant="ghost" className="text-primary hover:text-primary gap-1">
                  <Plus className="h-4 w-4" /> Record
                </Button>
              </Link>
            </div>
            {payments.length === 0 ? (
              <Card className="bg-transparent border-dashed border-2 shadow-none py-8 text-center text-muted-foreground text-sm font-medium">
                No payments recorded yet.
              </Card>
            ) : (
              <div className="grid gap-3">
                {payments.slice(0, 5).map((p) => (
                  <Card key={p._id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-green-50 p-2 text-green-600">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold">Payment Recieved</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            {p.paymentMode} • {formatDate(p.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 tabular-nums">+{formatCurrency(p.amount)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
