import 'fastify';
import type { RecipeRepository } from '../db/repositories/recipe-repository.js';
import type { AffiliateRepository } from '../db/repositories/affiliate-repository.js';

declare module 'fastify' {
  interface FastifyInstance {
    recipeRepo: RecipeRepository;
    affiliateRepo: AffiliateRepository;
  }
}
