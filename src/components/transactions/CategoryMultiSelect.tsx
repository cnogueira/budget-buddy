"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Category } from "@/types/database";
import { CategoryIcon } from "@/components/CategoryIcon";

interface CategoryMultiSelectProps {
  categories: Category[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function CategoryMultiSelect({ categories, selected, onChange }: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(next);
  }

  const incomeCategories = categories.filter((c) => c.category_type === "income");
  const expenseCategories = categories.filter((c) => c.category_type === "expense");

  const label =
    selected.length === 0
      ? "All categories"
      : `${selected.length} ${selected.length === 1 ? "category" : "categories"}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        <span>{label}</span>
        <ChevronDown className="h-4 w-4 text-zinc-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-56 rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <div className="max-h-72 overflow-y-auto p-2">
            {incomeCategories.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Income
                </p>
                {incomeCategories.map((c) => (
                  <CategoryRow key={c.id} category={c} checked={selected.includes(c.id)} onToggle={() => toggle(c.id)} />
                ))}
              </div>
            )}
            {expenseCategories.length > 0 && (
              <div className={incomeCategories.length > 0 ? "mt-2" : ""}>
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Expense
                </p>
                {expenseCategories.map((c) => (
                  <CategoryRow key={c.id} category={c} checked={selected.includes(c.id)} onToggle={() => toggle(c.id)} />
                ))}
              </div>
            )}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-zinc-100 p-2 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryRow({
  category,
  checked,
  onToggle,
}: {
  category: Category;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-3.5 w-3.5 rounded border-zinc-300 accent-blue-600"
      />
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: category.color }}
      >
        <CategoryIcon name={category.icon} size={12} color="white" />
      </span>
      <span className="text-sm text-zinc-700 dark:text-zinc-300">{category.name}</span>
    </label>
  );
}
