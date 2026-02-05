import { buildApp } from '../../app.js';
import type {
  RecipeRepository,
  RecipeRow,
  RecipeWithRelations,
} from '../../db/repositories/recipe-repository.js';
import type {
  AffiliateRepository,
  AffiliateRow,
  AffiliateMatch,
} from '../../db/repositories/affiliate-repository.js';
import type { Database } from '../../db/connection.js';

export function createMockRecipeRepo(overrides: Partial<RecipeRepository> = {}): RecipeRepository {
  return {
    findAll: async (): Promise<RecipeRow[]> => [],
    findAllWithRelations: async (): Promise<RecipeWithRelations[]> => [],
    findById: async (): Promise<RecipeRow | undefined> => undefined,
    findWithRelations: async (): Promise<RecipeWithRelations | undefined> => undefined,
    ...overrides,
  };
}

export function createMockAffiliateRepo(
  overrides: Partial<AffiliateRepository> = {},
): AffiliateRepository {
  return {
    findAll: async (): Promise<AffiliateRow[]> => [],
    findById: async (): Promise<AffiliateRow | undefined> => undefined,
    matchIngredient: async (): Promise<AffiliateMatch | undefined> => undefined,
    ...overrides,
  };
}

export async function buildTestApp(opts?: {
  recipeRepo?: Partial<RecipeRepository>;
  affiliateRepo?: Partial<AffiliateRepository>;
  db?: Database;
}) {
  return buildApp({
    recipeRepo: createMockRecipeRepo(opts?.recipeRepo),
    affiliateRepo: createMockAffiliateRepo(opts?.affiliateRepo),
    db: opts?.db,
  });
}
