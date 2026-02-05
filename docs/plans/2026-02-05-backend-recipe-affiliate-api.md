# Backend Recipe & Affiliate API — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Fastify backend with PostgreSQL that exposes Recipe and Affiliate entities via REST API.

**Architecture:** Fastify + TypeScript backend with Drizzle ORM. Recipes are fully normalized (ingredients, steps, images, tags in separate tables). Affiliate products are stored with aliases as a PostgreSQL `TEXT[]` array. The recipe↔affiliate relationship is indirect: recipe ingredients are matched to affiliate products by name at the API layer — no direct FK between them.

**Tech Stack:** Node.js, Fastify, TypeScript, PostgreSQL, Drizzle ORM, Vitest

---

## Database Schema

```
recipes ──────┬── recipe_ingredients ···(matched by name at API layer)··· affiliate_products
              ├── recipe_steps
              ├── recipe_images
              └── recipe_tags ── tags
```

**Key design decisions:**

1. **Ingredients normalized** — each ingredient is a row in `recipe_ingredients`, not a JSON blob. This enables SQL querying, joining, and affiliate matching at the DB level.
2. **Affiliate aliases as `TEXT[]`** — PostgreSQL array type. Simple, queryable with `ANY()`, no join table needed for the ~30-50 curated products.
3. **No FK between ingredients and affiliates** — the relationship is by name matching, keeping the two entities loosely coupled. A recipe ingredient like "minyak goreng" matches `affiliate_products.canonical_name = 'minyak goreng'` or its aliases.
4. **Steps normalized** — each step is a row with a `position` column for ordering, rather than a JSON array.

---

## Full Table Definitions

### `recipes`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | nullable |
| cooking_time_minutes | INTEGER | nullable |
| source | VARCHAR(50) | NOT NULL, DEFAULT 'user' |
| is_favorite | BOOLEAN | NOT NULL, DEFAULT false |
| is_archived | BOOLEAN | NOT NULL, DEFAULT false |
| allergies | TEXT | nullable |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

### `recipe_ingredients`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| recipe_id | INTEGER | NOT NULL, FK → recipes(id) ON DELETE CASCADE |
| name | VARCHAR(255) | NOT NULL |
| is_main | BOOLEAN | NOT NULL, DEFAULT true |
| position | INTEGER | NOT NULL, DEFAULT 0 |

Index: `idx_recipe_ingredients_recipe_id` on `recipe_id`

### `recipe_steps`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| recipe_id | INTEGER | NOT NULL, FK → recipes(id) ON DELETE CASCADE |
| description | TEXT | NOT NULL |
| position | INTEGER | NOT NULL, DEFAULT 0 |

Index: `idx_recipe_steps_recipe_id` on `recipe_id`

### `recipe_images`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| recipe_id | INTEGER | NOT NULL, FK → recipes(id) ON DELETE CASCADE |
| url | TEXT | NOT NULL |
| position | INTEGER | NOT NULL, DEFAULT 0 |

Index: `idx_recipe_images_recipe_id` on `recipe_id`

### `tags`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| key | VARCHAR(100) | NOT NULL, UNIQUE |
| type | VARCHAR(50) | NOT NULL |
| label_en | VARCHAR(255) | nullable |
| label_id | VARCHAR(255) | nullable |

### `recipe_tags`

| Column | Type | Constraints |
|--------|------|-------------|
| recipe_id | INTEGER | NOT NULL, FK → recipes(id) ON DELETE CASCADE |
| tag_id | INTEGER | NOT NULL, FK → tags(id) ON DELETE CASCADE |

Composite PK: `(recipe_id, tag_id)`

### `affiliate_products`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| canonical_name | VARCHAR(255) | NOT NULL, UNIQUE |
| link | TEXT | NOT NULL |
| aliases | TEXT[] | NOT NULL, DEFAULT '{}' |
| category | VARCHAR(100) | nullable |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

Index: `idx_affiliate_products_canonical_name` on `canonical_name`

---

## Recipe ↔ Affiliate Relationship

The relationship is **resolved at the API layer**, not via foreign keys:

```
GET /recipes/:id  →  returns recipe with ingredients
                     each ingredient includes matched affiliate link

Matching logic (server-side):
  1. Exact match:    ingredient.name = affiliate.canonical_name (case-insensitive)
  2. Alias match:    ingredient.name = ANY(affiliate.aliases) (case-insensitive)
  3. Contains match: ingredient.name ILIKE '%' || affiliate.canonical_name || '%'
  4. Fallback:       search URL template with ingredient name as keyword
```

This mirrors the existing mobile app's matching algorithm but runs server-side in SQL/application code.

---

## Tasks

### Task 1: Scaffold Fastify Project

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/app.ts`
- Create: `backend/src/server.ts`

**Step 1: Initialize project and install dependencies**

```bash
mkdir -p backend && cd backend
npm init -y
npm i fastify @fastify/cors drizzle-orm postgres dotenv
npm i -D typescript @types/node drizzle-kit vitest tsx
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create app.ts**

```typescript
// backend/src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';

export function buildApp() {
  const app = Fastify({ logger: true });
  app.register(cors);
  app.get('/health', async () => ({ status: 'ok' }));
  return app;
}
```

**Step 4: Create server.ts**

```typescript
// backend/src/server.ts
import 'dotenv/config';
import { buildApp } from './app.js';

const app = buildApp();

app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
```

**Step 5: Add scripts to package.json**

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Step 6: Verify server starts**

Run: `cd backend && npm run dev`
Expected: Server listening on port 3000. `curl localhost:3000/health` returns `{"status":"ok"}`

**Step 7: Commit**

```bash
git add backend/
git commit -m "feat(backend): scaffold fastify project with typescript"
```

---

### Task 2: Database Connection & Drizzle Config

**Files:**
- Create: `backend/.env`
- Create: `backend/src/db/connection.ts`
- Create: `backend/drizzle.config.ts`

**Step 1: Create .env**

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/masakyuk
```

**Step 2: Create database connection module**

```typescript
// backend/src/db/connection.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

**Step 3: Create drizzle.config.ts**

```typescript
// backend/drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 4: Create the PostgreSQL database**

```bash
createdb masakyuk
```

**Step 5: Commit**

```bash
git add backend/.env backend/src/db/ backend/drizzle.config.ts
git commit -m "feat(backend): add database connection with drizzle orm"
```

---

### Task 3: Recipe & Tags Schema

**Files:**
- Create: `backend/src/db/schema/recipes.ts`
- Create: `backend/src/db/schema/index.ts`

**Step 1: Define recipe-related table schemas**

```typescript
// backend/src/db/schema/recipes.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── Tables ──

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  cookingTimeMinutes: integer('cooking_time_minutes'),
  source: varchar('source', { length: 50 }).notNull().default('user'),
  isFavorite: boolean('is_favorite').notNull().default(false),
  isArchived: boolean('is_archived').notNull().default(false),
  allergies: text('allergies'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const recipeIngredients = pgTable('recipe_ingredients', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  isMain: boolean('is_main').notNull().default(true),
  position: integer('position').notNull().default(0),
}, (table) => [
  index('idx_recipe_ingredients_recipe_id').on(table.recipeId),
]);

export const recipeSteps = pgTable('recipe_steps', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  position: integer('position').notNull().default(0),
}, (table) => [
  index('idx_recipe_steps_recipe_id').on(table.recipeId),
]);

export const recipeImages = pgTable('recipe_images', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  position: integer('position').notNull().default(0),
}, (table) => [
  index('idx_recipe_images_recipe_id').on(table.recipeId),
]);

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(),
  labelEn: varchar('label_en', { length: 255 }),
  labelId: varchar('label_id', { length: 255 }),
});

export const recipeTags = pgTable('recipe_tags', {
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.recipeId, table.tagId] }),
]);

// ── Relations ──

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  steps: many(recipeSteps),
  images: many(recipeImages),
  tags: many(recipeTags),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeIngredients.recipeId], references: [recipes.id] }),
}));

export const recipeStepsRelations = relations(recipeSteps, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeSteps.recipeId], references: [recipes.id] }),
}));

export const recipeImagesRelations = relations(recipeImages, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeImages.recipeId], references: [recipes.id] }),
}));

export const recipeTagsRelations = relations(recipeTags, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeTags.recipeId], references: [recipes.id] }),
  tag: one(tags, { fields: [recipeTags.tagId], references: [tags.id] }),
}));
```

**Step 2: Create schema barrel export**

```typescript
// backend/src/db/schema/index.ts
export * from './recipes.js';
export * from './affiliates.js';
```

Note: `affiliates.js` will be created in Task 4. Temporarily comment it out or create an empty file.

**Step 3: Generate migration**

```bash
cd backend && npm run db:generate
```

Expected: Migration SQL file generated in `backend/drizzle/`

**Step 4: Run migration**

```bash
npm run db:migrate
```

Expected: Tables created. Verify with `psql masakyuk -c "\dt"` — should show `recipes`, `recipe_ingredients`, `recipe_steps`, `recipe_images`, `tags`, `recipe_tags`.

**Step 5: Commit**

```bash
git add backend/src/db/schema/ backend/drizzle/
git commit -m "feat(backend): add recipe and tags database schema"
```

---

### Task 4: Affiliate Schema

**Files:**
- Create: `backend/src/db/schema/affiliates.ts`
- Modify: `backend/src/db/schema/index.ts` (uncomment affiliates export)

**Step 1: Define affiliate table schema**

```typescript
// backend/src/db/schema/affiliates.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const affiliateProducts = pgTable('affiliate_products', {
  id: serial('id').primaryKey(),
  canonicalName: varchar('canonical_name', { length: 255 }).notNull().unique(),
  link: text('link').notNull(),
  aliases: text('aliases').array().notNull().default(sql`ARRAY[]::text[]`),
  category: varchar('category', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_affiliate_products_canonical_name').on(table.canonicalName),
]);
```

**Step 2: Update schema index**

```typescript
// backend/src/db/schema/index.ts
export * from './recipes.js';
export * from './affiliates.js';
```

**Step 3: Generate and run migration**

```bash
cd backend
npm run db:generate
npm run db:migrate
```

Expected: `affiliate_products` table created. Verify with `psql masakyuk -c "\d affiliate_products"`.

**Step 4: Commit**

```bash
git add backend/src/db/schema/affiliates.ts backend/drizzle/
git commit -m "feat(backend): add affiliate products database schema"
```

---

### Task 5: Seed Data

**Files:**
- Create: `backend/src/db/seed.ts`

**Step 1: Create seed script**

Migrate the existing data from the mobile app into the backend DB. Reference:
- Tags: `app/data/db/seed.ts` (lines 7-39) — 27 tags across 4 categories
- Recipes: `app/data/db/seed.ts` (lines 51-200) — 3 sample recipes
- Affiliate products: `app/data/affiliateLinks.ts` (lines 13-109) — 21 curated products

```typescript
// backend/src/db/seed.ts
import 'dotenv/config';
import { db } from './db/connection.js';
import { tags, recipes, recipeIngredients, recipeSteps, recipeTags, affiliateProducts } from './db/schema/index.js';

async function seed() {
  console.log('Seeding tags...');
  await db.insert(tags).values([
    { key: 'indonesian', type: 'cuisine', labelEn: 'Indonesian', labelId: 'Indonesia' },
    { key: 'italian', type: 'cuisine', labelEn: 'Italian', labelId: 'Italia' },
    { key: 'japanese', type: 'cuisine', labelEn: 'Japanese', labelId: 'Jepang' },
    // ... (all 27 tags from app/data/db/seed.ts)
  ]).onConflictDoNothing();

  console.log('Seeding recipes...');
  const [nasiGoreng] = await db.insert(recipes).values({
    name: 'Nasi Goreng Sederhana',
    description: 'Nasi goreng klasik Indonesia yang mudah dan cepat dibuat',
    cookingTimeMinutes: 10,
    source: 'system',
  }).returning();

  await db.insert(recipeIngredients).values([
    { recipeId: nasiGoreng.id, name: 'Nasi putih', isMain: true, position: 0 },
    { recipeId: nasiGoreng.id, name: 'Bawang merah', isMain: true, position: 1 },
    { recipeId: nasiGoreng.id, name: 'Bawang putih', isMain: true, position: 2 },
    { recipeId: nasiGoreng.id, name: 'Kecap manis', isMain: true, position: 3 },
    { recipeId: nasiGoreng.id, name: 'Telur', isMain: true, position: 4 },
    { recipeId: nasiGoreng.id, name: 'Garam', isMain: true, position: 5 },
    { recipeId: nasiGoreng.id, name: 'Minyak goreng', isMain: true, position: 6 },
  ]);

  await db.insert(recipeSteps).values([
    { recipeId: nasiGoreng.id, description: 'Iris bawang merah dan bawang putih', position: 0 },
    { recipeId: nasiGoreng.id, description: 'Panaskan minyak, tumis bawang hingga harum', position: 1 },
    { recipeId: nasiGoreng.id, description: 'Masukkan telur, orak-arik hingga setengah matang', position: 2 },
    { recipeId: nasiGoreng.id, description: 'Masukkan nasi putih, aduk rata', position: 3 },
    { recipeId: nasiGoreng.id, description: 'Tambahkan kecap manis dan garam, aduk hingga merata', position: 4 },
    { recipeId: nasiGoreng.id, description: 'Koreksi rasa, sajikan panas dengan acar dan kerupuk', position: 5 },
  ]);

  // ... repeat for other 2 sample recipes

  console.log('Seeding affiliate products...');
  await db.insert(affiliateProducts).values([
    { canonicalName: 'minyak goreng', link: 'https://s.blibli.com/GNtk/w6epk41g', aliases: ['cooking oil', 'minyak sayur', 'vegetable oil'], category: 'oils' },
    { canonicalName: 'minyak wijen', link: 'https://s.blibli.com/GNtk/hypy6579', aliases: ['sesame oil', 'minyak bijan'], category: 'oils' },
    { canonicalName: 'kecap manis', link: 'https://s.blibli.com/GNtk/68p5esec', aliases: ['sweet soy sauce'], category: 'sauces' },
    { canonicalName: 'kecap asin', link: 'https://s.blibli.com/GNtk/z6i8tu9t', aliases: ['soy sauce', 'kecap'], category: 'sauces' },
    { canonicalName: 'saus tiram', link: 'https://s.blibli.com/GNtk/g8y35nb3', aliases: ['oyster sauce'], category: 'sauces' },
    { canonicalName: 'garam', link: 'https://s.blibli.com/GNtk/xye5vw6o', aliases: ['salt', 'garam dapur'], category: 'seasonings' },
    { canonicalName: 'gula', link: 'https://s.blibli.com/GNtk/au55v3ud', aliases: ['sugar', 'gula pasir'], category: 'seasonings' },
    { canonicalName: 'merica', link: 'https://s.blibli.com/GNtk/uj9jz7ry', aliases: ['pepper', 'lada', 'black pepper'], category: 'seasonings' },
    { canonicalName: 'beras', link: 'https://s.blibli.com/GNtk/67x30j6r', aliases: ['rice', 'nasi'], category: 'staples' },
    { canonicalName: 'tepung terigu', link: 'https://s.blibli.com/GNtk/mrort1s9', aliases: ['flour', 'wheat flour', 'terigu'], category: 'staples' },
    { canonicalName: 'santan', link: 'https://s.blibli.com/GNtk/n8alsdaj', aliases: ['coconut milk', 'coconut cream'], category: 'staples' },
    { canonicalName: 'bawang merah', link: 'https://s.blibli.com/GNtk/2e2ea4bl', aliases: ['shallot', 'red onion'], category: 'aromatics' },
    { canonicalName: 'bawang putih', link: 'https://s.blibli.com/GNtk/obkn0e96', aliases: ['garlic'], category: 'aromatics' },
    { canonicalName: 'bawang bombay', link: 'https://s.blibli.com/GNtk/9jzvdixp', aliases: ['bombay', 'onion'], category: 'aromatics' },
    { canonicalName: 'daun bawang', link: 'https://s.blibli.com/GNtk/ggwk5jin', aliases: ['green onion', 'scallion', 'spring onion'], category: 'aromatics' },
    { canonicalName: 'jahe', link: 'https://s.blibli.com/GNtk/ov7s0ale', aliases: ['ginger'], category: 'aromatics' },
    { canonicalName: 'telur', link: 'https://s.blibli.com/GNtk/y6ba3qw3', aliases: ['telor', 'egg'], category: 'proteins' },
    { canonicalName: 'ayam', link: 'https://s.blibli.com/GNtk/5ve7uip8', aliases: ['daging ayam', 'chicken'], category: 'proteins' },
    { canonicalName: 'sapi', link: 'https://s.blibli.com/GNtk/tqnx8cu0', aliases: ['daging sapi', 'beef'], category: 'proteins' },
    { canonicalName: 'salmon', link: 'https://s.blibli.com/GNtk/p4jv61zv', aliases: ['ikan salmon'], category: 'proteins' },
    { canonicalName: 'sosis', link: 'https://s.blibli.com/GNtk/h13s0rql', aliases: ['sausage'], category: 'proteins' },
  ]).onConflictDoNothing();

  console.log('Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

**Step 2: Add seed script to package.json**

```json
"db:seed": "tsx src/db/seed.ts"
```

**Step 3: Run seed**

```bash
cd backend && npm run db:seed
```

Expected: "Seed complete!" printed. Verify with:
```bash
psql masakyuk -c "SELECT count(*) FROM tags"              -- 27
psql masakyuk -c "SELECT count(*) FROM recipes"            -- 3
psql masakyuk -c "SELECT count(*) FROM affiliate_products" -- 21
```

**Step 4: Commit**

```bash
git add backend/src/db/seed.ts backend/package.json
git commit -m "feat(backend): add seed script for tags, recipes, and affiliates"
```

---

### Task 6: Recipe API Routes

**Files:**
- Create: `backend/src/routes/recipes.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/src/__tests__/recipes.test.ts`

**Step 1: Write failing test for GET /recipes**

```typescript
// backend/src/__tests__/recipes.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.js';

describe('GET /recipes', () => {
  const app = buildApp();

  afterAll(async () => { await app.close(); });

  it('returns a list of recipes', async () => {
    const res = await app.inject({ method: 'GET', url: '/recipes' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Array.isArray(body)).toBe(true);
  });
});

describe('GET /recipes/:id', () => {
  const app = buildApp();

  afterAll(async () => { await app.close(); });

  it('returns a recipe with ingredients, steps, images, and tags', async () => {
    const res = await app.inject({ method: 'GET', url: '/recipes/1' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('name');
    expect(body).toHaveProperty('ingredients');
    expect(body).toHaveProperty('steps');
    expect(body).toHaveProperty('images');
    expect(body).toHaveProperty('tags');
  });

  it('returns 404 for non-existent recipe', async () => {
    const res = await app.inject({ method: 'GET', url: '/recipes/99999' });
    expect(res.statusCode).toBe(404);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test`
Expected: FAIL — routes don't exist yet

**Step 3: Implement recipe routes**

```typescript
// backend/src/routes/recipes.ts
import { FastifyInstance } from 'fastify';
import { db } from '../db/connection.js';
import { recipes, recipeIngredients, recipeSteps, recipeImages, recipeTags, tags } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

export async function recipeRoutes(app: FastifyInstance) {
  // GET /recipes — list all active recipes
  app.get('/recipes', async (request, reply) => {
    const result = await db
      .select()
      .from(recipes)
      .where(eq(recipes.isArchived, false))
      .orderBy(recipes.createdAt);

    return result;
  });

  // GET /recipes/:id — get recipe with all related data
  app.get<{ Params: { id: string } }>('/recipes/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);

    const recipe = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
    if (recipe.length === 0) {
      return reply.status(404).send({ error: 'Recipe not found' });
    }

    const [ingredients, steps, images, tagRows] = await Promise.all([
      db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, id)).orderBy(recipeIngredients.position),
      db.select().from(recipeSteps).where(eq(recipeSteps.recipeId, id)).orderBy(recipeSteps.position),
      db.select().from(recipeImages).where(eq(recipeImages.recipeId, id)).orderBy(recipeImages.position),
      db.select({ id: tags.id, key: tags.key, type: tags.type, labelEn: tags.labelEn, labelId: tags.labelId })
        .from(recipeTags)
        .innerJoin(tags, eq(recipeTags.tagId, tags.id))
        .where(eq(recipeTags.recipeId, id)),
    ]);

    return {
      ...recipe[0],
      ingredients,
      steps,
      images,
      tags: tagRows,
    };
  });
}
```

**Step 4: Register routes in app.ts**

```typescript
// backend/src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { recipeRoutes } from './routes/recipes.js';

export function buildApp() {
  const app = Fastify({ logger: true });
  app.register(cors);
  app.register(recipeRoutes);
  app.get('/health', async () => ({ status: 'ok' }));
  return app;
}
```

**Step 5: Run tests to verify they pass**

Run: `cd backend && npm test`
Expected: PASS

**Step 6: Commit**

```bash
git add backend/src/routes/ backend/src/__tests__/ backend/src/app.ts
git commit -m "feat(backend): add recipe api routes with tests"
```

---

### Task 7: Affiliate API Routes

**Files:**
- Create: `backend/src/routes/affiliates.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/src/__tests__/affiliates.test.ts`

**Step 1: Write failing test for GET /affiliates**

```typescript
// backend/src/__tests__/affiliates.test.ts
import { describe, it, expect, afterAll } from 'vitest';
import { buildApp } from '../app.js';

describe('GET /affiliates', () => {
  const app = buildApp();
  afterAll(async () => { await app.close(); });

  it('returns a list of affiliate products', async () => {
    const res = await app.inject({ method: 'GET', url: '/affiliates' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Array.isArray(body)).toBe(true);
  });
});

describe('GET /affiliates/match', () => {
  const app = buildApp();
  afterAll(async () => { await app.close(); });

  it('returns exact match for known ingredient', async () => {
    const res = await app.inject({ method: 'GET', url: '/affiliates/match?ingredient=minyak goreng' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('link');
    expect(body).toHaveProperty('matchType', 'exact');
  });

  it('returns alias match', async () => {
    const res = await app.inject({ method: 'GET', url: '/affiliates/match?ingredient=garlic' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('matchType', 'alias');
  });

  it('returns search fallback for unknown ingredient', async () => {
    const res = await app.inject({ method: 'GET', url: '/affiliates/match?ingredient=daun ketumbar' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('matchType', 'search');
  });

  it('returns 400 without ingredient param', async () => {
    const res = await app.inject({ method: 'GET', url: '/affiliates/match' });
    expect(res.statusCode).toBe(400);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd backend && npm test`
Expected: FAIL — routes don't exist yet

**Step 3: Implement affiliate routes**

```typescript
// backend/src/routes/affiliates.ts
import { FastifyInstance } from 'fastify';
import { db } from '../db/connection.js';
import { affiliateProducts } from '../db/schema/index.js';
import { eq, ilike, sql } from 'drizzle-orm';

const SEARCH_URL_TEMPLATE = 'https://www.blibli.com/merchant/farmers-market-flagship-store/FAM-70080?merchantSearchTerm=[keyword]';

export async function affiliateRoutes(app: FastifyInstance) {
  // GET /affiliates — list all affiliate products
  app.get('/affiliates', async () => {
    return db.select().from(affiliateProducts).orderBy(affiliateProducts.canonicalName);
  });

  // GET /affiliates/:id — get single affiliate product
  app.get<{ Params: { id: string } }>('/affiliates/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const result = await db.select().from(affiliateProducts).where(eq(affiliateProducts.id, id)).limit(1);
    if (result.length === 0) {
      return reply.status(404).send({ error: 'Affiliate product not found' });
    }
    return result[0];
  });

  // GET /affiliates/match?ingredient=... — find affiliate link for an ingredient name
  app.get<{ Querystring: { ingredient?: string } }>('/affiliates/match', async (request, reply) => {
    const ingredient = request.query.ingredient?.trim();
    if (!ingredient) {
      return reply.status(400).send({ error: 'ingredient query parameter is required' });
    }

    const normalized = ingredient.toLowerCase();

    // 1. Exact match on canonical_name
    const exact = await db
      .select()
      .from(affiliateProducts)
      .where(ilike(affiliateProducts.canonicalName, normalized))
      .limit(1);

    if (exact.length > 0) {
      return { link: exact[0].link, matchType: 'exact', product: exact[0] };
    }

    // 2. Alias match
    const aliasMatch = await db
      .select()
      .from(affiliateProducts)
      .where(sql`${normalized} ILIKE ANY(${affiliateProducts.aliases})`)
      .limit(1);

    if (aliasMatch.length > 0) {
      return { link: aliasMatch[0].link, matchType: 'alias', product: aliasMatch[0] };
    }

    // 3. Contains match (ingredient name contains a canonical name)
    const containsMatch = await db
      .select()
      .from(affiliateProducts)
      .where(sql`${normalized} ILIKE '%' || ${affiliateProducts.canonicalName} || '%'`)
      .orderBy(sql`length(${affiliateProducts.canonicalName}) DESC`)
      .limit(1);

    if (containsMatch.length > 0) {
      return { link: containsMatch[0].link, matchType: 'contains', product: containsMatch[0] };
    }

    // 4. Search fallback
    const searchUrl = SEARCH_URL_TEMPLATE.replace('[keyword]', encodeURIComponent(ingredient));
    return { link: searchUrl, matchType: 'search', product: null };
  });
}
```

**Step 4: Register routes in app.ts**

```typescript
// backend/src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { recipeRoutes } from './routes/recipes.js';
import { affiliateRoutes } from './routes/affiliates.js';

export function buildApp() {
  const app = Fastify({ logger: true });
  app.register(cors);
  app.register(recipeRoutes);
  app.register(affiliateRoutes);
  app.get('/health', async () => ({ status: 'ok' }));
  return app;
}
```

**Step 5: Run tests to verify they pass**

Run: `cd backend && npm test`
Expected: PASS

**Step 6: Commit**

```bash
git add backend/src/routes/affiliates.ts backend/src/__tests__/affiliates.test.ts backend/src/app.ts
git commit -m "feat(backend): add affiliate api routes with ingredient matching"
```

---

### Task 8: Recipe-with-Affiliates Enriched Endpoint

**Files:**
- Modify: `backend/src/routes/recipes.ts`
- Modify: `backend/src/__tests__/recipes.test.ts`

This task adds an enriched recipe endpoint that returns each ingredient with its matched affiliate link — demonstrating the relationship between the two entities.

**Step 1: Write failing test**

Add to `backend/src/__tests__/recipes.test.ts`:

```typescript
describe('GET /recipes/:id/with-affiliates', () => {
  const app = buildApp();
  afterAll(async () => { await app.close(); });

  it('returns recipe ingredients enriched with affiliate links', async () => {
    const res = await app.inject({ method: 'GET', url: '/recipes/1/with-affiliates' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('ingredients');
    expect(body.ingredients[0]).toHaveProperty('affiliateLink');
    expect(body.ingredients[0]).toHaveProperty('affiliateMatchType');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test`
Expected: FAIL — route doesn't exist yet

**Step 3: Implement enriched endpoint**

Add to `backend/src/routes/recipes.ts`:

```typescript
// GET /recipes/:id/with-affiliates — recipe with affiliate-enriched ingredients
app.get<{ Params: { id: string } }>('/recipes/:id/with-affiliates', async (request, reply) => {
  const id = parseInt(request.params.id, 10);

  const recipe = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (recipe.length === 0) {
    return reply.status(404).send({ error: 'Recipe not found' });
  }

  const [ingredients, steps, images, tagRows] = await Promise.all([
    db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, id)).orderBy(recipeIngredients.position),
    db.select().from(recipeSteps).where(eq(recipeSteps.recipeId, id)).orderBy(recipeSteps.position),
    db.select().from(recipeImages).where(eq(recipeImages.recipeId, id)).orderBy(recipeImages.position),
    db.select({ id: tags.id, key: tags.key, type: tags.type, labelEn: tags.labelEn, labelId: tags.labelId })
      .from(recipeTags)
      .innerJoin(tags, eq(recipeTags.tagId, tags.id))
      .where(eq(recipeTags.recipeId, id)),
  ]);

  // Load all affiliate products once
  const allAffiliates = await db.select().from(affiliateProducts);

  // Match each ingredient to an affiliate product
  const enrichedIngredients = ingredients.map((ing) => {
    const normalized = ing.name.toLowerCase().trim();

    // Exact match
    const exact = allAffiliates.find(
      (a) => a.canonicalName.toLowerCase() === normalized
    );
    if (exact) {
      return { ...ing, affiliateLink: exact.link, affiliateMatchType: 'exact' as const };
    }

    // Alias match
    const alias = allAffiliates.find(
      (a) => a.aliases.some((al) => al.toLowerCase() === normalized)
    );
    if (alias) {
      return { ...ing, affiliateLink: alias.link, affiliateMatchType: 'alias' as const };
    }

    // Contains match (prefer longest canonical name)
    const containsMatches = allAffiliates
      .filter((a) => normalized.includes(a.canonicalName.toLowerCase()))
      .sort((a, b) => b.canonicalName.length - a.canonicalName.length);
    if (containsMatches.length > 0) {
      return { ...ing, affiliateLink: containsMatches[0].link, affiliateMatchType: 'contains' as const };
    }

    // Search fallback
    const searchUrl = SEARCH_URL_TEMPLATE.replace('[keyword]', encodeURIComponent(ing.name));
    return { ...ing, affiliateLink: searchUrl, affiliateMatchType: 'search' as const };
  });

  return {
    ...recipe[0],
    ingredients: enrichedIngredients,
    steps,
    images,
    tags: tagRows,
  };
});
```

Also add at the top of recipes.ts:
```typescript
import { affiliateProducts } from '../db/schema/index.js';

const SEARCH_URL_TEMPLATE = 'https://www.blibli.com/merchant/farmers-market-flagship-store/FAM-70080?merchantSearchTerm=[keyword]';
```

**Step 4: Run tests to verify they pass**

Run: `cd backend && npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/routes/recipes.ts backend/src/__tests__/recipes.test.ts
git commit -m "feat(backend): add enriched recipe endpoint with affiliate links"
```

---

## API Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/recipes` | List all active recipes |
| GET | `/recipes/:id` | Get recipe with ingredients, steps, images, tags |
| GET | `/recipes/:id/with-affiliates` | Get recipe with affiliate-enriched ingredients |
| GET | `/affiliates` | List all affiliate products |
| GET | `/affiliates/:id` | Get single affiliate product |
| GET | `/affiliates/match?ingredient=...` | Match ingredient name to affiliate link |

## Sample Response: GET /recipes/1/with-affiliates

```json
{
  "id": 1,
  "name": "Nasi Goreng Sederhana",
  "description": "Nasi goreng klasik Indonesia yang mudah dan cepat dibuat",
  "cookingTimeMinutes": 10,
  "source": "system",
  "isFavorite": false,
  "isArchived": false,
  "ingredients": [
    {
      "id": 1,
      "name": "Nasi putih",
      "isMain": true,
      "position": 0,
      "affiliateLink": "https://s.blibli.com/GNtk/67x30j6r",
      "affiliateMatchType": "contains"
    },
    {
      "id": 2,
      "name": "Minyak goreng",
      "isMain": true,
      "position": 6,
      "affiliateLink": "https://s.blibli.com/GNtk/w6epk41g",
      "affiliateMatchType": "exact"
    }
  ],
  "steps": [
    { "id": 1, "description": "Iris bawang merah dan bawang putih", "position": 0 }
  ],
  "images": [],
  "tags": [
    { "id": 2, "key": "indonesian", "type": "cuisine", "labelEn": "Indonesian", "labelId": "Indonesia" }
  ]
}
```
