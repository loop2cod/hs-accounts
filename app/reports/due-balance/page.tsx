import Link from "next/link";
import { getDueBalanceReport } from "@/lib/actions/reports";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

export default async function DueBalanceReportPage() {
  const rows = await getDueBalanceReport();

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Due & balance</h1>
        <div className="flex gap-2">
          <a href="/api/export/excel?type=due-balance" download="due-balance.xlsx">
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
        <CardHeader className="font-medium">Customer-wise due and balance</CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Shop</th>
                  <th className="text-right p-2">Due</th>
                  <th className="text-right p-2">Paid</th>
                  <th className="text-right p-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.customerId}
                    className="border-b border-neutral-100 dark:border-neutral-800"
                  >
                    <td className="p-2">
                      <Link
                        href={`/customers/${r.customerId}`}
                        className="text-neutral-900 hover:underline dark:text-white"
                      >
                        {r.customerName}
                      </Link>
                    </td>
                    <td className="p-2 text-neutral-600 dark:text-neutral-400">
                      {r.shopName}
                    </td>
                    <td className="text-right tabular-nums p-2">
                      {formatCurrency(r.due)}
                    </td>
                    <td className="text-right tabular-nums p-2">
                      {formatCurrency(r.paid)}
                    </td>
                    <td className="text-right tabular-nums p-2 font-medium">
                      {formatCurrency(r.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-neutral-500">
              No customer data.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
