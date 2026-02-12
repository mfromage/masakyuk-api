import { eq, inArray } from 'drizzle-orm';
import type { Database } from '../connection.js';
import { recipes, recipeImages, recipeTags, tags } from '../schema/index.js';

export interface RecipeRow {
  id: number;
  name: string;
  description: string | null;
  cookingTimeMinutes: number | null;
  source: string | null;
  allergies: string | null;
  ingredients: string[];
  steps: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeWithRelations extends RecipeRow {
  images: {
    id: number;
    url: string;
    position: number;
  }[];
  tags: {
    id: number;
    key: string;
    type: string;
    labelEn: string | null;
    labelId: string | null;
  }[];
}

export interface RecipeRepository {
  findAll(): Promise<RecipeRow[]>;
  findAllWithRelations(): Promise<RecipeWithRelations[]>;
  findById(id: number): Promise<RecipeRow | undefined>;
  findWithRelations(id: number): Promise<RecipeWithRelations | undefined>;
}

export function createRecipeRepository(db: Database): RecipeRepository {
  return {
    async findAll() {
      return db.select().from(recipes);
    },

    async findAllWithRelations() {
      const allRecipes = await db.select().from(recipes);
      if (allRecipes.length === 0) return [];

      const recipeIds = allRecipes.map((r) => r.id);

      const [allImages, allTagRows] = await Promise.all([
        db
          .select()
          .from(recipeImages)
          .where(inArray(recipeImages.recipeId, recipeIds))
          .orderBy(recipeImages.recipeId, recipeImages.position),
        db
          .select({
            recipeId: recipeTags.recipeId,
            id: tags.id,
            key: tags.key,
            type: tags.type,
            labelEn: tags.labelEn,
            labelId: tags.labelId,
          })
          .from(recipeTags)
          .innerJoin(tags, eq(recipeTags.tagId, tags.id))
          .where(inArray(recipeTags.recipeId, recipeIds)),
      ]);

      const imagesByRecipe = Map.groupBy(allImages, (img) => img.recipeId);
      const tagsByRecipe = Map.groupBy(allTagRows, (t) => t.recipeId);

      return allRecipes.map((recipe) => ({
        ...recipe,
        images: (imagesByRecipe.get(recipe.id) ?? []).map((img) => ({
          id: img.id,
          url: img.url,
          position: img.position,
        })),
        tags: (tagsByRecipe.get(recipe.id) ?? []).map((t) => ({
          id: t.id,
          key: t.key,
          type: t.type,
          labelEn: t.labelEn,
          labelId: t.labelId,
        })),
      }));
    },

    async findById(id: number) {
      const rows = await db.select().from(recipes).where(eq(recipes.id, id));
      return rows[0];
    },

    async findWithRelations(id: number) {
      const recipe = await db.select().from(recipes).where(eq(recipes.id, id));
      if (!recipe[0]) return undefined;

      const [imageRows, tagRows] = await Promise.all([
        db
          .select()
          .from(recipeImages)
          .where(eq(recipeImages.recipeId, id))
          .orderBy(recipeImages.position),
        db
          .select({
            id: tags.id,
            key: tags.key,
            type: tags.type,
            labelEn: tags.labelEn,
            labelId: tags.labelId,
          })
          .from(recipeTags)
          .innerJoin(tags, eq(recipeTags.tagId, tags.id))
          .where(eq(recipeTags.recipeId, id)),
      ]);

      return {
        ...recipe[0],
        images: imageRows.map((img) => ({
          id: img.id,
          url: img.url,
          position: img.position,
        })),
        tags: tagRows,
      };
    },
  };
}
