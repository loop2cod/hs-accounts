import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/actions/invoices";
import { getCustomerById } from "@/lib/actions/customers";
import { Button } from "@/components/ui/Button";
import { PrintButton } from "@/components/invoices/PrintButton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { numberToWords } from "@/lib/numberToWords";

export default async function InvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();
  const customer = await getCustomerById(invoice.customerId);

  return (
    <>
      {/* Toolbar - hidden in print */}
      <div className="print:hidden mx-auto max-w-3xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200">
        <Link href="/invoices">
          <Button size="sm" variant="ghost">
            Back
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/invoices/${id}/edit`}>
            <Button size="sm" variant="secondary">
              Edit
            </Button>
          </Link>
          <a href={`/invoices/${id}/pdf`}>
            <Button size="sm" variant="secondary">
              Download PDF
            </Button>
          </a>
        </div>
      </div>

      {/* Invoice document - matches template structure */}
      <div className="invoice-doc mx-auto max-w-3xl px-4 py-6 print:py-0 print:px-0 print:max-w-none">
        <div className="inv-header">
          <div className="inv-header-left flex gap-4 items-center">
            <img src="/logo.png" alt="HS Accounts Logo" className="h-16 w-auto mix-blend-multiply scale-200" />
          </div>
          <div className="inv-meta">
            <div className="inv-title">
              {invoice.withGst ? "TAX INVOICE" : "INVOICE"}
            </div>
            <div>
              <strong>Invoice No.:</strong> {invoice.invoiceNumber}
            </div>
            <div>
              <strong>Date:</strong> {formatDate(invoice.date)}
            </div>
            <div>
              <strong>Due Date:</strong> {formatDate(invoice.date)}
            </div>
          </div>
        </div>

        <div className="flex justify-between mb-4 text-sm">
          <div className="inv-recipient border border-neutral-300 p-2 w-[48%] min-h-30">
            <strong>NAME:</strong> {customer?.name || "—"}
            <br />
            <strong>ADDRESS:</strong> {customer?.address || "—"}
            <br />
            {customer?.gstNumber && (
              <>
                <strong>GST IN:</strong> {customer.gstNumber}
                <br />
              </>
            )}
            {customer?.panNumber && (
              <>
                <strong>PAN:</strong> {customer.panNumber}
                <br />
              </>
            )}
            <strong>Phone:</strong> {customer?.phone || "—"}
          </div>

          <div className="inv-recipient border border-neutral-300 p-2 w-[48%] min-h-30">
            <strong>SHIPPING ADDRESS</strong>
            <br />
            <strong>NAME:</strong> {customer?.name || "—"}
            <br />
            <strong>ADDRESS:</strong> {invoice.shippingAddress || customer?.address || "—"}
          </div>
        </div>


        <table className="w-full border-collapse border border-neutral-300 text-sm mb-4">
          <thead className="bg-neutral-100">
            <tr>
              <th className="border border-neutral-300 p-1 w-8 text-center">#</th>
              <th className="border border-neutral-300 p-1 text-left">Commodity / Item</th>
              <th className="border border-neutral-300 p-1 w-24 text-left">HSN/SAC</th>
              <th className="border border-neutral-300 p-1 text-left">Narration</th>
              <th className="border border-neutral-300 p-1 w-24 text-right">Unit Price</th>
              <th className="border border-neutral-300 p-1 w-16 text-right">Qty</th>
              <th className="border border-neutral-300 p-1 w-28 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, i) => (
              <tr key={i}>
                <td className="border border-neutral-300 p-1 text-center">{i + 1}</td>
                <td className="border border-neutral-300 p-1">{item.description}</td>
                <td className="border border-neutral-300 p-1">{item.hsnSac || ""}</td>
                <td className="border border-neutral-300 p-1">{item.narration || ""}</td>
                <td className="border border-neutral-300 p-1 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="border border-neutral-300 p-1 text-right">{item.quantity}</td>
                <td className="border border-neutral-300 p-1 text-right">
                  {formatCurrency(
                    item.totalRow ?? item.amount + (item.gstAmount ?? 0)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex text-sm border border-neutral-300 mb-4">
          <div className="p-2 w-3/4 border-r border-neutral-300 flex flex-col justify-between">
            <div>
              <strong>Grand Total in words:</strong>
              <div className="font-semibold text-neutral-800 lowercase">
                {numberToWords(invoice.totalAmount)}
              </div>
            </div>
            {invoice.notes && (
              <div className="mt-4 pt-2 border-t border-neutral-200 text-neutral-600">
                <strong>Notes:</strong> {invoice.notes}
              </div>
            )}
          </div>
          <div className="w-1/4">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-neutral-300">
                  <td className="p-1 font-medium bg-neutral-50/50">Amount</td>
                  <td className="p-1 text-right">{formatCurrency(invoice.subtotal)}</td>
                </tr>
                {invoice.freight != null && invoice.freight > 0 && (
                  <tr className="border-b border-neutral-300">
                    <td className="p-1 font-medium bg-neutral-50/50">Freight</td>
                    <td className="p-1 text-right">{formatCurrency(Math.abs(invoice.freight))}</td>
                  </tr>
                )}
                {(invoice.freight != null && invoice.freight > 0) && (
                  <tr className="border-b border-neutral-300">
                    <td className="p-1 font-medium bg-neutral-50/50 text-xs">Taxable Amt</td>
                    <td className="p-1 text-right">
                      {formatCurrency(invoice.subtotal + invoice.freight)}
                    </td>
                  </tr>
                )}
                {invoice.withGst && invoice.totalGst != null && (
                  <>
                    <tr className="border-b border-neutral-300">
                      <td className="p-1 font-medium bg-neutral-50/50">CGST (2.5%)</td>
                      <td className="p-1 text-right">
                        {formatCurrency(invoice.totalGst / 2)}
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-300">
                      <td className="p-1 font-medium bg-neutral-50/50">SGST (2.5%)</td>
                      <td className="p-1 text-right">
                        {formatCurrency(invoice.totalGst / 2)}
                      </td>
                    </tr>
                  </>
                )}
                <tr>
                  <td className="p-2 font-bold bg-neutral-200/50">Grand Total</td>
                  <td className="p-2 text-right font-bold text-lg bg-neutral-200/50">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs border border-neutral-300 p-2 flex justify-between">
          <div>
            <strong>DECLARATION:</strong> Certified that all the particulars shown in the above invoice are true and correct.
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="mb-8">for <strong>HS Hajass Traders</strong></span>
            <span>Authorised Signatory</span>
          </div>
        </div>
      </div >
    </>
  );
}
