import Link from "next/link";
import { getLedgerReport } from "@/lib/actions/reports";
import { getCustomers } from "@/lib/actions/customers";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function LedgerReportPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const params = await searchParams;
  const customerId = params.customerId ?? undefined;
  const [entries, customers] = await Promise.all([
    getLedgerReport(customerId),
    getCustomers(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Ledger</h1>
        <div className="flex gap-2">
          <a
            href={`/api/export/excel?type=ledger${customerId ? `&customerId=${customerId}` : ""}`}
            download="ledger.xlsx"
          >
            <span className="inline-flex items-center justify-center rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800">
              Download Excel
            </span>
          </a>
          <Link href="/reports">
            <span className="text-sm text-neutral-500 hover:underline">Back to reports</span>
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader className="font-medium">Filter by customer</CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            <Link
              href="/reports/ledger"
              className={`rounded px-2 py-1 text-sm ${
                !customerId ? "bg-neutral-200 dark:bg-neutral-700" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              All
            </Link>
            {customers.map((c) => (
              <Link
                key={c._id}
                href={`/reports/ledger?customerId=${c._id}`}
                className={`rounded px-2 py-1 text-sm ${
                  customerId === c._id ? "bg-neutral-200 dark:bg-neutral-700" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="font-medium">Transaction history</CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Reference</th>
                  <th className="text-right p-2">Amount</th>
                  <th className="text-right p-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr
                    key={i}
                    className="border-b border-neutral-100 dark:border-neutral-800"
                  >
                    <td className="p-2">{formatDate(e.date)}</td>
                    <td className="p-2 capitalize">{e.type}</td>
                    <td className="p-2">{e.reference}</td>
                    <td
                      className={`text-right tabular-nums p-2 ${
                        e.amount >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {e.amount >= 0 ? "+" : ""}
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="text-right tabular-nums p-2">
                      {formatCurrency(e.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {entries.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-neutral-500">
              No transactions.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
