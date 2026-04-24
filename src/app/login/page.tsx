'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [message, setMessage] = useState<string | null>(null)
    const [showEmailForm, setShowEmailForm] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true)
        setError(null)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${location.origin}/auth/callback` },
        })
        if (error) {
            setError(error.message)
            setIsGoogleLoading(false)
        }
    }

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setMessage(null)

        try {
            if (mode === 'signin') {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                router.push('/')
                router.refresh()
            } else {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { emailRedirectTo: `${location.origin}/auth/callback` },
                })
                if (error) throw error

                if (data.session) {
                    router.push('/')
                    router.refresh()
                    return
                }

                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    setError('This email is already registered. Please sign in instead.')
                    return
                }

                setMessage('Check your email for the confirmation link.')
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-6">
                <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                    Sign in to Budget Buddy
                </h2>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                >
                    {isGoogleLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                    )}
                    Continue with Google
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-gray-50 px-2 text-gray-500">or</span>
                    </div>
                </div>

                <button
                    onClick={() => setShowEmailForm(!showEmailForm)}
                    className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <span>Sign in with email</span>
                    <span className="text-gray-400">{showEmailForm ? '▲' : '▾'}</span>
                </button>

                {showEmailForm && (
                    <form className="space-y-4" onSubmit={handleEmailAuth}>
                        <div className="-space-y-px rounded-md shadow-sm">
                            <div>
                                <label htmlFor="email" className="sr-only">Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        )}

                        {message && (
                            <div className="rounded-md bg-green-50 p-4">
                                <p className="text-sm font-medium text-green-800">{message}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'signin' ? 'Sign in' : 'Sign up'}
                        </button>

                        <p className="text-center text-sm text-gray-600">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode(mode === 'signin' ? 'signup' : 'signin')
                                    setError(null)
                                    setMessage(null)
                                    setEmail('')
                                    setPassword('')
                                }}
                                className="font-medium text-blue-600 hover:text-blue-500"
                            >
                                {mode === 'signin' ? 'Or sign up instead' : 'Or sign in instead'}
                            </button>
                        </p>
                    </form>
                )}
            </div>
        </div>
    )
}
