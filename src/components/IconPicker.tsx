"use client";

import { CATEGORY_ICONS } from "@/lib/categories/constants";
import { CategoryIcon } from "./CategoryIcon";

interface IconPickerProps {
    value: string;
    onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    return (
        <div className="grid grid-cols-10 gap-1 max-h-40 overflow-y-auto p-1">
            {CATEGORY_ICONS.map((icon) => (
                <button
                    key={icon}
                    type="button"
                    title={icon}
                    onClick={() => onChange(icon)}
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                        value === icon
                            ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                >
                    <CategoryIcon name={icon} size={16} />
                </button>
            ))}
        </div>
    );
}
