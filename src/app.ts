import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type { RecipeRepository } from './db/repositories/recipe-repository.js';
import type { AffiliateRepository } from './db/repositories/affiliate-repository.js';
import { recipeRoutes } from './routes/recipes.js';
import { affiliateRoutes } from './routes/affiliates.js';

export interface BuildAppOptions {
  recipeRepo: RecipeRepository;
  affiliateRepo: AffiliateRepository;
  logger?: boolean;
}

export async function buildApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? false });

  await app.register(cors);

  app.decorate('recipeRepo', opts.recipeRepo);
  app.decorate('affiliateRepo', opts.affiliateRepo);

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  await app.register(recipeRoutes, { prefix: '/recipes' });
  await app.register(affiliateRoutes, { prefix: '/affiliates' });

  return app;
}
