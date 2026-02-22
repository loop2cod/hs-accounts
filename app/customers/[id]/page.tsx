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
    <div className="mx-auto max-w-3xl space-y-4 px-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{customer.name}</h1>
        <div className="flex gap-2">
          <Link href={`/customers/${id}/edit`}>
            <Button size="sm" variant="secondary">
              Edit
            </Button>
          </Link>
          <Link href="/customers">
            <Button size="sm" variant="ghost">
              Back
            </Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader className="font-medium">Details</CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Shop: {customer.shopName}</p>
          <p>Phone: {customer.phone}</p>
          {customer.address && <p>Address: {customer.address}</p>}
          <p>Route weekday: {weekdayLabel}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="font-medium">Balance</CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-neutral-500">Due</p>
            <p className="font-medium">{formatCurrency(balance.due)}</p>
          </div>
          <div>
            <p className="text-neutral-500">Paid</p>
            <p className="font-medium">{formatCurrency(balance.paid)}</p>
          </div>
          <div>
            <p className="text-neutral-500">Balance</p>
            <p className="font-medium">{formatCurrency(balance.balance)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between font-medium">
          <span>Invoices</span>
          <Link href={`/invoices/new?customerId=${id}`}>
            <Button size="sm">New invoice</Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-neutral-500">
              No invoices yet.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {invoices.map((inv) => (
                <li key={inv._id}>
                  <Link
                    href={`/invoices/${inv._id}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <span className="font-mono">{inv.invoiceNumber}</span>
                    <span>{formatDate(inv.date)}</span>
                    <span>{formatCurrency(inv.totalAmount)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between font-medium">
          <span>Payments</span>
          <Link href={`/payments/new?customerId=${id}`}>
            <Button size="sm">Record payment</Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-neutral-500">
              No payments yet.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {payments.map((p) => (
                <li
                  key={p._id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span>{formatDate(p.date)}</span>
                  <span>{formatCurrency(p.amount)}</span>
                  <span className="text-neutral-500">{p.paymentMode}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
