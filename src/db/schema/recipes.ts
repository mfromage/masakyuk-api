import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  cookingTimeMinutes: integer('cooking_time_minutes'),
  source: text('source'),
  allergies: text('allergies'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const recipeIngredients = pgTable(
  'recipe_ingredients',
  {
    id: serial('id').primaryKey(),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    isMain: boolean('is_main').default(false).notNull(),
    position: integer('position').default(0).notNull(),
  },
  (table) => [index('recipe_ingredients_recipe_id_idx').on(table.recipeId)],
);

export const recipeSteps = pgTable(
  'recipe_steps',
  {
    id: serial('id').primaryKey(),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    position: integer('position').default(0).notNull(),
  },
  (table) => [index('recipe_steps_recipe_id_idx').on(table.recipeId)],
);

export const recipeImages = pgTable(
  'recipe_images',
  {
    id: serial('id').primaryKey(),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    position: integer('position').default(0).notNull(),
  },
  (table) => [index('recipe_images_recipe_id_idx').on(table.recipeId)],
);

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  type: text('type').notNull(),
  labelEn: text('label_en'),
  labelId: text('label_id'),
});

export const recipeTags = pgTable(
  'recipe_tags',
  {
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.recipeId, table.tagId] })],
);

// Relations
export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  steps: many(recipeSteps),
  images: many(recipeImages),
  recipeTags: many(recipeTags),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeStepsRelations = relations(recipeSteps, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeSteps.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeImagesRelations = relations(recipeImages, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeImages.recipeId],
    references: [recipes.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  recipeTags: many(recipeTags),
}));

export const recipeTagsRelations = relations(recipeTags, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeTags.recipeId],
    references: [recipes.id],
  }),
  tag: one(tags, {
    fields: [recipeTags.tagId],
    references: [tags.id],
  }),
}));
