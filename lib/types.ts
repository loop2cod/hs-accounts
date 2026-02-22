import type { ObjectId } from "mongodb";

export type RouteWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sun-Sat or use "monday" etc.

export interface Customer {
  _id?: ObjectId;
  name: string;
  shopName: string;
  phone: string;
  address?: string;
  routeWeekday: RouteWeekday;
  routeOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  gstRate?: number;
  gstAmount?: number;
  totalRow?: number;
}

export interface Invoice {
  _id?: ObjectId;
  customerId: ObjectId;
  withGst: boolean;
  invoiceNumber: string;
  date: Date;
  lineItems: LineItem[];
  subtotal: number;
  totalGst?: number;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
}

export interface Payment {
  _id?: ObjectId;
  customerId: ObjectId;
  amount: number;
  date: Date;
  paymentMode: string;
  reference?: string;
  notes?: string;
  createdAt: Date;
}

export interface CountersDoc {
  _id?: ObjectId;
  lastInvoiceNumberGst: number;
  lastInvoiceNumberNonGst: number;
}

export type InvoiceWithCustomer = Invoice & { customer?: Customer | null };
export type PaymentWithCustomer = Payment & { customer?: Customer | null };
