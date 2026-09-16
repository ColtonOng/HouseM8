"use client";

import { useEffect, useMemo, useState } from "react";
import { usePeople } from "@/components/PersonProvider";
import { formatMoney, formatDate } from "@/lib/format";
import { computeNetBalances } from "@/lib/balance";
import type { Expense } from "@/lib/types";

const CATEGORIES = [
  "Rent & Utilities",
  "Groceries",
  "Furniture & Household",
  "Internet & Subscriptions",
  "Dining Out",
  "Other",
];

const SPLIT_PRESETS = [
  { label: "Split 50/50", value: 50 },
  { label: "They owe it all back", value: 100 },
  { label: "My treat (no split)", value: 0 },
  { label: "Custom %", value: "custom" as const },
];

export default function ExpensesPage() {
  const { people, currentPersonId } = usePeople();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paidByOverride, setPaidByOverride] = useState<string | null>(null);
  const [splitChoice, setSplitChoice] = useState<number | "custom">(50);
  const [customPercent, setCustomPercent] = useState("50");
  const [submitting, setSubmitting] = useState(false);
  const [showSettled, setShowSettled] = useState(false);

  const paidById = paidByOverride ?? currentPersonId ?? people[0]?.id ?? "";

  function loadExpenses() {
    return fetch("/api/expenses")
      .then((res) => res.json())
      .then((data) => {
        setExpenses(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetch("/api/expenses")
      .then((res) => res.json())
      .then((data) => {
        setExpenses(data);
        setLoading(false);
      });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) return;
    setSubmitting(true);
    const owedPercent = splitChoice === "custom" ? Number(customPercent) || 0 : splitChoice;
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount: Number(amount),
          category,
          owedPercent,
          paidById,
        }),
      });
      if (res.ok) {
        setDescription("");
        setAmount("");
        setSplitChoice(50);
        setShowForm(false);
        await loadExpenses();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleSettled(exp: Expense) {
    setExpenses((prev) =>
      prev.map((e) => (e.id === exp.id ? { ...e, settled: !e.settled } : e))
    );
    await fetch(`/api/expenses/${exp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settled: !exp.settled }),
    });
    loadExpenses();
  }

  async function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
  }

  async function settleAllUp() {
    const unsettled = expenses.filter((e) => !e.settled);
    await Promise.all(
      unsettled.map((e) =>
        fetch(`/api/expenses/${e.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settled: true }),
        })
      )
    );
    loadExpenses();
  }

  const netBalances = useMemo(
    () => computeNetBalances(people.map((p) => p.id), expenses),
    [people, expenses]
  );

  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const unsettledCount = expenses.filter((e) => !e.settled).length;

  const balanceSummary = useMemo(() => {
    if (people.length < 2) return null;
    const [a, b] = people;
    const diff = (netBalances[a.id] ?? 0) - (netBalances[b.id] ?? 0);
    if (Math.abs(diff) < 0.01) return { settled: true as const };
    const creditor = diff > 0 ? a : b;
    const debtor = diff > 0 ? b : a;
    return { settled: false as const, creditor, debtor, amount: Math.abs(diff) / 2 };
  }, [people, netBalances]);

  const visibleExpenses = expenses.filter((e) => showSettled || !e.settled);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ocean-900">Expenses</h1>
          <p className="mt-1 text-sm text-ocean-700/70">What&apos;s been spent so far, and who owes who.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-coral-500 px-4 py-2 text-sm font-semibold text-white shadow-coastal transition hover:bg-coral-600"
        >
          {showForm ? "Cancel" : "+ Log expense"}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-ocean-600 to-ocean-800 p-6 text-white">
          {balanceSummary === null ? (
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
          {unsettledCount > 0 && (
            <button
              onClick={settleAllUp}
              className="mt-4 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur transition hover:bg-white/25"
            >
              Mark all settled up
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
          <Stat label="Total logged" value={formatMoney(totalSpent)} />
          <Stat label="Unsettled" value={String(unsettledCount)} />
          {people.map((p) => (
            <Stat
              key={p.id}
              label={`Paid by ${p.name}`}
              value={formatMoney(
                expenses.filter((e) => e.paidById === p.id).reduce((s, e) => s + e.amount, 0)
              )}
            />
          ))}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What was it?">
              <input
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Target run"
                className="input"
                required
              />
            </Field>
            <Field label="Amount">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                className="input"
                required
              />
            </Field>
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Paid by">
              <select
                value={paidById}
                onChange={(e) => setPaidByOverride(e.target.value)}
                className="input"
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Split">
                <select
                  value={splitChoice}
                  onChange={(e) =>
                    setSplitChoice(e.target.value === "custom" ? "custom" : Number(e.target.value))
                  }
                  className="input"
                >
                  {SPLIT_PRESETS.map((p) => (
                    <option key={p.label} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
              {splitChoice === "custom" && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={customPercent}
                    onChange={(e) => setCustomPercent(e.target.value)}
                    inputMode="numeric"
                    className="input w-24"
                  />
                  <span className="text-sm text-ocean-700/70">% owed back to payer</span>
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-ocean-600 px-5 py-2 text-sm font-semibold text-white shadow-coastal transition hover:bg-ocean-700 disabled:opacity-50"
          >
            {submitting ? "Logging…" : "Log expense"}
          </button>
        </form>
      )}

      <label className="flex w-fit items-center gap-2 text-sm text-ocean-700/70">
        <input
          type="checkbox"
          checked={showSettled}
          onChange={(e) => setShowSettled(e.target.checked)}
          className="h-4 w-4 rounded border-sand-300 text-ocean-600 focus:ring-ocean-400"
        />
        Show settled expenses
      </label>

      {loading ? (
        <p className="text-sm text-ocean-700/60">Loading…</p>
      ) : visibleExpenses.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2.5">
          {visibleExpenses.map((exp) => (
            <li
              key={exp.id}
              className={`card flex flex-wrap items-center gap-4 p-4 ${exp.settled ? "opacity-60" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ocean-900">{exp.description}</p>
                <p className="text-xs text-ocean-700/60">
                  {formatDate(exp.date)} · {exp.category}
                  {exp.paidBy ? ` · paid by ${exp.paidBy.name}` : ""}
                  {exp.owedPercent > 0 ? ` · ${exp.owedPercent}% split back` : " · not split"}
                </p>
              </div>
              <span className="font-semibold text-ocean-800">{formatMoney(exp.amount)}</span>
              <button
                onClick={() => toggleSettled(exp)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  exp.settled
                    ? "bg-seafoam-100 text-seafoam-500"
                    : "bg-sand-100 text-ocean-700 hover:bg-sand-200"
                }`}
              >
                {exp.settled ? "Settled" : "Mark settled"}
              </button>
              <button
                onClick={() => removeExpense(exp.id)}
                className="rounded-full p-1.5 text-ocean-700/40 transition hover:bg-coral-50 hover:text-coral-600"
                aria-label="Remove expense"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ocean-700/50">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ocean-900">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ocean-800/70">{label}</span>
      {children}
    </label>
  );
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center gap-2 p-10 text-center">
      <span className="text-3xl">🧾</span>
      <p className="font-medium text-ocean-900">No expenses logged yet</p>
      <p className="text-sm text-ocean-700/60">Log the first thing someone paid for.</p>
    </div>
  );
}
