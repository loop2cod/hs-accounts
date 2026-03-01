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
    .find({ customerId: oid, deleted: { $ne: true } })
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
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
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
  if (!filters?.includeDeleted) query.deleted = { $ne: true };

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 10;
  const skip = (page - 1) * limit;

  const col = db.collection<Invoice>("invoices");
  const total = await col.countDocuments(query);

  const cursor = col.find(query).sort({ date: -1, createdAt: -1 });

  if (filters?.limit !== 0) {
    cursor.skip(skip).limit(limit);
  }

  const list = await cursor.toArray();

  return {
    invoices: list.map((inv) => ({
      ...inv,
      _id: inv._id!.toString(),
      customerId: inv.customerId.toString(),
    })),
    total,
    page,
    limit: filters?.limit === 0 ? total : limit,
    totalPages: filters?.limit === 0 ? 1 : Math.ceil(total / limit),
  };
}

export async function getInvoiceById(id: string, includeDeleted: boolean = false) {
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
  const inv = await db.collection<Invoice>("invoices").findOne(query);
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
  shippingAddress?: string;
  freight?: number;
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
    if (data.withGst) {
      gstAmount = Math.round((amount * 5) / 100);
      totalRow = amount + gstAmount;
    }
    subtotal += amount;
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount,
      hsnSac: item.hsnSac,
      narration: item.narration,
      ...(data.withGst && { gstRate: 5, gstAmount, totalRow }),
    };
  });
  const totalGst = data.withGst
    ? lineItems.reduce((s, i) => s + (i.gstAmount ?? 0), 0)
    : undefined;

  const freightAmount = data.freight ?? 0;
  const taxableAmount = subtotal + freightAmount;
  const totalAmount = totalGst != null ? taxableAmount + totalGst : taxableAmount;

  const doc: Omit<Invoice, "_id"> = {
    customerId,
    withGst: data.withGst,
    invoiceNumber,
    date: data.date,
    shippingAddress: data.shippingAddress,
    lineItems,
    subtotal,
    freight: data.freight,
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
  const shippingAddress = String(formData.get("shippingAddress") ?? "").trim() || undefined;
  const freightRaw = formData.get("freight");
  const freight = freightRaw ? parseFloat(String(freightRaw)) : undefined;

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
    shippingAddress,
    freight,
    lineItems: filtered,
    notes,
  });
  if (result._id) redirect(`/invoices/${result._id}`);
  return result;
}

export async function updateInvoice(
  id: string,
  data: {
    customerId: string;
    withGst: boolean;
    date: Date;
    shippingAddress?: string;
    freight?: number;
    lineItems: LineItem[];
    notes?: string;
  }
) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");

  let invoiceId: ObjectId;
  let customerId: ObjectId;
  try {
    invoiceId = new ObjectId(id);
    customerId = new ObjectId(data.customerId);
  } catch {
    return { error: "Invalid ID" };
  }

  let subtotal = 0;
  const lineItems: LineItem[] = data.lineItems.map((item) => {
    const amount = item.quantity * item.unitPrice;
    let gstAmount = 0;
    let totalRow = amount;
    if (data.withGst) {
      gstAmount = Math.round((amount * 5) / 100);
      totalRow = amount + gstAmount;
    }
    subtotal += amount;
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount,
      hsnSac: item.hsnSac,
      narration: item.narration,
      ...(data.withGst && { gstRate: 5, gstAmount, totalRow }),
    };
  });
  const totalGst = data.withGst
    ? lineItems.reduce((s, i) => s + (i.gstAmount ?? 0), 0)
    : undefined;

  const freightAmount = data.freight ?? 0;
  const taxableAmount = subtotal + freightAmount;
  const totalAmount = totalGst != null ? taxableAmount + totalGst : taxableAmount;

  const updateDoc = {
    $set: {
      customerId,
      withGst: data.withGst,
      date: data.date,
      shippingAddress: data.shippingAddress,
      lineItems,
      subtotal,
      freight: data.freight,
      totalGst,
      totalAmount,
      notes: data.notes,
      updatedAt: new Date(),
    }
  };

  await db.collection<Invoice>("invoices").updateOne({ _id: invoiceId }, updateDoc);

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/");
  revalidatePath(`/customers/${data.customerId}`);

  return { _id: id };
}

export async function deleteInvoice(id: string) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return { error: "Invalid id" };
  }
  await db.collection<Invoice>("invoices").updateOne(
    { _id: oid },
    { $set: { deleted: true, updatedAt: new Date() } }
  );
  revalidatePath("/invoices");
  revalidatePath("/");
  return {};
}

export async function restoreInvoice(id: string) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return { error: "Invalid id" };
  }
  await db.collection<Invoice>("invoices").updateOne(
    { _id: oid },
    { $unset: { deleted: "" }, $set: { updatedAt: new Date() } }
  );
  revalidatePath("/invoices");
  revalidatePath("/");
  return {};
}

export async function updateInvoiceFromForm(id: string, formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "").trim();
  const withGst = formData.get("withGst") === "on" || formData.get("withGst") === "true";
  const dateStr = String(formData.get("date") ?? "");
  const date = dateStr ? new Date(dateStr) : new Date();
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const shippingAddress = String(formData.get("shippingAddress") ?? "").trim() || undefined;
  const freightRaw = formData.get("freight");
  const freight = freightRaw ? parseFloat(String(freightRaw)) : undefined;

  let lineItems: LineItem[];
  try {
    const raw = formData.get("lineItems");
    lineItems = raw ? JSON.parse(String(raw)) : [];
  } catch {
    return { error: "Invalid line items" };
  }

  // For editing, allow empty customerId if the invoice already has a customer
  if (!customerId) {
    // Check if the invoice already exists and has a customer
    const existingInvoice = await getInvoiceById(id);
    if (!existingInvoice || !existingInvoice.customerId) {
      return { error: "Customer required" };
    }
    // Use the existing customer ID
    const result = await updateInvoice(id, {
      customerId: existingInvoice.customerId,
      withGst,
      date,
      shippingAddress,
      freight,
      lineItems,
      notes,
    });
    if (result._id) redirect(`/invoices/${result._id}`);
    return result;
  }

  const filtered = lineItems.filter(
    (i) => i.description.trim() !== "" || i.quantity > 0 || i.unitPrice > 0
  );
  if (filtered.length === 0) return { error: "Add at least one line item" };

  const result = await updateInvoice(id, {
    customerId,
    withGst,
    date,
    shippingAddress,
    freight,
    lineItems: filtered,
    notes,
  });

  if (result._id) redirect(`/invoices/${result._id}`);
  return result;
}
