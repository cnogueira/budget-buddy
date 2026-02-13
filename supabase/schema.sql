-- Create a strict Enum for transaction types to prevent logic errors
create type transaction_type as enum ('income', 'expense');

-- Create the main transactions table
create table public.transactions
(
    id          uuid                                default gen_random_uuid() primary key,
    user_id     uuid references auth.users not null, -- Links to Supabase Auth
    amount      decimal(12, 2)             not null,
    type        transaction_type           not null,
    category    text                       not null, -- e.g., 'Groceries', 'Salary'
    description text,
    date        date                       not null default current_date,
    created_at  timestamptz                         default now() not null
);

-- Enable Row Level Security (RLS)
-- This ensures users can only edit/delete their OWN data
alter table public.transactions enable row level security;

-- Create policies
create
policy "Users can view their own transactions"
on public.transactions for
select
    using (auth.uid() = user_id);

create
policy "Users can insert their own transactions"
on public.transactions for insert
with check (auth.uid() = user_id);

create
policy "Users can update their own transactions"
on public.transactions for
update
    using (auth.uid() = user_id);

create
policy "Users can delete their own transactions"
on public.transactions for delete
using (auth.uid() = user_id);
