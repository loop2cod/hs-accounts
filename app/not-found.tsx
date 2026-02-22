import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 px-3 py-8 text-center">
      <h2 className="text-lg font-semibold">Page not found</h2>
      <p className="text-sm text-neutral-600">
        The page you are looking for does not exist.
      </p>
      <Link href="/">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
}
