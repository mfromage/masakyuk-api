import { sql } from 'drizzle-orm';
import Papa from 'papaparse';
import type { Database } from './connection.js';
import { recipes, recipeImages, tags, recipeTags, affiliateProducts } from './schema/index.js';
import {
  validateTagRows,
  validateRecipeRows,
  validateAffiliateRows,
  type TagCsvRow,
  type RecipeCsvRow,
  type AffiliateCsvRow,
  type ImageJson,
  type ValidationError,
} from './csv-helpers.js';

export interface ImportResult {
  imported: number;
}

export class CsvValidationError extends Error {
  public errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'CsvValidationError';
    this.errors = errors;
  }
}

function parseCsvString<T>(csv: string): T[] {
  const result = Papa.parse<T>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  if (result.errors.length > 0) {
    const details = result.errors.map((e) => ({
      row: (e.row ?? 0) + 2,
      field: '',
      message: `CSV parse error: ${e.message}`,
    }));
    throw new CsvValidationError(details);
  }
  return result.data;
}

export async function importTagsCsv(db: Database, csvContent: string): Promise<ImportResult> {
  const rows = parseCsvString<TagCsvRow>(csvContent);

  const errors = validateTagRows(rows);
  if (errors.length > 0) {
    throw new CsvValidationError(errors);
  }

  if (rows.length === 0) {
    return { imported: 0 };
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`TRUNCATE tags CASCADE`);
    await tx.insert(tags).values(
      rows.map((t) => ({
        key: t.key.trim(),
        type: t.type.trim(),
        labelEn: t.label_en?.trim() || null,
        labelId: t.label_id?.trim() || null,
      })),
    );
  });

  return { imported: rows.length };
}

export async function importRecipesCsv(db: Database, csvContent: string): Promise<ImportResult> {
  const rows = parseCsvString<RecipeCsvRow>(csvContent);

  const errors = validateRecipeRows(rows);
  if (errors.length > 0) {
    throw new CsvValidationError(errors);
  }

  // Validate tag references against existing tags in DB
  const existingTags = await db.select({ id: tags.id, key: tags.key }).from(tags);
  const tagKeyToId = new Map(existingTags.map((t) => [t.key, t.id]));

  const tagErrors: ValidationError[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.tags?.trim()) {
      const keys = row.tags.split(',').map((k) => k.trim());
      for (const key of keys) {
        if (!tagKeyToId.has(key)) {
          tagErrors.push({
            row: i + 2,
            field: 'tags',
            message: `unknown tag key "${key}"`,
          });
        }
      }
    }
  }
  if (tagErrors.length > 0) {
    throw new CsvValidationError(tagErrors);
  }

  if (rows.length === 0) {
    return { imported: 0 };
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`TRUNCATE recipes CASCADE`);

    const insertedRecipes = await tx
      .insert(recipes)
      .values(
        rows.map((r) => ({
          name: r.name.trim(),
          description: r.description?.trim() || null,
          cookingTimeMinutes: r.cooking_time_minutes?.trim()
            ? Number(r.cooking_time_minutes)
            : null,
          source: r.source?.trim() || null,
          allergies: r.allergies?.trim() || null,
          ingredients: r.ingredients?.trim() ? (JSON.parse(r.ingredients) as string[]) : [],
          steps: r.steps?.trim() ? (JSON.parse(r.steps) as string[]) : [],
        })),
      )
      .returning({ id: recipes.id });

    const allImageValues: (typeof recipeImages.$inferInsert)[] = [];
    const allRecipeTagValues: (typeof recipeTags.$inferInsert)[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const recipeId = insertedRecipes[i].id;

      if (row.images?.trim()) {
        const items: ImageJson[] = JSON.parse(row.images);
        for (const item of items) {
          allImageValues.push({
            recipeId,
            url: item.url,
            position: item.position,
          });
        }
      }

      if (row.tags?.trim()) {
        const keys = row.tags.split(',').map((k) => k.trim());
        for (const key of keys) {
          allRecipeTagValues.push({
            recipeId,
            tagId: tagKeyToId.get(key)!,
          });
        }
      }
    }

    if (allImageValues.length > 0) {
      await tx.insert(recipeImages).values(allImageValues);
    }
    if (allRecipeTagValues.length > 0) {
      await tx.insert(recipeTags).values(allRecipeTagValues);
    }
  });

  return { imported: rows.length };
}

export async function importAffiliatesCsv(db: Database, csvContent: string): Promise<ImportResult> {
  const rows = parseCsvString<AffiliateCsvRow>(csvContent);

  const errors = validateAffiliateRows(rows);
  if (errors.length > 0) {
    throw new CsvValidationError(errors);
  }

  if (rows.length === 0) {
    return { imported: 0 };
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`TRUNCATE affiliate_products`);
    await tx.insert(affiliateProducts).values(
      rows.map((a) => ({
        canonicalName: a.canonical_name.trim(),
        link: a.link.trim(),
        category: a.category?.trim() || null,
        aliases: a.aliases?.trim() ? a.aliases.split('|').map((s) => s.trim()) : null,
        partner: a.partner.trim(),
        searchUrlTemplate: a.search_url_template?.trim() || null,
      })),
    );
  });

  return { imported: rows.length };
}
