import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>© {new Date().getFullYear()} Budget Buddy</span>
                    <Link href="/privacy" className="hover:text-gray-700">
                        Privacy Policy
                    </Link>
                </div>
            </div>
        </footer>
    )
}
