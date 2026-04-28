"use client";

import { useState } from "react";
import { Category } from "@/types/database";
import { deleteCategory } from "@/app/actions/category-actions";
import { Modal } from "./Modal";
import { OTHERS_NAME } from "@/lib/categories/constants";

interface DeleteCategoryDialogProps {
    category: Category;
    transactionCount: number;
    isOpen: boolean;
    onClose: () => void;
}

export function DeleteCategoryDialog({
    category,
    transactionCount,
    isOpen,
    onClose,
}: DeleteCategoryDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        setIsDeleting(true);
        setError(null);
        const result = await deleteCategory(category.id);
        setIsDeleting(false);
        if (result.success) {
            onClose();
        } else {
            setError(result.error ?? "Failed to delete category");
        }
    }

    const hasTransactions = transactionCount > 0;
    const willRename = hasTransactions;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Delete "${category.name}"`}>
            <div className="space-y-4">
                {hasTransactions ? (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        This category has <strong>{transactionCount}</strong>{" "}
                        {transactionCount === 1 ? "transaction" : "transactions"}.{" "}
                        {willRename ? (
                            <>
                                They will be moved to a <strong>&quot;{OTHERS_NAME}&quot;</strong> catch-all category
                                (created or merged into an existing one).
                            </>
                        ) : null}
                    </p>
                ) : (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        This category has no transactions and will be permanently deleted.
                    </p>
                )}

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
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
