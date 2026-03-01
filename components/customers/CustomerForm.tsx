"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ROUTE_WEEKDAYS } from "@/lib/utils";
import type { Customer } from "@/lib/types";

interface CustomerFormProps {
  customer?: (Omit<Customer, "_id"> & { _id?: string }) | null;
  action: (state: any, formData: FormData) => Promise<any>;
}

function SubmitButton({ isUpdate }: { isUpdate: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : isUpdate ? "Update" : "Create"}
    </Button>
  );
}

export function CustomerForm({ customer, action }: CustomerFormProps) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <div className="rounded bg-red-50 p-2 text-sm text-red-600">
          {state.error}
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium">Shop name *</label>
        <Input
          name="shopName"
          required
          defaultValue={customer?.shopName}
          placeholder="Shop name"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Phone *</label>
        <Input
          name="phone"
          type="tel"
          required
          defaultValue={customer?.phone}
          placeholder="Phone"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <Input
          name="name"
          defaultValue={customer?.name}
          placeholder="Customer name"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Address</label>
        <Input
          name="address"
          defaultValue={customer?.address ?? ""}
          placeholder="Address"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Route weekday *</label>
        <Select
          name="routeWeekday"
          required
          defaultValue={String(customer?.routeWeekday ?? 1)}
        >
          {ROUTE_WEEKDAYS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Route order</label>
        <Input
          name="routeOrder"
          type="number"
          min={0}
          defaultValue={customer?.routeOrder ?? ""}
          placeholder="Order in route"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">GST Number (Optional)</label>
        <Input
          name="gstNumber"
          defaultValue={customer?.gstNumber ?? ""}
          placeholder="GST Number"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">PAN Number (Optional)</label>
        <Input
          name="panNumber"
          defaultValue={customer?.panNumber ?? ""}
          placeholder="PAN Number"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Opening Balance / Pending Due</label>
        <Input
          name="openingBalance"
          type="number"
          step="0.01"
          defaultValue={customer?.openingBalance ?? ""}
          placeholder="0.00"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <SubmitButton isUpdate={!!customer} />
        <Link href={customer?._id ? `/customers/${customer._id}` : "/customers"}>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
