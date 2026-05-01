"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, PieLabelRenderProps } from "recharts";
import { OverviewCategoryItem, TransactionType } from "@/types/database";
import { CategoryIcon } from "@/components/CategoryIcon";
import { formatDateRange } from "@/lib/format";

interface PeriodCategoryWidgetProps {
  type: TransactionType;
  categoryBreakdown: OverviewCategoryItem[];
  from: string;
  to: string;
}

const RADIAN = Math.PI / 180;
const ICON_R = 13;

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
    icon: c.icon,
  }));

  // Renders a circular icon badge + percentage at the outer edge of each slice.
  function renderIconLabel(props: PieLabelRenderProps) {
    const cx = Number(props.cx ?? 0);
    const cy = Number(props.cy ?? 0);
    const midAngle = Number(props.midAngle ?? 0);
    const outerRadius = Number(props.outerRadius ?? 0);
    const index = Number(props.index ?? 0);
    const percent = Number(props.percent ?? 0);
    const entry = pieData[index];
    if (!entry) return null;

    const angle = -midAngle * RADIAN;
    const iconRadius = outerRadius + ICON_R + 6;
    const x = cx + iconRadius * Math.cos(angle);
    const y = cy + iconRadius * Math.sin(angle);

    // Percentage text placed further along the same radial line
    const pctRadius = iconRadius + ICON_R + 9;
    const pctX = cx + pctRadius * Math.cos(angle);
    const pctY = cy + pctRadius * Math.sin(angle);
    const pct = (percent * 100).toFixed(1) + "%";

    return (
      <g key={`icon-label-${index}`}>
        <circle cx={x} cy={y} r={ICON_R} fill={entry.color} />
        <foreignObject
          x={x - ICON_R}
          y={y - ICON_R}
          width={ICON_R * 2}
          height={ICON_R * 2}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}
          >
            <CategoryIcon name={entry.icon} size={13} color="white" />
          </div>
        </foreignObject>
        <text
          x={pctX}
          y={pctY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fontWeight={600}
          fill="#71717a"
        >
          {pct}
        </text>
      </g>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        <p className="text-xs text-zinc-400">{formatDateRange(from, to)}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-zinc-400">
          No {type} transactions in this period
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={70}
                dataKey="value"
                stroke="none"
                label={renderIconLabel}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, name) => [`${Number(v).toFixed(2)} €`, String(name)]}
                contentStyle={{ fontSize: 12, border: "none", borderRadius: "8px" }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-2 flex flex-col gap-2 max-h-48 overflow-y-auto">
            {items.map((c) => {
              const pct = total > 0 ? ((c.total / total) * 100).toFixed(1) : "0.0";
              return (
                <div key={c.categoryId ?? c.name} className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: c.color ?? "#a1a1aa" }}
                  >
                    <CategoryIcon name={c.icon} size={12} color="white" />
                  </span>
                  <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">{c.name}</span>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {c.count} {c.count === 1 ? "tx" : "txs"}
                  </span>
                  <span className={`text-sm font-medium shrink-0 ${amountColor}`}>
                    {sign}{c.total.toFixed(2)} €
                  </span>
                  <span className="text-xs text-zinc-400 w-10 text-right shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
