"use client";

import { deleteTransaction } from "@/app/actions/transaction-actions";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useData } from "@/providers/DataProvider";

interface DeleteTransactionButtonProps {
  readonly id: string;
}

export function DeleteTransactionButton({ id }: DeleteTransactionButtonProps) {
  const { applyTransaction } = useData();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = globalThis.confirm(
      "Are you sure you want to delete this transaction? This action cannot be undone."
    );

    if (!confirmed) return;

    setIsDeleting(true);

    const result = await deleteTransaction(id);

    if (result.success) {
      applyTransaction({ op: "delete", id });
    } else {
      alert(`Failed to delete transaction: ${result.error}`);
    }
    setIsDeleting(false);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-red-400"
      title="Delete transaction"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}


