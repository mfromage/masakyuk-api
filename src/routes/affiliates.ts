import type { FastifyInstance } from 'fastify';
import { importAffiliatesCsv, CsvValidationError } from '../db/import-service.js';

export async function affiliateRoutes(app: FastifyInstance) {
  // POST /affiliates/import — bulk import affiliate products from CSV
  app.post('/import', async (request, reply) => {
    if (!app.db) {
      return reply.status(500).send({ error: 'Import failed' });
    }

    const file = await request.file();
    if (!file) {
      return reply.status(400).send({ error: 'Validation failed', details: ['No file uploaded'] });
    }
    const csvContent = (await file.toBuffer()).toString('utf-8');

    try {
      const result = await importAffiliatesCsv(app.db, csvContent);
      return { imported: result.imported };
    } catch (err) {
      if (err instanceof CsvValidationError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: err.errors.map((e) => `Row ${e.row}, ${e.field}: ${e.message}`),
        });
      }
      request.log.error(err, 'Affiliate import failed');
      return reply.status(500).send({ error: 'Import failed' });
    }
  });

  // GET /affiliates/match?ingredient=... — match ingredient to affiliate
  // IMPORTANT: Register before /:id to prevent "match" being captured as an id
  app.get<{ Querystring: { ingredient?: string } }>('/match', async (request, reply) => {
    const { ingredient } = request.query;
    if (!ingredient || ingredient.length > 200) {
      return reply
        .status(400)
        .send({ error: 'Missing or invalid query parameter: ingredient (max 200 chars)' });
    }

    const match = await app.affiliateRepo.matchIngredient(ingredient);
    if (!match) {
      return reply.status(404).send({ error: 'No matching affiliate product found' });
    }

    return {
      product: match.product,
      matchType: match.matchType,
    };
  });

  // GET /affiliates — affiliate product catalog
  app.get('/', async () => {
    return app.affiliateRepo.findCatalog();
  });

  // GET /affiliates/:id — single affiliate product
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: 'Invalid affiliate id' });
    }

    const product = await app.affiliateRepo.findById(id);
    if (!product) {
      return reply.status(404).send({ error: 'Affiliate product not found' });
    }

    return product;
  });
}
