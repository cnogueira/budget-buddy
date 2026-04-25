"use client";

import { useState } from "react";
import { seedFakeTransactions, wipeUserData } from "@/app/actions/debug-actions";

type Status = { type: "idle" } | { type: "loading" } | { type: "success"; message: string } | { type: "error"; message: string };

export function DebugPane() {
  const [expanded, setExpanded] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function handleSeed() {
    setStatus({ type: "loading" });
    setWipeConfirm(false);
    const result = await seedFakeTransactions();
    if (result.success) {
      setStatus({ type: "success", message: result.message ?? "Done" });
    } else {
      setStatus({ type: "error", message: result.error ?? "Unknown error" });
    }
  }

  async function handleWipe() {
    if (!wipeConfirm) {
      setWipeConfirm(true);
      return;
    }
    setStatus({ type: "loading" });
    setWipeConfirm(false);
    const result = await wipeUserData();
    if (result.success) {
      setStatus({ type: "success", message: result.message ?? "Done" });
    } else {
      setStatus({ type: "error", message: result.error ?? "Unknown error" });
    }
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-zinc-800 px-3 py-1 text-xs font-mono text-zinc-200 shadow-lg hover:bg-zinc-700"
      >
        {"</>"}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Debug
        </span>
        <button
          type="button"
          onClick={() => { setExpanded(false); setWipeConfirm(false); setStatus({ type: "idle" }); }}
          className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 p-4">
        <button
          type="button"
          onClick={handleSeed}
          disabled={status.type === "loading"}
          className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Seed fake data
        </button>

        {wipeConfirm ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleWipe}
              disabled={status.type === "loading"}
              className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Are you sure?
            </button>
            <button
              type="button"
              onClick={() => setWipeConfirm(false)}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleWipe}
            disabled={status.type === "loading"}
            className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
          >
            Wipe all data
          </button>
        )}

        {status.type !== "idle" && (
          <p className={`text-xs ${
            status.type === "loading" ? "text-zinc-400" :
            status.type === "success" ? "text-green-600 dark:text-green-400" :
            "text-red-600 dark:text-red-400"
          }`}>
            {status.type === "loading" ? "Working…" : status.message}
          </p>
        )}
      </div>
    </div>
  );
}
