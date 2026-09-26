// Data event (promo/koleksi baru/dsb.) untuk section "Event" di halaman
// /events-updates.
//
// Sumber data: tabel `events` di Neon (lihat src/db/schema.ts), diquery lewat
// Drizzle. Pola sama dengan src/data/products.ts.
//
// Cuma boleh ada SATU event `featured` aktif (banner besar paling atas).
// Sisanya tampil di grid 3 kolom, urut terbaru dulu.

import { db } from '../db/client';
import { events as eventsTable, type EventRow } from '../db/schema';
import { desc, eq, ne, and } from 'drizzle-orm';

export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  soon: boolean;
  featured: boolean;
  image: string;
  imageAlt: string;
  href: string;
  linkLabel: string;
  createdAt: string; // ISO
}

function rowToEvent(row: EventRow): Event {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    status: row.status,
    soon: row.soon,
    featured: row.featured,
    image: row.image,
    imageAlt: row.imageAlt,
    href: row.href,
    linkLabel: row.linkLabel,
    createdAt: row.createdAt.toISOString(),
  };
}

async function allEvents(): Promise<Event[]> {
  const rows = await db.select().from(eventsTable).orderBy(desc(eventsTable.createdAt));
  return rows.map(rowToEvent);
}

// ---------------------------------------------------------------------------
// Query publik (dipakai /events-updates.astro)
// ---------------------------------------------------------------------------

// Semua event, terbaru dulu (featured atau tidak) — dipakai carousel
// "Apa yang baru dari Jubejam?" di homepage (EventSection.astro).
export async function listAllEventsPublic(): Promise<Event[]> {
  return allEvents();
}

export async function getFeaturedEvent(): Promise<Event | undefined> {
  const [row] = await db.select().from(eventsTable).where(eq(eventsTable.featured, true)).limit(1);
  return row ? rowToEvent(row) : undefined;
}

// Event non-featured, terbaru dulu — dipakai EventGrid.
export async function listGridEvents(): Promise<Event[]> {
  const rows = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.featured, false))
    .orderBy(desc(eventsTable.createdAt));
  return rows.map(rowToEvent);
}

// ---------------------------------------------------------------------------
// Admin CRUD (dipakai src/pages/admin/events/* dan src/pages/api/admin/events/*)
// ---------------------------------------------------------------------------

export async function listAllEventsAdmin(): Promise<Event[]> {
  return allEvents();
}

export async function getEventByIdAdmin(id: string): Promise<Event | undefined> {
  const [row] = await db.select().from(eventsTable).where(eq(eventsTable.id, id)).limit(1);
  return row ? rowToEvent(row) : undefined;
}

export type EventInput = Omit<Event, 'id' | 'createdAt' | 'slug'>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function buildEventSlug(input: Pick<EventInput, 'title'>): string {
  return slugify(input.title);
}

// Pastikan cuma satu event featured yang aktif: kalau input ini featured,
// lepas status featured dari event lain dulu. `exceptId` supaya event yang
// sedang diupdate tidak ikut ke-unset lalu di-set lagi (aman dari race
// kondisi sederhana di single admin).
async function unsetOtherFeatured(exceptId?: string): Promise<void> {
  const condition = exceptId
    ? and(eq(eventsTable.featured, true), ne(eventsTable.id, exceptId))
    : eq(eventsTable.featured, true);
  await db.update(eventsTable).set({ featured: false }).where(condition);
}

export async function createEventAdmin(input: EventInput): Promise<Event> {
  const slug = buildEventSlug(input);

  if (input.featured) await unsetOtherFeatured();

  const [row] = await db
    .insert(eventsTable)
    .values({
      slug,
      title: input.title,
      description: input.description,
      status: input.status,
      soon: input.soon,
      featured: input.featured,
      image: input.image,
      imageAlt: input.imageAlt,
      href: input.href,
      linkLabel: input.linkLabel,
    })
    .returning();
  return rowToEvent(row);
}

export async function updateEventAdmin(id: string, input: EventInput): Promise<Event | undefined> {
  if (input.featured) await unsetOtherFeatured(id);

  const [row] = await db
    .update(eventsTable)
    .set({
      title: input.title,
      description: input.description,
      status: input.status,
      soon: input.soon,
      featured: input.featured,
      image: input.image,
      imageAlt: input.imageAlt,
      href: input.href,
      linkLabel: input.linkLabel,
      updatedAt: new Date(),
    })
    .where(eq(eventsTable.id, id))
    .returning();
  return row ? rowToEvent(row) : undefined;
}

export async function deleteEventAdmin(id: string): Promise<Event | undefined> {
  const [row] = await db.delete(eventsTable).where(eq(eventsTable.id, id)).returning();
  return row ? rowToEvent(row) : undefined;
}
