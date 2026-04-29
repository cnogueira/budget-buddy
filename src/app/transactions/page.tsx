import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddTransactionButton } from "@/components/AddTransactionButton";
import { ImportTransactionsButton } from "@/components/ImportTransactionsButton";
import { TransactionsContent, TransactionsSkeleton } from "./TransactionsContent";

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultRange(): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from, to };
}

function parseDate(s: string | undefined, fallback: Date): Date {
  if (!s) return fallback;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? fallback : d;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; categories?: string; sort?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const defaults = defaultRange();

  const fromDate = parseDate(params.from, defaults.from);
  const toDate = parseDate(params.to, defaults.to);
  const start = toISODate(fromDate);
  const end = toISODate(toDate);

  const categoryIds = params.categories
    ? params.categories.split(",").filter(Boolean)
    : [];

  const sort: "asc" | "desc" =
    params.sort === "asc" ? "asc" : "desc";

  const contentKey = `${start}-${end}-${categoryIds.join(",")}-${sort}`;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Transactions
          </h1>
          <div className="flex items-center gap-2">
            <AddTransactionButton />
            <ImportTransactionsButton />
          </div>
        </header>

        <Suspense key={contentKey} fallback={<TransactionsSkeleton />}>
          <TransactionsContent
            start={start}
            end={end}
            categoryIds={categoryIds}
            sort={sort}
            fromDate={fromDate}
            toDate={toDate}
          />
        </Suspense>
      </main>
    </div>
  );
}
