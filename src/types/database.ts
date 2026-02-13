export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    type: TransactionType;
    category: string;
    description: string | null;
    date: string; // ISO string YYYY-MM-DD
    created_at: string;
}

export interface TransactionInsert {
    amount: number;
    type: TransactionType;
    category: string;
    description?: string;
    date: string;
}

export interface TransactionUpdate {
    amount?: number;
    type?: TransactionType;
    category?: string;
    description?: string;
    date?: string;
}
