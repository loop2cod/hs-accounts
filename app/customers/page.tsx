import Link from "next/link";
import { getCustomers } from "@/lib/actions/customers";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ROUTE_WEEKDAYS } from "@/lib/utils";
import {
  Users,
  Download,
  UserPlus,
  Filter,
  ChevronRight,
  Store,
  MapPin
} from "lucide-react";

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
      ? { routeWeekday: weekdayFilter }
      : undefined
  );

  const weekdayLabel = (n: number) => ROUTE_WEEKDAYS.find((w) => w.value === n)?.label ?? "";

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
            <p className="text-sm text-muted-foreground">Manage your customer database and routes.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/export/excel?type=customers" download="customers.xlsx">
            <Button variant="secondary" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </a>
          <Link href="/customers/new">
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              New Customer
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-muted-foreground px-1">
            <Filter className="h-4 w-4" />
            Route Filters
          </div>
          <div className="flex flex-wrap gap-2 lg:flex-col">
            <Link
              href="/customers"
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${weekdayFilter === undefined
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                  : "bg-card hover:bg-secondary text-muted-foreground"
                }`}
            >
              All Routes
            </Link>
            {ROUTE_WEEKDAYS.map(({ value, label }) => (
              <Link
                key={value}
                href={`/customers?weekday=${value}`}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${weekdayFilter === value
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                    : "bg-card hover:bg-secondary text-muted-foreground"
                  }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </aside>

        {/* Customer List */}
        <main className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {customers.length} {customers.length === 1 ? "Customer" : "Customers"} Found
            </h2>
          </div>

          {customers.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent shadow-none">
              <CardContent className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold">No customers found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or add a new customer.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {customers.map((c) => (
                <Link key={c._id} href={`/customers/${c._id}`} className="group">
                  <Card className="transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-secondary group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors sm:flex">
                          <Store className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{c.name}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Store className="h-3 w-3" />
                              {c.shopName}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {weekdayLabel(c.routeWeekday)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 items-center justify-center rounded-full bg-secondary hidden sm:flex">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
