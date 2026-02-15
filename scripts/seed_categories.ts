import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_CATEGORIES = [
    {
        name: 'Housing', icon: 'Home', color: '#3b82f6', type: 'expense',
        children: [
            { name: 'Rent', icon: 'Key', color: '#2563eb' },
            { name: 'Utilities', icon: 'Zap', color: '#1d4ed8' },
            { name: 'Maintenance', icon: 'Wrench', color: '#1e40af' }
        ]
    },
    {
        name: 'Food & Drink', icon: 'Utensils', color: '#f59e0b', type: 'expense',
        children: [
            { name: 'Groceries', icon: 'ShoppingBasket', color: '#d97706' },
            { name: 'Dining Out', icon: 'Pizza', color: '#b45309' },
            { name: 'Coffee', icon: 'Coffee', color: '#92400e' }
        ]
    },
    {
        name: 'Transport', icon: 'Car', color: '#6366f1', type: 'expense',
        children: [
            { name: 'Fuel', icon: 'Fuel', color: '#4f46e5' },
            { name: 'Public Transit', icon: 'Bus', color: '#4338ca' },
            { name: 'Uber/Lyft', icon: 'CarFront', color: '#3730a3' }
        ]
    },
    {
        name: 'Entertainment', icon: 'Ticket', color: '#ec4899', type: 'expense',
        children: [
            { name: 'Movies', icon: 'Film', color: '#db2777' },
            { name: 'Gaming', icon: 'Gamepad2', color: '#be185d' },
            { name: 'Subscriptions', icon: 'Clapperboard', color: '#9d174d' }
        ]
    },
    {
        name: 'Health', icon: 'HeartPulse', color: '#ef4444', type: 'expense',
        children: [
            { name: 'Pharmacy', icon: 'Pill', color: '#dc2626' },
            { name: 'Gym', icon: 'Dumbbell', color: '#b91c1c' },
            { name: 'Insurance', icon: 'ShieldPlus', color: '#991b1b' }
        ]
    },
    {
        name: 'Income', icon: 'TrendingUp', color: '#10b981', type: 'income',
        children: [
            { name: 'Salary', icon: 'Briefcase', color: '#059669' },
            { name: 'Freelance', icon: 'Laptop', color: '#047857' },
            { name: 'Dividends', icon: 'Coins', color: '#065f46' }
        ]
    },
    {
        name: 'Shopping', icon: 'ShoppingBag', color: '#8b5cf6', type: 'expense',
        children: [
            { name: 'Clothing', icon: 'Shirt', color: '#7c3aed' },
            { name: 'Electronics', icon: 'Cpu', color: '#6d28d9' },
            { name: 'General', icon: 'Store', color: '#5b21b6' }
        ]
    }
];

const GLOBAL_RULES = [
    { pattern: 'uber', category: 'Transport' },
    { pattern: 'lyft', category: 'Transport' },
    { pattern: 'shell', category: 'Transport' },
    { pattern: 'mcdonalds', category: 'Food & Drink' },
    { pattern: 'starbucks', category: 'Food & Drink' },
    { pattern: 'burger king', category: 'Food & Drink' },
    { pattern: 'netflix', category: 'Subscriptions' },
    { pattern: 'spotify', category: 'Subscriptions' },
    { pattern: 'hulu', category: 'Subscriptions' },
    { pattern: 'amazon', category: 'Shopping' },
    { pattern: 'walmart', category: 'Shopping' },
    { pattern: 'target', category: 'Shopping' },
];

import { TEST_USER } from '../e2e/credentials';

async function seed() {
    console.log('Seeding categories...');

    let userId: string;

    // 1. Try to get user via Auth Admin (requires Service Role Key)
    const { data: adminData, error: adminError } = await (supabase.auth as any).admin.listUsers();

    if (adminData?.users && adminData.users.length > 0) {
        userId = adminData.users[0].id;
        console.log(`Found user via Admin API: ${userId}`);
    } else {
        if (adminError) {
            console.log('Admin API error (likely missing Service Role Key):', adminError.message);
        }

        console.log(`Attempting to login as ${TEST_USER.email} instead...`);

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: TEST_USER.email,
            password: TEST_USER.password,
        });

        if (authError) {
            console.error('Login failed:', authError.message);
            console.error('Make sure your credentials in e2e/credentials.ts match a user in your Supabase project.');
            return;
        }

        userId = authData.user!.id;
        console.log(`Successfully logged in as: ${userId}`);
    }
    console.log(`Seeding for user: ${userId}`);

    for (const parent of DEFAULT_CATEGORIES) {
        // Insert parent
        const { data: parentData, error: parentError } = await supabase
            .from('categories')
            .upsert({
                user_id: userId,
                name: parent.name,
                icon: parent.icon,
                color: parent.color,
                category_type: parent.type,
                parent_id: null
            }, { onConflict: 'user_id, name, parent_id' })
            .select()
            .single();

        if (parentError) {
            console.error(`Error seeding parent ${parent.name}:`, parentError.message);
            continue;
        }

        console.log(`Seeded parent: ${parent.name}`);

        // Insert children
        for (const child of parent.children) {
            const { error: childError } = await supabase
                .from('categories')
                .upsert({
                    user_id: userId,
                    name: child.name,
                    icon: child.icon,
                    color: child.color,
                    category_type: parent.type,
                    parent_id: parentData.id
                }, { onConflict: 'user_id, name, parent_id' });

            if (childError) {
                console.error(`  Error seeding child ${child.name}:`, childError.message);
            } else {
                console.log(`  Seeded child: ${child.name}`);
            }
        }
    }

    console.log('Seeding global rules...');
    // Note: global rules have user_id = null
    for (const rule of GLOBAL_RULES) {
        // Find the category ID for this rule (using the parent or child name)
        const { data: catData } = await supabase
            .from('categories')
            .select('id')
            .eq('name', rule.category)
            .limit(1)
            .single();

        if (catData) {
            const { error: ruleError } = await supabase
                .from('merchant_rules')
                .upsert({
                    user_id: null, // Global
                    match_pattern: rule.pattern,
                    category_id: catData.id,
                    match_type: 'CONTAINS'
                }, { onConflict: 'user_id, match_pattern' });

            if (ruleError) {
                console.error(`Error seeding rule ${rule.pattern}:`, ruleError.message);
            } else {
                console.log(`Seeded rule: ${rule.pattern} -> ${rule.category}`);
            }
        }
    }

    console.log('Seeding complete!');
}

seed().catch(console.error);
