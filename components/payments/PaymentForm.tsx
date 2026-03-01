"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const PAYMENT_MODES = ["Cash", "UPI", "Bank transfer", "Card", "Other"];

interface PaymentFormProps {
  customerId?: string;
  customers: { _id: string; name: string; shopName: string }[];
  action: (formData: FormData) => Promise<{ error?: string }>;
  defaultValues?: {
    amount: number;
    date: string;
    paymentMode: string;
    reference?: string;
    notes?: string;
  };
  submitLabel?: string;
}

export function PaymentForm({ customerId, customers, action, defaultValues, submitLabel }: PaymentFormProps) {
  const [state, formAction] = useActionState(
    async (state: { error?: string } | null, formData: FormData) => action(formData),
    null as { error?: string } | null
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium animate-in fade-in slide-in-from-top-1" role="alert">
          {state.error}
        </div>
      )}

      <div className="space-y-4">
        {customerId ? (
          <input type="hidden" name="customerId" value={customerId} />
        ) : (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Customer *</label>
            <Select
              name="customerId"
              required
              defaultValue={customerId || undefined}
              className="bg-slate-50/50 border-slate-200/50 focus:bg-white"
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name || c.shopName} – {c.shopName}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amount (₹) *</label>
            <Input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              defaultValue={defaultValues?.amount ?? ""}
              className="bg-slate-50/50 border-slate-200/50 focus:bg-white h-10"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date *</label>
            <Input
              name="date"
              type="date"
              required
              defaultValue={defaultValues?.date ?? today}
              className="bg-slate-50/50 border-slate-200/50 focus:bg-white h-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payment mode *</label>
            <Select
              name="paymentMode"
              required
              defaultValue={defaultValues?.paymentMode ?? "Cash"}
              className="bg-slate-50/50 border-slate-200/50 focus:bg-white h-10"
            >
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reference</label>
            <Input
              name="reference"
              placeholder="Optional"
              defaultValue={defaultValues?.reference ?? ""}
              className="bg-slate-50/50 border-slate-200/50 focus:bg-white h-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Notes</label>
          <textarea
            name="notes"
            className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all min-h-20 placeholder:text-slate-400 focus:bg-white"
            rows={2}
            defaultValue={defaultValues?.notes ?? ""}
            placeholder="Add any additional details..."
          />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full h-11 shadow-lg shadow-primary/20 font-bold tracking-wide">
          {submitLabel ?? "Record Payment"}
        </Button>
      </div>
    </form>
  );
}
