"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
    { label: "Overview", href: "/overview" },
    { label: "Transactions", href: "/transactions" },
    { label: "Categories", href: "/categories" },
];

export function NavLinks() {
    const pathname = usePathname();

    return (
        <div className="flex h-16 items-stretch gap-1">
            {links.map(({ label, href }) => {
                const isActive = pathname.startsWith(href);
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center px-3 text-sm font-medium transition-colors border-b-2 ${
                            isActive
                                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:border-zinc-600"
                        }`}
                    >
                        {label}
                    </Link>
                );
            })}
        </div>
    );
}
