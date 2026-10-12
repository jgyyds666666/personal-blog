import { pgTable, serial, timestamp, varchar, text, index, uuid, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import type { DocumentAsset } from '@/lib/document-types';



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const posts = pgTable("posts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: varchar("excerpt", { length: 500 }),
  content: text("content").notNull().default(""),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  status: varchar("status", { length: 20 }).notNull().default("published"),
  cover_image_key: varchar("cover_image_key", { length: 255 }),
  created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index("posts_slug_idx").on(table.slug),
  index("posts_status_idx").on(table.status),
  index("posts_created_at_idx").on(table.created_at),
]);

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export const privateDocuments = pgTable('private_documents', {
  id: uuid('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  excerpt: varchar('excerpt', { length: 500 }).notNull().default(''),
  format: varchar('format', { length: 4 }).notNull(),
  original_name: text('original_name').notNull(),
  original_key: text('original_key').notNull(),
  content: text('content').notNull(),
  assets: jsonb('assets').$type<DocumentAsset[]>().notNull().default(sql`'[]'::jsonb`),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [index('private_documents_created_at_idx').on(table.created_at)]);
