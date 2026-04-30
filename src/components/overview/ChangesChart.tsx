"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { OverviewTransaction } from "@/types/database";
import { formatDateRange } from "@/lib/format";

type Granularity = "days" | "weeks" | "months";

interface ChangesChartProps {
  transactions: OverviewTransaction[];
  from: string;
  to: string;
}

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  const week = Math.ceil((dayOfYear + jan4.getDay() - 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function bucketKey(dateStr: string, granularity: Granularity): string {
  if (granularity === "months") return dateStr.slice(0, 7);
  if (granularity === "weeks") return isoWeek(dateStr);
  return dateStr;
}

function bucketLabel(key: string, granularity: Granularity): string {
  if (granularity === "months") {
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  if (granularity === "weeks") return key.replace("-W", " W");
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildSeries(transactions: OverviewTransaction[], granularity: Granularity) {
  const buckets = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const key = bucketKey(t.date, granularity);
    const existing = buckets.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "income") existing.income += t.amount;
    else existing.expense += t.amount;
    buckets.set(key, existing);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({
      label: bucketLabel(key, granularity),
      income: Math.round(val.income * 100) / 100,
      expense: Math.round(val.expense * 100) / 100,
    }));
}

const GRANULARITIES: { key: Granularity; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "weeks", label: "Weeks" },
  { key: "months", label: "Months" },
];

export function ChangesChart({ transactions, from, to }: ChangesChartProps) {
  const [granularity, setGranularity] = useState<Granularity>("days");
  const data = buildSeries(transactions, granularity);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Changes</h3>
          <p className="text-xs text-zinc-400">{formatDateRange(from, to)}</p>
        </div>
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs">
          {GRANULARITIES.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGranularity(g.key)}
              className={`px-2.5 py-1 font-medium transition-colors ${
                granularity === g.key
                  ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                  : "bg-white text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-zinc-400">
          No transactions in this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(161,161,170,0.2)" strokeDasharray="4 4" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(v) => `${v}€`} tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} width={60} />
            <Tooltip formatter={(v, name) => [`${Number(v).toFixed(2)} €`, name === "income" ? "Income" : "Expense"]} contentStyle={{ fontSize: 12, border: "none", borderRadius: "8px" }} />
            <Legend formatter={(v) => v === "income" ? "Income" : "Expense"} />
            <Bar dataKey="income" fill="#22c55e" stroke="none" radius={[3, 3, 0, 0]} maxBarSize={40} />
            <Bar dataKey="expense" fill="#ef4444" stroke="none" radius={[3, 3, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
