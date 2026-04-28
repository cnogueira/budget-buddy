"use client";

import { useState } from "react";
import { Category } from "@/types/database";
import { mergeCategories } from "@/app/actions/category-actions";
import { Modal } from "./Modal";
import { CategoryIcon } from "./CategoryIcon";

interface MergeCategoryDialogProps {
    source: Category;
    candidates: Category[]; // same-type categories, excluding source
    isOpen: boolean;
    onClose: () => void;
}

export function MergeCategoryDialog({
    source,
    candidates,
    isOpen,
    onClose,
}: MergeCategoryDialogProps) {
    const [targetId, setTargetId] = useState<string>("");
    const [isMerging, setIsMerging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleMerge() {
        if (!targetId) return;
        setIsMerging(true);
        setError(null);
        const result = await mergeCategories(source.id, targetId);
        setIsMerging(false);
        if (result.success) {
            onClose();
        } else {
            setError(result.error ?? "Failed to merge categories");
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Merge "${source.name}" into…`}>
            <div className="space-y-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    All transactions and rules from <strong>&quot;{source.name}&quot;</strong> will move to
                    the selected category. <strong>&quot;{source.name}&quot;</strong> will then be deleted.
                </p>

                <div className="space-y-1 max-h-56 overflow-y-auto">
                    {candidates.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setTargetId(cat.id)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                                targetId === cat.id
                                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                            }`}
                        >
                            <span
                                className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
                                style={{ backgroundColor: cat.color }}
                            >
                                <CategoryIcon name={cat.icon} size={14} color="white" />
                            </span>
                            <span className="flex-1 text-left font-medium">{cat.name}</span>
                            {targetId === cat.id && (
                                <span className="text-xs opacity-75">selected</span>
                            )}
                        </button>
                    ))}
                </div>

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleMerge}
                        disabled={isMerging || !targetId}
                        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                    >
                        {isMerging ? "Merging..." : "Merge"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
