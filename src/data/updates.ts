// Data update/artikel (panduan, edukasi, dsb.) untuk section "Update" di
// halaman /events-updates.
//
// Sumber data: tabel `updates` di Neon (lihat src/db/schema.ts), diquery
// lewat Drizzle. Pola sama dengan src/data/products.ts & src/data/events.ts.

import { db } from '../db/client';
import { updates as updatesTable, type UpdateRow } from '../db/schema';
import { desc, eq } from 'drizzle-orm';

export interface Update {
  id: string;
  slug: string;
  tag: string;
  title: string;
  excerpt: string;
  meta: string;
  image: string;
  imageAlt: string;
  href: string;
  createdAt: string; // ISO
}

function rowToUpdate(row: UpdateRow): Update {
  return {
    id: row.id,
    slug: row.slug,
    tag: row.tag,
    title: row.title,
    excerpt: row.excerpt,
    meta: row.meta,
    image: row.image,
    imageAlt: row.imageAlt,
    href: row.href,
    createdAt: row.createdAt.toISOString(),
  };
}

async function allUpdates(): Promise<Update[]> {
  const rows = await db.select().from(updatesTable).orderBy(desc(updatesTable.createdAt));
  return rows.map(rowToUpdate);
}

// ---------------------------------------------------------------------------
// Query publik (dipakai /events-updates.astro)
// ---------------------------------------------------------------------------

export async function listUpdates(): Promise<Update[]> {
  return allUpdates();
}

// ---------------------------------------------------------------------------
// Admin CRUD (dipakai src/pages/admin/updates/* dan src/pages/api/admin/updates/*)
// ---------------------------------------------------------------------------

export async function listAllUpdatesAdmin(): Promise<Update[]> {
  return allUpdates();
}

export async function getUpdateByIdAdmin(id: string): Promise<Update | undefined> {
  const [row] = await db.select().from(updatesTable).where(eq(updatesTable.id, id)).limit(1);
  return row ? rowToUpdate(row) : undefined;
}

export type UpdateInput = Omit<Update, 'id' | 'createdAt' | 'slug'>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function buildUpdateSlug(input: Pick<UpdateInput, 'title'>): string {
  return slugify(input.title);
}

export async function createUpdateAdmin(input: UpdateInput): Promise<Update> {
  const slug = buildUpdateSlug(input);
  const [row] = await db
    .insert(updatesTable)
    .values({
      slug,
      tag: input.tag,
      title: input.title,
      excerpt: input.excerpt,
      meta: input.meta,
      image: input.image,
      imageAlt: input.imageAlt,
      href: input.href || '#',
    })
    .returning();
  return rowToUpdate(row);
}

export async function updateUpdateAdmin(id: string, input: UpdateInput): Promise<Update | undefined> {
  const [row] = await db
    .update(updatesTable)
    .set({
      tag: input.tag,
      title: input.title,
      excerpt: input.excerpt,
      meta: input.meta,
      image: input.image,
      imageAlt: input.imageAlt,
      href: input.href || '#',
      updatedAt: new Date(),
    })
    .where(eq(updatesTable.id, id))
    .returning();
  return row ? rowToUpdate(row) : undefined;
}

export async function deleteUpdateAdmin(id: string): Promise<Update | undefined> {
  const [row] = await db.delete(updatesTable).where(eq(updatesTable.id, id)).returning();
  return row ? rowToUpdate(row) : undefined;
}
