"use client";

import { useEffect, useMemo, useState } from "react";
import { usePeople } from "@/components/PersonProvider";
import { formatMoney } from "@/lib/format";
import type { GroceryItem } from "@/lib/types";

const CATEGORIES = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Pantry",
  "Frozen",
  "Snacks",
  "Drinks",
  "Household",
  "Other",
];

export default function GroceriesPage() {
  const { currentPersonId } = usePeople();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [estPrice, setEstPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  function loadItems() {
    return fetch("/api/groceries")
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetch("/api/groceries")
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
      const res = await fetch("/api/groceries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          estPrice: estPrice ? Number(estPrice) : 0,
          quantity: quantity ? Number(quantity) : 1,
          addedById: currentPersonId,
        }),
      });
      if (res.ok) {
        setName("");
        setEstPrice("");
        setQuantity("1");
        setShowForm(false);
        await loadItems();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePurchased(item: GroceryItem) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, purchased: !i.purchased } : i))
    );
    await fetch(`/api/groceries/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchased: !item.purchased }),
    });
    loadItems();
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/groceries/${id}`, { method: "DELETE" });
  }

  const { toBuy, inCart, totalEst } = useMemo(() => {
    const toBuy = items.filter((i) => !i.purchased);
    const inCart = items.filter((i) => i.purchased);
    const totalEst = items.reduce((sum, i) => sum + i.estPrice * i.quantity, 0);
    return { toBuy, inCart, totalEst };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ocean-900">Groceries</h1>
          <p className="mt-1 text-sm text-ocean-700/70">The running shopping list, with what we expect to spend.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-coral-500 px-4 py-2 text-sm font-semibold text-white shadow-coastal transition hover:bg-coral-600"
        >
          {showForm ? "Cancel" : "+ Add item"}
        </button>
      </div>

      <div className="card grid grid-cols-3 gap-4 p-5">
        <Stat label="On the list" value={String(toBuy.length)} />
        <Stat label="In the cart" value={String(inCart.length)} />
        <Stat label="Est. total" value={formatMoney(totalEst)} accent />
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Field label="Item name">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eggs"
                  className="input"
                  required
                />
              </Field>
            </div>
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Qty">
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputMode="numeric"
                className="input"
              />
            </Field>
            <Field label="Est. price (each)">
              <input
                value={estPrice}
                onChange={(e) => setEstPrice(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
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

      {loading ? (
        <p className="text-sm text-ocean-700/60">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          <GroceryGroup title="To buy" items={toBuy} onToggle={togglePurchased} onRemove={removeItem} />
          {inCart.length > 0 && (
            <GroceryGroup title="In the cart" items={inCart} onToggle={togglePurchased} onRemove={removeItem} muted />
          )}
        </div>
      )}
    </div>
  );
}

function GroceryGroup({
  title,
  items,
  onToggle,
  onRemove,
  muted,
}: {
  title: string;
  items: GroceryItem[];
  onToggle: (item: GroceryItem) => void;
  onRemove: (id: string) => void;
  muted?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ocean-700/60">
        {title} ({items.length})
      </h2>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li
            key={item.id}
            className={`card flex items-center gap-4 p-4 ${muted ? "opacity-60" : ""}`}
          >
            <button
              onClick={() => onToggle(item)}
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
                {item.quantity > 1 ? ` ×${item.quantity}` : ""}
              </p>
              <p className="text-xs text-ocean-700/60">
                {item.category}
                {item.addedBy ? ` · added by ${item.addedBy.name}` : ""}
              </p>
            </div>
            <span className="shrink-0 font-semibold text-ocean-800">
              {formatMoney(item.estPrice * item.quantity)}
            </span>
            <button
              onClick={() => onRemove(item.id)}
              className="shrink-0 rounded-full p-1.5 text-ocean-700/40 transition hover:bg-coral-50 hover:text-coral-600"
              aria-label="Remove item"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
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
      <span className="text-3xl">🛒</span>
      <p className="font-medium text-ocean-900">The list is empty</p>
      <p className="text-sm text-ocean-700/60">Add something you&apos;re running low on.</p>
    </div>
  );
}
