import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Path constants ──
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.resolve(__dirname, '../../data');
export const RECIPES_CSV_PATH = path.join(DATA_DIR, 'recipes.csv');
export const AFFILIATES_CSV_PATH = path.join(DATA_DIR, 'affiliates.csv');
export const TAGS_CSV_PATH = path.join(DATA_DIR, 'tags.csv');

// ── CSV row types (denormalized) ──
export interface IngredientJson {
  name: string;
  isMain: boolean;
  position: number;
}

export interface StepJson {
  description: string;
  position: number;
}

export interface ImageJson {
  url: string;
  position: number;
}

export interface RecipeCsvRow {
  name: string;
  description: string;
  cooking_time_minutes: string;
  source: string;
  allergies: string;
  ingredients: string; // JSON array
  steps: string; // JSON array
  images: string; // JSON array
  tags: string; // comma-separated keys
}

export interface AffiliateCsvRow {
  canonical_name: string;
  link: string;
  category: string;
  aliases: string; // pipe-delimited
}

export interface TagCsvRow {
  key: string;
  type: string;
  label_en: string;
  label_id: string;
}

// ── Validation ──
export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function validateRecipeRows(rows: RecipeCsvRow[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const names = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed + header

    if (!row.name?.trim()) {
      errors.push({ row: rowNum, field: 'name', message: 'name is required' });
    } else if (names.has(row.name.trim())) {
      errors.push({
        row: rowNum,
        field: 'name',
        message: `duplicate recipe name: "${row.name.trim()}"`,
      });
    } else {
      names.add(row.name.trim());
    }

    if (row.cooking_time_minutes?.trim()) {
      const n = Number(row.cooking_time_minutes.trim());
      if (!Number.isInteger(n) || n < 0) {
        errors.push({
          row: rowNum,
          field: 'cooking_time_minutes',
          message: 'must be a non-negative integer',
        });
      }
    }

    // Validate JSON columns
    for (const field of ['ingredients', 'steps', 'images'] as const) {
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
  }

  return errors;
}

export function validateAffiliateRows(rows: AffiliateCsvRow[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const names = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    if (!row.canonical_name?.trim()) {
      errors.push({ row: rowNum, field: 'canonical_name', message: 'canonical_name is required' });
    } else if (names.has(row.canonical_name.trim())) {
      errors.push({
        row: rowNum,
        field: 'canonical_name',
        message: `duplicate canonical_name: "${row.canonical_name.trim()}"`,
      });
    } else {
      names.add(row.canonical_name.trim());
    }

    if (!row.link?.trim()) {
      errors.push({ row: rowNum, field: 'link', message: 'link is required' });
    }
  }

  return errors;
}

export function validateTagRows(rows: TagCsvRow[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const keys = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    if (!row.key?.trim()) {
      errors.push({ row: rowNum, field: 'key', message: 'key is required' });
    } else if (keys.has(row.key.trim())) {
      errors.push({ row: rowNum, field: 'key', message: `duplicate tag key: "${row.key.trim()}"` });
    } else {
      keys.add(row.key.trim());
    }

    if (!row.type?.trim()) {
      errors.push({ row: rowNum, field: 'type', message: 'type is required' });
    }
  }

  return errors;
}

export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map((e) => `  Row ${e.row}, ${e.field}: ${e.message}`).join('\n');
}
