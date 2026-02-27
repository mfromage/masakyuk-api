-- Add temporary jsonb column
ALTER TABLE "recipes" ADD COLUMN "ingredients_new" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint

-- Migrate existing text[] data to jsonb objects: each string -> {name, amount: 0, unit: ""}
UPDATE "recipes"
SET "ingredients_new" = (
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('name', elem, 'amount', 0, 'unit', '')),
    '[]'::jsonb
  )
  FROM unnest("ingredients") AS elem
);--> statement-breakpoint

-- Drop old column and rename new one
ALTER TABLE "recipes" DROP COLUMN "ingredients";--> statement-breakpoint
ALTER TABLE "recipes" RENAME COLUMN "ingredients_new" TO "ingredients";
