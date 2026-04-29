"use client";

import { useState } from "react";
import { createCategory } from "@/app/actions/category-actions";
import { CategoryForm } from "@/components/CategoryForm";
import { Modal } from "@/components/Modal";
import { Plus } from "lucide-react";
import { TransactionType } from "@/types/database";

export function NewCategoryButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(data: { name: string; category_type: TransactionType; color: string; icon: string }) {
        setIsSubmitting(true);
        setError(null);
        const result = await createCategory(data);
        setIsSubmitting(false);
        if (result.success) {
            setIsOpen(false);
        } else {
            setError(result.error ?? "Failed to create category");
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
            >
                <Plus size={16} />
                New Category
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Category">
                <CategoryForm
                    mode="create"
                    onSubmit={handleSubmit}
                    onCancel={() => setIsOpen(false)}
                    isSubmitting={isSubmitting}
                    error={error}
                />
            </Modal>
        </>
    );
}
