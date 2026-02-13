# Setup Instructions

## Database Setup

Execute these SQL files in order via Supabase SQL Editor:

1. **supabase/01_initial_schema.sql** - Creates all tables and RLS policies
2. **supabase/02_dev_setup.sql** - Development setup (creates test user, disables RLS)

That's it! Start the dev server:

```bash
npm run dev
```

## Features Implemented

✅ Transaction management (add, view, delete)
✅ Category system with color coding
✅ Inline category creation
✅ Category limits (6 income, 26 expense)

## Testing the App

1. Visit http://localhost:3000
2. Add a transaction:
   - Select Income/Expense type
   - Click "+ New" to create a category
   - Category gets auto-assigned a unique color
   - Fill in amount, date, description
   - Submit
3. See your transaction in the list with colored category badge
4. Click delete button to remove transactions

## Next Steps

See CONTEXT.md for upcoming features (dashboard, category management, auth).

