import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { getCustomers } from "@/lib/actions/customers";
import { getInvoiceById, updateInvoiceFromForm } from "@/lib/actions/invoices";

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
                <Link href={`/invoices/${id}`}>
                    <span className="text-sm text-neutral-500 hover:underline">Cancel</span>
                </Link>
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
