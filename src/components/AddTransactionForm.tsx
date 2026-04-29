"use client";

import { addTransaction } from "@/app/actions/transaction-actions";
import { getCategories, createCategory } from "@/app/actions/category-actions";
import { TransactionType, Category } from "@/types/database";
import { useState, useEffect } from "react";
import { CategorySelector } from "./CategorySelector";
import { CategoryForm } from "./CategoryForm";

interface AddTransactionFormProps {
  onSuccess?: () => void;
}

export function AddTransactionForm({ onSuccess }: AddTransactionFormProps) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingSubmitting, setIsCreatingSubmitting] = useState(false);

  // Filter categories locally based on the selected type
  const categories = allCategories.filter((cat) => cat.category_type === type);

  // Fetch all categories once when the form mounts
  useEffect(() => {
    async function loadCategories() {
      setIsLoadingCategories(true);
      const result = await getCategories();
      if (result.success && result.data) {
        setAllCategories(result.data);
      }
      setIsLoadingCategories(false);
    }
    loadCategories();
  }, []);

  async function handleCreateCategory(data: {
    name: string;
    category_type: TransactionType;
    color: string;
    icon: string;
  }) {
    setIsCreatingSubmitting(true);
    setCreateError(null);
    const result = await createCategory(data);
    setIsCreatingSubmitting(false);

    if (result.success && result.data) {
      setAllCategories([...allCategories, result.data]);
      setCategoryId(result.data.id);
      setIsCreatingCategory(false);
    } else {
      setCreateError(result.error ?? "Failed to create category");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!categoryId) {
      setMessage({ type: "error", text: "Please select or create a category" });
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const result = await addTransaction({
      amount: Number.parseFloat(amount),
      type,
      category_id: categoryId,
      description: description || undefined,
      date,
    });

    setIsSubmitting(false);

    if (result.success) {
      setMessage({ type: "success", text: "Transaction added successfully!" });
      setAmount("");
      setCategoryId("");
      setDescription("");
      setDate(getTodayDate());

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } else {
      setMessage({ type: "error", text: result.error || "Failed to add transaction" });
    }

    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="bg-white dark:bg-zinc-950">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Amount
            </label>
            <input
              type="number"
              id="amount"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500"
              placeholder="0.00"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Type
            </label>
            <div className="mt-1 grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg relative">
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
                  name="transactionType"
                  value="expense"
                  checked={type === "expense"}
                  onChange={() => {
                    setType("expense");
                    setCategoryId("");
                    setIsCreatingCategory(false);
                  }}
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
                  name="transactionType"
                  value="income"
                  checked={type === "income"}
                  onChange={() => {
                    setType("income");
                    setCategoryId("");
                    setIsCreatingCategory(false);
                  }}
                  className="sr-only"
                />
                Income
              </label>
            </div>
          </div>

          {/* Category */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Category
              </label>
              {!isCreatingCategory && (
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
                >
                  <span className="text-lg leading-none">+</span> New Category
                </button>
              )}
            </div>

            {isCreatingCategory ? (
              <CategoryForm
                mode="create"
                lockedType={type}
                onSubmit={handleCreateCategory}
                onCancel={() => {
                  setIsCreatingCategory(false);
                  setCreateError(null);
                }}
                isSubmitting={isCreatingSubmitting}
                error={createError}
              />
            ) : (
              <CategorySelector
                categories={categories}
                selectedId={categoryId}
                onSelect={(id: string) => setCategoryId(id)}
                isLoading={isLoadingCategories}
              />
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Date
            </label>
            <input
              type="date"
              id="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description (Optional)
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500"
            placeholder="Add notes about this transaction"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus:ring-zinc-400"
          >
            {isSubmitting ? "Adding..." : "Add Transaction"}
          </button>

          {message && (
            <div
              className={`text-sm font-medium ${
                message.type === "success"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
