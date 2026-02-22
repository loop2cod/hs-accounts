"use client";

import { Button } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <Button size="sm" variant="primary" onClick={() => window.print()}>
      Print
    </Button>
  );
}
