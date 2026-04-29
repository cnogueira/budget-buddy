import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import UserMenu from './UserMenu'
import { NavLinks } from './NavLinks'
import { Wallet } from 'lucide-react'

export default async function Navbar() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    return (
        <nav className="border-b border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
                            <Wallet className="h-8 w-8 text-blue-600" />
                            <span className="text-xl font-bold text-gray-900 dark:text-zinc-50">Budget Buddy</span>
                        </Link>
                        {user && <NavLinks />}
                    </div>
                    <div className="flex items-center">
                        {user ? (
                            <UserMenu email={user.email || ''} />
                        ) : (
                            <Link
                                href="/login"
                                className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 dark:text-zinc-50 dark:hover:text-blue-400"
                            >
                                Log in <span aria-hidden="true">&rarr;</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
