CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX "affiliate_products_canonical_name_trgm_idx"
  ON "affiliate_products"
  USING gin ("canonical_name" gin_trgm_ops);
