# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run ESLint
npm start         # Start production server
```

There is no test runner configured beyond `bbva-parser.test.ts` (which appears to be a manual/ad-hoc file). No `npm test` script exists.

## Architecture

**Budget Buddy** is a personal finance tracker built with Next.js App Router, TypeScript, Supabase (PostgreSQL + Auth), and Tailwind CSS.

### Data flow

1. **Server Components** (e.g. `src/app/page.tsx`) fetch data directly with `await` — no `useEffect` for initial loads.
2. **Server Actions** (`src/app/actions/`) handle all mutations and return `{ success: boolean, data?: T, error?: string }`. They always call `revalidatePath()` after mutations.
3. **Client Components** (marked `'use client'`) are leaf-level only — for interactivity like forms, modals, and buttons. Keep logic on the server.
4. **Supabase RLS** enforces per-user data isolation. Server Actions call `supabase.auth.getUser()` to get `user_id` — never trust client-supplied IDs.

### Key directories

- `src/app/actions/` — all Server Actions (transactions, categories, import, learning)
- `src/components/` — React components; mix of Server and Client components
- `src/lib/supabase/` — Supabase clients: `server.ts` (SSR/cookie-based), `client.ts` (browser)
- `src/lib/parsers/` — BBVA Excel/CSV parser
- `src/lib/categorization/` — auto-categorization engine (keyword matching + user/global rules)
- `src/types/database.ts` — canonical TypeScript types for all DB entities
- `supabase/` — SQL schema files (numbered, self-contained, each runnable independently)

### Auth

- Supabase email/password auth via `@supabase/ssr`
- Auth callback at `/src/app/auth/callback/route.ts`
- Middleware at `src/middleware.ts` protects routes
- Login/register at `src/app/login/page.tsx`

## Coding Rules

- **Strict typing:** Use interfaces from `@/types/database.ts`. Define new types there first.
- **No `useMemo`/`useCallback`:** React Compiler is enabled — trust it.
- **No `pages/` directory:** App Router only (`src/app/`).
- **No heavy UI libraries:** Standard HTML + Tailwind. `lucide-react` for icons.
- **Validate at boundaries:** Validate inputs in Server Actions before any DB call.
- **SQL files:** Each file in `supabase/` must be self-contained and runnable independently.

## File Organization

- Only `CLAUDE.md` and `README.md` are allowed as `.md` files in the root.
- Temporary docs, notes, and instructions go in `temp/`.
- Do not create multiple instruction files for a single feature.

## Environment Variables

Required in `.env.local` (and Vercel for production):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
