"use client";

import { useState } from "react";
import { AlertDialog } from "@/components/ui/AlertDialog";
import { handleDeleteInvoice } from "./delete-action";

interface DeleteInvoiceButtonProps {
  invoiceId: string;
}

export function DeleteInvoiceButton({ invoiceId }: DeleteInvoiceButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
      >
        Delete Invoice
      </button>
      
      <AlertDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => handleDeleteInvoice(invoiceId)}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmText="Delete Invoice"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}
