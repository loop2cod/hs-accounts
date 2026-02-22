"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { LineItem, Invoice } from "@/lib/types";

interface InvoiceFormProps {
  invoice?: Invoice | null;
  customerId?: string;
  customers: { _id: string; name: string; shopName: string; address?: string }[];
  action: (formData: FormData) => Promise<unknown>;
}

const defaultLineItem: LineItem = {
  description: "",
  hsnSac: "",
  narration: "",
  quantity: 0,
  unitPrice: 0,
  amount: 0,
  gstRate: 5,
};

export function InvoiceForm({ invoice, customerId, customers, action }: InvoiceFormProps) {
  const defaultCustId = invoice ? invoice.customerId.toString() : (customerId || "");
  const [withGst, setWithGst] = useState(invoice ? invoice.withGst : false);
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice && invoice.lineItems.length > 0 ? invoice.lineItems : [{ ...defaultLineItem }]
  );
  const [error, setError] = useState<string | null>(null);

  // Find initial shipping address if customer is pre-selected for a new invoice
  const getInitialAddress = () => {
    if (invoice?.shippingAddress) return invoice.shippingAddress;
    if (customerId) {
      const cust = customers.find(c => c._id === customerId);
      return cust?.address || "";
    }
    return "";
  };

  const [shippingAddress, setShippingAddress] = useState(getInitialAddress());
  const formRef = useRef<HTMLFormElement>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  const updateLineItem = useCallback(
    (index: number, field: keyof LineItem, value: string | number) => {
      setLineItems((prev) => {
        const next = [...prev];
        const item = { ...next[index], [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          const q = field === "quantity" ? Number(value) : item.quantity;
          const u = field === "unitPrice" ? Number(value) : item.unitPrice;
          item.amount = q * u;
        }
        next[index] = item;
        return next;
      });
    },
    []
  );

  const addRow = useCallback(() => {
    setLineItems((prev) => {
      const nextLength = prev.length;
      setTimeout(() => rowRefs.current[nextLength]?.querySelector("input")?.focus(), 50);
      return [...prev, { ...defaultLineItem }];
    });
  }, []);

  const removeRow = useCallback((index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }, [lineItems.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, rowIndex: number, field: "desc" | "qty" | "rate" | "amount") => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          formRef.current?.requestSubmit();
          return;
        }
        const fields: ("desc" | "qty" | "rate" | "amount")[] = ["desc", "qty", "rate", "amount"];
        const idx = fields.indexOf(field);
        if (idx < 3) {
          const next = (e.currentTarget as HTMLElement).closest("tr")?.querySelectorAll("input")[idx + 1];
          (next as HTMLInputElement | undefined)?.focus();
        } else {
          if (rowIndex >= lineItems.length - 1) addRow();
          const nextRow = rowRefs.current[rowIndex + 1];
          nextRow?.querySelector("input")?.focus();
        }
      }
    },
    [lineItems.length, addRow]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("lineItems", JSON.stringify(lineItems));
    fd.set("withGst", withGst ? "true" : "false");
    const result = await action(fd);
    if (result && typeof result === "object" && "error" in result && result.error) {
      setError(String(result.error));
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 bg-white p-4 md:p-6 rounded-2xl border border-slate-200/60 shadow-sm">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-1" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</label>
            <label className="flex items-center gap-2 text-xs font-semibold text-primary/80 cursor-pointer hover:text-primary transition-colors">
              <input
                type="checkbox"
                name="withGst"
                checked={withGst}
                onChange={(e) => setWithGst(e.target.checked)}
                disabled={!!invoice}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary"
              />
              Include GST (5%)
            </label>
          </div>

          <div className="space-y-4">
            <Select
              name="customerId"
              required
              disabled={!!invoice}
              defaultValue={defaultCustId || undefined}
              className="bg-slate-50/50 border-slate-200/50 focus:bg-white"
              onChange={(e) => {
                const selectedId = e.target.value;
                const cust = customers.find(c => c._id === selectedId);
                setShippingAddress(cust?.address || "");
              }}
            >
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} – {c.shopName}
                </option>
              ))}
            </Select>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Shipping Address</label>
              <textarea
                name="shippingAddress"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all min-h-20 placeholder:text-slate-400 focus:bg-white"
                placeholder="Full delivery address..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invoice Date</label>
            <Input
              name="date"
              type="date"
              required
              className="bg-slate-50/50 border-slate-200/50 focus:bg-white"
              defaultValue={invoice ? new Date(invoice.date).toISOString().slice(0, 10) : today}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notes & Terms</label>
            <textarea
              name="notes"
              className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all min-h-20 placeholder:text-slate-400 focus:bg-white"
              defaultValue={invoice?.notes || ""}
              placeholder="Special instructions or terms..."
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Line Items</label>
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-7 rounded-lg text-[10px] font-bold uppercase tracking-wider px-3">
            Add Row
          </Button>
        </div>

        <div className="space-y-4 md:space-y-0 md:border md:border-slate-100 md:rounded-xl md:overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:grid md:grid-cols-12 bg-slate-50/80 border-b border-slate-100 px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-4">Description</div>
            <div className="col-span-2">HSN</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="divide-y divide-slate-100">
            {lineItems.map((item, i) => (
              <div
                key={i}
                ref={(el) => {
                  rowRefs.current[i] = el as any; // Cast as any for simplicity in this transition
                }}
                className="relative group bg-white border border-slate-200/60 rounded-xl p-4 md:p-0 md:border-0 md:rounded-none md:grid md:grid-cols-12 md:items-center md:hover:bg-slate-50/30 transition-all"
              >
                {/* Mobile View Stacking */}
                <div className="space-y-3 md:space-y-0 md:contents">
                  <div className="md:col-span-4">
                    <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Description</label>
                    <Input
                      className="border-slate-200/60 md:border-transparent bg-slate-50/30 md:bg-transparent focus:bg-white md:focus:border-slate-200 h-9 px-3 md:px-2 text-sm"
                      value={item.description}
                      onChange={(e) => updateLineItem(i, "description", e.target.value)}
                      placeholder="Item name..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">HSN Code</label>
                    <Input
                      className="border-slate-200/60 md:border-transparent bg-slate-50/30 md:bg-transparent focus:bg-white md:focus:border-slate-200 h-9 px-3 md:px-2 uppercase text-sm"
                      value={item.hsnSac ?? ""}
                      onChange={(e) => updateLineItem(i, "hsnSac", e.target.value)}
                      placeholder="HSN"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:col-span-4 md:grid-cols-2 md:gap-0">
                    <div>
                      <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block text-right">Qty</label>
                      <Input
                        type="number"
                        className="border-slate-200/60 md:border-transparent bg-slate-50/30 md:bg-transparent focus:bg-white md:focus:border-slate-200 h-9 px-3 md:px-2 text-right text-sm"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          updateLineItem(i, "quantity", parseFloat(e.target.value) || 0)
                        }
                        onKeyDown={(e) => handleKeyDown(e, i, "qty")}
                      />
                    </div>
                    <div>
                      <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block text-right">Rate</label>
                      <Input
                        type="number"
                        className="border-slate-200/60 md:border-transparent bg-slate-50/30 md:bg-transparent focus:bg-white md:focus:border-slate-200 h-9 px-3 md:px-2 text-right text-sm"
                        value={item.unitPrice || ""}
                        onChange={(e) =>
                          updateLineItem(i, "unitPrice", parseFloat(e.target.value) || 0)
                        }
                        onKeyDown={(e) => handleKeyDown(e, i, "rate")}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 md:border-0 md:pt-0 md:col-span-2 md:justify-end md:px-4">
                    <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</label>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {(
                        item.quantity * item.unitPrice +
                        (withGst ? 5 * (item.quantity * item.unitPrice) / 100 : 0)
                      ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="absolute -top-2 -right-2 md:static w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-500 border border-red-100 md:border-0 md:bg-transparent md:text-slate-300 md:hover:text-red-500 md:hover:bg-red-50 transition-all md:opacity-0 md:group-hover:opacity-100"
                  title="Delete item"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-6 pt-4 border-t border-slate-200/60">
        <div className="hidden md:flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 px-4 py-2 rounded-lg">
          <span className="flex items-center gap-1.5"><kbd className="bg-white border px-1 rounded shadow-sm text-slate-500">Tab</kbd> Next</span>
          <span className="flex items-center gap-1.5"><kbd className="bg-white border px-1 rounded shadow-sm text-slate-500">Enter</kbd> Add row</span>
        </div>

        <div className="flex items-end justify-between md:justify-end gap-6 w-full md:w-auto">
          <div className="flex flex-col items-start md:items-end">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Freight</label>
            <div className="w-24 mt-1">
              <Input
                name="freight"
                type="number"
                className="text-right h-9 bg-slate-50/50 border-slate-200/50 focus:bg-white text-sm"
                defaultValue={invoice?.freight ?? 0}
                placeholder="0.00"
              />
            </div>
          </div>
          <Button type="submit" size="md" className="h-10 px-8 shadow-lg shadow-primary/20 font-bold tracking-wide">
            {invoice ? "Update Invoice" : "Save Invoice"}
          </Button>
        </div>
      </div>
    </form>
  );
}
