"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import type { Customer, RouteWeekday } from "@/lib/types";
import type { ObjectId } from "mongodb";

export async function getCustomers(filters?: { routeWeekday?: RouteWeekday; includeDeleted?: boolean }) {
  const db = await getDb();
  const query: any = {};
  if (filters?.routeWeekday != null) query.routeWeekday = filters.routeWeekday;
  if (!filters?.includeDeleted) query.deleted = { $ne: true };
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

export async function getCustomerById(id: string, includeDeleted: boolean = false) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return null;
  }
  const query: any = { _id: oid };
  if (!includeDeleted) query.deleted = { $ne: true };
  const customer = await db.collection<Customer>("customers").findOne(query);
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
  const customer = await db.collection<Customer>("customers").findOne({ _id: oid });
  const openingBalance = customer?.openingBalance ?? 0;

  const invoices = await db
    .collection("invoices")
    .aggregate<{ total: number }>([
      { $match: { customerId: oid, deleted: { $ne: true } } },
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
  const due = (invoices[0]?.total ?? 0) + openingBalance;
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
  await db.collection<Customer>("customers").updateOne(
    { _id: oid },
    { $set: { deleted: true, updatedAt: new Date() } }
  );
  revalidatePath("/customers");
  revalidatePath("/");
  return {};
}

export async function restoreCustomer(id: string) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return { error: "Invalid id" };
  }
  await db.collection<Customer>("customers").updateOne(
    { _id: oid },
    { $unset: { deleted: "" }, $set: { updatedAt: new Date() } }
  );
  revalidatePath("/customers");
  revalidatePath("/");
  return {};
}

function parseRouteWeekday(v: string): RouteWeekday {
  const n = parseInt(v, 10);
  if (Number.isNaN(n) || n < 0 || n > 6) return 1;
  return n as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export async function createCustomerFromForm(state: any, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const shopName = String(formData.get("shopName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !shopName || !phone) {
    return { error: "Name, shop name, and phone are required." };
  }

  const db = await getDb();
  const existing = await db.collection<Customer>("customers").findOne({ phone });
  if (existing) {
    return { error: "A customer with this phone number already exists." };
  }

  const routeOrderRaw = formData.get("routeOrder");
  const routeOrder =
    routeOrderRaw !== null && routeOrderRaw !== ""
      ? parseInt(String(routeOrderRaw), 10)
      : undefined;
  const result = await createCustomer({
    name,
    shopName,
    phone,
    address: String(formData.get("address") ?? "").trim() || undefined,
    routeWeekday: parseRouteWeekday(String(formData.get("routeWeekday") ?? "1")),
    routeOrder: Number.isInteger(routeOrder) ? routeOrder : undefined,
    gstNumber: String(formData.get("gstNumber") ?? "").trim() || undefined,
    panNumber: String(formData.get("panNumber") ?? "").trim() || undefined,
    openingBalance: parseFloat(String(formData.get("openingBalance") ?? "0")) || 0,
  });
  if (result._id) redirect(`/customers/${result._id}`);
  return result;
}

export async function updateCustomerFromForm(id: string, state: any, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const shopName = String(formData.get("shopName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!shopName || !phone) {
    return { error: "Shop name and phone are required." };
  }

  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  try {
    const oid = new ObjectId(id);
    const existing = await db.collection<Customer>("customers").findOne({
      phone,
      _id: { $ne: oid },
    });
    if (existing) {
      return { error: "Another customer with this phone number already exists." };
    }
  } catch {
    return { error: "Invalid customer ID." };
  }

  const routeOrderRaw = formData.get("routeOrder");
  const routeOrder =
    routeOrderRaw !== null && routeOrderRaw !== ""
      ? parseInt(String(routeOrderRaw), 10)
      : undefined;
  await updateCustomer(id, {
    name: name || undefined,
    shopName,
    phone,
    address: String(formData.get("address") ?? "").trim() || undefined,
    routeWeekday: parseRouteWeekday(String(formData.get("routeWeekday") ?? "1")),
    routeOrder: Number.isInteger(routeOrder) ? routeOrder : undefined,
    gstNumber: String(formData.get("gstNumber") ?? "").trim() || undefined,
    panNumber: String(formData.get("panNumber") ?? "").trim() || undefined,
    openingBalance: parseFloat(String(formData.get("openingBalance") ?? "0")) || 0,
  });
  redirect(`/customers/${id}`);
}

/** For use as bound action: action={updateCustomerFormAction.bind(null, id)} */
export async function updateCustomerFormAction(id: string, state: any, formData: FormData) {
  return updateCustomerFromForm(id, state, formData);
}
