"use server";

import { getDb } from "@/lib/db";
import type { Customer } from "@/lib/types";
import type { ObjectId } from "mongodb";

export interface DueBalanceRow {
  customerId: string;
  customerName: string;
  shopName: string;
  due: number;
  paid: number;
  balance: number;
}

export async function getDueBalanceReport(): Promise<DueBalanceRow[]> {
  const db = await getDb();
  const customers = await db
    .collection<Customer>("customers")
    .find({})
    .sort({ name: 1 })
    .toArray();

  const rows: DueBalanceRow[] = [];
  for (const c of customers) {
    const oid = c._id!;
    const invAgg = await db
      .collection("invoices")
      .aggregate<{ total: number }>([
        { $match: { customerId: oid } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ])
      .toArray();
    const payAgg = await db
      .collection("payments")
      .aggregate<{ total: number }>([
        { $match: { customerId: oid } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray();
    const due = invAgg[0]?.total ?? 0;
    const paid = payAgg[0]?.total ?? 0;
    rows.push({
      customerId: oid.toString(),
      customerName: c.name,
      shopName: c.shopName,
      due,
      paid,
      balance: due - paid,
    });
  }
  return rows;
}

export interface LedgerEntry {
  date: Date;
  type: "invoice" | "payment";
  reference: string;
  amount: number; // + for invoice, - for payment
  runningBalance: number;
}

export async function getLedgerReport(customerId?: string): Promise<LedgerEntry[]> {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  const match = customerId ? { customerId: new ObjectId(customerId) } : {};

  const invoices = await db
    .collection("invoices")
    .find(match)
    .sort({ date: 1, createdAt: 1 })
    .toArray();
  const payments = await db
    .collection("payments")
    .find(match)
    .sort({ date: 1, createdAt: 1 })
    .toArray();

  type Row = { date: Date; type: "invoice" | "payment"; reference: string; amount: number };
  const rows: Row[] = [
    ...invoices.map((inv: { date: Date; invoiceNumber: string; totalAmount: number }) => ({
      date: inv.date,
      type: "invoice" as const,
      reference: inv.invoiceNumber,
      amount: inv.totalAmount,
    })),
    ...payments.map((p: { date: Date; _id: ObjectId; amount: number }) => ({
      date: p.date,
      type: "payment" as const,
      reference: `Payment ${p._id.toString().slice(-6)}`,
      amount: -p.amount,
    })),
  ];
  rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let running = 0;
  return rows.map((r) => {
    running += r.amount;
    return {
      date: r.date,
      type: r.type,
      reference: r.reference,
      amount: r.amount,
      runningBalance: running,
    };
  });
}
