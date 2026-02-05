import type { FastifyInstance } from 'fastify';
import { importTagsCsv, CsvValidationError } from '../db/import-service.js';

export async function tagRoutes(app: FastifyInstance) {
  // POST /tags/import — bulk import tags from CSV
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
