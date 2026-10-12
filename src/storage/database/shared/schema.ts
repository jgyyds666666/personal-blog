import { pgTable, serial, timestamp, index, unique, pgPolicy, varchar, text, check, uuid, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import type { DocumentAsset } from '@/lib/document-types';



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const posts = pgTable("posts", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	slug: varchar({ length: 128 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	excerpt: varchar({ length: 500 }),
	content: text().default(sql`''`).notNull(),
	tags: text().array().default(sql`ARRAY[]::text[]`).notNull(),
	status: varchar({ length: 20 }).default('published').notNull(),
	cover_image_key: varchar("cover_image_key", { length: 255 }),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("posts_created_at_idx").using("btree", table.created_at.asc().nullsLast().op("timestamptz_ops")),
	index("posts_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("posts_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("posts_slug_unique").on(table.slug),
	pgPolicy("Enable read access for published posts", { as: "permissive", for: "select", to: ["public"], using: sql`((status)::text = 'published'::text)` }),
]);

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export const privateDocuments = pgTable("private_documents", {
	id: uuid().primaryKey().notNull(),
	title: text().default('未命名文档').notNull(),
	excerpt: text(),
	content: text().default(sql`''`).notNull(),
	format: text().notNull(),
	original_name: text("original_name").notNull(),
	original_key: text("original_key").notNull(),
	assets: jsonb('assets').$type<DocumentAsset[]>().notNull().default(sql`'[]'::jsonb`),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("private_documents_format_check", sql`format = ANY (ARRAY['md'::text, 'txt'::text, 'docx'::text])`),
	index("private_documents_created_at_idx").on(table.created_at),
]);