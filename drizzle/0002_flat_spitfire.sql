DROP TABLE "recipe_ingredients" CASCADE;--> statement-breakpoint
DROP TABLE "recipe_steps" CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "ingredients" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "steps" text[] DEFAULT '{}' NOT NULL;