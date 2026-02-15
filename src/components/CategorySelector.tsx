"use client";

import { useMemo } from "react";
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
    isLoading
}: CategorySelectorProps) {

    const hierarchicalCategories = useMemo(() => {
        // 1. Separate parents and children
        const parents = categories.filter(c => !c.parent_id);
        const childrenByParent = new Map<string, Category[]>();

        categories.forEach(c => {
            if (c.parent_id) {
                const group = childrenByParent.get(c.parent_id) || [];
                group.push(c);
                childrenByParent.set(c.parent_id, group);
            }
        });

        return parents.map(p => ({
            ...p,
            children: childrenByParent.get(p.id) || []
        }));
    }, [categories]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {hierarchicalCategories.length > 0 ? (
                hierarchicalCategories.map((parent) => (
                    <div key={parent.id} className="space-y-2">
                        {/* Parent Header */}
                        <div className="flex items-center gap-2 px-1">
                            <CategoryIcon name={parent.icon} size={14} className="text-zinc-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                                {parent.name}
                            </span>
                        </div>

                        {/* Combined List including Parent (if it can be selected) and Children */}
                        <div className="flex flex-wrap gap-2">
                            {/* Option to select the parent itself if desired, or just show children */}
                            <CategoryPill
                                category={parent}
                                isSelected={selectedId === parent.id}
                                onClick={() => onSelect(parent.id)}
                            />

                            {parent.children.map((child) => (
                                <CategoryPill
                                    key={child.id}
                                    category={child}
                                    isSelected={selectedId === child.id}
                                    onClick={() => onSelect(child.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-zinc-500 italic">No categories found. Create one to get started.</p>
            )}
        </div>
    );
}

function CategoryPill({
    category,
    isSelected,
    onClick
}: {
    category: Category;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group relative flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 border ${isSelected
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 scale-105"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
        >
            <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: category.color }}
            />
            {category.name}
            {isSelected && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] text-white ring-2 ring-white dark:bg-zinc-50 dark:text-zinc-900 dark:ring-zinc-950">
                    ✓
                </span>
            )}
        </button>
    );
}
