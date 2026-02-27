import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  index,
  primaryKey,
  jsonb,
} from 'drizzle-orm/pg-core';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  cookingTimeMinutes: integer('cooking_time_minutes'),
  source: text('source'),
  allergies: text('allergies'),
  ingredients: jsonb('ingredients').$type<Ingredient[]>().notNull().default([]),
  steps: text('steps').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

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
  images: many(recipeImages),
  recipeTags: many(recipeTags),
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
