import Link from "next/link";
import { getPayments } from "@/lib/actions/payments";
import { getCustomers } from "@/lib/actions/customers";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";
import { PaymentListItem } from "@/components/payments/PaymentListItem";
import {
  CreditCard,
  Download,
  Plus,
  Calendar,
  Wallet
} from "lucide-react";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const limit = 10;

  const { payments, totalPages } = await getPayments({
    customerId: params.customerId,
    page,
    limit,
  });

  const customers = await getCustomers();
  const customerMap = new Map(customers.map((c) => [c._id, c]));

  const baseUrl = `/payments${params.customerId ? `?customerId=${params.customerId}` : ""}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payments</h1>
          <p className="text-slate-500">Track and manage received payments from customers.</p>
        </div>
        <div className="flex gap-3">
          <a href="/api/export/excel?type=payments" download="payments.xlsx">
            <Button size="md" variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </Button>
          </a>
          <Link href="/payments/new">
            <Button size="md" className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              Record Payment
            </Button>
          </Link>
        </div>
      </header>

      <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50">
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No payments recorded</h3>
              <p className="text-slate-500 mt-1 max-w-xs mx-auto">Once you start receiving payments, they will appear in this list.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {payments.map((p: any) => (
                  <PaymentListItem
                    key={p._id}
                    payment={p}
                    customerName={(customerMap.get(p.customerId)?.name || customerMap.get(p.customerId)?.shopName) ?? "Unknown Customer"}
                  />
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

