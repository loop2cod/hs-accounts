import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  getCustomerById,
  updateCustomerFormAction,
} from "@/lib/actions/customers";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-md space-y-4 px-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Edit customer</h1>
        <Link href={`/customers/${id}`}>
          <Button size="sm" variant="ghost">
            Back
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader className="font-medium">Customer details</CardHeader>
        <CardContent>
          <CustomerForm
            customer={customer}
            action={updateCustomerFormAction.bind(null, id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
