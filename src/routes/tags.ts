import type { FastifyInstance } from 'fastify';
import { importTagsCsv, CsvValidationError } from '../db/import-service.js';

export async function tagRoutes(app: FastifyInstance) {
  // POST /tags/import — bulk import tags from CSV
  app.post('/import', async (request, reply) => {
    if (!app.db) {
      return reply.status(500).send({ error: 'Import failed' });
    }

    const csvContent = request.body as string;
    if (!csvContent) {
      return reply.status(400).send({ error: 'Validation failed', details: ['Empty CSV body'] });
    }

    try {
      const result = await importTagsCsv(app.db, csvContent);
      return { imported: result.imported };
    } catch (err) {
      if (err instanceof CsvValidationError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: err.errors.map((e) => `Row ${e.row}, ${e.field}: ${e.message}`),
        });
      }
      request.log.error(err, 'Tag import failed');
      return reply.status(500).send({ error: 'Import failed' });
    }
  });
}
