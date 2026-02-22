"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { LineItem } from "@/lib/types";

interface InvoiceFormProps {
  customerId: string;
  customers: { _id: string; name: string; shopName: string }[];
  action: (formData: FormData) => Promise<unknown>;
}

const defaultLineItem: LineItem = {
  description: "",
  quantity: 0,
  unitPrice: 0,
  amount: 0,
};

export function InvoiceForm({ customerId, customers, action }: InvoiceFormProps) {
  const [withGst, setWithGst] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...defaultLineItem }]);
  const [error, setError] = useState<string | null>(null);
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
    setLineItems((prev) => [...prev, { ...defaultLineItem }]);
    setTimeout(() => rowRefs.current[prev.length]?.querySelector("input")?.focus(), 50);
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
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <input type="hidden" name="lineItems" value={JSON.stringify(lineItems)} readOnly />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            name="withGst"
            checked={withGst}
            onChange={(e) => setWithGst(e.target.checked)}
            className="rounded"
          />
          With GST
        </label>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Customer *</label>
        <Select name="customerId" required defaultValue={customerId || undefined}>
          <option value="">Select customer</option>
          {customers.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} – {c.shopName}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Date *</label>
        <Input name="date" type="date" required defaultValue={today} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Line items</label>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left p-1">Description</th>
                <th className="text-right w-20 p-1">Qty</th>
                <th className="text-right w-24 p-1">Rate</th>
                {withGst && <th className="text-right w-16 p-1">GST%</th>}
                <th className="text-right w-24 p-1">Amount</th>
                <th className="w-8 p-1" />
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr
                  key={i}
                  ref={(el) => {
                    rowRefs.current[i] = el;
                  }}
                  className="border-b border-neutral-100"
                >
                  <td className="p-1">
                    <Input
                      className="min-w-[120px]"
                      value={item.description}
                      onChange={(e) => updateLineItem(i, "description", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, i, "desc")}
                      placeholder="Particulars"
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={item.quantity || ""}
                      onChange={(e) =>
                        updateLineItem(i, "quantity", parseFloat(e.target.value) || 0)
                      }
                      onKeyDown={(e) => handleKeyDown(e, i, "qty")}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        updateLineItem(i, "unitPrice", parseFloat(e.target.value) || 0)
                      }
                      onKeyDown={(e) => handleKeyDown(e, i, "rate")}
                    />
                  </td>
                  {withGst && (
                    <td className="p-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={item.gstRate ?? ""}
                        onChange={(e) =>
                          updateLineItem(i, "gstRate", parseFloat(e.target.value) || 0)
                        }
                      />
                    </td>
                  )}
                  <td className="p-1 text-right tabular-nums">
                    {(
                      item.quantity * item.unitPrice +
                      (withGst ? (item.gstRate ?? 0) * (item.quantity * item.unitPrice) / 100 : 0)
                    ).toFixed(2)}
                  </td>
                  <td className="p-1">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-neutral-500 hover:text-red-600 text-xs"
                      aria-label="Remove row"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addRow} className="mt-1">
          Add row
        </Button>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea
          name="notes"
          className="w-full rounded border border-neutral-300 bg-white px-2.5 py-1.5 text-sm"
          rows={2}
          defaultValue=""
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit">Save invoice</Button>
        <p className="text-xs text-neutral-500 self-center">
          Tab: next field · Enter: next field/row · Ctrl+Enter: save
        </p>
      </div>
    </form>
  );
}
