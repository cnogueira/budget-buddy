# Running SQL Scripts via IntelliJ

## How to Run the Scripts

1. **Open Database Tool Window** in IntelliJ
2. **Connect to Supabase** using your connection string
3. **Open the SQL file**: `supabase/complete_dev_setup.sql`
4. **Run the entire script**

## What to Run

### Primary Script: `complete_dev_setup.sql`

This script will:
- ✅ Create dev user with UUID `00000000-0000-0000-0000-000000000000`
- ✅ Configure user_id column as NOT NULL
- ✅ Drop all old RLS policies
- ✅ Create new dev-friendly RLS policies (that check `user_id` column, not `auth.uid()`)
- ✅ Verify everything is set up correctly

### Expected Output

You should see output like:
```
NOTICE: Dev user created (or already exists)
NOTICE: user_id column configured as NOT NULL
NOTICE: Dev users found: 1
NOTICE: RLS enabled on transactions: true
NOTICE: RLS policies on transactions: 4

component    | status
-------------|-----------
Dev User     | ✅ Created
RLS Enabled  | ✅ Yes
RLS Policies | 4 policies
```

### About the Warning

The warning you saw:
```
[2026-02-13 17:49:42] Unsafe query: 'Update' statement does nothing because 'where' condition is always false
```

**This is OK!** It means there are no NULL `user_id` values to update (which is expected). The script is designed to handle both cases safely.

## After Running the Script

1. **Restart your dev server** (if running):
   ```bash
   npm run dev
   ```

2. **Test adding a transaction** - it should work now! ✅

## What the Fix Does

The new RLS policies check:
```sql
-- OLD (doesn't work - auth.uid() is NULL when not authenticated)
USING (auth.uid() = user_id)

-- NEW (works - checks the actual user_id value)
USING (user_id = '00000000-0000-0000-0000-000000000000')
```

This allows your Server Actions to insert/update/delete transactions for the dev user without requiring an authentication session.

## Troubleshooting

If you still get RLS errors after running the script:
1. Verify the script completed successfully (check for errors in IntelliJ output)
2. Confirm 4 policies were created (should see "4 policies" in output)
3. Restart your dev server
4. Check browser console for any other errors

