import 'fastify';
import type { RecipeRepository } from '../db/repositories/recipe-repository.js';
import type { AffiliateRepository } from '../db/repositories/affiliate-repository.js';
import type { Database } from '../db/connection.js';

declare module 'fastify' {
  interface FastifyInstance {
    recipeRepo: RecipeRepository;
    affiliateRepo: AffiliateRepository;
    db?: Database;
  }
}
