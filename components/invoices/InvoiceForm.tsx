"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { LineItem, Invoice } from "@/lib/types";

interface InvoiceFormProps {
  invoice?: Invoice | null;
  customerId?: string;
  customers: { _id: string; shopName: string; address?: string }[];
  action: (formData: FormData) => Promise<unknown>;
}

const defaultLineItem: LineItem = {
  description: "",
  hsnSac: "",
  narration: "",
  quantity: 0,
  unitPrice: 0,
  amount: 0,
  gstRate: 5,
};

export function InvoiceForm({ invoice, customerId, customers, action }: InvoiceFormProps) {
  const defaultCustId = invoice ? invoice.customerId.toString() : (customerId || "");
  const [withGst, setWithGst] = useState(invoice ? invoice.withGst : false);
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice && invoice.lineItems.length > 0 ? invoice.lineItems : [{ ...defaultLineItem }]
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Customer Command Combobox state ---
  const [selectedCustomerId, setSelectedCustomerId] = useState(defaultCustId);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const customerComboboxRef = useRef<HTMLDivElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);

  // keep selected in sync if prop changes (e.g. navigation with ?customerId=)
  useEffect(() => {
    setSelectedCustomerId(defaultCustId);
  }, [defaultCustId]);

  // focus search input when popover opens
  useEffect(() => {
    if (customerOpen) {
      setTimeout(() => customerInputRef.current?.focus(), 0);
    } else {
      setCustomerQuery("");
    }
  }, [customerOpen]);

  // close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        customerComboboxRef.current &&
        !customerComboboxRef.current.contains(e.target as Node)
      ) {
        setCustomerOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCustomerOpen(false);
    }
    if (customerOpen) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onClickOutside);
        document.removeEventListener("keydown", onKey);
      };
    }
  }, [customerOpen]);

  const selectedCustomer = customers.find((c) => c._id === selectedCustomerId) || null;

  const filteredCustomers = customers.filter((c) => {
    if (!customerQuery.trim()) return true;
    const q = customerQuery.toLowerCase();
    return (
      c.shopName.toLowerCase().includes(q) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  // Find initial shipping address if customer is pre-selected for a new invoice
  const getInitialAddress = () => {
    if (invoice?.shippingAddress) return invoice.shippingAddress;
    if (customerId) {
      const cust = customers.find(c => c._id === customerId);
      return cust?.address || "";
    }
    return "";
  };

  const [shippingAddress, setShippingAddress] = useState(getInitialAddress());
  const formRef = useRef<HTMLFormElement>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  const updateLineItem = useCallback(
    (index: number, field: keyof LineItem, value: string | number) => {
      setLineItems((prev) => {
        const next = [...prev];
        const item = { ...next[index], [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          const q = field === "quantity" ? Number(value) : item.quantity;
          const u = field === "unitPrice" ? Number(value) : item.unitPrice;
          item.amount = q * u;
        }
        next[index] = item;
        // Auto-add new row if the user types in the last row
        if (index === next.length - 1) {
          if (value !== "" && value !== 0 && !Number.isNaN(value)) {
            next.push({ ...defaultLineItem });
          }
        }
        return next;
      });
    },
    []
  );

  const addRow = useCallback(() => {
    setLineItems((prev) => {
      const nextLength = prev.length;
      setTimeout(() => rowRefs.current[nextLength]?.querySelector("input")?.focus(), 50);
      return [...prev, { ...defaultLineItem }];
    });
  }, []);

  const removeRow = useCallback((index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }, [lineItems.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, rowIndex: number, field: "desc" | "qty" | "rate" | "amount") => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          formRef.current?.requestSubmit();
          return;
        }
        const fields: ("desc" | "qty" | "rate" | "amount")[] = ["desc", "qty", "rate", "amount"];
        const idx = fields.indexOf(field);
        if (idx < 3) {
          const next = (e.currentTarget as HTMLElement).closest("tr")?.querySelectorAll("input")[idx + 1];
          (next as HTMLInputElement | undefined)?.focus();
        } else {
          if (rowIndex >= lineItems.length - 1) addRow();
          const nextRow = rowRefs.current[rowIndex + 1];
          nextRow?.querySelector("input")?.focus();
        }
      }
    },
    [lineItems.length, addRow]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    if (!selectedCustomerId) {
      setError("Please select a customer.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    // ensure customerId from controlled state is submitted (hidden input already does, but be explicit)
    fd.set("customerId", selectedCustomerId);
    // Filter out completely empty rows
    const validLineItems = lineItems.filter(item => (item.description && item.description.trim() !== "") || item.quantity > 0 || item.unitPrice > 0);
    if (validLineItems.length === 0) { setError("Please add at least one valid line item."); setIsSubmitting(false); return; }
    fd.set("lineItems", JSON.stringify(validLineItems));
    fd.set("withGst", withGst ? "true" : "false");
    const result = await action(fd);
    if (result && typeof result === "object" && "error" in result && result.error) {
      setError(String(result.error));
      setIsSubmitting(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 bg-white p-4 md:p-6 rounded-2xl border border-slate-200/60 shadow-sm">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-1" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</label>
            <label className="flex items-center gap-2 text-xs font-semibold text-primary/80 cursor-pointer hover:text-primary transition-colors">
              <input
                type="checkbox"
                name="withGst"
                checked={withGst}
                onChange={(e) => setWithGst(e.target.checked)}
                disabled={!!invoice}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary"
              />
              Include GST (5%)
            </label>
          </div>

          <div className="space-y-4">
            {/* Customer Command Combobox */}
            <div ref={customerComboboxRef} className="relative">
              {/* hidden input for form submission */}
              <input type="hidden" name="customerId" value={selectedCustomerId} />
              <button
                type="button"
                role="combobox"
                aria-expanded={customerOpen}
                aria-controls="customer-command-list"
                disabled={!!invoice}
                onClick={() => {
                  if (!invoice) setCustomerOpen((o) => !o);
                }}
                className={`flex w-full items-center justify-between rounded-xl border bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 ${customerOpen ? "border-primary bg-white ring-4 ring-primary/10" : "border-slate-200/50"} ${invoice ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-white"} ${!selectedCustomer ? "text-slate-400" : "text-slate-900"}`}
              >
                <span className="truncate text-left">
                  {selectedCustomer ? selectedCustomer.shopName : "Select a customer"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>

              {customerOpen && !invoice && (
                <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                  {/* Command Input */}
                  <div className="flex items-center border-b border-slate-100 px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-40" />
                    <input
                      ref={customerInputRef}
                      placeholder="Search customer..."
                      value={customerQuery}
                      onChange={(e) => setCustomerQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.preventDefault();
                          setCustomerOpen(false);
                        }
                      }}
                      className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>

                  {/* Command List */}
                  <div
                    id="customer-command-list"
                    role="listbox"
                    className="max-h-60 overflow-auto p-1"
                  >
                    {filteredCustomers.length === 0 ? (
                      <div className="py-6 text-center text-sm text-slate-500">
                        No customer found.
                      </div>
                    ) : (
                      filteredCustomers.map((c) => {
                        const isSelected = c._id === selectedCustomerId;
                        return (
                          <button
                            key={c._id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setSelectedCustomerId(c._id);
                              setShippingAddress(c.address || "");
                              setCustomerOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors text-left ${isSelected ? "bg-primary text-white" : "hover:bg-slate-50 text-slate-700"}`}
                          >
                            <Check className={`h-4 w-4 shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                            <div className="flex flex-col overflow-hidden">
                              <span className={`truncate font-medium ${isSelected ? "text-white" : "text-slate-900"}`}>
                                {c.shopName}
                              </span>
                              {c.address && (
                                <span className={`truncate text-xs ${isSelected ? "text-white/80" : "text-slate-500"}`}>
                                  {c.address}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {customers.length > 5 && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2 text-[10px] font-medium text-slate-400">
                      {filteredCustomers.length} of {customers.length} customers
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Shipping Address</label>
              <textarea
                name="shippingAddress"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all min-h-20 placeholder:text-slate-400 focus:bg-white"
                placeholder="Full delivery address..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invoice Date</label>
            <Input
              name="date"
              type="date"
              required
              className="bg-slate-50/50 border-slate-200/50 focus:bg-white"
              defaultValue={invoice ? new Date(invoice.date).toISOString().slice(0, 10) : today}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notes & Terms</label>
            <textarea
              name="notes"
              className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all min-h-20 placeholder:text-slate-400 focus:bg-white"
              defaultValue={invoice?.notes || ""}
              placeholder="Special instructions or terms..."
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Line Items</label>
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-7 rounded-lg text-[10px] font-bold uppercase tracking-wider px-3">
            Add Row
          </Button>
        </div>

        <div className="border border-slate-100 rounded-xl overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:grid md:grid-cols-12 bg-slate-50/80 border-b border-slate-100 px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-3 flex items-center">Description</div>
            <div className="col-span-2 flex items-center">HSN</div>
            <div className="col-span-3 flex items-center">Narration</div>
            <div className="col-span-2 flex items-center justify-end">Qty</div>
            <div className="col-span-2 flex items-center justify-end">Rate</div>
          </div>

          <div className="divide-y divide-slate-100">
            {lineItems.map((item, i) => (
              <div
                key={i}
                ref={(el) => {
                  rowRefs.current[i] = el as any;
                }}
                className="relative group bg-white hover:bg-slate-50/30 transition-colors"
              >
                {/* Mobile View */}
                <div className="md:hidden space-y-3 p-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</label>
                    <Input
                      className="border-slate-200/60 bg-slate-50/30 focus:bg-white h-9 px-3 text-sm"
                      value={item.description}
                      onChange={(e) => updateLineItem(i, "description", e.target.value)}
                      placeholder="Item name..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">HSN Code</label>
                      <Input
                        className="border-slate-200/60 bg-slate-50/30 focus:bg-white h-9 px-3 text-sm uppercase"
                        value={item.hsnSac ?? ""}
                        onChange={(e) => updateLineItem(i, "hsnSac", e.target.value)}
                        placeholder="HSN"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Narration</label>
                      <Input
                        className="border-slate-200/60 bg-slate-50/30 focus:bg-white h-9 px-3 text-sm"
                        value={item.narration ?? ""}
                        onChange={(e) => updateLineItem(i, "narration", e.target.value)}
                        placeholder="Narration..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Qty</label>
                      <Input
                        type="number"
                        className="border-slate-200/60 bg-slate-50/30 focus:bg-white h-9 px-3 text-right text-sm"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          updateLineItem(i, "quantity", parseFloat(e.target.value) || 0)
                        }
                        onKeyDown={(e) => handleKeyDown(e, i, "qty")}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rate</label>
                      <Input
                        type="number"
                        className="border-slate-200/60 bg-slate-50/30 focus:bg-white h-9 px-3 text-right text-sm"
                        value={item.unitPrice || ""}
                        onChange={(e) =>
                          updateLineItem(i, "unitPrice", parseFloat(e.target.value) || 0)
                        }
                        onKeyDown={(e) => handleKeyDown(e, i, "rate")}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</label>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {(item.quantity * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Desktop View */}
                <div className="hidden md:grid md:grid-cols-12 md:items-center md:p-4">
                  <div className="col-span-3">
                    <Input
                      className="border-slate-200/60 bg-transparent focus:bg-white focus:border-slate-200 h-9 px-2 text-sm"
                      value={item.description}
                      onChange={(e) => updateLineItem(i, "description", e.target.value)}
                      placeholder="Item name..."
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      className="border-slate-200/60 bg-transparent focus:bg-white focus:border-slate-200 h-9 px-2 uppercase text-sm"
                      value={item.hsnSac ?? ""}
                      onChange={(e) => updateLineItem(i, "hsnSac", e.target.value)}
                      placeholder="HSN"
                    />
                  </div>

                  <div className="col-span-3">
                    <Input
                      className="border-slate-200/60 bg-transparent focus:bg-white focus:border-slate-200 h-9 px-2 text-sm"
                      value={item.narration ?? ""}
                      onChange={(e) => updateLineItem(i, "narration", e.target.value)}
                      placeholder="Narration..."
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      className="border-slate-200/60 bg-transparent focus:bg-white focus:border-slate-200 h-9 px-2 text-right text-sm"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        updateLineItem(i, "quantity", parseFloat(e.target.value) || 0)
                      }
                      onKeyDown={(e) => handleKeyDown(e, i, "qty")}
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      className="border-slate-200/60 bg-transparent focus:bg-white focus:border-slate-200 h-9 px-2 text-right text-sm"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        updateLineItem(i, "unitPrice", parseFloat(e.target.value) || 0)
                      }
                      onKeyDown={(e) => handleKeyDown(e, i, "rate")}
                    />
                  </div>
                </div>

                <div className="hidden md:flex md:items-center md:justify-end md:px-4 md:py-3 md:border-t md:border-slate-100">
                  <span className="font-bold text-slate-900 tabular-nums">
                    {(item.quantity * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="absolute top-2 right-2 md:static md:top-auto md:right-auto md:w-7 md:h-7 md:flex md:items-center md:justify-center md:rounded-full bg-red-50 text-red-500 border border-red-100 md:border-0 md:bg-transparent md:text-slate-300 md:hover:text-red-500 md:hover:bg-red-50 md:transition-all md:opacity-0 md:group-hover:opacity-100"
                  title="Delete item"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-6 pt-4 border-t border-slate-200/60">
        <div className="hidden md:flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 px-4 py-2 rounded-lg">
          <span className="flex items-center gap-1.5"><kbd className="bg-white border px-1 rounded shadow-sm text-slate-500">Tab</kbd> Next</span>
          <span className="flex items-center gap-1.5"><kbd className="bg-white border px-1 rounded shadow-sm text-slate-500">Enter</kbd> Add row</span>
        </div>

        <div className="flex items-end justify-between md:justify-end gap-6 w-full md:w-auto">
          <div className="flex flex-col items-start md:items-end">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Freight</label>
            <div className="w-24 mt-1">
              <Input
                name="freight"
                type="number"
                className="text-right h-9 bg-slate-50/50 border-slate-200/50 focus:bg-white text-sm"
                defaultValue={invoice?.freight ?? 0}
                placeholder="0.00"
              />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} size="md" className="h-10 px-8 shadow-lg shadow-primary/20 font-bold tracking-wide">
            {isSubmitting ? "Saving..." : invoice ? "Update Invoice" : "Save Invoice"}
          </Button>
        </div>
      </div>
    </form>
  );
}
