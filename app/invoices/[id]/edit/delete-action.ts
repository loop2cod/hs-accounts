"use server";

import { redirect } from "next/navigation";
import { deleteInvoice } from "@/lib/actions/invoices";

export async function handleDeleteInvoice(invoiceId: string) {
  const result = await deleteInvoice(invoiceId);
  if (result.error) {
    // Handle error - for now just redirect without error display
    redirect(`/invoices/${invoiceId}/edit?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/invoices");
}