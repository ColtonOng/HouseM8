"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePeople } from "@/components/PersonProvider";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/items", label: "Move-In List" },
  { href: "/groceries", label: "Groceries" },
  { href: "/expenses", label: "Expenses" },
];

const personColorClasses: Record<string, string> = {
  ocean: "bg-ocean-500",
  coral: "bg-coral-500",
};

export function NavBar() {
  const pathname = usePathname();
  const { people, currentPersonId, setCurrentPersonId, loading } = usePeople();

  return (
    <header className="sticky top-0 z-20 border-b border-sand-200/80 bg-sand-50/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-ocean-400 to-ocean-600 text-lg shadow-coastal">
            🌊
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ocean-900">HouseM8</p>
            <p className="text-[11px] text-ocean-600/70">Pacific Beach household</p>
          </div>
        </Link>

        <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-2 sm:w-auto">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-ocean-600 text-white shadow-coastal"
                    : "text-ocean-800/70 hover:bg-ocean-100 hover:text-ocean-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="order-2 flex items-center gap-1 rounded-full border border-sand-200 bg-white p-1 shadow-coastal sm:order-3">
          {loading || people.length === 0 ? (
            <span className="px-3 py-1 text-xs text-ocean-700/60">Loading…</span>
          ) : (
            people.map((p) => {
              const active = p.id === currentPersonId;
              return (
                <button
                  key={p.id}
                  onClick={() => setCurrentPersonId(p.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-ocean-50 text-ocean-900 ring-1 ring-ocean-300"
                      : "text-ocean-700/60 hover:bg-sand-100"
                  }`}
                  title={`Switch to ${p.name}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${personColorClasses[p.color] ?? "bg-ocean-400"}`}
                  />
                  {p.name}
                </button>
              );
            })
          )}
        </div>
      </div>
    </header>
  );
}
