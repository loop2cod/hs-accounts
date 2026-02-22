import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { getCustomers } from "@/lib/actions/customers";
import { createInvoiceFromForm } from "@/lib/actions/invoices";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const params = await searchParams;
  const customers = await getCustomers();
  const customerId = params.customerId ?? "";

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">New invoice</h1>
        <Link href="/invoices">
          <span className="text-sm text-neutral-500 hover:underline">Back to list</span>
        </Link>
      </div>
      <Card>
        <CardHeader className="font-medium">Invoice details</CardHeader>
        <CardContent>
          <InvoiceForm
            customerId={customerId}
            customers={customers.map((c) => ({ _id: c._id, name: c.name, shopName: c.shopName }))}
            action={createInvoiceFromForm}
          />
        </CardContent>
      </Card>
    </div>
  );
}
