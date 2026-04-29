"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { OverviewCategoryItem, TransactionType } from "@/types/database";
import { CategoryIcon } from "@/components/CategoryIcon";

interface PeriodCategoryWidgetProps {
  type: TransactionType;
  categoryBreakdown: OverviewCategoryItem[];
  from: string;
  to: string;
}

export function PeriodCategoryWidget({ type, categoryBreakdown, from, to }: PeriodCategoryWidgetProps) {
  const items = categoryBreakdown.filter((c) => c.type === type).sort((a, b) => b.total - a.total);
  const total = items.reduce((s, c) => s + c.total, 0);
  const title = type === "income" ? "Period Income" : "Period Expenses";
  const amountColor = type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  const sign = type === "income" ? "+" : "-";

  const pieData = items.map((c) => ({
    name: c.name,
    value: c.total,
    color: c.color ?? "#a1a1aa",
  }));

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        <p className="text-xs text-zinc-400">{from} – {to}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-zinc-400">
          No {type} transactions in this period
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={2}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, name) => [`${Number(v).toFixed(2)} €`, String(name)]}
                contentStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 flex flex-col gap-2 max-h-48 overflow-y-auto">
            {items.map((c) => {
              const pct = total > 0 ? ((c.total / total) * 100).toFixed(1) : "0.0";
              return (
                <div key={c.categoryId ?? c.name} className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: c.color ?? "#a1a1aa" }}
                  >
                    <CategoryIcon name={c.icon} size={14} color="white" />
                  </span>
                  <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">{c.name}</span>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {c.count} {c.count === 1 ? "transaction" : "transactions"}
                  </span>
                  <span className={`text-sm font-medium shrink-0 ${amountColor}`}>
                    {sign}{c.total.toFixed(2)} €
                  </span>
                  <span className="text-xs text-zinc-400 w-12 text-right shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
