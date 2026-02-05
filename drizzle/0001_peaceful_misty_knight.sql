ALTER TABLE "affiliate_products" ADD COLUMN "partner" text DEFAULT 'tokopedia' NOT NULL;--> statement-breakpoint
ALTER TABLE "affiliate_products" ADD COLUMN "search_url_template" text;