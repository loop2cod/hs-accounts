"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/invoices", label: "Invoices" },
  { href: "/payments", label: "Payments" },
  { href: "/reports", label: "Reports" },
];

export function AppNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white/95 py-1 md:bottom-auto md:top-0 md:border-b md:border-t-0"
      aria-label="Main navigation"
    >
      <ul className="flex justify-around items-center gap-1 text-xs md:justify-start md:gap-4 md:px-4 md:py-2">
        {links.map(({ href, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`block rounded px-2 py-2 font-medium transition-colors md:px-3 ${isActive
                  ? "bg-neutral-200 text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
        <li className="ml-auto flex items-center pr-2">
          <form action={logout}>
            <button
              type="submit"
              className="block rounded px-2 py-2 font-medium transition-colors md:px-3 text-red-600 hover:bg-neutral-100"
            >
              Logout
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
