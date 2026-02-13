export type TransactionType = 'income' | 'expense';

export interface Category {
    id: string;
    user_id: string;
    name: string;
    category_type: TransactionType;
    color: string; // hex color code
    created_at: string;
}

export interface CategoryInsert {
    name: string;
    category_type: TransactionType;
    color: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    type: TransactionType;
    category: string; // Legacy field (for migration)
    category_id: string | null; // New field
    description: string | null;
    date: string; // ISO string YYYY-MM-DD
    created_at: string;
}

export interface TransactionInsert {
    amount: number;
    type: TransactionType;
    category_id: string;
    description?: string;
    date: string;
}

export interface TransactionUpdate {
    amount?: number;
    type?: TransactionType;
    category_id?: string;
    description?: string;
    date?: string;
}

// Extended transaction type that includes category details (for display)
export interface TransactionWithCategory extends Omit<Transaction, 'category'> {
    categories: Category | null;
}

