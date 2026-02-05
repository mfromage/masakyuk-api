import * as dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

import fs from 'node:fs';
import { eq, inArray } from 'drizzle-orm';
import Papa from 'papaparse';
import { createDb } from './connection.js';
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeImages,
  recipeTags,
  tags,
  affiliateProducts,
} from './schema/index.js';
import {
  DATA_DIR,
  RECIPES_CSV_PATH,
  AFFILIATES_CSV_PATH,
  TAGS_CSV_PATH,
  type IngredientJson,
  type StepJson,
  type ImageJson,
} from './csv-helpers.js';

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}
const db = createDb(process.env.DATABASE_URL);

async function exportCsv() {
  console.log('Exporting database to CSV...');
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // ── Tags ──
  const allTags = await db.select().from(tags).orderBy(tags.type, tags.key);
  const tagsCsv = Papa.unparse(
    allTags.map((t) => ({
      key: t.key,
      type: t.type,
      label_en: t.labelEn ?? '',
      label_id: t.labelId ?? '',
    })),
  );
  fs.writeFileSync(TAGS_CSV_PATH, tagsCsv + '\n');
  console.log(`  tags.csv: ${allTags.length} rows`);

  // ── Recipes (denormalized) ──
  const allRecipes = await db.select().from(recipes).orderBy(recipes.name);

  if (allRecipes.length > 0) {
    const recipeIds = allRecipes.map((r) => r.id);

    const [allIngredients, allSteps, allImages, allTagRows] = await Promise.all([
      db
        .select()
        .from(recipeIngredients)
        .where(inArray(recipeIngredients.recipeId, recipeIds))
        .orderBy(recipeIngredients.recipeId, recipeIngredients.position),
      db
        .select()
        .from(recipeSteps)
        .where(inArray(recipeSteps.recipeId, recipeIds))
        .orderBy(recipeSteps.recipeId, recipeSteps.position),
      db
        .select()
        .from(recipeImages)
        .where(inArray(recipeImages.recipeId, recipeIds))
        .orderBy(recipeImages.recipeId, recipeImages.position),
      db
        .select({
          recipeId: recipeTags.recipeId,
          key: tags.key,
        })
        .from(recipeTags)
        .innerJoin(tags, eq(recipeTags.tagId, tags.id))
        .where(inArray(recipeTags.recipeId, recipeIds)),
    ]);

    const ingredientsByRecipe = Map.groupBy(allIngredients, (i) => i.recipeId);
    const stepsByRecipe = Map.groupBy(allSteps, (s) => s.recipeId);
    const imagesByRecipe = Map.groupBy(allImages, (img) => img.recipeId);
    const tagsByRecipe = Map.groupBy(allTagRows, (t) => t.recipeId);

    const recipeRows = allRecipes.map((r) => {
      const ingredients: IngredientJson[] = (ingredientsByRecipe.get(r.id) ?? []).map((i) => ({
        name: i.name,
        isMain: i.isMain,
        position: i.position,
      }));
      const steps: StepJson[] = (stepsByRecipe.get(r.id) ?? []).map((s) => ({
        description: s.description,
        position: s.position,
      }));
      const images: ImageJson[] = (imagesByRecipe.get(r.id) ?? []).map((img) => ({
        url: img.url,
        position: img.position,
      }));
      const tagKeys = (tagsByRecipe.get(r.id) ?? [])
        .map((t) => t.key)
        .sort()
        .join(',');

      return {
        name: r.name,
        description: r.description ?? '',
        cooking_time_minutes: r.cookingTimeMinutes?.toString() ?? '',
        source: r.source ?? '',
        allergies: r.allergies ?? '',
        ingredients: JSON.stringify(ingredients),
        steps: JSON.stringify(steps),
        images: JSON.stringify(images),
        tags: tagKeys,
      };
    });

    const recipesCsv = Papa.unparse(recipeRows);
    fs.writeFileSync(RECIPES_CSV_PATH, recipesCsv + '\n');
    console.log(`  recipes.csv: ${recipeRows.length} rows`);
  } else {
    fs.writeFileSync(
      RECIPES_CSV_PATH,
      'name,description,cooking_time_minutes,source,allergies,ingredients,steps,images,tags\n',
    );
    console.log('  recipes.csv: 0 rows');
  }

  // ── Affiliates ──
  const allAffiliates = await db
    .select()
    .from(affiliateProducts)
    .orderBy(affiliateProducts.canonicalName);

  const affiliateRows = allAffiliates.map((a) => ({
    canonical_name: a.canonicalName,
    link: a.link,
    category: a.category ?? '',
    aliases: (a.aliases ?? []).join('|'),
  }));

  const affiliatesCsv = Papa.unparse(affiliateRows);
  fs.writeFileSync(AFFILIATES_CSV_PATH, affiliatesCsv + '\n');
  console.log(`  affiliates.csv: ${affiliateRows.length} rows`);

  console.log('Export complete!');
  process.exit(0);
}

exportCsv().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
