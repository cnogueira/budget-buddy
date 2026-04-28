"use client";

import { Category } from "@/types/database";
import { CategoryIcon } from "./CategoryIcon";

interface CategorySelectorProps {
    categories: Category[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    isLoading?: boolean;
}

export function CategorySelector({
    categories,
    selectedId,
    onSelect,
    isLoading,
}: CategorySelectorProps) {
    if (isLoading) {
        return (
            <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-8 w-20 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full" />
                ))}
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <p className="text-sm text-zinc-500 italic">No categories found. Create one to get started.</p>
        );
    }

    return (
        <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
            {categories.map((cat) => (
                <CategoryPill
                    key={cat.id}
                    category={cat}
                    isSelected={selectedId === cat.id}
                    onClick={() => onSelect(cat.id)}
                />
            ))}
        </div>
    );
}

function CategoryPill({
    category,
    isSelected,
    onClick,
}: {
    category: Category;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group relative flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 border ${
                isSelected
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 scale-105"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
        >
            <CategoryIcon name={category.icon} size={12} style={{ color: isSelected ? undefined : category.color }} />
            {category.name}
            {isSelected && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] text-white ring-2 ring-white dark:bg-zinc-50 dark:text-zinc-900 dark:ring-zinc-950">
                    ✓
                </span>
            )}
        </button>
    );
}
