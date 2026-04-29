"use client";

import { CATEGORY_COLORS } from "@/lib/categories/constants";
import { Check } from "lucide-react";

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((color) => (
                <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => onChange(color)}
                    className="w-7 h-7 rounded-full flex items-center justify-center ring-offset-2 transition-all hover:scale-110"
                    style={{
                        backgroundColor: color,
                        boxShadow: value === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : undefined,
                    }}
                >
                    {value === color && <Check size={12} color="white" strokeWidth={3} />}
                </button>
            ))}
        </div>
    );
}
