# Budget Buddy

A streamlined, type-safe application for tracking monthly finances. Built with an "agent-first" philosophy to ensure rapid development, high maintainability, and seamless deployment.

## 🚀 The Tech Stack

This project leverages a modern, unified stack designed for maximum developer (and AI agent) efficiency:

* **Frontend & Backend:** [Next.js](https://nextjs.org/) (App Router & Server Actions)
* **Language:** [TypeScript](https://www.typescriptlang.org/) for end-to-end type safety.
* **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
* **Deployment:** [Vercel](https://vercel.com/)

## ✨ Features

* **Financial Overview:** Instant visualization of monthly income vs. expenses.
* **Full CRUD:** Add, edit, and delete financial entries with real-time UI updates.
* **Type Safety:** Strict TypeScript schemas ensure data integrity across the entire stack.
* **Responsive Design:** Fully optimized for mobile and desktop budgeting.

## 🛠️ Development with AI Agents

This repository is structured to be "Agent-Friendly." To get the best results when using AI agents (like Cursor or Claude):

1. **Schema First:** Always define your data models in `types/database.ts` or via the Supabase client first.
2. **Server Actions:** Use Next.js Server Actions for data mutations to keep logic and UI tightly coupled for the agent.
3. **Component Driven:** Use the `components/ui` pattern to allow agents to reuse atomic design elements.

## 🌐 Deployment

This application is optimized for **Vercel**.

1. **Push to GitHub:** Vercel will automatically detect the Next.js framework.
2. **Configure Environment Variables:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in the Vercel dashboard.
3. **Live:** Every push to `main` results in an instant production deployment.
