"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "./Modal";
import { AddTransactionForm } from "./AddTransactionForm";

export function AddTransactionButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
                <Plus className="h-4 w-4" />
                Add Transaction
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Add Transaction"
            >
                <AddTransactionForm onSuccess={() => setIsOpen(false)} />
            </Modal>
        </>
    );
}
