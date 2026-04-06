"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";

interface InvoiceSearchBarProps {
  initialSearch?: string;
  filter?: string;
  customerId?: string;
}

export function InvoiceSearchBar({ initialSearch = "", filter, customerId }: InvoiceSearchBarProps) {
  const [search, setSearch] = useState(initialSearch);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const performSearch = useCallback((value: string) => {
    const params = new URLSearchParams();
    if (filter) params.set("filter", filter);
    if (customerId) params.set("customerId", customerId);
    if (value.trim()) params.set("search", value.trim());

    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
  }, [filter, customerId, pathname, router]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== initialSearch) {
        performSearch(search);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, initialSearch, performSearch]);

  const handleClear = () => {
    setSearch("");
    const params = new URLSearchParams();
    if (filter) params.set("filter", filter);
    if (customerId) params.set("customerId", customerId);

    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        placeholder="Search by invoice number or shop name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            performSearch(search);
          }
        }}
        className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
      />
      {search && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      )}
    </div>
  );
}
