'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { useState } from 'react'
import { clearAllCaches } from '@/lib/client-cache'

interface UserMenuProps {
    email: string
}

export default function UserMenu({ email }: UserMenuProps) {
    const router = useRouter()
    const supabase = createClient()
    const [isOpen, setIsOpen] = useState(false)

    const handleSignOut = async () => {
        clearAllCaches()
        await supabase.auth.signOut()
        router.refresh()
    }

    return (
        <div className="relative ml-3">
            <div>
                <button
                    type="button"
                    className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-zinc-950 dark:focus:ring-offset-zinc-950"
                    id="user-menu-button"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="sr-only">Open user menu</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
                        <User className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
                    </div>
                </button>
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div
                        className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-900 dark:ring-zinc-700"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu-button"
                        tabIndex={-1}
                    >
                        <div className="px-4 py-2 text-xs text-gray-500 truncate dark:text-zinc-400">
                            {email}
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            role="menuitem"
                            tabIndex={-1}
                            id="user-menu-item-2"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
