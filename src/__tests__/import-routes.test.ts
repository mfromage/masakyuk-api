import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildTestApp } from './helpers/setup.js';
import type { Database } from '../db/connection.js';

// Mock the import service module
vi.mock('../db/import-service.js', () => ({
  importTagsCsv: vi.fn(),
  importRecipesCsv: vi.fn(),
  importAffiliatesCsv: vi.fn(),
  CsvValidationError: class CsvValidationError extends Error {
    public errors: Array<{ row: number; field: string; message: string }>;
    constructor(errors: Array<{ row: number; field: string; message: string }>) {
      super('Validation failed');
      this.name = 'CsvValidationError';
      this.errors = errors;
    }
  },
}));

// Import after mocking
import {
  importTagsCsv,
  importRecipesCsv,
  importAffiliatesCsv,
  CsvValidationError,
} from '../db/import-service.js';

const mockImportTags = vi.mocked(importTagsCsv);
const mockImportRecipes = vi.mocked(importRecipesCsv);
const mockImportAffiliates = vi.mocked(importAffiliatesCsv);

// Minimal mock db — the real DB calls are mocked at the service level
const mockDb = {} as Database;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /tags/import', () => {
  it('returns 200 with imported count on valid CSV', async () => {
    mockImportTags.mockResolvedValue({ imported: 3 });
    const app = await buildTestApp({ db: mockDb });

    const response = await app.inject({
      method: 'POST',
      url: '/tags/import',
      headers: { 'content-type': 'text/csv' },
      payload:
        'key,type,label_en,label_id\njapanese,cuisine,Japanese,Jepang\nkorean,cuisine,Korean,Korea\nquick,time,Quick,Cepat',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ imported: 3 });
    expect(mockImportTags).toHaveBeenCalledOnce();
  });

  it('returns 400 on validation error', async () => {
    mockImportTags.mockRejectedValue(
      new CsvValidationError([{ row: 2, field: 'key', message: 'key is required' }]),
    );
    const app = await buildTestApp({ db: mockDb });

    const response = await app.inject({
      method: 'POST',
      url: '/tags/import',
      headers: { 'content-type': 'text/csv' },
      payload: 'key,type,label_en,label_id\n,cuisine,Japanese,Jepang',
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details).toHaveLength(1);
    expect(body.details[0]).toContain('key is required');
  });

  it('returns 400 on empty body', async () => {
    const app = await buildTestApp({ db: mockDb });

    const response = await app.inject({
      method: 'POST',
      url: '/tags/import',
      headers: { 'content-type': 'text/csv' },
      payload: '',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('Validation failed');
  });

  it('returns 500 on DB error', async () => {
    mockImportTags.mockRejectedValue(new Error('connection refused'));
    const app = await buildTestApp({ db: mockDb });

    const response = await app.inject({
      method: 'POST',
      url: '/tags/import',
      headers: { 'content-type': 'text/csv' },
      payload: 'key,type,label_en,label_id\njapanese,cuisine,Japanese,Jepang',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().error).toBe('Import failed');
  });

  it('returns 500 when db is not configured', async () => {
    const app = await buildTestApp(); // no db

    const response = await app.inject({
      method: 'POST',
      url: '/tags/import',
      headers: { 'content-type': 'text/csv' },
      payload: 'key,type,label_en,label_id\njapanese,cuisine,Japanese,Jepang',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().error).toBe('Import failed');
  });
});

describe('POST /recipes/import', () => {
  it('returns 200 with imported count on valid CSV', async () => {
    mockImportRecipes.mockResolvedValue({ imported: 2 });
    const app = await buildTestApp({ db: mockDb });

    const response = await app.inject({
      method: 'POST',
      url: '/recipes/import',
      headers: { 'content-type': 'text/csv' },
      payload:
        'name,description,cooking_time_minutes,source,allergies,ingredients,steps,images,tags\nNasi Goreng,Fried rice,30,,,,[],[],""\nMie Ayam,Chicken noodles,25,,,,[],[],""',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ imported: 2 });
    expect(mockImportRecipes).toHaveBeenCalledOnce();
  });

  it('returns 400 on validation error', async () => {
    mockImportRecipes.mockRejectedValue(
      new CsvValidationError([{ row: 2, field: 'name', message: 'name is required' }]),
    );
    const app = await buildTestApp({ db: mockDb });

    const response = await app.inject({
      method: 'POST',
      url: '/recipes/import',
      headers: { 'content-type': 'text/csv' },
      payload: 'name,description\n,desc',
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details[0]).toContain('name is required');
  });

  it('returns 400 on unknown tag key', async () => {
    mockImportRecipes.mockRejectedValue(
      new CsvValidationError([{ row: 2, field: 'tags', message: 'unknown tag key "nonexistent"' }]),
    );
    const app = await buildTestApp({ db: mockDb });

    const response = await app.inject({
      method: 'POST',
      url: '/recipes/import',
      headers: { 'content-type': 'text/csv' },
      payload:
        'name,description,cooking_time_minutes,source,allergies,ingredients,steps,images,tags\nNasi Goreng,,,,,,[],[],nonexistent',
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details[0]).toContain('unknown tag key');
  });

  it('returns 500 on DB error', async () => {
    mockImportRecipes.mockRejectedValue(new Error('connection refused'));
    const app = await buildTestApp({ db: mockDb });

    const response = await app.inject({
      method: 'POST',
      url: '/recipes/import',
      headers: { 'content-type': 'text/csv' },
      payload: 'name,description\nTest,desc',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().error).toBe('Import failed');
  });
});

describe('POST /affiliates/import', () => {
  it('returns 200 with imported count on valid CSV', async () => {
    mockImportAffiliates.mockResolvedValue({ imported: 5 });
    const app = await buildTestApp({ db: mockDb });

    const response = await app.inject({
      method: 'POST',
      url: '/affiliates/import',
      headers: { 'content-type': 'text/csv' },
      payload:
        'canonical_name,link,category,aliases\nMinyak Goreng,https://example.com,oil,cooking oil|vegetable oil',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ imported: 5 });
    expect(mockImportAffiliates).toHaveBeenCalledOnce();
  });

  it('returns 400 on validation error', async () => {
    mockImportAffiliates.mockRejectedValue(
      new CsvValidationError([
        { row: 2, field: 'canonical_name', message: 'canonical_name is required' },
      ]),
    );
    const app = await buildTestApp({ db: mockDb });

    const response = await app.inject({
      method: 'POST',
      url: '/affiliates/import',
      headers: { 'content-type': 'text/csv' },
      payload: 'canonical_name,link,category,aliases\n,https://example.com,oil,',
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details[0]).toContain('canonical_name is required');
  });

  it('returns 500 on DB error', async () => {
    mockImportAffiliates.mockRejectedValue(new Error('connection refused'));
    const app = await buildTestApp({ db: mockDb });

    const response = await app.inject({
      method: 'POST',
      url: '/affiliates/import',
      headers: { 'content-type': 'text/csv' },
      payload: 'canonical_name,link,category,aliases\nTest,https://example.com,,',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().error).toBe('Import failed');
  });
});
