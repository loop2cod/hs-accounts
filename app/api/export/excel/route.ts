import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { getCustomers } from "@/lib/actions/customers";
import { getInvoices } from "@/lib/actions/invoices";
import { getPayments } from "@/lib/actions/payments";
import { getDueBalanceReport } from "@/lib/actions/reports";
import { getLedgerReport } from "@/lib/actions/reports";
import { formatDate } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "";
  let data: (string | number)[][];
  let filename: string;

  switch (type) {
    case "customers": {
      const list = await getCustomers();
      data = [
        ["Name", "Shop", "Phone", "Address", "Route weekday", "Route order"],
        ...list.map((c) => [
          c.name,
          c.shopName,
          c.phone,
          c.address ?? "",
          c.routeWeekday,
          c.routeOrder ?? "",
        ]),
      ];
      filename = "customers.xlsx";
      break;
    }
    case "invoices": {
      const filter = request.nextUrl.searchParams.get("filter");
      const withGst =
        filter === "gst" ? true : filter === "nogst" ? false : undefined;
      const { invoices: list } = await getInvoices({ withGst, limit: 0 });
      data = [
        ["Invoice #", "Date", "Total", "With GST"],
        ...list.map((inv) => [
          inv.invoiceNumber,
          formatDate(inv.date),
          inv.totalAmount,
          inv.withGst ? "Yes" : "No",
        ]),
      ];
      filename = "invoices.xlsx";
      break;
    }
    case "payments": {
      const { payments: list } = await getPayments({ limit: 0 });
      data = [
        ["Date", "Amount", "Mode", "Reference", "Notes"],
        ...list.map((p) => [
          formatDate(p.date),
          p.amount,
          p.paymentMode,
          p.reference ?? "",
          p.notes ?? "",
        ]),
      ];
      filename = "payments.xlsx";
      break;
    }
    case "due-balance": {
      const rows = await getDueBalanceReport();
      data = [
        ["Shop", "Name", "Weekday", "Opening Balance", "Due", "Paid", "Balance"],
        ...rows.map((r) => [
          r.shopName,
          r.customerName,
          r.routeWeekday,
          r.openingBalance,
          r.due,
          r.paid,
          r.balance,
        ]),
      ];
      filename = "due-balance.xlsx";
      break;
    }
    case "ledger": {
      const customerId = request.nextUrl.searchParams.get("customerId") ?? undefined;
      const entries = await getLedgerReport(customerId);
      data = [
        ["Date", "Type", "Reference", "Amount", "Running balance"],
        ...entries.map((e) => [
          formatDate(e.date),
          e.type,
          e.reference,
          e.amount,
          e.runningBalance,
        ]),
      ];
      filename = "ledger.xlsx";
      break;
    }
    default:
      return new Response("Invalid type", { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.addRows(data);

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
