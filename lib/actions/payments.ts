"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import type { Payment } from "@/lib/types";
import type { ObjectId } from "mongodb";

export async function getPaymentsByCustomer(customerId: string) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  let oid: ObjectId;
  try {
    oid = new ObjectId(customerId);
  } catch {
    return [];
  }
  const list = await db
    .collection<Payment>("payments")
    .find({ customerId: oid })
    .sort({ date: -1, createdAt: -1 })
    .toArray();
  return list.map((p) => ({
    ...p,
    _id: p._id!.toString(),
    customerId: p.customerId.toString(),
  }));
}

export async function getPayments(filters?: { customerId?: string }) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  const query: Record<string, unknown> = {};
  if (filters?.customerId) {
    try {
      query.customerId = new ObjectId(filters.customerId);
    } catch {
      // ignore
    }
  }
  const list = await db
    .collection<Payment>("payments")
    .find(query)
    .sort({ date: -1, createdAt: -1 })
    .toArray();
  return list.map((p) => ({
    ...p,
    _id: p._id!.toString(),
    customerId: p.customerId.toString(),
  }));
}

export async function createPayment(data: {
  customerId: string;
  amount: number;
  date: Date;
  paymentMode: string;
  reference?: string;
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
  const doc: Omit<Payment, "_id"> = {
    customerId,
    amount: data.amount,
    date: data.date,
    paymentMode: data.paymentMode,
    reference: data.reference,
    notes: data.notes,
    createdAt: new Date(),
  };
  const res = await db.collection<Payment>("payments").insertOne(doc as Payment);
  revalidatePath("/payments");
  revalidatePath("/");
  revalidatePath(`/customers/${data.customerId}`);
  return { _id: res.insertedId.toString() };
}

export async function createPaymentFromForm(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "").trim();
  const amount = parseFloat(String(formData.get("amount") ?? "0"));
  const dateStr = String(formData.get("date") ?? "");
  const date = dateStr ? new Date(dateStr) : new Date();
  const paymentMode = String(formData.get("paymentMode") ?? "cash").trim();
  const reference = String(formData.get("reference") ?? "").trim() || undefined;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  if (!customerId) return { error: "Customer required" };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Valid amount required" };
  const result = await createPayment({
    customerId,
    amount,
    date,
    paymentMode,
    reference,
    notes,
  });
  if (result._id) redirect(`/customers/${customerId}`);
  return result;
}
