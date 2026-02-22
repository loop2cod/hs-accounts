"use client";

import { Button } from "@/components/ui/Button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button
      size="md"
      variant="primary"
      className="gap-2 shadow-lg shadow-primary/20"
      onClick={() => window.print()}
    >
      <Printer className="w-4 h-4" />
      Print
    </Button>
  );
}
