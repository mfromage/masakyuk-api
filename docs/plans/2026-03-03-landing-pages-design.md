# Landing, Privacy & ToS Pages — Design

## Decision

Add Next.js App Router alongside the existing Fastify API in a single monorepo (hybrid approach). No API migration — Fastify continues running as a Vercel serverless function.

## Routing

```
/              → Next.js (landing page)
/privacy       → Next.js (privacy policy)
/tos           → Next.js (terms of service)
/api/*         → Fastify serverless function (existing API)
```

API routes move under `/api` prefix (e.g., `/recipes` → `/api/recipes`).

## Project Structure Changes

**New files:**
- `app/layout.tsx` — root layout
- `app/globals.css` — Tailwind global styles
- `app/page.tsx` — landing page
- `app/privacy/page.tsx` — privacy policy
- `app/tos/page.tsx` — terms of service
- `next.config.js` — Next.js config
- `tailwind.config.js` — Tailwind CSS config
- `postcss.config.js` — PostCSS config

**Modified files:**
- `vercel.json` — remove catch-all rewrite, add `/api` rewrite only
- `tsconfig.json` — support both Next.js (app/) and Fastify (src/)
- `src/app.ts` — add `/api` prefix to all route registrations
- `package.json` — add Next.js, React, Tailwind dependencies

**Unchanged:**
- `src/` (all Fastify code, DB layer, repositories)
- `api/index.ts` (Vercel serverless handler)
- `src/__tests__/` (unit tests)

## Tech Stack Addition

- Next.js (App Router, static generation)
- React + React DOM
- Tailwind CSS (utility-first styling)
- Framer Motion (animations, to be added later for rich interactions)
