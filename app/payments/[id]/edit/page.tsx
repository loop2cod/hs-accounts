import Link from "next/link";
import { notFound } from "next/navigation";
import { getPaymentById } from "@/lib/actions/payments";
import { getCustomers } from "@/lib/actions/customers";
import { updatePaymentFromForm } from "@/lib/actions/payments";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default async function EditPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payment = await getPaymentById(id);
  if (!payment) notFound();

  const customers = await getCustomers();
  const customer = customers.find((c) => c._id === payment.customerId);

  const defaultValues = {
    amount: payment.amount,
    date: payment.date,
    paymentMode: payment.paymentMode,
    reference: payment.reference,
    notes: payment.notes,
  };

  return (
    <div className="mx-auto max-w-md space-y-4 px-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Edit payment</h1>
        <Link href="/payments">
          <Button size="sm" variant="ghost">
            Back
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader className="font-medium">
          Payment for {customer?.name || customer?.shopName || "Unknown"}
        </CardHeader>
        <CardContent>
          <PaymentForm
            customerId={payment.customerId}
            customers={customers}
            action={updatePaymentFromForm.bind(null, id)}
            defaultValues={defaultValues}
            submitLabel="Update Payment"
          />
        </CardContent>
      </Card>
    </div>
  );
}
