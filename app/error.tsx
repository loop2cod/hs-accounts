"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-4 px-3 py-8">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-neutral-600">
        {error.message || "An error occurred."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
