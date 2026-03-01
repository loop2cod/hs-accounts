import Link from "next/link";
import { getDueBalanceReport } from "@/lib/actions/reports";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatCurrency, ROUTE_WEEKDAYS } from "@/lib/utils";
import { Filter } from "lucide-react";

export default async function DueBalanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ weekday?: string }>;
}) {
  const { weekday } = await searchParams;
  const weekdayFilter = weekday ? parseInt(weekday, 10) : undefined;
  const rows = await getDueBalanceReport(weekdayFilter);

  const totalDue = rows.reduce((sum, r) => sum + r.due, 0);
  const totalPaid = rows.reduce((sum, r) => sum + r.paid, 0);
  const totalBalance = rows.reduce((sum, r) => sum + r.balance, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Due & balance</h1>
        <div className="flex gap-2">
          <a href="/api/export/excel?type=due-balance" download="due-balance.xlsx">
            <span className="inline-flex items-center justify-center rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-100">
              Download Excel
            </span>
          </a>
          <Link href="/reports">
            <span className="text-sm text-neutral-500 hover:underline">Back to reports</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-neutral-500" />
        <Link
          href="/reports/due-balance"
          className={`px-3 py-1 text-sm rounded-full border ${
            weekday === undefined
              ? "bg-primary text-white border-primary"
              : "border-neutral-300 hover:bg-neutral-100"
          }`}
        >
          All
        </Link>
        {ROUTE_WEEKDAYS.map((d) => (
          <Link
            key={d.value}
            href={`/reports/due-balance?weekday=${d.value}`}
            className={`px-3 py-1 text-sm rounded-full border ${
              weekdayFilter === d.value
                ? "bg-primary text-white border-primary"
                : "border-neutral-300 hover:bg-neutral-100"
            }`}
          >
            {d.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="font-medium">Customer-wise due and balance</CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left p-2">Shop</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Weekday</th>
                  <th className="text-right p-2">Due</th>
                  <th className="text-right p-2">Paid</th>
                  <th className="text-right p-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.customerId}
                    className="border-b border-neutral-100"
                  >
                    <td className="p-2">
                      <Link
                        href={`/customers/${r.customerId}`}
                        className="text-neutral-900 hover:underline font-medium"
                      >
                        {r.shopName}
                      </Link>
                    </td>
                    <td className="p-2 text-neutral-600">
                      {r.customerName || "-"}
                    </td>
                    <td className="p-2 text-neutral-600">
                      {ROUTE_WEEKDAYS.find((w) => w.value === r.routeWeekday)?.label ?? ""}
                    </td>
                    <td className="text-right tabular-nums p-2">
                      {formatCurrency(r.due)}
                    </td>
                    <td className="text-right tabular-nums p-2">
                      {formatCurrency(r.paid)}
                    </td>
                    <td className={`text-right tabular-nums p-2 font-medium ${r.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(r.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-neutral-100 font-semibold">
                <tr>
                  <td className="p-2" colSpan={3}>Total ({rows.length} customers)</td>
                  <td className="text-right tabular-nums p-2">{formatCurrency(totalDue)}</td>
                  <td className="text-right tabular-nums p-2">{formatCurrency(totalPaid)}</td>
                  <td className={`text-right tabular-nums p-2 ${totalBalance > 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(totalBalance)}</td>
                </tr>
              </tfoot>
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
