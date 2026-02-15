"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Modal } from "./Modal";
import { ImportTransactionsForm } from "./ImportTransactionsForm";

export function ImportTransactionsButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-colors"
                title="Import transactions from bank"
            >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Import</span>
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Import Transactions"
            >
                <ImportTransactionsForm onSuccess={() => setIsOpen(false)} />
            </Modal>
        </>
    );
}
