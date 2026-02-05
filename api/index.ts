import * as dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { IncomingMessage } from 'http';
import type { InjectOptions } from 'fastify';
import { buildApp } from '../src/app.js';
import { createDb } from '../src/db/connection.js';
import { createRecipeRepository } from '../src/db/repositories/recipe-repository.js';
import { createAffiliateRepository } from '../src/db/repositories/affiliate-repository.js';

// Disable Vercel's body parser so we can forward the raw body to Fastify.
// This preserves multipart boundaries that @fastify/multipart needs intact.
export const config = {
  api: {
    bodyParser: false,
  },
};

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

function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();

  // DEBUG: log what Vercel provides for the request body
  console.log('[debug] req.body type:', typeof req.body);
  console.log('[debug] req.body isBuffer:', Buffer.isBuffer(req.body));
  console.log('[debug] req.readable:', req.readable);
  console.log('[debug] content-type:', req.headers['content-type']);

  const rawBody = await readRawBody(req);
  console.log('[debug] rawBody length:', rawBody.length);

  // Strip content-length — app.inject() recalculates it from the payload.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { 'content-length': _cl, ...headers } = req.headers as Record<string, string>;

  const injectOpts: InjectOptions = {
    method: req.method as InjectOptions['method'],
    url: req.url as string,
    headers,
    payload: rawBody.length > 0 ? rawBody : undefined,
  };

  const response = await app.inject(injectOpts);

  res.status(response.statusCode);
  for (const [key, value] of Object.entries(response.headers)) {
    if (value) res.setHeader(key, value as string);
  }
  res.send(response.body);
}
