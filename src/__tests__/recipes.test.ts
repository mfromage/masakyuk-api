import { describe, it, expect } from 'vitest';
import { buildTestApp } from './helpers/setup.js';
import type { RecipeRow, RecipeWithRelations } from '../db/repositories/recipe-repository.js';
import type { Ingredient } from '../db/schema/recipes.js';

const now = new Date();

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

const sampleRecipeWithRelations: RecipeWithRelations = {
  ...sampleRecipe,
  images: [{ id: 1, url: 'https://example.com/nasi-goreng.jpg', position: 0 }],
  tags: [
    { id: 1, key: 'indonesian', type: 'cuisine', labelEn: 'Indonesian', labelId: 'Indonesia' },
  ],
};

describe('GET /recipes', () => {
  it('returns a list of recipes', async () => {
    const app = await buildTestApp({
      recipeRepo: {
        findAll: async () => [sampleRecipe],
      },
    });

    const response = await app.inject({ method: 'GET', url: '/recipes' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('Nasi Goreng');
  });

  it('returns empty array when no recipes', async () => {
    const app = await buildTestApp();

    const response = await app.inject({ method: 'GET', url: '/recipes' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });
});

describe('GET /recipes/all', () => {
  it('returns all recipes with full relations', async () => {
    const app = await buildTestApp({
      recipeRepo: {
        findAllWithRelations: async () => [sampleRecipeWithRelations],
      },
    });

    const response = await app.inject({ method: 'GET', url: '/recipes/all' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('Nasi Goreng');
    expect(body[0].ingredients).toEqual(sampleIngredients);
    expect(body[0].steps).toEqual(['Heat oil in a wok', 'Add garlic and fry']);
    expect(body[0].images).toHaveLength(1);
    expect(body[0].tags).toHaveLength(1);
  });

  it('returns empty array when no recipes', async () => {
    const app = await buildTestApp();

    const response = await app.inject({ method: 'GET', url: '/recipes/all' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });
});

describe('GET /recipes/:id', () => {
  it('returns recipe with relations', async () => {
    const app = await buildTestApp({
      recipeRepo: {
        findWithRelations: async (id) => (id === 1 ? sampleRecipeWithRelations : undefined),
      },
    });

    const response = await app.inject({ method: 'GET', url: '/recipes/1' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.name).toBe('Nasi Goreng');
    expect(body.ingredients).toEqual(sampleIngredients);
    expect(body.steps).toEqual(['Heat oil in a wok', 'Add garlic and fry']);
    expect(body.images).toHaveLength(1);
    expect(body.tags).toHaveLength(1);
  });

  it('returns 404 for non-existent recipe', async () => {
    const app = await buildTestApp();

    const response = await app.inject({ method: 'GET', url: '/recipes/99999' });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe('Recipe not found');
  });

  it('returns 400 for invalid id', async () => {
    const app = await buildTestApp();

    const response = await app.inject({ method: 'GET', url: '/recipes/abc' });

    expect(response.statusCode).toBe(400);
  });
});

describe('GET /recipes/:id/with-affiliates', () => {
  it('returns recipe with affiliate-enriched ingredients', async () => {
    const app = await buildTestApp({
      recipeRepo: {
        findWithRelations: async (id) => (id === 1 ? sampleRecipeWithRelations : undefined),
      },
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
    });

    const response = await app.inject({ method: 'GET', url: '/recipes/1/with-affiliates' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.ingredients).toHaveLength(3);

    const minyak = body.ingredients.find((i: { name: string }) => i.name === 'minyak goreng');
    expect(minyak.affiliateLink).toBe('https://affiliate.example.com/minyak-goreng');
    expect(minyak.affiliateMatchType).toBe('exact');
    expect(minyak.amount).toBe(2);
    expect(minyak.unit).toBe('sdm');

    const nasi = body.ingredients.find((i: { name: string }) => i.name === 'nasi');
    expect(nasi.affiliateLink).toBeNull();
    expect(nasi.affiliateMatchType).toBeNull();
    expect(nasi.amount).toBe(200);
    expect(nasi.unit).toBe('gram');
  });

  it('returns 404 for non-existent recipe', async () => {
    const app = await buildTestApp();

    const response = await app.inject({ method: 'GET', url: '/recipes/99999/with-affiliates' });

    expect(response.statusCode).toBe(404);
  });
});
