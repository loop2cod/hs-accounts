import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { getCustomers } from "@/lib/actions/customers";
import { getInvoiceById, updateInvoiceFromForm, deleteInvoice } from "@/lib/actions/invoices";

async function DeleteInvoiceForm({ invoiceId }: { invoiceId: string }) {
  async function handleDelete() {
    "use server";
    const result = await deleteInvoice(invoiceId);
    if (result.error) {
      // Handle error - for now just redirect without error display
      redirect(`/invoices/${invoiceId}/edit?error=${encodeURIComponent(result.error)}`);
    }
    redirect("/invoices");
  }

  return (
    <form action={handleDelete}>
      <button 
        type="submit" 
        className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
      >
        Delete Invoice
      </button>
    </form>
  );
}

export default async function EditInvoicePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
        notFound();
    }

    const customers = await getCustomers();

    // Create partially applied action with the invoice ID
    const updateAction = updateInvoiceFromForm.bind(null, id);

    return (
        <div className="mx-auto max-w-3xl space-y-4 px-3">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold">Edit Invoice: {invoice.invoiceNumber}</h1>
                <div className="flex gap-2">
                    <Link href={`/invoices/${id}`}>
                        <span className="text-sm text-neutral-500 hover:underline">Cancel</span>
                    </Link>
                    <DeleteInvoiceForm invoiceId={id} />
                </div>
            </div>
            <Card>
                <CardHeader className="font-medium">Invoice details</CardHeader>
                <CardContent>
                    <InvoiceForm
                        invoice={invoice as any}
                        customers={customers.map((c) => ({
                            _id: c._id as string,
                            name: c.name,
                            shopName: c.shopName,
                            address: c.address,
                        }))}
                        action={updateAction}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
