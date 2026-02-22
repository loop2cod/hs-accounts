import Link from "next/link";
import { getInvoices } from "@/lib/actions/invoices";
import { getCustomers } from "@/lib/actions/customers";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; customerId?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter; // "all" | "gst" | "nogst"
  const withGstFilter =
    filter === "gst" ? true : filter === "nogst" ? false : undefined;
  const invoices = await getInvoices({
    withGst: withGstFilter,
    customerId: params.customerId,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Invoices</h1>
        <div className="flex gap-2">
          <a
            href={`/api/export/excel?type=invoices${params.filter ? `&filter=${params.filter}` : ""}`}
            download="invoices.xlsx"
          >
            <Button size="sm" variant="secondary">Download Excel</Button>
          </a>
          <Link href="/invoices/new">
            <Button size="sm">New invoice</Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-wrap gap-1 py-2">
          <Link
            href="/invoices"
            className={`rounded px-2 py-1 text-sm ${!filter || filter === "all"
                ? "bg-neutral-200"
                : "hover:bg-neutral-100"
              }`}
          >
            All
          </Link>
          <Link
            href="/invoices?filter=gst"
            className={`rounded px-2 py-1 text-sm ${filter === "gst"
                ? "bg-neutral-200"
                : "hover:bg-neutral-100"
              }`}
          >
            With GST
          </Link>
          <Link
            href="/invoices?filter=nogst"
            className={`rounded px-2 py-1 text-sm ${filter === "nogst"
                ? "bg-neutral-200"
                : "hover:bg-neutral-100"
              }`}
          >
            Without GST
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-neutral-500">
              No invoices match the filter.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {invoices.map((inv) => (
                <li key={inv._id}>
                  <Link
                    href={`/invoices/${inv._id}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <span className="font-mono">{inv.invoiceNumber}</span>
                    <span>{formatDate(inv.date)}</span>
                    <span>{formatCurrency(inv.totalAmount)}</span>
                    <span className="text-xs text-neutral-500">
                      {inv.withGst ? "GST" : "Non-GST"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
