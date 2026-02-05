import { describe, it, expect } from 'vitest';
import { buildTestApp } from './helpers/setup.js';

describe('GET /health', () => {
  it('returns status ok', async () => {
    const app = await buildTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });
});
