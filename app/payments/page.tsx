import Link from "next/link";
import { getPayments } from "@/lib/actions/payments";
import { getCustomers } from "@/lib/actions/customers";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";

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
    <div className="mx-auto max-w-3xl space-y-4 px-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Payments</h1>
        <div className="flex gap-2">
          <a href="/api/export/excel?type=payments" download="payments.xlsx">
            <Button size="sm" variant="secondary">Download Excel</Button>
          </a>
          <Link href="/payments/new">
            <Button size="sm">Record payment</Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-neutral-500">
              No payments yet.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {payments.map((p) => (
                <li
                  key={p._id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span>
                    {customerMap.get(p.customerId)?.name ?? p.customerId}
                  </span>
                  <span>{formatDate(p.date)}</span>
                  <span className="font-medium">{formatCurrency(p.amount)}</span>
                  <span className="text-xs text-neutral-500">
                    {p.paymentMode}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
