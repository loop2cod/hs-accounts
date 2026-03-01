"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { deletePayment } from "@/lib/actions/payments";
import { Trash2, Edit, X } from "lucide-react";

const PAYMENT_MODES = ["Cash", "UPI", "Bank transfer", "Card", "Other"];

interface PaymentListItemProps {
  payment: {
    _id: string;
    customerId: string;
    amount: number;
    date: string | Date;
    paymentMode: string;
    reference?: string;
    notes?: string;
  };
  customerName: string;
}

export function PaymentListItem({ payment, customerName }: PaymentListItemProps) {
  const date = typeof payment.date === "string" ? payment.date : payment.date.toISOString().slice(0, 10);

  const [deleteState, deleteAction, isDeleting] = useActionState(
    async () => {
      const result = await deletePayment(payment._id);
      return result;
    },
    null as { error?: string; success?: boolean } | null
  );

  if (deleteState?.success) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-2 sm:p-6 hover:bg-slate-50 transition-colors group">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
          <span className="text-sm font-bold">₹</span>
        </div>
        <div className="space-y-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{customerName}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium whitespace-nowrap">{date}</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold uppercase tracking-wider text-[7.5px] whitespace-nowrap">
              {payment.paymentMode}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-2 sm:ml-4">
        <span className="text-base sm:text-base font-bold text-green-600">+₹{payment.amount.toLocaleString()}</span>
        <div className="flex items-center gap-1">
          <a
            href={`/payments/${payment._id}/edit`}
            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            title="Edit payment"
          >
            <Edit className="w-4 h-4" />
          </a>
          <form action={deleteAction}>
            <button
              type="submit"
              disabled={isDeleting}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Delete payment"
              onClick={(e) => {
                if (!confirm("Delete this payment?")) {
                  e.preventDefault();
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
