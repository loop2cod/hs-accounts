import Link from "next/link";
import { getPayments } from "@/lib/actions/payments";
import { getCustomers } from "@/lib/actions/customers";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";
import {
  CreditCard,
  Download,
  Plus,
  ChevronRight,
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
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-2 sm:p-6 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {customerMap.get(p.customerId)?.name ?? "Unknown Customer"}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium whitespace-nowrap">
                            <Calendar className="w-3 h-3" />
                            {formatDate(p.date)}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold uppercase tracking-wider text-[7.5px] whitespace-nowrap">
                            {p.paymentMode}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-2 sm:ml-4">
                      <span className="text-base sm:text-base font-bold text-green-600">
                        +{formatCurrency(p.amount)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
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

