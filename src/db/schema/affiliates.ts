import { pgTable, serial, text, timestamp, index } from 'drizzle-orm/pg-core';

export const affiliateProducts = pgTable(
  'affiliate_products',
  {
    id: serial('id').primaryKey(),
    canonicalName: text('canonical_name').notNull().unique(),
    link: text('link').notNull(),
    aliases: text('aliases').array(),
    category: text('category'),
    partner: text('partner').notNull().default('tokopedia'),
    searchUrlTemplate: text('search_url_template'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('affiliate_products_canonical_name_idx').on(table.canonicalName)],
);
