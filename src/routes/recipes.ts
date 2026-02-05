import type { FastifyInstance } from 'fastify';

export async function recipeRoutes(app: FastifyInstance) {
  // GET /recipes — list all recipes
  app.get('/', async () => {
    return app.recipeRepo.findAll();
  });

  // GET /recipes/all — all recipes with full details (compressed)
  app.get('/all', async () => {
    return app.recipeRepo.findAllWithRelations();
  });

  // GET /recipes/:id — recipe with full relations
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: 'Invalid recipe id' });
    }

    const recipe = await app.recipeRepo.findWithRelations(id);
    if (!recipe) {
      return reply.status(404).send({ error: 'Recipe not found' });
    }

    return recipe;
  });

  // GET /recipes/:id/with-affiliates — recipe with affiliate-enriched ingredients
  app.get<{ Params: { id: string } }>('/:id/with-affiliates', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: 'Invalid recipe id' });
    }

    const recipe = await app.recipeRepo.findWithRelations(id);
    if (!recipe) {
      return reply.status(404).send({ error: 'Recipe not found' });
    }

    const enrichedIngredients = await Promise.all(
      recipe.ingredients.map(async (ingredient) => {
        const match = await app.affiliateRepo.matchIngredient(ingredient.name);
        return {
          ...ingredient,
          affiliateLink: match?.product.link ?? null,
          affiliateMatchType: match?.matchType ?? null,
        };
      }),
    );

    return {
      ...recipe,
      ingredients: enrichedIngredients,
    };
  });
}
