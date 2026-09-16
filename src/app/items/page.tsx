"use client";

import { useEffect, useMemo, useState } from "react";
import { usePeople } from "@/components/PersonProvider";
import { formatMoney } from "@/lib/format";
import type { MoveInItem } from "@/lib/types";

const CATEGORIES = [
  "Furniture",
  "Kitchen",
  "Bedroom",
  "Bathroom",
  "Living Room",
  "Cleaning",
  "Electronics",
  "Decor",
  "Outdoor",
  "Other",
];

export default function ItemsPage() {
  const { currentPersonId } = usePeople();
  const [items, setItems] = useState<MoveInItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [estCost, setEstCost] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "needed" | "purchased">("all");

  function loadItems() {
    return fetch("/api/items")
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetch("/api/items")
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          estCost: estCost ? Number(estCost) : 0,
          notes,
          addedById: currentPersonId,
        }),
      });
      if (res.ok) {
        setName("");
        setEstCost("");
        setNotes("");
        setShowForm(false);
        await loadItems();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePurchased(item: MoveInItem) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, purchased: !i.purchased } : i))
    );
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchased: !item.purchased }),
    });
    loadItems();
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/items/${id}`, { method: "DELETE" });
  }

  const { totalEst, totalSpent, remaining, needed, purchased } = useMemo(() => {
    const needed = items.filter((i) => !i.purchased);
    const purchased = items.filter((i) => i.purchased);
    const totalEst = items.reduce((sum, i) => sum + i.estCost, 0);
    const totalSpent = purchased.reduce((sum, i) => sum + i.estCost, 0);
    return { totalEst, totalSpent, remaining: totalEst - totalSpent, needed, purchased };
  }, [items]);

  const visibleItems = items.filter((i) => {
    if (filter === "needed") return !i.purchased;
    if (filter === "purchased") return i.purchased;
    return true;
  });

  const pct = totalEst > 0 ? Math.min(100, Math.round((totalSpent / totalEst) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ocean-900">Move-In List</h1>
          <p className="mt-1 text-sm text-ocean-700/70">
            Everything we still need for the new place, and what it&apos;ll probably cost.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-coral-500 px-4 py-2 text-sm font-semibold text-white shadow-coastal transition hover:bg-coral-600"
        >
          {showForm ? "Cancel" : "+ Add item"}
        </button>
      </div>

      <div className="card grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
        <Stat label="Items needed" value={String(needed.length)} />
        <Stat label="Purchased" value={String(purchased.length)} />
        <Stat label="Est. total" value={formatMoney(totalEst)} />
        <Stat label="Remaining" value={formatMoney(remaining)} accent />
      </div>

      {totalEst > 0 && (
        <div className="card p-5">
          <div className="mb-2 flex justify-between text-sm text-ocean-800">
            <span>Purchased so far</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-sand-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-seafoam-500 to-ocean-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="card space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Item name">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Couch"
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
            <Field label="Estimated cost">
              <input
                value={estCost}
                onChange={(e) => setEstCost(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                className="input"
              />
            </Field>
            <Field label="Notes (optional)">
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. IKEA, secondhand ok"
                className="input"
              />
            </Field>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-ocean-600 px-5 py-2 text-sm font-semibold text-white shadow-coastal transition hover:bg-ocean-700 disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add to list"}
          </button>
        </form>
      )}

      <div className="flex gap-1 rounded-full border border-sand-200 bg-white p-1 shadow-coastal w-fit">
        {(["all", "needed", "purchased"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === f ? "bg-ocean-600 text-white" : "text-ocean-700/60 hover:bg-sand-100"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-ocean-700/60">Loading…</p>
      ) : visibleItems.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2.5">
          {visibleItems.map((item) => (
            <li
              key={item.id}
              className={`card flex items-center gap-4 p-4 transition-opacity ${
                item.purchased ? "opacity-60" : ""
              }`}
            >
              <button
                onClick={() => togglePurchased(item)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  item.purchased
                    ? "border-seafoam-500 bg-seafoam-500 text-white"
                    : "border-ocean-300 hover:border-ocean-500"
                }`}
                aria-label="Toggle purchased"
              >
                {item.purchased && "✓"}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`font-medium text-ocean-900 ${item.purchased ? "line-through" : ""}`}>
                  {item.name}
                </p>
                <p className="text-xs text-ocean-700/60">
                  {item.category}
                  {item.notes ? ` · ${item.notes}` : ""}
                  {item.addedBy ? ` · added by ${item.addedBy.name}` : ""}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-ocean-800">
                {formatMoney(item.estCost)}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="shrink-0 rounded-full p-1.5 text-ocean-700/40 transition hover:bg-coral-50 hover:text-coral-600"
                aria-label="Remove item"
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ocean-700/50">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${accent ? "text-coral-600" : "text-ocean-900"}`}>
        {value}
      </p>
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
      <span className="text-3xl">🏖️</span>
      <p className="font-medium text-ocean-900">Nothing here yet</p>
      <p className="text-sm text-ocean-700/60">Add the first thing your place needs.</p>
    </div>
  );
}
