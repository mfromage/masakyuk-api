import type { FastifyInstance } from 'fastify';

export async function affiliateRoutes(app: FastifyInstance) {
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

  // GET /affiliates — list all affiliate products
  app.get('/', async () => {
    return app.affiliateRepo.findAll();
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
