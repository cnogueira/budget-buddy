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
        <div className="flex items-center gap-1">
            {links.map(({ label, href }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                        {label}
                    </Link>
                );
            })}
        </div>
    );
}
