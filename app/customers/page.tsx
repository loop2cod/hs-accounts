import Link from "next/link";
import { getCustomers } from "@/lib/actions/customers";
import type { RouteWeekday } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ROUTE_WEEKDAYS } from "@/lib/utils";
import {
  Users,
  Download,
  UserPlus,
  ChevronRight,
  MapPin,
  Clock,
  Search,
} from "lucide-react";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ weekday?: string; search?: string }>;
}) {
  const params = await searchParams;
  const weekdayFilter =
    params.weekday !== undefined && params.weekday !== ""
      ? parseInt(params.weekday, 10)
      : undefined;
  
  const customers = await getCustomers({
    routeWeekday: weekdayFilter !== undefined && !Number.isNaN(weekdayFilter)
      ? (weekdayFilter as RouteWeekday)
      : undefined,
    search: params.search,
  });
  
  const weekdayLabel = (n: number) => ROUTE_WEEKDAYS.find((w) => w.value === n)?.label ?? "";

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500">Manage your business contacts and delivery routes.</p>
        </div>
        <div className="flex gap-3">
          <a href="/api/export/excel?type=customers" download="customers.xlsx">
            <Button size="md" variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </Button>
          </a>
          <Link href="/customers/new">
            <Button size="md" className="gap-2 shadow-lg shadow-primary/20">
              <UserPlus className="w-4 h-4" />
              New Customer
            </Button>
          </Link>
        </div>
      </header>

      {/* Search Bar */}
      <form className="relative" action="/customers" method="GET">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          name="search"
          placeholder="Search by shop name, customer name, phone, or address..."
          defaultValue={params.search ?? ""}
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
        />
        {weekdayFilter !== undefined && (
          <input type="hidden" name="weekday" value={weekdayFilter} />
        )}
        {params.search && (
          <a
            href={`/customers${weekdayFilter !== undefined ? `?weekday=${weekdayFilter}` : ""}`}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <span className="text-slate-400 text-xs">✕</span>
          </a>
        )}
      </form>

      <Card className="bg-slate-50/50 border-slate-200/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter by Route</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/customers${params.search ? `?search=${encodeURIComponent(params.search)}` : ""}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                weekdayFilter === undefined
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Routes
            </Link>
            {ROUTE_WEEKDAYS.map(({ value, label }) => (
              <Link
                key={value}
                href={`/customers?weekday=${value}${params.search ? `&search=${encodeURIComponent(params.search)}` : ""}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  weekdayFilter === value
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {customers.length === 0 ? (
          <Card className="border-dashed bg-slate-50/50">
            <CardContent className="py-12 text-center">
              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">
                {params.search ? "No customers found" : "No customers yet"}
              </h3>
              <p className="text-slate-500 mt-1">
                {params.search
                  ? "Try adjusting your search terms."
                  : "Try adjusting your filters or add a new customer."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {customers.map((c) => (
              <Link key={c._id} href={`/customers/${c._id}`} className="group drop-shadow-sm">
                <Card className="transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.995]">
                  <CardContent className="flex items-center justify-between gap-4 py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary font-bold group-hover:bg-primary/5">
                        {(c.shopName || c.phone || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900 leading-none">{c.shopName || "-"}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {c.shopName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {weekdayLabel(c.routeWeekday)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
