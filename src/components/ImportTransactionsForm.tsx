"use client";

import { useState, useRef } from "react";
import { importTransactions } from "@/app/actions/import-transactions";
import { Upload, File as FileIcon, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface ImportTransactionsFormProps {
    onSuccess?: () => void;
}

export function ImportTransactionsForm({ onSuccess }: ImportTransactionsFormProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        count?: number;
        duplicateCount?: number;
        error?: string;
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(true);
    }

    function handleDragLeave(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setResult(null);
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) return;

        setIsLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await importTransactions(formData);
            setResult(res);

            if (res.success) {
                if (onSuccess) {
                    setTimeout(() => onSuccess(), 2000);
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
                        setFile(null);
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
            <div
                className={`relateive flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 transition-colors ${isDragging
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                        : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
                    } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileChange}
                />

                {!file ? (
                    <div
                        className="flex flex-col items-center justify-center cursor-pointer text-center"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="h-8 w-8 text-zinc-400 mb-2" />
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Supported formats: CSV, Excel (.xlsx, .xls)
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                            Works with BBVA Export Format
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center w-full">
                        <div className="flex items-center gap-3 w-full p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md">
                            <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center shrink-0">
                                <FileIcon className="h-5 w-5 text-zinc-500" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                    {file.name}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                disabled={isLoading}
                                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <X className="h-4 w-4 text-zinc-500" />
                            </button>
                        </div>
                    </div>
                )}
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

            <button
                type="submit"
                disabled={!file || isLoading}
                className="w-full inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus:ring-zinc-400 transition-colors"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing File...
                    </>
                ) : (
                    "Import Transactions"
                )}
            </button>
        </form>
    );
}
