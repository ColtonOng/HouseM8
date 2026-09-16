"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePeople } from "@/components/PersonProvider";
import { formatMoney, formatDate } from "@/lib/format";
import { computeNetBalances } from "@/lib/balance";
import type { MoveInItem, GroceryItem, Expense } from "@/lib/types";

export default function DashboardPage() {
  const { people, currentPerson } = usePeople();
  const [items, setItems] = useState<MoveInItem[]>([]);
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/items").then((r) => r.json()),
      fetch("/api/groceries").then((r) => r.json()),
      fetch("/api/expenses").then((r) => r.json()),
    ]).then(([i, g, e]) => {
      setItems(i);
      setGroceries(g);
      setExpenses(e);
      setLoading(false);
    });
  }, []);

  const itemsNeeded = items.filter((i) => !i.purchased);
  const itemsRemainingCost = itemsNeeded.reduce((s, i) => s + i.estCost, 0);

  const groceriesToBuy = groceries.filter((g) => !g.purchased);
  const groceriesCost = groceriesToBuy.reduce((s, g) => s + g.estPrice * g.quantity, 0);

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const netBalances = useMemo(
    () => computeNetBalances(people.map((p) => p.id), expenses),
    [people, expenses]
  );

  const balanceSummary = useMemo(() => {
    if (people.length < 2) return null;
    const [a, b] = people;
    const diff = (netBalances[a.id] ?? 0) - (netBalances[b.id] ?? 0);
    if (Math.abs(diff) < 0.01) return { settled: true as const };
    const creditor = diff > 0 ? a : b;
    const debtor = diff > 0 ? b : a;
    return { settled: false as const, creditor, debtor, amount: Math.abs(diff) / 2 };
  }, [people, netBalances]);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-coral-600">
          {greeting()}{currentPerson ? `, ${currentPerson.name}` : ""} 🌅
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ocean-900">Our place in Pacific Beach</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-ocean-600 to-ocean-800 p-6 text-white">
          {loading ? (
            <p className="text-sm text-white/80">Loading balance…</p>
          ) : balanceSummary === null ? (
            <p className="text-sm text-white/80">Add both housemates to see the split.</p>
          ) : balanceSummary.settled ? (
            <p className="text-lg font-semibold">You&apos;re all settled up 🎉</p>
          ) : (
            <>
              <p className="text-sm text-white/70">Current balance</p>
              <p className="mt-1 text-2xl font-semibold">
                {balanceSummary.debtor.name} owes {balanceSummary.creditor.name}{" "}
                {formatMoney(balanceSummary.amount)}
              </p>
            </>
          )}
          <Link
            href="/expenses"
            className="mt-4 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur transition hover:bg-white/25"
          >
            View expenses →
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardCard
          href="/items"
          emoji="🛋️"
          title="Move-in list"
          primary={`${itemsNeeded.length} item${itemsNeeded.length === 1 ? "" : "s"} left`}
          secondary={`${formatMoney(itemsRemainingCost)} estimated`}
        />
        <DashboardCard
          href="/groceries"
          emoji="🛒"
          title="Groceries"
          primary={`${groceriesToBuy.length} to buy`}
          secondary={`${formatMoney(groceriesCost)} estimated`}
        />
        <DashboardCard
          href="/expenses"
          emoji="🧾"
          title="Total spent"
          primary={formatMoney(totalSpent)}
          secondary={`${expenses.length} expense${expenses.length === 1 ? "" : "s"} logged`}
        />
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ocean-900">Recent expenses</h2>
          <Link href="/expenses" className="text-sm font-medium text-ocean-600 hover:text-ocean-800">
            See all
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-ocean-700/60">Loading…</p>
        ) : recentExpenses.length === 0 ? (
          <p className="text-sm text-ocean-700/60">Nothing logged yet — add your first expense.</p>
        ) : (
          <ul className="divide-y divide-sand-200">
            {recentExpenses.map((exp) => (
              <li key={exp.id} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ocean-900">{exp.description}</p>
                  <p className="text-xs text-ocean-700/60">
                    {formatDate(exp.date)}
                    {exp.paidBy ? ` · paid by ${exp.paidBy.name}` : ""}
                  </p>
                </div>
                <span className="font-semibold text-ocean-800">{formatMoney(exp.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardCard({
  href,
  emoji,
  title,
  primary,
  secondary,
}: {
  href: string;
  emoji: string;
  title: string;
  primary: string;
  secondary: string;
}) {
  return (
    <Link href={href} className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-2 text-sm text-ocean-700/60">
        <span>{emoji}</span>
        {title}
      </div>
      <p className="mt-2 text-xl font-semibold text-ocean-900">{primary}</p>
      <p className="text-sm text-ocean-700/60">{secondary}</p>
    </Link>
  );
}
