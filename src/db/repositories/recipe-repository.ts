import { eq, inArray } from 'drizzle-orm';
import type { Database } from '../connection.js';
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeImages,
  recipeTags,
  tags,
} from '../schema/index.js';

export interface RecipeRow {
  id: number;
  name: string;
  description: string | null;
  cookingTimeMinutes: number | null;
  source: string | null;
  allergies: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeWithRelations extends RecipeRow {
  ingredients: {
    id: number;
    name: string;
    isMain: boolean;
    position: number;
  }[];
  steps: {
    id: number;
    description: string;
    position: number;
  }[];
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

      // Group by recipeId
      const ingredientsByRecipe = Map.groupBy(allIngredients, (i) => i.recipeId);
      const stepsByRecipe = Map.groupBy(allSteps, (s) => s.recipeId);
      const imagesByRecipe = Map.groupBy(allImages, (img) => img.recipeId);
      const tagsByRecipe = Map.groupBy(allTagRows, (t) => t.recipeId);

      return allRecipes.map((recipe) => ({
        ...recipe,
        ingredients: (ingredientsByRecipe.get(recipe.id) ?? []).map((i) => ({
          id: i.id,
          name: i.name,
          isMain: i.isMain,
          position: i.position,
        })),
        steps: (stepsByRecipe.get(recipe.id) ?? []).map((s) => ({
          id: s.id,
          description: s.description,
          position: s.position,
        })),
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

      const [ingredientRows, stepRows, imageRows, tagRows] = await Promise.all([
        db
          .select()
          .from(recipeIngredients)
          .where(eq(recipeIngredients.recipeId, id))
          .orderBy(recipeIngredients.position),
        db
          .select()
          .from(recipeSteps)
          .where(eq(recipeSteps.recipeId, id))
          .orderBy(recipeSteps.position),
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
        ingredients: ingredientRows.map((i) => ({
          id: i.id,
          name: i.name,
          isMain: i.isMain,
          position: i.position,
        })),
        steps: stepRows.map((s) => ({
          id: s.id,
          description: s.description,
          position: s.position,
        })),
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
