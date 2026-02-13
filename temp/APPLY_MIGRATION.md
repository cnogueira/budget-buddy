# How to Apply the Categories Schema

Since we don't have the Supabase CLI set up, please apply the schema manually:

## Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project (ncgwwlyccmpdfuzzlhsy)

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Copy the Migration SQL**
   - Open the file `supabase/categories_schema.sql`
   - Copy all the contents

4. **Run the Migration**
   - Paste the SQL into the SQL Editor
   - Click "Run" to execute

5. **Verify**
   - Check that the `categories` table was created
   - Check that the `category_id` column was added to `transactions`

## After Migration:

Start the development server and test:
```bash
npm run dev
```

Then try:
- Creating a new category via the "Add Transaction" form
- The form should now show a category selector with a "+ New" button
- Categories will have colors automatically assigned

