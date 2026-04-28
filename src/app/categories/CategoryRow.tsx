"use client";

import { useState } from "react";
import { Category } from "@/types/database";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CategoryForm } from "@/components/CategoryForm";
import { DeleteCategoryDialog } from "@/components/DeleteCategoryDialog";
import { MergeCategoryDialog } from "@/components/MergeCategoryDialog";
import { Modal } from "@/components/Modal";
import { updateCategory } from "@/app/actions/category-actions";
import { Pencil, Trash2, GitMerge } from "lucide-react";

interface CategoryRowProps {
    category: Category;
    transactionCount: number;
    sameTypePeers: Category[];
}

export function CategoryRow({ category, transactionCount, sameTypePeers }: CategoryRowProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [mergeOpen, setMergeOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    async function handleEdit(data: { name: string; category_type: "income" | "expense"; color: string; icon: string }) {
        setIsSubmitting(true);
        setEditError(null);
        const result = await updateCategory(category.id, { name: data.name, color: data.color, icon: data.icon });
        setIsSubmitting(false);
        if (result.success) {
            setEditOpen(false);
        } else {
            setEditError(result.error ?? "Failed to update category");
        }
    }

    return (
        <div className="flex items-center gap-3 py-3 px-4 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <span
                className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
            >
                <CategoryIcon name={category.icon} size={16} color="white" />
            </span>

            <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {category.name}
            </span>

            <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {transactionCount} {transactionCount === 1 ? "transaction" : "transactions"}
            </span>

            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    title="Edit"
                    className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                    <Pencil size={14} />
                </button>
                {sameTypePeers.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setMergeOpen(true)}
                        title="Merge"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <GitMerge size={14} />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    title="Delete"
                    className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={`Edit "${category.name}"`}>
                <CategoryForm
                    mode="edit"
                    initial={category}
                    onSubmit={handleEdit}
                    onCancel={() => setEditOpen(false)}
                    isSubmitting={isSubmitting}
                    error={editError}
                />
            </Modal>

            <DeleteCategoryDialog
                category={category}
                transactionCount={transactionCount}
                isOpen={deleteOpen}
                onClose={() => setDeleteOpen(false)}
            />

            <MergeCategoryDialog
                source={category}
                candidates={sameTypePeers}
                isOpen={mergeOpen}
                onClose={() => setMergeOpen(false)}
            />
        </div>
    );
}
