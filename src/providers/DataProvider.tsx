"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Category, TransactionWithCategory } from "@/types/database";
import { loadCache, saveCache } from "@/lib/client-cache";
import { computeFingerprint } from "@/lib/compute";
import { getAllData, getFingerprint } from "@/app/actions/data-actions";

export type DataStatus = "loading" | "ready" | "syncing";

export type TransactionPatch =
  | { op: "add"; transaction: TransactionWithCategory }
  | { op: "delete"; id: string }
  | { op: "update"; transaction: TransactionWithCategory };

export interface DataContextValue {
  transactions: TransactionWithCategory[];
  categories: Category[];
  status: DataStatus;
  applyTransaction: (patch: TransactionPatch) => void;
  invalidateAndRefetch: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}

interface DataProviderProps {
  userId: string;
  children: React.ReactNode;
}

export function DataProvider({ userId, children }: DataProviderProps) {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<DataStatus>("loading");
  const fingerprintRef = useRef<string>("");

  function persist(
    txs: TransactionWithCategory[],
    cats: Category[],
    fingerprint: string
  ) {
    fingerprintRef.current = fingerprint;
    saveCache({ userId, fingerprint, cachedAt: Date.now(), transactions: txs, categories: cats });
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const cached = loadCache(userId);

      if (cached) {
        setTransactions(cached.transactions);
        setCategories(cached.categories);
        fingerprintRef.current = cached.fingerprint;
        setStatus("ready");

        // Background fingerprint check — only re-download if stale
        try {
          const fp = await getFingerprint();
          if (cancelled || !fp.success) return;
          if (fp.fingerprint === fingerprintRef.current) return;

          // Stale: re-download silently
          setStatus("syncing");
          const fresh = await getAllData();
          if (cancelled) return;
          if (fresh.success && fresh.data) {
            setTransactions(fresh.data.transactions);
            setCategories(fresh.data.categories);
            persist(fresh.data.transactions, fresh.data.categories, fresh.data.fingerprint);
          }
          setStatus("ready");
        } catch {
          // Network error: keep cached data, stay ready
        }
      } else {
        // No cache: full fetch
        const fresh = await getAllData();
        if (cancelled) return;
        if (fresh.success && fresh.data) {
          setTransactions(fresh.data.transactions);
          setCategories(fresh.data.categories);
          persist(fresh.data.transactions, fresh.data.categories, fresh.data.fingerprint);
        }
        setStatus("ready");
      }
    }

    init();
    return () => { cancelled = true; };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyTransaction(patch: TransactionPatch) {
    setTransactions((prev) => {
      let next: TransactionWithCategory[];
      if (patch.op === "add") {
        next = [patch.transaction, ...prev];
      } else if (patch.op === "delete") {
        next = prev.filter((t) => t.id !== patch.id);
      } else {
        next = prev.map((t) => (t.id === patch.transaction.id ? patch.transaction : t));
      }
      persist(next, categories, computeFingerprint(next, categories));
      return next;
    });
  }

  async function invalidateAndRefetch() {
    setStatus("syncing");
    const fresh = await getAllData();
    if (fresh.success && fresh.data) {
      setTransactions(fresh.data.transactions);
      setCategories(fresh.data.categories);
      persist(fresh.data.transactions, fresh.data.categories, fresh.data.fingerprint);
    }
    setStatus("ready");
  }

  return (
    <DataContext.Provider
      value={{ transactions, categories, status, applyTransaction, invalidateAndRefetch }}
    >
      {status === "syncing" && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400 dark:bg-zinc-500" />
          Syncing…
        </div>
      )}
      {children}
    </DataContext.Provider>
  );
}
