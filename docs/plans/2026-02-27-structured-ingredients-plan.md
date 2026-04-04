# Structured Ingredients Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure recipe ingredients from flat `text[]` to `jsonb` column storing `{name, amount, unit}` objects.

**Architecture:** Replace the `ingredients text[] DEFAULT '{}'` column with `ingredients jsonb DEFAULT '[]'` on the `recipes` table. Use Drizzle's `jsonb().$type<Ingredient[]>()` for type-safe access. Migrate existing string data to `{name, amount: 0, unit: ""}` objects.

**Tech Stack:** Drizzle ORM, PostgreSQL jsonb, Vitest

---

### Task 1: Update Drizzle schema and Ingredient type

**Files:**
- Modify: `src/db/schema/recipes.ts:1-15`

**Step 1: Add jsonb import and Ingredient type, update column definition**

In `src/db/schema/recipes.ts`, add `jsonb` to the import from `drizzle-orm/pg-core` and define the `Ingredient` interface. Change the `ingredients` column from `text().array()` to `jsonb().$type<Ingredient[]>()`.

```typescript
import { relations } from 'drizzle-orm';
import { pgTable, serial, text, integer, timestamp, index, primaryKey, jsonb } from 'drizzle-orm/pg-core';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  cookingTimeMinutes: integer('cooking_time_minutes'),
  source: text('source'),
  allergies: text('allergies'),
  ingredients: jsonb('ingredients').$type<Ingredient[]>().notNull().default([]),
  steps: text('steps').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Type errors in downstream files (repository, routes, tests) — that's expected and will be fixed in subsequent tasks.

**Step 3: Commit**

```bash
git add src/db/schema/recipes.ts
git commit -m "refactor: change ingredients column to jsonb with Ingredient type"
```

---

### Task 2: Update repository interfaces

**Files:**
- Modify: `src/db/repositories/recipe-repository.ts:1-16`

**Step 1: Update RecipeRow.ingredients type**

Import `Ingredient` from the schema and change the `ingredients` field from `string[]` to `Ingredient[]`:

```typescript
import { eq, inArray } from 'drizzle-orm';
import type { Database } from '../connection.js';
import { recipes, recipeImages, recipeTags, tags } from '../schema/index.js';
import type { Ingredient } from '../schema/recipes.js';

export interface RecipeRow {
  id: number;
  name: string;
  description: string | null;
  cookingTimeMinutes: number | null;
  source: string | null;
  allergies: string | null;
  ingredients: Ingredient[];
  steps: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

No changes needed to `RecipeWithRelations` (it extends `RecipeRow`) or the query methods (Drizzle returns parsed JSON for jsonb columns automatically).

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Remaining errors in routes and tests only.

**Step 3: Commit**

```bash
git add src/db/repositories/recipe-repository.ts
git commit -m "refactor: update RecipeRow.ingredients to Ingredient[]"
```

---

### Task 3: Update test mock data and assertions

**Files:**
- Modify: `src/__tests__/recipes.test.ts:1-18`
- Modify: `src/__tests__/helpers/setup.ts` (no changes needed — uses `RecipeRepository` type which auto-updates)

**Step 1: Update the failing tests first — change mock data**

Update `sampleRecipe` ingredients from `string[]` to `Ingredient[]`:

```typescript
import type { Ingredient } from '../db/schema/recipes.js';

const sampleIngredients: Ingredient[] = [
  { name: 'nasi', amount: 200, unit: 'gram' },
  { name: 'minyak goreng', amount: 2, unit: 'sdm' },
  { name: 'bawang putih', amount: 3, unit: 'siung' },
];

const sampleRecipe: RecipeRow = {
  id: 1,
  name: 'Nasi Goreng',
  description: 'Indonesian fried rice',
  cookingTimeMinutes: 30,
  source: 'Grandma',
  allergies: 'soy',
  ingredients: sampleIngredients,
  steps: ['Heat oil in a wok', 'Add garlic and fry'],
  createdAt: now,
  updatedAt: now,
};
```

**Step 2: Update ingredient assertions in tests**

In `GET /recipes/all` test (line 68), change:
```typescript
// Before
expect(body[0].ingredients).toEqual(['nasi', 'minyak goreng', 'bawang putih']);
// After
expect(body[0].ingredients).toEqual(sampleIngredients);
```

In `GET /recipes/:id` test (line 97), change:
```typescript
// Before
expect(body.ingredients).toEqual(['nasi', 'minyak goreng', 'bawang putih']);
// After
expect(body.ingredients).toEqual(sampleIngredients);
```

In `GET /recipes/:id/with-affiliates` test (line 128-129), the `matchIngredient` mock receives an `Ingredient` object now. Update:
```typescript
affiliateRepo: {
  matchIngredient: async (name) => {
    if (name === 'minyak goreng') {
      return {
        product: {
          id: 1,
          canonicalName: 'minyak goreng',
          link: 'https://affiliate.example.com/minyak-goreng',
          aliases: null,
          category: 'oil',
          createdAt: now,
          updatedAt: now,
        },
        matchType: 'exact',
      };
    }
    return undefined;
  },
},
```

The `with-affiliates` assertions remain the same since the enriched output still uses `name` field (which now comes from `ingredient.name`).

**Step 3: Run tests to verify they pass**

Run: `npx vitest run`
Expected: All tests pass.

**Step 4: Commit**

```bash
git add src/__tests__/recipes.test.ts
git commit -m "test: update recipe test fixtures to use Ingredient objects"
```

---

### Task 4: Update the with-affiliates route

**Files:**
- Modify: `src/routes/recipes.ts:69-78`

**Step 1: Update ingredient mapping in with-affiliates endpoint**

The `recipe.ingredients` is now `Ingredient[]`, not `string[]`. Update the map callback:

```typescript
const enrichedIngredients = await Promise.all(
  recipe.ingredients.map(async (ingredient) => {
    const match = await app.affiliateRepo.matchIngredient(ingredient.name);
    return {
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      affiliateLink: match?.product.link ?? null,
      affiliateMatchType: match?.matchType ?? null,
    };
  }),
);
```

Key changes:
- Pass `ingredient.name` (not `ingredient`) to `matchIngredient()`
- Spread `amount` and `unit` into the enriched response

**Step 2: Run tests**

Run: `npx vitest run`
Expected: All tests pass.

**Step 3: Commit**

```bash
git add src/routes/recipes.ts
git commit -m "refactor: update with-affiliates to use structured Ingredient objects"
```

---

### Task 5: Update CSV validation

**Files:**
- Modify: `src/db/csv-helpers.ts:83-95`

**Step 1: Add Ingredient-specific validation in validateRecipeRows**

Replace the generic JSON array check for `ingredients` with structured validation. Keep the generic check for `steps` and `images`. After the existing JSON column loop (line 84-95), or replace the `ingredients` part of it:

```typescript
// Validate JSON columns — steps and images stay as simple arrays
for (const field of ['steps', 'images'] as const) {
  if (row[field]?.trim()) {
    try {
      const parsed = JSON.parse(row[field]);
      if (!Array.isArray(parsed)) {
        errors.push({ row: rowNum, field, message: 'must be a JSON array' });
      }
    } catch {
      errors.push({ row: rowNum, field, message: 'invalid JSON' });
    }
  }
}

// Validate ingredients as Ingredient[] objects
if (row.ingredients?.trim()) {
  try {
    const parsed = JSON.parse(row.ingredients);
    if (!Array.isArray(parsed)) {
      errors.push({ row: rowNum, field: 'ingredients', message: 'must be a JSON array' });
    } else {
      for (let j = 0; j < parsed.length; j++) {
        const item = parsed[j];
        if (typeof item !== 'object' || item === null) {
          errors.push({ row: rowNum, field: 'ingredients', message: `item ${j}: must be an object` });
          continue;
        }
        if (typeof item.name !== 'string' || !item.name.trim()) {
          errors.push({ row: rowNum, field: 'ingredients', message: `item ${j}: name is required` });
        }
        if (typeof item.amount !== 'number' || item.amount < 0) {
          errors.push({ row: rowNum, field: 'ingredients', message: `item ${j}: amount must be a non-negative number` });
        }
        if (typeof item.unit !== 'string') {
          errors.push({ row: rowNum, field: 'ingredients', message: `item ${j}: unit must be a string` });
        }
      }
    }
  } catch {
    errors.push({ row: rowNum, field: 'ingredients', message: 'invalid JSON' });
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/db/csv-helpers.ts
git commit -m "feat: add structured Ingredient validation for CSV import"
```

---

### Task 6: Update CSV import service

**Files:**
- Modify: `src/db/import-service.ts:123`

**Step 1: Update the JSON parse cast**

Change the `ingredients` parsing from `string[]` to `Ingredient[]`:

```typescript
// Before (line 123)
ingredients: r.ingredients?.trim() ? (JSON.parse(r.ingredients) as string[]) : [],
// After
ingredients: r.ingredients?.trim() ? JSON.parse(r.ingredients) as Ingredient[] : [],
```

Add the import at the top of the file:

```typescript
import type { Ingredient } from './schema/recipes.js';
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/db/import-service.ts
git commit -m "refactor: parse CSV ingredients as Ingredient[] objects"
```

---

### Task 7: Update seed data

**Files:**
- Modify: `src/db/seed.ts:58-66,81,96`

**Step 1: Convert seed ingredients to Ingredient objects**

```typescript
// Nasi Goreng
ingredients: [
  { name: 'nasi putih', amount: 200, unit: 'gram' },
  { name: 'minyak goreng', amount: 2, unit: 'sdm' },
  { name: 'bawang putih', amount: 3, unit: 'siung' },
  { name: 'bawang merah', amount: 4, unit: 'siung' },
  { name: 'kecap manis', amount: 2, unit: 'sdm' },
  { name: 'telur', amount: 1, unit: 'butir' },
  { name: 'garam', amount: 0, unit: 'secukupnya' },
],

// Soto Ayam
ingredients: [
  { name: 'ayam', amount: 500, unit: 'gram' },
  { name: 'kunyit', amount: 2, unit: 'cm' },
  { name: 'serai', amount: 2, unit: 'batang' },
  { name: 'soun', amount: 100, unit: 'gram' },
  { name: 'bawang putih', amount: 3, unit: 'siung' },
  { name: 'daun jeruk', amount: 3, unit: 'lembar' },
],

// Gado-gado
ingredients: [
  { name: 'kacang tanah', amount: 200, unit: 'gram' },
  { name: 'tahu', amount: 200, unit: 'gram' },
  { name: 'tempe', amount: 200, unit: 'gram' },
  { name: 'kangkung', amount: 1, unit: 'ikat' },
  { name: 'tauge', amount: 100, unit: 'gram' },
  { name: 'kentang', amount: 2, unit: 'buah' },
],
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/db/seed.ts
git commit -m "refactor: update seed data with structured Ingredient objects"
```

---

### Task 8: Generate and apply database migration

**Step 1: Generate Drizzle migration**

Run: `npx drizzle-kit generate`
Expected: A new migration file in `drizzle/` that drops the `text[]` column and adds `jsonb`.

**Step 2: Review the generated migration**

Check the generated SQL. It will likely be a destructive drop-and-add. We need to write a custom migration that preserves data. Edit the generated `.sql` file to:

```sql
-- Add temporary jsonb column
ALTER TABLE "recipes" ADD COLUMN "ingredients_new" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint

-- Migrate existing text[] data to jsonb objects
UPDATE "recipes"
SET "ingredients_new" = (
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('name', elem, 'amount', 0, 'unit', '')),
    '[]'::jsonb
  )
  FROM unnest("ingredients") AS elem
);--> statement-breakpoint

-- Swap columns
ALTER TABLE "recipes" DROP COLUMN "ingredients";--> statement-breakpoint
ALTER TABLE "recipes" RENAME COLUMN "ingredients_new" TO "ingredients";
```

**Step 3: Apply migration**

Run: `npx drizzle-kit push`
Or if using migrate: `npx drizzle-kit migrate`

Verify the column type changed:
Run: `psql $DATABASE_URL -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='recipes' AND column_name='ingredients';"`
Expected: `data_type` is `jsonb`.

**Step 4: Verify existing data migrated correctly**

Run: `psql $DATABASE_URL -c "SELECT id, name, ingredients FROM recipes LIMIT 3;"`
Expected: Each row has JSON array of `{name, amount, unit}` objects.

**Step 5: Commit**

```bash
git add drizzle/
git commit -m "feat: migrate ingredients column from text[] to jsonb"
```

---

### Task 9: Run full test suite and verify

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

**Step 2: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Run linter**

Run: `npx eslint src/`
Expected: No errors.

**Step 4: Test manually (optional)**

Start dev server and test endpoints:
```bash
npm run dev &
curl -s http://localhost:3000/recipes/1 | jq '.ingredients'
```
Expected: `[{"name": "...", "amount": ..., "unit": "..."}, ...]`

**Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "chore: fix any remaining issues from ingredients restructure"
```
