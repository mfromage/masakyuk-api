import * as dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

import fs from 'node:fs';
import { createDb } from './connection.js';
import { TAGS_CSV_PATH, RECIPES_CSV_PATH, AFFILIATES_CSV_PATH } from './csv-helpers.js';
import {
  importTagsCsv,
  importRecipesCsv,
  importAffiliatesCsv,
  CsvValidationError,
} from './import-service.js';

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}
const db = createDb(process.env.DATABASE_URL);

async function importCsv() {
  console.log('Importing CSV to database...');

  const tagsCsv = fs.readFileSync(TAGS_CSV_PATH, 'utf-8');
  const recipesCsv = fs.readFileSync(RECIPES_CSV_PATH, 'utf-8');
  const affiliatesCsv = fs.readFileSync(AFFILIATES_CSV_PATH, 'utf-8');

  const tagResult = await importTagsCsv(db, tagsCsv);
  console.log(`  Imported ${tagResult.imported} tags`);

  const recipeResult = await importRecipesCsv(db, recipesCsv);
  console.log(`  Imported ${recipeResult.imported} recipes`);

  const affiliateResult = await importAffiliatesCsv(db, affiliatesCsv);
  console.log(`  Imported ${affiliateResult.imported} affiliates`);

  console.log('Import complete!');
  process.exit(0);
}

importCsv().catch((err) => {
  if (err instanceof CsvValidationError) {
    console.error('Validation errors:');
    for (const e of err.errors) {
      console.error(`  Row ${e.row}, ${e.field}: ${e.message}`);
    }
    process.exit(1);
  }
  console.error('Import failed:', err);
  process.exit(1);
});
