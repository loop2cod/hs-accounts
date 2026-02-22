import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ROUTE_WEEKDAYS } from "@/lib/utils";
import type { Customer } from "@/lib/types";

interface CustomerFormProps {
  customer?: (Customer & { _id?: string }) | null;
  action: (formData: FormData) => Promise<unknown>;
}

export function CustomerForm({ customer, action }: CustomerFormProps) {
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Name *</label>
        <Input
          name="name"
          required
          defaultValue={customer?.name}
          placeholder="Customer name"
        />
      </div>
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
      <div className="flex gap-2 pt-2">
        <Button type="submit">{customer ? "Update" : "Create"}</Button>
        <Link href={customer?._id ? `/customers/${customer._id}` : "/customers"}>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
