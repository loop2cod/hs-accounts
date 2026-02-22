import { CustomerForm } from "@/components/customers/CustomerForm";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { createCustomerFromForm } from "@/lib/actions/customers";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-md space-y-4 px-3">
      <h1 className="text-lg font-semibold">New customer</h1>
      <Card>
        <CardHeader className="font-medium">Customer details</CardHeader>
        <CardContent>
          <CustomerForm action={createCustomerFromForm as any} />
        </CardContent>
      </Card>
    </div>
  );
}
