"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/modules", label: "Modules" },
  { href: "/session", label: "Session" },
  { href: "/settings", label: "Settings" },
];

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-center text-sm font-semibold ${active ? "bg-slate-900 text-white" : "text-slate-700"}`}
    >
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="hidden border-r border-slate-300 bg-slate-100/70 p-4 lg:block">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">RescueCalc FOG/SOG</p>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} active={pathname === item.href} />
          ))}
        </nav>
      </aside>

      <div className="pb-20 lg:pb-0">
        <main className="mx-auto w-full max-w-6xl p-4 lg:p-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 gap-1 border-t border-slate-300 bg-white/95 p-2 backdrop-blur lg:hidden">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} active={pathname === item.href} />
        ))}
      </nav>
    </div>
  );
}
