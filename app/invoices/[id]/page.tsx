import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/actions/invoices";
import { getCustomerById } from "@/lib/actions/customers";
import { Button } from "@/components/ui/Button";
import { PrintButton } from "@/components/invoices/PrintButton";
import { formatCurrency, formatDate } from "@/lib/utils";

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
          <div className="inv-header-left">
            <div className="inv-company-name">HS Accounts</div>
            <div className="text-neutral-600">
              Textile Trader
            </div>
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

        <div className="inv-recipient">
          <strong>Bill To:</strong>
          <br />
          {customer ? (
            <>
              {customer.name}
              <br />
              {customer.shopName}
              {customer.address && (
                <>
                  <br />
                  {customer.address}
                </>
              )}
              {customer.gstNumber && (
                <>
                  <br />
                  GST: {customer.gstNumber}
                </>
              )}
              {customer.panNumber && (
                <>
                  <br />
                  PAN: {customer.panNumber}
                </>
              )}
            </>
          ) : (
            "—"
          )}
        </div>

        <table className="inv-table">
          <thead>
            <tr>
              <th style={{ width: "5%" }}>#</th>
              <th>Description</th>
              <th style={{ width: "10%", textAlign: "right" }} className="num">
                Qty
              </th>
              <th style={{ width: "15%", textAlign: "right" }} className="num">
                Unit Price
              </th>
              {invoice.withGst && (
                <>
                  <th style={{ width: "8%", textAlign: "right" }} className="num">
                    GST%
                  </th>
                  <th style={{ width: "12%", textAlign: "right" }} className="num">
                    GST
                  </th>
                </>
              )}
              <th style={{ width: "15%", textAlign: "right" }} className="num">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{item.description}</td>
                <td className="num">{item.quantity}</td>
                <td className="num">{formatCurrency(item.unitPrice)}</td>
                {invoice.withGst && (
                  <>
                    <td className="num">{item.gstRate ?? 0}%</td>
                    <td className="num">
                      {formatCurrency(item.gstAmount ?? 0)}
                    </td>
                  </>
                )}
                <td className="num">
                  {formatCurrency(
                    item.totalRow ?? item.amount + (item.gstAmount ?? 0)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="inv-totals">
          <tbody>
            <tr>
              <td>Subtotal:</td>
              <td className="inv-totals-r">
                {formatCurrency(invoice.subtotal)}
              </td>
            </tr>
            {invoice.withGst && invoice.totalGst != null && (
              <tr>
                <td>GST:</td>
                <td className="inv-totals-r">
                  {formatCurrency(invoice.totalGst)}
                </td>
              </tr>
            )}
            <tr>
              <td>
                <strong>Total:</strong>
              </td>
              <td className="inv-totals-r">
                <strong>{formatCurrency(invoice.totalAmount)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {invoice.notes && (
          <div className="inv-notes">{invoice.notes}</div>
        )}

        <div className="inv-bottom">
          <div className="inv-bottom-left">
            <strong>HS Accounts</strong>
            <br />
            Textile Trader
          </div>
          <div className="inv-bottom-right">Thank you for your business.</div>
        </div>
      </div>
    </>
  );
}
