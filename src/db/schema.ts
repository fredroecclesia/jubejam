// Skema Drizzle untuk Neon Postgres.
//
// Bentuk kolom mengikuti interface `Product` di src/data/products.ts supaya
// hasil query bisa dipetakan langsung tanpa transformasi aneh. Kalau field
// di `Product` berubah, update di sini juga.

import { pgTable, uuid, varchar, text, integer, jsonb, timestamp, index, boolean } from 'drizzle-orm/pg-core';

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 160 }).notNull().unique(),

    brandSlug: varchar('brand_slug', { length: 60 }).notNull(),
    brandName: varchar('brand_name', { length: 100 }).notNull(),
    model: varchar('model', { length: 150 }).notNull(),
    category: varchar('category', { length: 60 }), // nullable, slug dari `categories` di products.ts
    reference: varchar('reference', { length: 60 }).notNull(),
    year: integer('year'), // nullable: null = "Undated" (tahun produksi tidak diketahui)

    gender: varchar('gender', { length: 10 }).notNull(), // 'men' | 'ladies' | 'unisex'
    condition: varchar('condition', { length: 20 }).notNull(), // 'preloved' | 'brand-new'
    status: varchar('status', { length: 20 }).notNull().default('available'), // 'available' | 'sold'

    price: integer('price').notNull(), // rupiah, angka utuh

    image: text('image').notNull(), // URL R2 (foto sampul)
    imageAlt: varchar('image_alt', { length: 200 }).notNull(),
    gallery: jsonb('gallery').$type<{ src: string; alt: string }[]>().notNull().default([]),

    kelengkapan: varchar('kelengkapan', { length: 100 }).notNull(),
    warranty: varchar('warranty', { length: 150 }).notNull(),

    grade: varchar('grade', { length: 60 }).notNull(),
    movement: varchar('movement', { length: 100 }).notNull(),
    caseDetail: text('case_detail').notNull(),
    dial: varchar('dial', { length: 150 }).notNull(),
    bracelet: text('bracelet').notNull(),
    serial: varchar('serial', { length: 60 }),
    marketPrice: integer('market_price'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    brandSlugIdx: index('products_brand_slug_idx').on(table.brandSlug),
    statusIdx: index('products_status_idx').on(table.status),
  })
);

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;

// ---------------------------------------------------------------------------
// Events (halaman /events-updates — section "Event")
// ---------------------------------------------------------------------------

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 160 }).notNull().unique(),

    title: varchar('title', { length: 200 }).notNull(),
    description: text('description').notNull(),
    status: varchar('status', { length: 60 }).notNull(), // label badge, mis. "Tersedia sekarang"
    soon: boolean('soon').notNull().default(false), // aksen "segera hadir" di kartu grid

    // Cuma boleh ada satu event featured aktif — ditampilkan di banner besar
    // paling atas section Event. Sisanya tampil di grid 3 kolom.
    featured: boolean('featured').notNull().default(false),

    image: text('image').notNull(),
    imageAlt: varchar('image_alt', { length: 200 }).notNull(),

    href: text('href').notNull(), // tujuan CTA, bisa link internal atau eksternal (WA, IG, dst.)
    linkLabel: varchar('link_label', { length: 80 }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    featuredIdx: index('events_featured_idx').on(table.featured),
  })
);

export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;

// ---------------------------------------------------------------------------
// Updates (halaman /events-updates — section "Update", artikel/panduan)
// ---------------------------------------------------------------------------

export const updates = pgTable('updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),

  tag: varchar('tag', { length: 40 }).notNull(), // mis. "PANDUAN", "EDUKASI"
  title: varchar('title', { length: 200 }).notNull(),
  excerpt: text('excerpt').notNull(),
  meta: varchar('meta', { length: 60 }).notNull(), // mis. "5 menit baca"

  image: text('image').notNull(),
  imageAlt: varchar('image_alt', { length: 200 }).notNull(),

  href: text('href').notNull().default('#'), // link artikel lengkap, kalau belum ada halamannya biarkan "#"

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type UpdateRow = typeof updates.$inferSelect;
export type NewUpdateRow = typeof updates.$inferInsert;

// ---------------------------------------------------------------------------
// Testimoni (section "Testimonial" di homepage)
// ---------------------------------------------------------------------------

export const testimonials = pgTable('testimonials', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: varchar('name', { length: 120 }).notNull(),
  // Profesi/jabatan yang tampil di bawah nama, mis. "Content Creator and FnB".
  role: varchar('role', { length: 120 }).notNull().default(''),
  quote: text('quote').notNull(),

  // Foto pelanggan (lanskap ~16:10) — tampil besar di sisi kiri slider.
  image: text('image').notNull(),
  imageAlt: varchar('image_alt', { length: 200 }).notNull(),

  // Jam yang dibeli pelanggan (opsional). Brand, nama, foto & status ("Sold out")
  // diambil langsung dari tabel `products` supaya selalu sinkron. Kalau produknya
  // dihapus, kolom ini otomatis jadi null dan kartu jam di slider disembunyikan.
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),

  // Urutan tampil di carousel homepage — makin kecil makin di depan.
  sortOrder: integer('sort_order').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TestimonialRow = typeof testimonials.$inferSelect;
export type NewTestimonialRow = typeof testimonials.$inferInsert;
