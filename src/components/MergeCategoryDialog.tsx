"use client";

import { useState } from "react";
import { Category } from "@/types/database";
import { mergeCategories } from "@/app/actions/category-actions";
import { Modal } from "./Modal";

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

                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Merge into
                    </label>
                    <select
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
                    >
                        <option value="">Select a category…</option>
                        {candidates.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
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
