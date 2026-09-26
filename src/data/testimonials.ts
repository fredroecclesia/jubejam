// Data testimoni pelanggan untuk section "Testimonial" di homepage.
//
// Sumber data: tabel `testimonials` di Neon (lihat src/db/schema.ts), diquery
// lewat Drizzle. Pola sama dengan src/data/products.ts, events.ts, updates.ts.
//
// Beda dari event/update: testimoni dikontrol urutannya secara manual lewat
// `sortOrder` (makin kecil makin di depan carousel), bukan cuma createdAt,
// supaya admin bisa mengatur testimoni mana yang tampil duluan.

import { db } from '../db/client';
import { testimonials as testimonialsTable, products as productsTable, type TestimonialRow } from '../db/schema';
import { asc, eq } from 'drizzle-orm';

// Ringkasan jam yang dibeli pelanggan — diambil dari tabel `products` (bukan
// disalin), jadi status "sold"/"available" selalu mengikuti data katalog.
export interface TestimonialProduct {
  slug: string;
  brandName: string;
  model: string;
  image: string;
  imageAlt: string;
  status: 'available' | 'sold';
}

export interface Testimonial {
  id: string;
  name: string;
  role: string; // profesi/jabatan, boleh kosong
  quote: string;
  image: string;
  imageAlt: string;
  productId: string | null;
  product: TestimonialProduct | null; // hasil join dari productId (read-only)
  sortOrder: number;
  createdAt: string; // ISO
}

type JoinedProduct = {
  slug: string | null;
  brandName: string | null;
  model: string | null;
  image: string | null;
  imageAlt: string | null;
  status: string | null;
};

function rowToTestimonial(row: TestimonialRow, p?: JoinedProduct | null): Testimonial {
  const product: TestimonialProduct | null =
    p && p.slug && p.brandName && p.model && p.image
      ? {
          slug: p.slug,
          brandName: p.brandName,
          model: p.model,
          image: p.image,
          imageAlt: p.imageAlt ?? `${p.brandName} ${p.model}`,
          status: p.status === 'sold' ? 'sold' : 'available',
        }
      : null;

  return {
    id: row.id,
    name: row.name,
    role: row.role,
    quote: row.quote,
    image: row.image,
    imageAlt: row.imageAlt,
    productId: row.productId,
    product,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

const testimonialWithProduct = {
  t: testimonialsTable,
  p: {
    slug: productsTable.slug,
    brandName: productsTable.brandName,
    model: productsTable.model,
    image: productsTable.image,
    imageAlt: productsTable.imageAlt,
    status: productsTable.status,
  },
};

async function allTestimonials(): Promise<Testimonial[]> {
  const rows = await db
    .select(testimonialWithProduct)
    .from(testimonialsTable)
    .leftJoin(productsTable, eq(testimonialsTable.productId, productsTable.id))
    .orderBy(asc(testimonialsTable.sortOrder), asc(testimonialsTable.createdAt));
  return rows.map((r) => rowToTestimonial(r.t, r.p));
}

// ---------------------------------------------------------------------------
// Query publik (dipakai TestimonialSection.astro di homepage)
// ---------------------------------------------------------------------------

export async function listTestimonials(): Promise<Testimonial[]> {
  return allTestimonials();
}

// ---------------------------------------------------------------------------
// Admin CRUD (dipakai src/pages/admin/testimoni/* dan src/pages/api/admin/testimoni/*)
// ---------------------------------------------------------------------------

export async function listAllTestimonialsAdmin(): Promise<Testimonial[]> {
  return allTestimonials();
}

export async function getTestimonialByIdAdmin(id: string): Promise<Testimonial | undefined> {
  const [row] = await db
    .select(testimonialWithProduct)
    .from(testimonialsTable)
    .leftJoin(productsTable, eq(testimonialsTable.productId, productsTable.id))
    .where(eq(testimonialsTable.id, id))
    .limit(1);
  return row ? rowToTestimonial(row.t, row.p) : undefined;
}

export type TestimonialInput = Omit<Testimonial, 'id' | 'createdAt' | 'product'>;

export async function createTestimonialAdmin(input: TestimonialInput): Promise<Testimonial> {
  const [row] = await db
    .insert(testimonialsTable)
    .values({
      name: input.name,
      role: input.role,
      quote: input.quote,
      image: input.image,
      imageAlt: input.imageAlt,
      productId: input.productId,
      sortOrder: input.sortOrder,
    })
    .returning();
  return rowToTestimonial(row);
}

export async function updateTestimonialAdmin(
  id: string,
  input: TestimonialInput
): Promise<Testimonial | undefined> {
  const [row] = await db
    .update(testimonialsTable)
    .set({
      name: input.name,
      role: input.role,
      quote: input.quote,
      image: input.image,
      imageAlt: input.imageAlt,
      productId: input.productId,
      sortOrder: input.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(testimonialsTable.id, id))
    .returning();
  return row ? rowToTestimonial(row) : undefined;
}

export async function deleteTestimonialAdmin(id: string): Promise<Testimonial | undefined> {
  const [row] = await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id)).returning();
  return row ? rowToTestimonial(row) : undefined;
}
