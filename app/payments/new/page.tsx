import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { getCustomers } from "@/lib/actions/customers";
import { createPaymentFromForm } from "@/lib/actions/payments";

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const params = await searchParams;
  const customers = await getCustomers();
  const customerId = params.customerId ?? "";

  return (
    <div className="mx-auto max-w-md space-y-4 px-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Record payment</h1>
        <Link href="/payments">
          <span className="text-sm text-neutral-500 hover:underline">Back</span>
        </Link>
      </div>
      <Card>
        <CardHeader className="font-medium">Payment details</CardHeader>
        <CardContent>
          <PaymentForm
            customerId={customerId}
            customers={customers.map((c) => ({
              _id: c._id,
              name: c.name,
              shopName: c.shopName,
            }))}
            action={createPaymentFromForm}
          />
        </CardContent>
      </Card>
    </div>
  );
}
