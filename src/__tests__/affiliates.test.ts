import { describe, it, expect } from 'vitest';
import { buildTestApp } from './helpers/setup.js';
import type { AffiliateRow } from '../db/repositories/affiliate-repository.js';

const now = new Date();

const sampleProduct: AffiliateRow = {
  id: 1,
  canonicalName: 'minyak goreng',
  link: 'https://affiliate.example.com/minyak-goreng',
  aliases: ['cooking oil', 'vegetable oil'],
  category: 'oil',
  createdAt: now,
  updatedAt: now,
};

describe('GET /affiliates', () => {
  it('returns a list of affiliate products', async () => {
    const app = await buildTestApp({
      affiliateRepo: {
        findAll: async () => [sampleProduct],
      },
    });

    const response = await app.inject({ method: 'GET', url: '/affiliates' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveLength(1);
    expect(body[0].canonicalName).toBe('minyak goreng');
  });
});

describe('GET /affiliates/:id', () => {
  it('returns affiliate product by id', async () => {
    const app = await buildTestApp({
      affiliateRepo: {
        findById: async (id) => (id === 1 ? sampleProduct : undefined),
      },
    });

    const response = await app.inject({ method: 'GET', url: '/affiliates/1' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.canonicalName).toBe('minyak goreng');
    expect(body.link).toBe('https://affiliate.example.com/minyak-goreng');
  });

  it('returns 404 for non-existent affiliate', async () => {
    const app = await buildTestApp();

    const response = await app.inject({ method: 'GET', url: '/affiliates/99999' });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe('Affiliate product not found');
  });

  it('returns 400 for invalid id', async () => {
    const app = await buildTestApp();

    const response = await app.inject({ method: 'GET', url: '/affiliates/abc' });

    expect(response.statusCode).toBe(400);
  });
});

describe('GET /affiliates/match', () => {
  it('returns exact match', async () => {
    const app = await buildTestApp({
      affiliateRepo: {
        matchIngredient: async (name) =>
          name === 'minyak goreng' ? { product: sampleProduct, matchType: 'exact' } : undefined,
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/affiliates/match?ingredient=minyak goreng',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.matchType).toBe('exact');
    expect(body.product.canonicalName).toBe('minyak goreng');
  });

  it('returns alias match', async () => {
    const app = await buildTestApp({
      affiliateRepo: {
        matchIngredient: async (name) =>
          name === 'garlic'
            ? {
                product: {
                  ...sampleProduct,
                  id: 2,
                  canonicalName: 'bawang putih',
                  aliases: ['garlic'],
                },
                matchType: 'alias',
              }
            : undefined,
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/affiliates/match?ingredient=garlic',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().matchType).toBe('alias');
  });

  it('returns fuzzy match for typos', async () => {
    const app = await buildTestApp({
      affiliateRepo: {
        matchIngredient: async (name) =>
          name === 'mnyak'
            ? {
                product: { ...sampleProduct, canonicalName: 'minyak goreng' },
                matchType: 'fuzzy',
              }
            : undefined,
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/affiliates/match?ingredient=mnyak',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().matchType).toBe('fuzzy');
  });

  it('returns 400 when ingredient param is missing', async () => {
    const app = await buildTestApp();

    const response = await app.inject({ method: 'GET', url: '/affiliates/match' });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain('Missing or invalid');
  });

  it('returns 400 when ingredient exceeds max length', async () => {
    const app = await buildTestApp();
    const longIngredient = 'a'.repeat(201);

    const response = await app.inject({
      method: 'GET',
      url: `/affiliates/match?ingredient=${longIngredient}`,
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns 404 when no match found', async () => {
    const app = await buildTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/affiliates/match?ingredient=nonexistent',
    });

    expect(response.statusCode).toBe(404);
  });
});
