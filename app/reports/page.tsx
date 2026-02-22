import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-md space-y-4 px-3">
      <h1 className="text-lg font-semibold">Reports</h1>
      <Card>
        <CardHeader className="font-medium">Reports</CardHeader>
        <CardContent className="space-y-2">
          <Link
            href="/reports/due-balance"
            className="block rounded p-2 text-sm hover:bg-neutral-100"
          >
            Due & balance
          </Link>
          <Link
            href="/reports/ledger"
            className="block rounded p-2 text-sm hover:bg-neutral-100"
          >
            Ledger (transaction history)
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
