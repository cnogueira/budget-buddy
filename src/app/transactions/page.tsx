import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddTransactionButton } from "@/components/AddTransactionButton";
import { ImportTransactionsButton } from "@/components/ImportTransactionsButton";
import { TransactionsClientContent } from "./TransactionsClientContent";
import { DataProvider } from "@/providers/DataProvider";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <DataProvider userId={user.id}>
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Transactions
            </h1>
            <div className="flex items-center gap-2">
              <AddTransactionButton />
              <ImportTransactionsButton />
            </div>
          </header>

          <TransactionsClientContent />
        </DataProvider>
      </main>
    </div>
  );
}
