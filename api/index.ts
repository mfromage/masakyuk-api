import * as dotenv from 'dotenv';
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
    appPromise = buildApp({ recipeRepo, affiliateRepo, db, logger: true });
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();

  // Strip content-length: Vercel already parsed the body, so the original
  // header no longer matches the payload size. app.inject() recalculates it.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { 'content-length': _cl, ...headers } = req.headers as Record<string, string>;

  // Vercel may provide req.body as Buffer, string, parsed object, or undefined
  // depending on Content-Type. Keep Buffer raw for multipart boundaries.
  let payload: string | Buffer | undefined;
  if (Buffer.isBuffer(req.body)) {
    payload = req.body;
  } else if (typeof req.body === 'string') {
    payload = req.body;
  } else if (req.body != null) {
    payload = JSON.stringify(req.body);
  }

  const injectOpts: InjectOptions = {
    method: req.method as InjectOptions['method'],
    url: req.url as string,
    headers,
    payload,
  };

  const response = await app.inject(injectOpts);

  res.status(response.statusCode);
  for (const [key, value] of Object.entries(response.headers)) {
    if (value) res.setHeader(key, value as string);
  }
  res.send(response.body);
}
