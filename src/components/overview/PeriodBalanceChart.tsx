"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { OverviewTransaction } from "@/types/database";

type Granularity = "days" | "weeks" | "months";

interface PeriodBalanceChartProps {
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

function buildSeries(transactions: OverviewTransaction[], granularity: Granularity, periodFrom: string) {
  const netByBucket = new Map<string, number>();
  for (const t of transactions) {
    const key = bucketKey(t.date, granularity);
    const delta = t.type === "income" ? t.amount : -t.amount;
    netByBucket.set(key, (netByBucket.get(key) ?? 0) + delta);
  }

  const startKey = bucketKey(periodFrom, granularity);
  const startLabel = bucketLabel(startKey, granularity);

  const keys = Array.from(netByBucket.keys()).sort();
  let running = 0;
  const txPoints = keys.map((key) => {
    running += netByBucket.get(key)!;
    return { label: bucketLabel(key, granularity), balance: Math.round(running * 100) / 100 };
  });

  // Always anchor the series at balance=0 on the period start date.
  // Skip the synthetic point only if the first transaction falls in the same
  // bucket (identical X label), which would otherwise create a duplicate tick.
  if (txPoints.length === 0 || keys[0] !== startKey) {
    return [{ label: startLabel, balance: 0 }, ...txPoints];
  }
  return txPoints;
}

function formatEUR(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

const GRANULARITIES: { key: Granularity; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "weeks", label: "Weeks" },
  { key: "months", label: "Months" },
];

export function PeriodBalanceChart({ transactions, from, to }: PeriodBalanceChartProps) {
  const [granularity, setGranularity] = useState<Granularity>("days");
  const data = buildSeries(transactions, granularity, from);

  const dateSubtitle = `${from} – ${to}`;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Period Balance</h3>
          <p className="text-xs text-zinc-400">{dateSubtitle}</p>
        </div>
        <GranularityToggle value={granularity} onChange={setGranularity} />
      </div>

      {transactions.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(161,161,170,0.2)" strokeDasharray="4 4" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(v) => `${v}€`} tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} width={60} />
            <Tooltip formatter={(v) => [formatEUR(Number(v)), "Balance"]} contentStyle={{ fontSize: 12, border: "none", borderRadius: "8px" }} />
            <Area type="monotone" dataKey="balance" stroke="#22c55e" strokeWidth={2} fill="url(#balanceFill)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function GranularityToggle({ value, onChange }: { value: Granularity; onChange: (g: Granularity) => void }) {
  return (
    <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs">
      {GRANULARITIES.map((g) => (
        <button
          key={g.key}
          type="button"
          onClick={() => onChange(g.key)}
          className={`px-2.5 py-1 font-medium transition-colors ${
            value === g.key
              ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
              : "bg-white text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          }`}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-zinc-400">
      No transactions in this period
    </div>
  );
}
