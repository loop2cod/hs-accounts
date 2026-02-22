"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  LogOut
} from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/customers", label: "Users", icon: Users },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/payments", label: "Finances", icon: CreditCard },
  { href: "/reports", label: "Stats", icon: BarChart3 },
];

export function AppNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-white/80 backdrop-blur-lg border-b border-slate-100 md:hidden">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-base tracking-tight">HS Traders</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </form>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/80 backdrop-blur-lg px-2 py-2 md:bottom-auto md:top-0 md:border-b md:border-t-0 md:h-16 md:flex md:items-center"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto w-full flex justify-around items-center md:px-6">
          <div className="hidden md:flex items-center gap-2 mr-8">
            <span className="font-bold text-slate-900 text-lg tracking-tight">HS Traders</span>
          </div>

          <ul className="flex flex-1 justify-around items-center gap-1 md:justify-start md:gap-2">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href} className="flex-1 md:flex-none">
                  <Link
                    href={href}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 transition-all md:flex-row md:gap-2 md:px-4 md:py-2 ${isActive
                      ? "text-primary bg-primary/5 font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-slate-400"}`} />
                    <span className="text-[10px] md:text-sm">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden md:flex items-center ml-4 border-l border-slate-100 pl-4">
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </nav>
    </>
  );
}
