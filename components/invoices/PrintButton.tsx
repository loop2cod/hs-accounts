"use client";

import { Button } from "@/components/ui/Button";
import { Printer } from "lucide-react";

export function PrintButton({ invoiceId }: { invoiceId: string }) {
  const handlePrint = () => {
    window.open(`/invoices/${invoiceId}/pdf?print=true`, "_blank");
  };

  return (
    <Button
      size="md"
      variant="primary"
      className="gap-2 shadow-lg shadow-primary/20"
      onClick={handlePrint}
    >
      <Printer className="w-4 h-4" />
      Print
    </Button>
  );
}
