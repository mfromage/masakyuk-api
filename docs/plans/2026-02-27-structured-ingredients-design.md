# Structured Ingredients Design

## Summary

Restructure recipe ingredients from flat `text[]` (plain name strings) to `jsonb` column storing an array of objects with `name`, `amount`, and `unit`.

## Data Model

### Database column

```
ingredients: text[] DEFAULT '{}'  →  ingredients: jsonb DEFAULT '[]' NOT NULL
```

### TypeScript type

```typescript
interface Ingredient {
  name: string;   // ingredient name
  amount: number; // quantity, 0 = unspecified
  unit: string;   // freeform text, "" = unspecified
}
```

### Example

```json
[
  { "name": "bawang putih", "amount": 2, "unit": "siung" },
  { "name": "garam", "amount": 0, "unit": "secukupnya" }
]
```

## Migration Strategy

Single migration that:

1. Adds a temporary `jsonb` column
2. Converts existing `text[]` data: each string becomes `{ name: "<string>", amount: 0, unit: "" }`
3. Drops the old column, renames the new one

## Affected Files

| File | Change |
|---|---|
| `src/db/schema/recipes.ts` | `text().array()` → `jsonb().$type<Ingredient[]>()` |
| `src/db/repositories/recipe-repository.ts` | `ingredients: string[]` → `Ingredient[]` |
| `src/routes/recipes.ts` | `/:id/with-affiliates` uses `ingredient.name` for matching |
| `src/db/import-service.ts` | CSV parse expects `Ingredient[]` objects |
| `src/db/csv-helpers.ts` | Validate each element has `name`, `amount`, `unit` |
| `src/db/seed.ts` | Update seed data to object format |
| `src/__tests__/recipes.test.ts` | Update mock data and assertions |
| New migration SQL | Alter column + data migration |

## CSV Import Format

New expected format for `ingredients` column:

```json
[{"name": "nasi putih", "amount": 200, "unit": "gram"}, {"name": "minyak goreng", "amount": 2, "unit": "sdm"}]
```

Validation: array of objects, each with `name` (non-empty string), `amount` (number >= 0), `unit` (string).

## Design Decisions

- **JSONB over normalized table** — maintains single-table simplicity, avoids joins. Easy to migrate to a separate table later if needed.
- **amount: 0 for unspecified** — no sentinel values like -1. Pairs naturally with unit like `"secukupnya"`.
- **unit: freeform text** — Indonesian cooking uses varied measurement terms; enum would be too restrictive.
