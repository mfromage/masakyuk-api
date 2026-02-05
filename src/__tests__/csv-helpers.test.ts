import { describe, it, expect } from 'vitest';
import {
  validateRecipeRows,
  validateAffiliateRows,
  validateTagRows,
  formatValidationErrors,
  type RecipeCsvRow,
  type AffiliateCsvRow,
  type TagCsvRow,
} from '../db/csv-helpers.js';

function makeRecipeRow(overrides: Partial<RecipeCsvRow> = {}): RecipeCsvRow {
  return {
    name: 'Nasi Goreng',
    description: 'Fried rice',
    cooking_time_minutes: '20',
    source: 'Traditional',
    allergies: '',
    ingredients: JSON.stringify([{ name: 'rice', isMain: true, position: 0 }]),
    steps: JSON.stringify([{ description: 'Cook rice', position: 0 }]),
    images: JSON.stringify([{ url: 'https://example.com/img.jpg', position: 0 }]),
    tags: 'indonesian,easy',
    ...overrides,
  };
}

function makeAffiliateRow(overrides: Partial<AffiliateCsvRow> = {}): AffiliateCsvRow {
  return {
    canonical_name: 'minyak goreng',
    link: 'https://tokopedia.link/minyak-goreng',
    category: 'oil',
    aliases: 'cooking oil|vegetable oil',
    partner: 'tokopedia',
    search_url_template: 'https://tokopedia.link/search?q=[keyword]',
    ...overrides,
  };
}

function makeTagRow(overrides: Partial<TagCsvRow> = {}): TagCsvRow {
  return {
    key: 'indonesian',
    type: 'cuisine',
    label_en: 'Indonesian',
    label_id: 'Indonesia',
    ...overrides,
  };
}

describe('validateRecipeRows', () => {
  it('returns no errors for valid rows', () => {
    const errors = validateRecipeRows([makeRecipeRow()]);
    expect(errors).toEqual([]);
  });

  it('detects missing name', () => {
    const errors = validateRecipeRows([makeRecipeRow({ name: '' })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ field: 'name', message: 'name is required' });
  });

  it('detects duplicate recipe names', () => {
    const errors = validateRecipeRows([
      makeRecipeRow({ name: 'Nasi Goreng' }),
      makeRecipeRow({ name: 'Nasi Goreng' }),
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      field: 'name',
      message: 'duplicate recipe name: "Nasi Goreng"',
    });
  });

  it('detects non-integer cooking_time_minutes', () => {
    const errors = validateRecipeRows([makeRecipeRow({ cooking_time_minutes: 'abc' })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ field: 'cooking_time_minutes' });
  });

  it('detects negative cooking_time_minutes', () => {
    const errors = validateRecipeRows([makeRecipeRow({ cooking_time_minutes: '-5' })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ field: 'cooking_time_minutes' });
  });

  it('allows empty cooking_time_minutes', () => {
    const errors = validateRecipeRows([makeRecipeRow({ cooking_time_minutes: '' })]);
    expect(errors).toEqual([]);
  });

  it('detects invalid JSON in ingredients', () => {
    const errors = validateRecipeRows([makeRecipeRow({ ingredients: '{not json' })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ field: 'ingredients', message: 'invalid JSON' });
  });

  it('detects non-array JSON in steps', () => {
    const errors = validateRecipeRows([makeRecipeRow({ steps: '"not an array"' })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ field: 'steps', message: 'must be a JSON array' });
  });

  it('detects invalid JSON in images', () => {
    const errors = validateRecipeRows([makeRecipeRow({ images: 'bad' })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ field: 'images', message: 'invalid JSON' });
  });

  it('allows empty JSON columns', () => {
    const errors = validateRecipeRows([makeRecipeRow({ ingredients: '', steps: '', images: '' })]);
    expect(errors).toEqual([]);
  });

  it('reports correct row numbers (1-indexed + header)', () => {
    const errors = validateRecipeRows([makeRecipeRow({ name: 'A' }), makeRecipeRow({ name: '' })]);
    expect(errors[0].row).toBe(3); // row 1 = header, row 2 = first data, row 3 = second data
  });
});

describe('validateAffiliateRows', () => {
  it('returns no errors for valid rows', () => {
    const errors = validateAffiliateRows([makeAffiliateRow()]);
    expect(errors).toEqual([]);
  });

  it('detects missing canonical_name', () => {
    const errors = validateAffiliateRows([makeAffiliateRow({ canonical_name: '' })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ field: 'canonical_name' });
  });

  it('detects missing link', () => {
    const errors = validateAffiliateRows([makeAffiliateRow({ link: '' })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ field: 'link' });
  });

  it('detects missing partner', () => {
    const errors = validateAffiliateRows([makeAffiliateRow({ partner: '' })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ field: 'partner', message: 'partner is required' });
  });

  it('detects duplicate canonical_name', () => {
    const errors = validateAffiliateRows([
      makeAffiliateRow({ canonical_name: 'salt' }),
      makeAffiliateRow({ canonical_name: 'salt' }),
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      field: 'canonical_name',
      message: 'duplicate canonical_name: "salt"',
    });
  });
});

describe('validateTagRows', () => {
  it('returns no errors for valid rows', () => {
    const errors = validateTagRows([makeTagRow()]);
    expect(errors).toEqual([]);
  });

  it('detects missing key', () => {
    const errors = validateTagRows([makeTagRow({ key: '' })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ field: 'key' });
  });

  it('detects missing type', () => {
    const errors = validateTagRows([makeTagRow({ type: '' })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ field: 'type' });
  });

  it('detects duplicate tag keys', () => {
    const errors = validateTagRows([makeTagRow({ key: 'halal' }), makeTagRow({ key: 'halal' })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ field: 'key', message: 'duplicate tag key: "halal"' });
  });
});

describe('formatValidationErrors', () => {
  it('formats errors with row number and field', () => {
    const result = formatValidationErrors([
      { row: 2, field: 'name', message: 'name is required' },
      { row: 3, field: 'link', message: 'link is required' },
    ]);
    expect(result).toBe('  Row 2, name: name is required\n  Row 3, link: link is required');
  });

  it('returns empty string for no errors', () => {
    expect(formatValidationErrors([])).toBe('');
  });
});
