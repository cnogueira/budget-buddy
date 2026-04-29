"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
    { label: "Dashboard", href: "/" },
    { label: "Transactions", href: "/transactions" },
    { label: "Categories", href: "/categories" },
];

export function NavLinks() {
    const pathname = usePathname();

    return (
        <div className="flex h-16 items-stretch gap-1">
            {links.map(({ label, href }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center px-3 text-sm font-medium transition-colors border-b-2 ${
                            isActive
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                        }`}
                    >
                        {label}
                    </Link>
                );
            })}
        </div>
    );
}
