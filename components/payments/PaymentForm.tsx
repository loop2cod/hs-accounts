"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const PAYMENT_MODES = ["Cash", "UPI", "Bank transfer", "Card", "Other"];

interface PaymentFormProps {
  customerId: string;
  customers: { _id: string; name: string; shopName: string }[];
  action: (formData: FormData) => Promise<{ error?: string }>;
}

export function PaymentForm({ customerId, customers, action }: PaymentFormProps) {
  const [state, formAction] = useActionState(
    async (_: null, formData: FormData) => action(formData),
    null as { error?: string } | null
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
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
        <label className="mb-1 block text-sm font-medium">Amount (₹) *</label>
        <Input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="0.00"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Date *</label>
        <Input name="date" type="date" required defaultValue={today} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Payment mode *</label>
        <Select name="paymentMode" required defaultValue="Cash">
          {PAYMENT_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Reference</label>
        <Input name="reference" placeholder="Optional" />
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
        <Button type="submit">Record payment</Button>
      </div>
    </form>
  );
}
