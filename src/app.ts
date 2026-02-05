import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type { RecipeRepository } from './db/repositories/recipe-repository.js';
import type { AffiliateRepository } from './db/repositories/affiliate-repository.js';
import type { Database } from './db/connection.js';
import { recipeRoutes } from './routes/recipes.js';
import { affiliateRoutes } from './routes/affiliates.js';
import { tagRoutes } from './routes/tags.js';

export interface BuildAppOptions {
  recipeRepo: RecipeRepository;
  affiliateRepo: AffiliateRepository;
  db?: Database;
  logger?: boolean;
}

export async function buildApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? false });

  await app.register(cors);

  app.decorate('recipeRepo', opts.recipeRepo);
  app.decorate('affiliateRepo', opts.affiliateRepo);
  if (opts.db) {
    app.decorate('db', opts.db);
  }

  // Parse text/csv bodies as raw strings
  app.addContentTypeParser('text/csv', { parseAs: 'string' }, (_req, body, done) => {
    done(null, body);
  });

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  await app.register(tagRoutes, { prefix: '/tags' });
  await app.register(recipeRoutes, { prefix: '/recipes' });
  await app.register(affiliateRoutes, { prefix: '/affiliates' });

  return app;
}
