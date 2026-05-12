"use client";

import { useState, useRef } from "react";
import { importTransactions, approveReview } from "@/app/actions/import-transactions";
import { AiReviewProposal, AiCategoryProposal, AiTransactionProposal, AiRuleProposal } from "@/types/database";
import { useData } from "@/providers/DataProvider";
import { Upload, File as FileIcon, X, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

interface ImportTransactionsFormProps {
    onSuccess?: () => void;
}

interface TxEdit {
    categoryId: string | null;
    newCategory: AiCategoryProposal | null;
}

function collectNewCategories(proposals: AiReviewProposal): AiCategoryProposal[] {
    const seen = new Set<string>();
    const result: AiCategoryProposal[] = [];
    const all = [
        ...proposals.transactions.map(t => t.newCategory),
        ...proposals.rules.map(r => r.newCategory),
    ];
    for (const nc of all) {
        if (!nc) continue;
        const key = `${nc.name}:${nc.category_type}`;
        if (!seen.has(key)) {
            seen.add(key);
            result.push(nc);
        }
    }
    return result;
}

export function ImportTransactionsForm({ onSuccess }: ImportTransactionsFormProps) {
    const { categories, invalidateAndRefetch } = useData();
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        count?: number;
        duplicateCount?: number;
        error?: string;
        pendingReview?: AiReviewProposal;
    } | null>(null);
    const [txEdits, setTxEdits] = useState<Map<string, TxEdit>>(new Map());
    const [dismissedRules, setDismissedRules] = useState<Set<number>>(new Set());

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
        setTxEdits(new Map());
        setDismissedRules(new Set());

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await importTransactions(formData);
            setResult(res);

            if (res.success && !res.pendingReview && onSuccess) {
                setTimeout(() => onSuccess(), 2000);
            }
        } catch {
            setResult({ success: false, error: "An unexpected error occurred." });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleApproveReview() {
        if (!result?.pendingReview) return;
        setIsApproving(true);

        const txsToApprove = result.pendingReview.transactions.map((tx: AiTransactionProposal) => {
            const edit = txEdits.get(tx.transactionId);
            return {
                transactionId: tx.transactionId,
                categoryId: edit ? edit.categoryId : tx.categoryId,
                newCategory: edit ? edit.newCategory : tx.newCategory,
            };
        });

        const rulesToApprove = result.pendingReview.rules
            .filter((_: AiRuleProposal, i: number) => !dismissedRules.has(i));

        await approveReview(txsToApprove, rulesToApprove);
        await invalidateAndRefetch();
        setIsApproving(false);
        if (onSuccess) onSuccess();
    }

    function handleSkipAndClose() {
        if (onSuccess) onSuccess();
    }

    function handleTxCategoryChange(tx: AiTransactionProposal, value: string) {
        const newEdits = new Map(txEdits);
        if (value.startsWith('new:')) {
            const name = value.slice(4);
            const allNew = result?.pendingReview ? collectNewCategories(result.pendingReview) : [];
            const nc = allNew.find(c => c.name === name) ?? null;
            newEdits.set(tx.transactionId, { categoryId: null, newCategory: nc });
        } else {
            newEdits.set(tx.transactionId, { categoryId: value || null, newCategory: null });
        }
        setTxEdits(newEdits);
    }

    function getSelectValue(tx: AiTransactionProposal): string {
        const edit = txEdits.get(tx.transactionId);
        const catId = edit ? edit.categoryId : tx.categoryId;
        const newCat = edit ? edit.newCategory : tx.newCategory;
        if (catId) return catId;
        if (newCat) return `new:${newCat.name}`;
        return '';
    }

    if (result?.success) {
        const review = result.pendingReview;
        const aiNewCategories = review ? collectNewCategories(review) : [];

        return (
            <div className="flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Success header */}
                <div className="flex flex-col items-center justify-center p-4 text-center space-y-3">
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
                </div>

                {/* Review panel */}
                {review && (
                    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
                            <Sparkles className="h-4 w-4 text-violet-500" />
                            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">AI Categorization Review</span>
                        </div>

                        {/* Uncategorized transactions */}
                        {review.transactions.length > 0 && (
                            <div className="p-3 space-y-1">
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                                    Uncategorized transactions ({review.transactions.length})
                                </p>
                                {review.transactions.map((tx: AiTransactionProposal) => {
                                    const expenseCategories = categories.filter(c => c.category_type === tx.type);
                                    return (
                                        <div key={tx.transactionId} className="flex items-center gap-2 py-1.5">
                                            <span className="flex-1 text-xs text-zinc-700 dark:text-zinc-300 truncate min-w-0" title={tx.description}>
                                                {tx.description}
                                            </span>
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                                                €{tx.amount.toFixed(2)}
                                            </span>
                                            <select
                                                value={getSelectValue(tx)}
                                                onChange={e => handleTxCategoryChange(tx, e.target.value)}
                                                className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shrink-0 max-w-[140px]"
                                            >
                                                <option value="">Uncategorized</option>
                                                <optgroup label="Categories">
                                                    {expenseCategories.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </optgroup>
                                                {aiNewCategories.filter(nc => nc.category_type === tx.type).length > 0 && (
                                                    <optgroup label="AI-suggested (new)">
                                                        {aiNewCategories
                                                            .filter(nc => nc.category_type === tx.type)
                                                            .map(nc => (
                                                                <option key={nc.name} value={`new:${nc.name}`}>{nc.name}</option>
                                                            ))}
                                                    </optgroup>
                                                )}
                                            </select>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* New rules */}
                        {review.rules.length > 0 && (
                            <div className={`p-3 space-y-1 ${review.transactions.length > 0 ? 'border-t border-zinc-200 dark:border-zinc-700' : ''}`}>
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                                    New rules to add ({review.rules.filter((_: AiRuleProposal, i: number) => !dismissedRules.has(i)).length}/{review.rules.length})
                                </p>
                                {review.rules.map((rule: AiRuleProposal, i: number) => {
                                    const catName = rule.categoryId
                                        ? (categories.find(c => c.id === rule.categoryId)?.name ?? '?')
                                        : (rule.newCategory?.name ?? '?');
                                    const isDismissed = dismissedRules.has(i);
                                    return (
                                        <div key={i} className={`flex items-center gap-2 py-1 ${isDismissed ? 'opacity-40' : ''}`}>
                                            <code className="flex-1 text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400 truncate min-w-0">
                                                {rule.match_type === 'CONTAINS' ? 'contains' : '='} &quot;{rule.match_pattern}&quot;
                                            </code>
                                            <span className="text-xs text-zinc-400 shrink-0">→</span>
                                            <span className="text-xs text-zinc-600 dark:text-zinc-300 shrink-0">
                                                {catName}{rule.newCategory ? ' (new)' : ''}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const next = new Set(dismissedRules);
                                                    if (isDismissed) next.delete(i); else next.add(i);
                                                    setDismissedRules(next);
                                                }}
                                                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0 underline"
                                            >
                                                {isDismissed ? 'restore' : 'dismiss'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 px-3 pb-3 pt-1">
                            <button
                                type="button"
                                onClick={handleApproveReview}
                                disabled={isApproving}
                                className="flex-1 inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
                            >
                                {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve & Apply'}
                            </button>
                            <button
                                type="button"
                                onClick={handleSkipAndClose}
                                disabled={isApproving}
                                className="px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                            >
                                Skip & Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Close button when no review */}
                {!review && (
                    <button
                        onClick={() => {
                            setResult(null);
                            setFile(null);
                            if (onSuccess) onSuccess();
                        }}
                        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                        Close
                    </button>
                )}
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
