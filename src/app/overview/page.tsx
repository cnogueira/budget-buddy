import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DateRangeNav } from "@/components/DateRangeNav";
import { OverviewContent, OverviewSkeleton } from "./OverviewContent";

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

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
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

  const contentKey = `${start}-${end}`;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-center">
          <DateRangeNav from={fromDate} to={toDate} />
        </div>

        <Suspense key={contentKey} fallback={<OverviewSkeleton />}>
          <OverviewContent start={start} end={end} />
        </Suspense>
      </main>
    </div>
  );
}
