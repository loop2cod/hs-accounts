"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import type { CountersDoc } from "@/lib/types";
import type { Invoice, LineItem } from "@/lib/types";
import type { ObjectId } from "mongodb";

async function getNextInvoiceNumber(withGst: boolean): Promise<string> {
  const db = await getDb();
  const col = db.collection<CountersDoc>("counters");
  await col.updateOne(
    {},
    {
      $setOnInsert: {
        lastInvoiceNumberGst: 0,
        lastInvoiceNumberNonGst: 0,
      },
    },
    { upsert: true }
  );
  const key = withGst ? "lastInvoiceNumberGst" : "lastInvoiceNumberNonGst";
  const doc = await col.findOneAndUpdate(
    {},
    { $inc: { [key]: 1 } },
    { returnDocument: "after" }
  );
  const n = doc ? (doc[key] as number) : 1;
  return withGst ? `INV-GST-${String(n).padStart(3, "0")}` : `INV-${String(n).padStart(3, "0")}`;
}

export async function getInvoicesByCustomer(customerId: string) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  let oid: ObjectId;
  try {
    oid = new ObjectId(customerId);
  } catch {
    return [];
  }
  const list = await db
    .collection<Invoice>("invoices")
    .find({ customerId: oid })
    .sort({ date: -1, createdAt: -1 })
    .toArray();
  return list.map((inv) => ({
    ...inv,
    _id: inv._id!.toString(),
    customerId: inv.customerId.toString(),
  }));
}

export async function getInvoices(filters?: {
  withGst?: boolean;
  customerId?: string;
}) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  const query: Record<string, unknown> = {};
  if (filters?.withGst !== undefined) query.withGst = filters.withGst;
  if (filters?.customerId) {
    try {
      query.customerId = new ObjectId(filters.customerId);
    } catch {
      // ignore invalid id
    }
  }
  const list = await db
    .collection<Invoice>("invoices")
    .find(query)
    .sort({ date: -1, createdAt: -1 })
    .toArray();
  return list.map((inv) => ({
    ...inv,
    _id: inv._id!.toString(),
    customerId: inv.customerId.toString(),
  }));
}

export async function getInvoiceById(id: string) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return null;
  }
  const inv = await db.collection<Invoice>("invoices").findOne({ _id: oid });
  if (!inv) return null;
  return {
    ...inv,
    _id: inv._id!.toString(),
    customerId: inv.customerId.toString(),
  };
}

export async function createInvoice(data: {
  customerId: string;
  withGst: boolean;
  date: Date;
  lineItems: LineItem[];
  notes?: string;
}) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  let customerId: ObjectId;
  try {
    customerId = new ObjectId(data.customerId);
  } catch {
    return { error: "Invalid customer" };
  }
  const invoiceNumber = await getNextInvoiceNumber(data.withGst);
  let subtotal = 0;
  const lineItems: LineItem[] = data.lineItems.map((item) => {
    const amount = item.quantity * item.unitPrice;
    let gstAmount = 0;
    let totalRow = amount;
    if (data.withGst && item.gstRate != null) {
      gstAmount = Math.round((amount * item.gstRate) / 100);
      totalRow = amount + gstAmount;
    }
    subtotal += amount;
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount,
      ...(data.withGst && { gstRate: item.gstRate ?? 0, gstAmount, totalRow }),
    };
  });
  const totalGst = data.withGst
    ? lineItems.reduce((s, i) => s + (i.gstAmount ?? 0), 0)
    : undefined;
  const totalAmount = totalGst != null ? subtotal + totalGst : subtotal;
  const doc: Omit<Invoice, "_id"> = {
    customerId,
    withGst: data.withGst,
    invoiceNumber,
    date: data.date,
    lineItems,
    subtotal,
    totalGst,
    totalAmount,
    notes: data.notes,
    createdAt: new Date(),
  };
  const res = await db.collection<Invoice>("invoices").insertOne(doc as Invoice);
  revalidatePath("/invoices");
  revalidatePath("/");
  revalidatePath(`/customers/${data.customerId}`);
  return { _id: res.insertedId.toString() };
}

export async function createInvoiceFromForm(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "").trim();
  const withGst = formData.get("withGst") === "on" || formData.get("withGst") === "true";
  const dateStr = String(formData.get("date") ?? "");
  const date = dateStr ? new Date(dateStr) : new Date();
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  let lineItems: LineItem[];
  try {
    const raw = formData.get("lineItems");
    lineItems = raw ? JSON.parse(String(raw)) : [];
  } catch {
    return { error: "Invalid line items" };
  }
  if (!customerId) return { error: "Customer required" };
  const filtered = lineItems.filter(
    (i) => i.description.trim() !== "" || i.quantity > 0 || i.unitPrice > 0
  );
  if (filtered.length === 0) return { error: "Add at least one line item" };
  const result = await createInvoice({
    customerId,
    withGst,
    date,
    lineItems: filtered,
    notes,
  });
  if (result._id) redirect(`/invoices/${result._id}`);
  return result;
}
