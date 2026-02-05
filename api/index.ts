import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { InjectOptions } from 'fastify';
import { buildApp } from '../src/app.js';
import { createDb } from '../src/db/connection.js';
import { createRecipeRepository } from '../src/db/repositories/recipe-repository.js';
import { createAffiliateRepository } from '../src/db/repositories/affiliate-repository.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const db = createDb(databaseUrl);
const recipeRepo = createRecipeRepository(db);
const affiliateRepo = createAffiliateRepository(db);

let appPromise: ReturnType<typeof buildApp> | null = null;

function getApp() {
  if (!appPromise) {
    appPromise = buildApp({ recipeRepo, affiliateRepo, logger: true });
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();

  const injectOpts: InjectOptions = {
    method: req.method as InjectOptions['method'],
    url: req.url as string,
    headers: req.headers as Record<string, string>,
    payload: req.body as string,
  };

  const response = await app.inject(injectOpts);

  res.status(response.statusCode);
  for (const [key, value] of Object.entries(response.headers)) {
    if (value) res.setHeader(key, value as string);
  }
  res.send(response.body);
}
