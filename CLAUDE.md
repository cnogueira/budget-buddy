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

## Planning Workflow

When asked to plan a new feature, follow this flow:

1. **Explore** the codebase to understand what's relevant (existing patterns, types, actions, components).
2. **Clarify** any ambiguous requirements with the user before designing.
3. **Design** a concrete implementation plan: files to create/modify, functions to write, reuse opportunities.
4. **Get approval** via `ExitPlanMode`.
5. **Create a GitHub issue** with the approved plan via `gh issue create`. The issue body must include enough context for a separate Claude instance to implement it cold — architecture notes, key file paths, FK ordering, auth patterns, relevant existing utilities, and a verification checklist.

Implementation is handled separately (by another instance working off the issue), so the issue is the deliverable — not a local plan file.

## Environment Variables

Required in `.env.local` (and Vercel for production):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
