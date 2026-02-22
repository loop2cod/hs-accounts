import Link from "next/link";
import { getPayments } from "@/lib/actions/payments";
import { getCustomers } from "@/lib/actions/customers";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CreditCard,
  Download,
  PlusCircle,
  User,
  Calendar,
  ChevronRight,
  Wallet,
  Store
} from "lucide-react";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const params = await searchParams;
  const payments = await getPayments({ customerId: params.customerId });
  const customers = await getCustomers();
  const customerMap = new Map(customers.map((c) => [c._id, c]));

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-green-50 p-3 text-green-600">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
            <p className="text-sm text-muted-foreground">Monitor and record all incoming funds.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/export/excel?type=payments" download="payments.xlsx">
            <Button variant="secondary" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </a>
          <Link href="/payments/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Record Payment
            </Button>
          </Link>
        </div>
      </div>

      {/* Payment List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {payments.length} {payments.length === 1 ? "Payment" : "Payments"} Received
          </h2>
        </div>

        {payments.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent shadow-none">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Wallet className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">No payments found</h3>
              <p className="text-sm text-muted-foreground">New payments will appear here once recorded.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {payments.map((p) => {
              const customer = customerMap.get(p.customerId);
              return (
                <Card key={p._id} className="transition-all duration-200 hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4 flex-wrap gap-4">
                    <div className="flex items-center gap-4 min-w-[200px] flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">
                          {customer?.name ?? "Unknown Customer"}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Store className="h-3 w-3" /> {customer?.shopName || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 text-sm">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Method</p>
                        <p className="font-bold underline decoration-primary/20 underline-offset-4">{p.paymentMode}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(p.date)}
                        </p>
                      </div>
                      <div className="text-right pl-4 border-l border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</p>
                        <p className="text-lg font-black text-green-600 tabular-nums">+{formatCurrency(p.amount)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
