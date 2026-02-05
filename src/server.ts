import 'dotenv/config';
import { buildApp } from './app.js';
import { createDb } from './db/connection.js';
import { createRecipeRepository } from './db/repositories/recipe-repository.js';
import { createAffiliateRepository } from './db/repositories/affiliate-repository.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function start() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const db = createDb(databaseUrl);
  const recipeRepo = createRecipeRepository(db);
  const affiliateRepo = createAffiliateRepository(db);

  const app = await buildApp({
    recipeRepo,
    affiliateRepo,
    logger: process.env.NODE_ENV !== 'test',
  });

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
