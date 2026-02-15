"use client";

import { useState, useRef } from "react";
import { Category } from "@/types/database";
import { updateTransactionCategory } from "@/app/actions/learning-actions";
import { Check, ChevronDown, Loader2 } from "lucide-react";

interface CategoryPickerProps {
    transactionId: string;
    currentCategoryId: string | null;
    currentCategoryName: string;
    currentCategoryColor: string;
    categories: Category[];
}

export function CategoryPicker({
    transactionId,
    currentCategoryId,
    currentCategoryName,
    currentCategoryColor,
    categories
}: CategoryPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    async function handleSelect(categoryId: string) {
        if (categoryId === currentCategoryId) {
            setIsOpen(false);
            return;
        }

        setIsUpdating(true);
        const result = await updateTransactionCategory(transactionId, categoryId);
        setIsUpdating(false);
        setIsOpen(false);

        if (!result.success) {
            alert(result.error || "Failed to update category");
        }
    }

    const toggleDropdown = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            // Dropdown has max-h-60 (240px) + some margin
            setOpenUpward(spaceBelow < 260);
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative inline-block text-left">
            <button
                ref={buttonRef}
                type="button"
                onClick={toggleDropdown}
                className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${isUpdating ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                    }`}
                style={{ backgroundColor: currentCategoryColor, color: '#fff' }}
                disabled={isUpdating}
            >
                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                {currentCategoryName}
                <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-20"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className={`absolute left-0 w-48 rounded-md bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-900 dark:ring-zinc-800 z-30 max-h-60 overflow-y-auto ${openUpward ? "bottom-full mb-2 origin-bottom-left" : "top-full mt-2 origin-top-left"
                        }`}>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleSelect(cat.id)}
                                className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: cat.color }}
                                />
                                <span className="flex-1 text-left">{cat.name}</span>
                                {cat.id === currentCategoryId && (
                                    <Check className="h-3 w-3 text-zinc-500" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
