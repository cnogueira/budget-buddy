"use client";

import { useState } from "react";
import { Category, TransactionType } from "@/types/database";
import { DEFAULT_NEW_CATEGORY_COLOR, DEFAULT_NEW_CATEGORY_ICON } from "@/lib/categories/constants";
import { IconPicker } from "./IconPicker";
import { ColorPicker } from "./ColorPicker";

interface CategoryFormProps {
    mode: "create" | "edit";
    initial?: Category;
    lockedType?: TransactionType;
    onSubmit: (data: { name: string; category_type: TransactionType; color: string; icon: string }) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
    error?: string | null;
}

export function CategoryForm({
    mode,
    initial,
    lockedType,
    onSubmit,
    onCancel,
    isSubmitting,
    error,
}: CategoryFormProps) {
    const [name, setName] = useState(initial?.name ?? "");
    const [type, setType] = useState<TransactionType>(
        lockedType ?? initial?.category_type ?? "expense"
    );
    const [color, setColor] = useState(initial?.color ?? DEFAULT_NEW_CATEGORY_COLOR);
    const [icon, setIcon] = useState(initial?.icon ?? DEFAULT_NEW_CATEGORY_ICON);

    const effectiveType = lockedType ?? type;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        await onSubmit({ name, category_type: effectiveType, color, icon });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Name
                </label>
                <input
                    type="text"
                    autoFocus
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500"
                    placeholder="Category name"
                />
            </div>

            {mode === "create" && !lockedType && (
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Type
                    </label>
                    <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg relative">
                        <div
                            className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-md shadow-sm transition-all duration-300 ease-in-out ${
                                type === "expense"
                                    ? "translate-x-0 bg-red-500 dark:bg-red-600"
                                    : "translate-x-full bg-emerald-500 dark:bg-emerald-600"
                            }`}
                        />
                        <label
                            className={`relative flex items-center justify-center py-2 text-sm font-bold cursor-pointer transition-colors duration-300 z-10 ${
                                type === "expense" ? "text-white" : "text-zinc-500 dark:text-zinc-400"
                            }`}
                        >
                            <input
                                type="radio"
                                name="categoryType"
                                value="expense"
                                checked={type === "expense"}
                                onChange={() => setType("expense")}
                                className="sr-only"
                            />
                            Expense
                        </label>
                        <label
                            className={`relative flex items-center justify-center py-2 text-sm font-bold cursor-pointer transition-colors duration-300 z-10 ${
                                type === "income" ? "text-white" : "text-zinc-500 dark:text-zinc-400"
                            }`}
                        >
                            <input
                                type="radio"
                                name="categoryType"
                                value="income"
                                checked={type === "income"}
                                onChange={() => setType("income")}
                                className="sr-only"
                            />
                            Income
                        </label>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Icon
                </label>
                <IconPicker value={icon} onChange={setIcon} />
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Color
                </label>
                <ColorPicker value={color} onChange={setColor} />
            </div>

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !name.trim()}
                    className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
                </button>
            </div>
        </form>
    );
}
