import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-3">
      <h1 className="text-lg font-semibold">Dashboard</h1>
      <Card>
        <CardHeader className="font-medium">Quick actions</CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/customers/new">
            <Button size="sm">New customer</Button>
          </Link>
          <Link href="/invoices/new">
            <Button size="sm" variant="primary">New invoice</Button>
          </Link>
          <Link href="/payments/new">
            <Button size="sm">Record payment</Button>
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="font-medium">Reports</CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/reports/due-balance">
            <Button size="sm" variant="secondary">Due & balance</Button>
          </Link>
          <Link href="/reports/ledger">
            <Button size="sm" variant="secondary">Ledger</Button>
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="font-medium">Summary</CardHeader>
        <CardContent className="text-neutral-600">
          <p className="text-sm">Total customers, outstanding dues, and recent activity will appear here once data exists.</p>
        </CardContent>
      </Card>
    </div>
  );
}
