import { Category, TransactionWithCategory } from "@/types/database";

export interface CachedUserData {
  userId: string;
  fingerprint: string;
  cachedAt: number;
  transactions: TransactionWithCategory[];
  categories: Category[];
}

const TTL_MS = 24 * 60 * 60 * 1000;
const cacheKey = (uid: string) => `budget-buddy:cache:${uid}`;

function isValidCache(data: unknown): data is CachedUserData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.userId === "string" &&
    typeof d.fingerprint === "string" &&
    typeof d.cachedAt === "number" &&
    Array.isArray(d.transactions) &&
    Array.isArray(d.categories)
  );
}

export function loadCache(userId: string): CachedUserData | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!isValidCache(data)) return null;
    if (data.userId !== userId) return null;
    if (Date.now() - data.cachedAt > TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveCache(data: CachedUserData): void {
  try {
    localStorage.setItem(cacheKey(data.userId), JSON.stringify(data));
  } catch {
    // QuotaExceededError or unavailable localStorage — in-memory state still works
  }
}

export function clearAllCaches(): void {
  try {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith("budget-buddy:cache:")
    );
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
