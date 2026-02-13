import { eq, ilike, sql } from 'drizzle-orm';
import type { Database } from '../connection.js';
import { affiliateProducts } from '../schema/index.js';

export interface AffiliateRow {
  id: number;
  canonicalName: string;
  link: string;
  aliases: string[] | null;
  category: string | null;
  partner: string;
  searchUrlTemplate: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateMatch {
  product: AffiliateRow;
  matchType: 'exact' | 'alias' | 'fuzzy';
}

export interface CatalogProduct {
  ingredient: string;
  link: string;
  aliases: string[] | null;
  partner: string;
  searchUrlTemplate: string | null;
}

export interface AffiliateRepository {
  findAll(): Promise<AffiliateRow[]>;
  findById(id: number): Promise<AffiliateRow | undefined>;
  findCatalog(): Promise<CatalogProduct[]>;
  matchIngredient(name: string): Promise<AffiliateMatch | undefined>;
}

export function createAffiliateRepository(db: Database): AffiliateRepository {
  return {
    async findAll() {
      return db.select().from(affiliateProducts);
    },

    async findCatalog(): Promise<CatalogProduct[]> {
      const rows = await db
        .select()
        .from(affiliateProducts)
        .orderBy(affiliateProducts.canonicalName);
      return rows.map((r) => ({
        ingredient: r.canonicalName,
        link: r.link,
        aliases: r.aliases,
        partner: r.partner,
        searchUrlTemplate: r.searchUrlTemplate,
      }));
    },

    async findById(id: number) {
      const rows = await db.select().from(affiliateProducts).where(eq(affiliateProducts.id, id));
      return rows[0];
    },

    async matchIngredient(name: string): Promise<AffiliateMatch | undefined> {
      const normalized = name.toLowerCase().trim();

      // 1. Exact match on canonical_name
      const exactRows = await db
        .select()
        .from(affiliateProducts)
        .where(ilike(affiliateProducts.canonicalName, normalized));
      if (exactRows[0]) {
        return { product: exactRows[0], matchType: 'exact' };
      }

      // 2. Alias match — check if any alias matches
      const aliasRows = await db
        .select()
        .from(affiliateProducts)
        .where(sql`${normalized} = ANY(lower(${affiliateProducts.aliases}::text)::text[])`);
      if (aliasRows[0]) {
        return { product: aliasRows[0], matchType: 'alias' };
      }

      // 3. Fuzzy match via pg_trgm word_similarity — handles typos like "mnyak" -> "minyak goreng"
      const fuzzyRows = await db
        .select()
        .from(affiliateProducts)
        .where(sql`word_similarity(${normalized}, ${affiliateProducts.canonicalName}) > 0.4`)
        .orderBy(sql`word_similarity(${normalized}, ${affiliateProducts.canonicalName}) DESC`)
        .limit(1);
      if (fuzzyRows[0]) {
        return { product: fuzzyRows[0], matchType: 'fuzzy' };
      }

      return undefined;
    },
  };
}
