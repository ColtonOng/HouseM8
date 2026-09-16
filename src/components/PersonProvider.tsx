"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Person } from "@/lib/types";

type PersonContextValue = {
  people: Person[];
  currentPersonId: string | null;
  currentPerson: Person | null;
  setCurrentPersonId: (id: string) => void;
  loading: boolean;
};

const PersonContext = createContext<PersonContextValue | null>(null);

const STORAGE_KEY = "housem8:currentPersonId";

export function PersonProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [currentPersonId, setCurrentPersonIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/people")
      .then((res) => res.json())
      .then((data: Person[]) => {
        if (cancelled) return;
        setPeople(data);
        const stored = localStorage.getItem(STORAGE_KEY);
        const valid = data.find((p) => p.id === stored);
        setCurrentPersonIdState(valid ? valid.id : data[0]?.id ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrentPersonId = useCallback((id: string) => {
    setCurrentPersonIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const currentPerson = people.find((p) => p.id === currentPersonId) ?? null;

  return (
    <PersonContext.Provider
      value={{ people, currentPersonId, currentPerson, setCurrentPersonId, loading }}
    >
      {children}
    </PersonContext.Provider>
  );
}

export function usePeople() {
  const ctx = useContext(PersonContext);
  if (!ctx) throw new Error("usePeople must be used within a PersonProvider");
  return ctx;
}
