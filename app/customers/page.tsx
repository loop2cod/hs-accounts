import Link from "next/link";
import { getCustomers } from "@/lib/actions/customers";
import type { RouteWeekday } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ROUTE_WEEKDAYS } from "@/lib/utils";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ weekday?: string }>;
}) {
  const params = await searchParams;
  const weekdayFilter =
    params.weekday !== undefined && params.weekday !== ""
      ? parseInt(params.weekday, 10)
      : undefined;
  const customers = await getCustomers(
    weekdayFilter !== undefined && !Number.isNaN(weekdayFilter)
      ? { routeWeekday: weekdayFilter as RouteWeekday }
      : undefined
  );
  const weekdayLabel = (n: number) => ROUTE_WEEKDAYS.find((w) => w.value === n)?.label ?? "";

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Customers</h1>
        <div className="flex gap-2">
          <a href="/api/export/excel?type=customers" download="customers.xlsx">
            <Button size="sm" variant="secondary">Download Excel</Button>
          </a>
          <Link href="/customers/new">
            <Button size="sm">New customer</Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader className="font-medium">Filter by route weekday</CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            <Link
              href="/customers"
              className={`rounded px-2 py-1 text-sm ${weekdayFilter === undefined
                ? "bg-neutral-200"
                : "hover:bg-neutral-100"
                }`}
            >
              All
            </Link>
            {ROUTE_WEEKDAYS.map(({ value, label }) => (
              <Link
                key={value}
                href={`/customers?weekday=${value}`}
                className={`rounded px-2 py-1 text-sm ${weekdayFilter === value
                  ? "bg-neutral-200"
                  : "hover:bg-neutral-100"
                  }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {customers.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-neutral-500">
              No customers yet. Add one to get started.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {customers.map((c) => (
              <li key={c._id}>
                <Link href={`/customers/${c._id}`}>
                  <Card className="transition-colors hover:bg-neutral-50">
                    <CardContent className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-neutral-500">
                          {c.shopName} · Route: {weekdayLabel(c.routeWeekday)}
                        </p>
                      </div>
                      <span className="text-xs text-neutral-500">View</span>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
