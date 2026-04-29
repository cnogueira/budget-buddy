import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-zinc-400">
                    <span>© {new Date().getFullYear()} Budget Buddy</span>
                    <div className="flex gap-4">
                        <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-zinc-200">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-gray-700 dark:hover:text-zinc-200">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
