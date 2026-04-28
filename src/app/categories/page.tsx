import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCategories } from "@/app/actions/category-actions";
import { Category } from "@/types/database";
import { CategoryRow } from "./CategoryRow";
import { NewCategoryButton } from "./NewCategoryButton";

export default async function CategoriesPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const categoriesResult = await getCategories();
    const categories: Category[] = categoriesResult.data ?? [];

    // Fetch transaction counts per category
    const { data: countRows } = await supabase
        .from("transactions")
        .select("category_id")
        .eq("user_id", user.id);

    const txCountMap = new Map<string, number>();
    for (const row of countRows ?? []) {
        if (row.category_id) {
            txCountMap.set(row.category_id, (txCountMap.get(row.category_id) ?? 0) + 1);
        }
    }

    const income = categories.filter((c) => c.category_type === "income");
    const expense = categories.filter((c) => c.category_type === "expense");

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Categories</h1>
                <NewCategoryButton />
            </div>

            <div className="space-y-8">
                <Section
                    title="Income"
                    categories={income}
                    txCountMap={txCountMap}
                />
                <Section
                    title="Expense"
                    categories={expense}
                    txCountMap={txCountMap}
                />
            </div>
        </div>
    );
}

function Section({
    title,
    categories,
    txCountMap,
}: {
    title: string;
    categories: Category[];
    txCountMap: Map<string, number>;
}) {
    return (
        <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                {title}
            </h2>
            {categories.length === 0 ? (
                <p className="text-sm text-zinc-400 italic">No {title.toLowerCase()} categories yet.</p>
            ) : (
                <div className="space-y-2">
                    {categories.map((cat) => (
                        <CategoryRow
                            key={cat.id}
                            category={cat}
                            transactionCount={txCountMap.get(cat.id) ?? 0}
                            sameTypePeers={categories.filter((c) => c.id !== cat.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
