"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import type { Customer, RouteWeekday } from "@/lib/types";
import type { ObjectId } from "mongodb";

export async function getCustomers(filters?: { routeWeekday?: RouteWeekday }) {
  const db = await getDb();
  const query = filters?.routeWeekday != null ? { routeWeekday: filters.routeWeekday } : {};
  const list = await db
    .collection<Customer>("customers")
    .find(query)
    .sort({ routeWeekday: 1, routeOrder: 1, name: 1 })
    .toArray();
  return list.map((c) => ({
    ...c,
    _id: c._id!.toString(),
  }));
}

export async function getCustomerById(id: string) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return null;
  }
  const customer = await db.collection<Customer>("customers").findOne({ _id: oid });
  if (!customer) return null;
  return { ...customer, _id: customer._id!.toString() };
}

export async function getCustomerBalance(customerId: string) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  let oid: ObjectId;
  try {
    oid = new ObjectId(customerId);
  } catch {
    return { due: 0, paid: 0, balance: 0 };
  }
  const invoices = await db
    .collection("invoices")
    .aggregate<{ total: number }>([
      { $match: { customerId: oid } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ])
    .toArray();
  const payments = await db
    .collection("payments")
    .aggregate<{ total: number }>([
      { $match: { customerId: oid } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    .toArray();
  const due = invoices[0]?.total ?? 0;
  const paid = payments[0]?.total ?? 0;
  return { due, paid, balance: due - paid };
}

export async function createCustomer(data: Omit<Customer, "_id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  const now = new Date();
  const doc: Omit<Customer, "_id"> = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const res = await db.collection<Customer>("customers").insertOne(doc as Customer);
  revalidatePath("/customers");
  revalidatePath("/");
  return { _id: res.insertedId.toString() };
}

export async function updateCustomer(
  id: string,
  data: Partial<Omit<Customer, "_id" | "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return { error: "Invalid id" };
  }
  const { _id, createdAt, ...rest } = data as Partial<Customer>;
  await db.collection<Customer>("customers").updateOne(
    { _id: oid },
    { $set: { ...rest, updatedAt: new Date() } }
  );
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  revalidatePath(`/customers/${id}/edit`);
  revalidatePath("/");
  return {};
}

export async function deleteCustomer(id: string) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return { error: "Invalid id" };
  }
  await db.collection<Customer>("customers").deleteOne({ _id: oid });
  revalidatePath("/customers");
  revalidatePath("/");
  return {};
}

function parseRouteWeekday(v: string): RouteWeekday {
  const n = parseInt(v, 10);
  if (Number.isNaN(n) || n < 0 || n > 6) return 1;
  return n as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export async function createCustomerFromForm(formData: FormData) {
  const routeOrderRaw = formData.get("routeOrder");
  const routeOrder =
    routeOrderRaw !== null && routeOrderRaw !== ""
      ? parseInt(String(routeOrderRaw), 10)
      : undefined;
  const result = await createCustomer({
    name: String(formData.get("name") ?? "").trim(),
    shopName: String(formData.get("shopName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim() || undefined,
    routeWeekday: parseRouteWeekday(String(formData.get("routeWeekday") ?? "1")),
    routeOrder: Number.isInteger(routeOrder) ? routeOrder : undefined,
  });
  if (result._id) redirect(`/customers/${result._id}`);
  return result;
}

export async function updateCustomerFromForm(id: string, formData: FormData) {
  const routeOrderRaw = formData.get("routeOrder");
  const routeOrder =
    routeOrderRaw !== null && routeOrderRaw !== ""
      ? parseInt(String(routeOrderRaw), 10)
      : undefined;
  await updateCustomer(id, {
    name: String(formData.get("name") ?? "").trim(),
    shopName: String(formData.get("shopName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim() || undefined,
    routeWeekday: parseRouteWeekday(String(formData.get("routeWeekday") ?? "1")),
    routeOrder: Number.isInteger(routeOrder) ? routeOrder : undefined,
  });
  redirect(`/customers/${id}`);
}

/** For use as bound action: action={updateCustomerFormAction.bind(null, id)} */
export async function updateCustomerFormAction(id: string, formData: FormData) {
  return updateCustomerFromForm(id, formData);
}
