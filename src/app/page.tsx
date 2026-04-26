import { Suspense } from "react";
import { parseMonthParam, formatMonthParam, formatMonthHeading } from "@/lib/month";
import { MonthNav } from "@/components/MonthNav";
import { DashboardContent, DashboardSkeleton } from "@/components/DashboardContent";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const selectedMonth = parseMonthParam(monthParam);
  const monthKey = formatMonthParam(selectedMonth);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <MonthNav currentMonth={monthKey}>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatMonthHeading(selectedMonth)}
            </h1>
          </MonthNav>
        </header>

        <Suspense key={monthKey} fallback={<DashboardSkeleton />}>
          <DashboardContent month={monthKey} />
        </Suspense>
      </main>
    </div>
  );
}
