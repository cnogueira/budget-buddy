"use client";

import { useState } from "react";
import { importTransactions } from "@/app/actions/import-transactions";
import { Lock, Building2, User, Key, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface ImportTransactionsFormProps {
    onSuccess?: () => void;
}

export function ImportTransactionsForm({ onSuccess }: ImportTransactionsFormProps) {
    const [bank, setBank] = useState("bbva");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        count?: number;
        duplicateCount?: number;
        error?: string;
    } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);

        try {
            const res = await importTransactions(bank, {
                username,
                password
            });

            setResult(res);

            if (res.success) {
                // Clear sensitive data
                setPassword("");
                if (onSuccess) {
                    setTimeout(() => onSuccess(), 2000); // Wait a bit so user sees success message
                }
            }
        } catch (err) {
            setResult({ success: false, error: "An unexpected error occurred." });
        } finally {
            setIsLoading(false);
        }
    }

    if (result?.success) {
        return (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                    Import Successful!
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Successfully imported <span className="font-semibold text-zinc-900 dark:text-zinc-50">{result.count}</span> transactions.
                    {result.duplicateCount && result.duplicateCount > 0 ? (
                        <span className="block mt-1">
                            Skipped {result.duplicateCount} duplicate transactions.
                        </span>
                    ) : null}
                </p>
                <button
                    onClick={() => {
                        setResult(null);
                        // onSuccess might have already closed modal, but if not:
                        if (onSuccess) onSuccess();
                    }}
                    className="mt-4 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                    Close
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Security Notice */}
            <div className="rounded-md bg-blue-50 p-3 flex items-start gap-3 dark:bg-blue-900/20">
                <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                    Your credentials are sent directly to the bank via a secure, ephemeral process. They are never stored on our servers.
                </p>
            </div>

            {/* Bank Selection */}
            <div>
                <label htmlFor="bank" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Bank
                </label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Building2 className="h-4 w-4 text-zinc-400" />
                    </div>
                    <select
                        id="bank"
                        value={bank}
                        onChange={(e) => setBank(e.target.value)}
                        disabled={isLoading}
                        className="block w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500 disabled:opacity-60"
                    >
                        <option value="bbva">BBVA (Spain)</option>
                        <option value="mock">Mock Bank (Test)</option>
                    </select>
                </div>
            </div>

            {/* Username */}
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Username / ID
                </label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-4 w-4 text-zinc-400" />
                    </div>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isLoading}
                        className="block w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 disabled:opacity-60"
                        placeholder="Enter your bank username"
                    />
                </div>
            </div>

            {/* Password */}
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Password
                </label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Key className="h-4 w-4 text-zinc-400" />
                    </div>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="block w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 disabled:opacity-60"
                        placeholder="Enter your bank password"
                    />
                </div>
            </div>

            {/* Error Message */}
            {result?.error && (
                <div className="rounded-md bg-red-50 p-3 flex items-start gap-3 dark:bg-red-900/20 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {result.error}
                    </p>
                </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus:ring-zinc-400 transition-colors"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importing...
                        </>
                    ) : (
                        "Import Transactions"
                    )}
                </button>
            </div>
        </form>
    );
}
