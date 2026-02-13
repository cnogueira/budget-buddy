"use client";

import { addTransaction } from "@/app/actions/transaction-actions";
import { getCategoriesByType, createCategory } from "@/app/actions/category-actions";
import { TransactionType, Category } from "@/types/database";
import { useState, useEffect } from "react";

interface AddTransactionFormProps {
  onSuccess?: () => void;
}

export function AddTransactionForm({ onSuccess }: AddTransactionFormProps) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch categories when type changes
  useEffect(() => {
    async function loadCategories() {
      setIsLoadingCategories(true);
      const result = await getCategoriesByType(type);
      if (result.success && result.data) {
        setCategories(result.data);
        // Reset category selection when type changes
        setCategoryId("");
        setIsCreatingCategory(false);
        setNewCategoryName("");
      }
      setIsLoadingCategories(false);
    }
    loadCategories();
  }, [type]);

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      setMessage({ type: "error", text: "Please enter a category name" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsSubmitting(true);
    const result = await createCategory({
      name: newCategoryName.trim(),
      category_type: type,
      color: "", // Server will assign color
    });

    setIsSubmitting(false);

    if (result.success && result.data) {
      // Add new category to list and select it
      setCategories([...categories, result.data]);
      setCategoryId(result.data.id);
      setIsCreatingCategory(false);
      setNewCategoryName("");
      setMessage({ type: "success", text: "Category created!" });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: "error", text: result.error || "Failed to create category" });
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // If creating a new category, create it first
    if (isCreatingCategory && newCategoryName.trim()) {
      await handleCreateCategory();
      // Don't submit transaction yet, let user confirm category was created
      setIsSubmitting(false);
      return;
    }

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
      // Reset form
      setAmount("");
      setCategoryId("");
      setDescription("");
      setDate(getTodayDate());

      // Notify parent of success
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500); // Small delay to show success message
      }
    } else {
      setMessage({ type: "error", text: result.error || "Failed to add transaction" });
    }

    // Clear message after 3 seconds
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
                className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-md shadow-sm transition-all duration-300 ease-in-out ${type === 'expense'
                    ? 'translate-x-0 bg-red-500 dark:bg-red-600'
                    : 'translate-x-full bg-emerald-500 dark:bg-emerald-600'
                  }`}
              />
              <label
                className={`relative flex items-center justify-center py-2 text-sm font-bold cursor-pointer transition-colors duration-300 z-10 ${type === 'expense' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
              >
                <input
                  type="radio"
                  name="transactionType"
                  value="expense"
                  checked={type === 'expense'}
                  onChange={() => setType('expense')}
                  className="sr-only"
                />
                Expense
              </label>
              <label
                className={`relative flex items-center justify-center py-2 text-sm font-bold cursor-pointer transition-colors duration-300 z-10 ${type === 'income' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
              >
                <input
                  type="radio"
                  name="transactionType"
                  value="income"
                  checked={type === 'income'}
                  onChange={() => setType('income')}
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

            {isLoadingCategories ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full" />
                ))}
              </div>
            ) : isCreatingCategory ? (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <input
                  type="text"
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500"
                  placeholder="Enter new category name"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={isSubmitting || !newCategoryName.trim()}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setNewCategoryName("");
                  }}
                  className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`group relative flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${categoryId === cat.id
                        ? "ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-50 dark:ring-offset-zinc-950 scale-105"
                        : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                        }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                      {categoryId === cat.id && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] text-white ring-2 ring-white dark:bg-zinc-50 dark:text-zinc-900 dark:ring-zinc-950">
                          ✓
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500 italic">No categories found. Create one to get started.</p>
                )}
              </div>
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

          {/* Success/Error Message */}
          {message && (
            <div
              className={`text-sm font-medium ${message.type === "success"
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

