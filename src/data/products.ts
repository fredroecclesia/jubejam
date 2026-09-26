// Data katalog jam.
//
// Sumber data: tabel `products` di Neon (lihat src/db/schema.ts), diquery
// lewat Drizzle. Tipe, nama fungsi, dan bentuk return `queryProducts` /
// `listBrands` / dst. sengaja dipertahankan dari versi seed dummy supaya
// halaman /produk dan komponen di src/components/catalog/ tidak perlu diubah.
//
// `brands` dan `categories` di bawah ini MASIH const statis (belum tabel
// tersendiri) — cukup untuk sekarang karena daftar brand/kategori jarang
// berubah. Kalau nanti perlu dikelola dari admin juga, baru dipindah ke tabel.
//
// ASET GAMBAR: gambar hasil upload admin (CRUD) disimpan di Cloudflare R2,
// bukan /public. `image`/`gallery[].src` hanya string URL, jadi komponen
// katalog tidak peduli gambarnya dari mana.

import { WHATSAPP_URL } from './faqs';
import { db } from '../db/client';
import { products as productsTable, type ProductRow } from '../db/schema';
import { desc, eq } from 'drizzle-orm';

export type Gender = 'men' | 'ladies' | 'unisex';
export type Condition = 'preloved' | 'brand-new';
export type Status = 'available' | 'sold';
export type SortKey = 'terbaru' | 'termurah' | 'termahal';
export type PriceRange = '0-100' | '100-250' | '250-500' | '500-up';

export interface ProductImage {
  src: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  brandSlug: string;
  brandName: string;
  model: string;
  category: string | null; // slug dari `categories` (kategori Rolex); null untuk brand lain
  reference: string;
  year: number | null; // null = "Undated"
  gender: Gender;
  condition: Condition;
  status: Status;
  price: number; // rupiah, angka utuh
  image: string; // URL (path /public, atau URL R2 nanti)
  imageAlt: string;
  kelengkapan: string; // mis. "Full set", "Box dan papers"
  warranty: string;
  createdAt: string; // ISO

  // --- Dipakai halaman detail /produk/[slug] (tabel "Product specifications") ---
  grade: string; // kondisi fisik, mis. "Excellent", "Very good", "Unworn"
  movement: string; // mis. "Automatic 3235"
  caseDetail: string; // material + diameter, mis. "Oystersteel (41mm), w/18K Yellow Gold"
  dial: string;
  bracelet: string; // bracelet atau strap
  serial?: string; // opsional; kalau kosong baris "Serial/Year" hanya menampilkan tahun
  marketPrice?: number; // harga pasar pembanding, tampil sebagai "Rp x++"
  gallery?: ProductImage[]; // foto tambahan setelah `image` (foto sampul)
}

export interface CatalogFilters {
  brand?: string;
  kategori?: string;
  gender?: Gender;
  kondisi?: Condition;
  harga?: PriceRange;
  urut: SortKey;
  hal: number;
}

export interface CatalogResult {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface BrandOption {
  slug: string;
  name: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Referensi (nanti jadi tabel `brands` dan `models`)
// ---------------------------------------------------------------------------

// Urutan mengikuti section "Other brands" di homepage.
// Slug harus sama dengan yang dihasilkan link di OtherBrandsSection.
export const brands = [
  { slug: 'rolex', name: 'Rolex' },
  { slug: 'audemars-piguet', name: 'Audemars Piguet' },
  { slug: 'breitling', name: 'Breitling' },
  { slug: 'cartier', name: 'Cartier' },
  { slug: 'franck-muller', name: 'Franck Muller' },
  { slug: 'hublot', name: 'Hublot' },
  { slug: 'omega', name: 'Omega' },
  { slug: 'panerai', name: 'Panerai' },
  { slug: 'patek-philippe', name: 'Patek Philippe' },
  { slug: 'richard-mille', name: 'Richard Mille' },
  { slug: 'zenith', name: 'Zenith' },
] as const;

export interface Category {
  slug: string;
  label: string;
  family?: string; // kelompok, supaya "datejust" mencakup ladies dan men
}

// Slug harus sama dengan link di RolexCategoriesSection.
export const categories: Category[] = [
  { slug: 'sea-dweller', label: 'Sea-Dweller' },
  { slug: 'daytona', label: 'Daytona' },
  { slug: 'gmt-master', label: 'GMT-Master' },
  { slug: 'submariner', label: 'Submariner' },
  { slug: 'air-king', label: 'Air-King' },
  { slug: 'datejust-ladies', label: 'Datejust Ladies', family: 'datejust' },
  { slug: 'datejust-men', label: 'Datejust Men', family: 'datejust' },
];

// Opsi di dropdown kategori (termasuk kelompok "datejust" yang dipakai hotspot hero).
export const categoryOptions: { slug: string; label: string }[] = [
  { slug: 'sea-dweller', label: 'Sea-Dweller' },
  { slug: 'daytona', label: 'Daytona' },
  { slug: 'gmt-master', label: 'GMT-Master' },
  { slug: 'submariner', label: 'Submariner' },
  { slug: 'air-king', label: 'Air-King' },
  { slug: 'datejust', label: 'Datejust (semua)' },
  { slug: 'datejust-ladies', label: 'Datejust Ladies' },
  { slug: 'datejust-men', label: 'Datejust Men' },
];

export const genderOptions: { value: Gender; label: string }[] = [
  { value: 'men', label: 'Men' },
  { value: 'ladies', label: 'Ladies' },
  { value: 'unisex', label: 'Unisex' },
];

export const conditionOptions: { value: Condition; label: string }[] = [
  { value: 'preloved', label: 'Pre-owned' },
  { value: 'brand-new', label: 'Brand new' },
];

export const priceOptions: { value: PriceRange; label: string }[] = [
  { value: '0-100', label: 'Di bawah Rp 100 juta' },
  { value: '100-250', label: 'Rp 100 - 250 juta' },
  { value: '250-500', label: 'Rp 250 - 500 juta' },
  { value: '500-up', label: 'Di atas Rp 500 juta' },
];

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'termurah', label: 'Harga terendah' },
  { value: 'termahal', label: 'Harga tertinggi' },
];

export const PAGE_SIZE = 12;

// ---------------------------------------------------------------------------
// Seed dummy — TIDAK dipakai lagi oleh queryProducts/dkk (sudah baca dari DB).
// Dibiarkan di sini untuk `npm run db:seed` kalau butuh isi data contoh ke
// Neon pas setup awal. Aman dihapus kapan pun.
// ---------------------------------------------------------------------------

const img = (file: string) => `/demo/products/${file}`;

// Foto tambahan SEMENTARA untuk demo galeri: potongan close-up dari foto utama
// (dial, sisi kiri/kanan, bagian bawah), bukan sudut foto yang sebenarnya.
// File: public/demo/products/<nama>-2.webp sampai -6.webp. Hapus bersama seedProducts;
// foto asli dari admin nanti diisi ke `gallery` (URL R2 / Uploadthing).
const demoGallery = (base: string, model: string): ProductImage[] =>
  [2, 3, 4, 5, 6].map((n) => ({ src: img(`${base}-${n}.webp`), alt: `${model}, foto detail ${n - 1}` }));

export const seedProducts: Product[] = [
  {
    id: 'demo-1', slug: 'rolex-submariner-date-126613lb', brandSlug: 'rolex', brandName: 'Rolex',
    model: 'Submariner Date', category: 'submariner', reference: '126613LB', year: 2021,
    gender: 'men', condition: 'preloved', status: 'available', price: 245_000_000,
    image: img('rolex-submariner-date-126613lb.webp'), imageAlt: 'Rolex Submariner Date dua warna dengan bezel dan dial biru',
    kelengkapan: 'Full set', warranty: 'Garansi 1 tahun movement', createdAt: '2026-09-18T08:00:00Z',
    grade: 'Excellent', movement: 'Automatic 3235',
    caseDetail: 'Oystersteel (41mm), w/18K Yellow Gold, Blue Cerachrom Bezel',
    dial: 'Sunburst Blue', bracelet: 'Oystersteel, w/18K Yellow Gold, Oyster Bracelet',
    marketPrice: 265_000_000,
    gallery: demoGallery('rolex-submariner-date-126613lb', 'Rolex Submariner Date'),
  },
  {
    id: 'demo-2', slug: 'rolex-gmt-master-ii-126710blnr', brandSlug: 'rolex', brandName: 'Rolex',
    model: 'GMT-Master II', category: 'gmt-master', reference: '126710BLNR', year: 2022,
    gender: 'men', condition: 'preloved', status: 'available', price: 262_000_000,
    image: img('rolex-gmt-master-ii-126710blnr.webp'), imageAlt: 'Rolex GMT-Master II bezel hitam-biru dengan bracelet Jubilee',
    kelengkapan: 'Full set', warranty: 'Garansi 1 tahun movement', createdAt: '2026-09-15T08:00:00Z',
    grade: 'Excellent', movement: 'Automatic 3285',
    caseDetail: 'Oystersteel (40mm), Black and Blue Cerachrom Bezel',
    dial: 'Black', bracelet: 'Oystersteel, Jubilee Bracelet',
    marketPrice: 285_000_000,
    gallery: demoGallery('rolex-gmt-master-ii-126710blnr', 'Rolex GMT-Master II'),
  },
  {
    id: 'demo-3', slug: 'rolex-datejust-31-278273', brandSlug: 'rolex', brandName: 'Rolex',
    model: 'Datejust 31 Mother-of-pearl', category: 'datejust-ladies', reference: '278273', year: 2023,
    gender: 'ladies', condition: 'brand-new', status: 'available', price: 198_000_000,
    image: img('rolex-datejust-31-278273.webp'), imageAlt: 'Rolex Datejust ladies dua warna dengan dial mother-of-pearl',
    kelengkapan: 'Full set', warranty: 'Garansi 5 tahun Rolex official', createdAt: '2026-09-12T08:00:00Z',
    grade: 'Unworn', movement: 'Automatic 2236',
    caseDetail: 'Oystersteel (31mm), w/18K Yellow Gold, Fluted Bezel',
    dial: 'Mother-of-pearl, Diamond Set', bracelet: 'Oystersteel, w/18K Yellow Gold, Jubilee Bracelet',
    marketPrice: 210_000_000,
    gallery: demoGallery('rolex-datejust-31-278273', 'Rolex Datejust 31'),
  },
  {
    id: 'demo-4', slug: 'audemars-piguet-royal-oak-offshore-26405ce', brandSlug: 'audemars-piguet', brandName: 'Audemars Piguet',
    model: 'Royal Oak Offshore Chronograph', category: null, reference: '26405CE', year: 2019,
    gender: 'men', condition: 'preloved', status: 'available', price: 540_000_000,
    image: img('ap-royal-oak-offshore-26405ce.webp'), imageAlt: 'Audemars Piguet Royal Oak Offshore Chronograph keramik abu-abu',
    kelengkapan: 'Box dan papers', warranty: 'Garansi 1 tahun movement', createdAt: '2026-09-10T08:00:00Z',
    grade: 'Excellent', movement: 'Automatic 4401',
    caseDetail: 'Black Ceramic (43mm), Ceramic Bezel',
    dial: 'Black Mega Tapisserie, Chronograph', bracelet: 'Black Rubber Strap',
    marketPrice: 590_000_000,
    gallery: demoGallery('ap-royal-oak-offshore-26405ce', 'Audemars Piguet Royal Oak Offshore'),
  },
  {
    id: 'demo-5', slug: 'rolex-datejust-41-126334', brandSlug: 'rolex', brandName: 'Rolex',
    model: 'Datejust 41', category: 'datejust-men', reference: '126334', year: 2020,
    gender: 'men', condition: 'preloved', status: 'available', price: 168_000_000,
    image: img('rolex-datejust-41-126334.webp'), imageAlt: 'Rolex Datejust 41 dial biru dengan bezel fluted dan bracelet Jubilee',
    kelengkapan: 'Box dan papers', warranty: 'Garansi 1 tahun movement', createdAt: '2026-09-07T08:00:00Z',
    grade: 'Excellent', movement: 'Automatic 3235',
    caseDetail: 'Oystersteel (41mm), w/18K White Gold, Fluted Bezel',
    dial: 'Blue', bracelet: 'Oystersteel, Jubilee Bracelet',
    marketPrice: 180_000_000,
    gallery: demoGallery('rolex-datejust-41-126334', 'Rolex Datejust 41'),
  },
  {
    id: 'demo-6', slug: 'rolex-sea-dweller-126600', brandSlug: 'rolex', brandName: 'Rolex',
    model: 'Sea-Dweller', category: 'sea-dweller', reference: '126600', year: 2021,
    gender: 'men', condition: 'preloved', status: 'available', price: 285_000_000,
    image: img('rolex-sea-dweller-126600.webp'), imageAlt: 'Rolex Sea-Dweller dial hitam dengan bezel keramik',
    kelengkapan: 'Full set', warranty: 'Garansi 1 tahun movement', createdAt: '2026-09-03T08:00:00Z',
    grade: 'Excellent', movement: 'Automatic 3235',
    caseDetail: 'Oystersteel (43mm), Black Cerachrom Bezel',
    dial: 'Black', bracelet: 'Oystersteel, Oyster Bracelet',
    marketPrice: 310_000_000,
    gallery: demoGallery('rolex-sea-dweller-126600', 'Rolex Sea-Dweller'),
  },
  {
    id: 'demo-7', slug: 'rolex-daytona-116503', brandSlug: 'rolex', brandName: 'Rolex',
    model: 'Daytona', category: 'daytona', reference: '116503', year: 2019,
    gender: 'men', condition: 'preloved', status: 'available', price: 512_000_000,
    image: img('rolex-daytona-116503.webp'), imageAlt: 'Rolex Daytona dua warna dengan dial champagne',
    kelengkapan: 'Full set', warranty: 'Garansi 1 tahun movement', createdAt: '2026-08-28T08:00:00Z',
    grade: 'Very good', movement: 'Automatic 4130',
    caseDetail: 'Oystersteel (40mm), w/18K Yellow Gold, Black Cerachrom Bezel',
    dial: 'Champagne', bracelet: 'Oystersteel, w/18K Yellow Gold, Oyster Bracelet',
    marketPrice: 550_000_000,
    gallery: demoGallery('rolex-daytona-116503', 'Rolex Daytona'),
  },
  {
    id: 'demo-8', slug: 'rolex-datejust-36-126231', brandSlug: 'rolex', brandName: 'Rolex',
    model: 'Datejust 36 Two-tone', category: 'datejust-men', reference: '126231', year: 2021,
    gender: 'unisex', condition: 'preloved', status: 'sold', price: 175_000_000,
    image: img('rolex-datejust-36-126231.webp'), imageAlt: 'Rolex Datejust 36 dua warna dengan bracelet Jubilee dan penanda berlian',
    kelengkapan: 'Full set', warranty: 'Garansi 1 tahun movement', createdAt: '2026-08-20T08:00:00Z',
    grade: 'Excellent', movement: 'Automatic 3235',
    caseDetail: 'Oystersteel (36mm), w/18K Everose Gold, Fluted Bezel',
    dial: 'Diamond Hour Markers', bracelet: 'Oystersteel, w/18K Everose Gold, Jubilee Bracelet',
    marketPrice: 190_000_000,
  },
];

// ---------------------------------------------------------------------------
// Query (Drizzle + Neon)
// ---------------------------------------------------------------------------

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    brandSlug: row.brandSlug,
    brandName: row.brandName,
    model: row.model,
    category: row.category,
    reference: row.reference,
    year: row.year,
    gender: row.gender as Gender,
    condition: row.condition as Condition,
    status: row.status as Status,
    price: row.price,
    image: row.image,
    imageAlt: row.imageAlt,
    gallery: (row.gallery as ProductImage[] | null) ?? undefined,
    kelengkapan: row.kelengkapan,
    warranty: row.warranty,
    createdAt: row.createdAt.toISOString(),
    grade: row.grade,
    movement: row.movement,
    caseDetail: row.caseDetail,
    dial: row.dial,
    bracelet: row.bracelet,
    serial: row.serial ?? undefined,
    marketPrice: row.marketPrice ?? undefined,
  };
}

// Filter brand/kategori/harga (family grouping dsb.) masih dilakukan di JS
// setelah fetch, sama seperti versi seed — jumlah produk toko jam preloved
// tidak akan besar, jadi tidak perlu didorong ke SQL. Kalau katalog membesar
// (ribuan baris), ini titik pertama yang perlu dioptimasi jadi query SQL.
async function allProducts(): Promise<Product[]> {
  const rows = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));
  return rows.map(rowToProduct);
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

// Baca filter dari query string. Nilai yang tidak dikenal dibuang, jadi URL
// sembarang tidak bisa merusak halaman.
export function parseFilters(params: URLSearchParams): CatalogFilters {
  const brand = params.get('brand');
  const kategori = params.get('kategori');
  const hal = Number.parseInt(params.get('hal') ?? '1', 10);

  return {
    brand: brand && /^[a-z0-9-]{1,40}$/.test(brand) ? brand : undefined,
    kategori: oneOf(kategori, categoryOptions.map((c) => c.slug)),
    gender: oneOf(params.get('gender'), genderOptions.map((g) => g.value)),
    kondisi: oneOf(params.get('kondisi'), conditionOptions.map((c) => c.value)),
    harga: oneOf(params.get('harga'), priceOptions.map((p) => p.value)),
    urut: oneOf(params.get('urut'), sortOptions.map((s) => s.value)) ?? 'terbaru',
    hal: Number.isFinite(hal) && hal > 0 ? hal : 1,
  };
}

function matchesCategory(product: Product, kategori: string): boolean {
  if (!product.category) return false;
  if (product.category === kategori) return true;
  return categories.find((c) => c.slug === product.category)?.family === kategori;
}

function matchesPrice(price: number, range: PriceRange): boolean {
  const juta = price / 1_000_000;
  switch (range) {
    case '0-100':
      return juta < 100;
    case '100-250':
      return juta >= 100 && juta < 250;
    case '250-500':
      return juta >= 250 && juta < 500;
    case '500-up':
      return juta >= 500;
  }
}

export async function queryProducts(filters: CatalogFilters): Promise<CatalogResult> {
  const source = await allProducts();
  let list = source.filter(
    (p) =>
      (!filters.brand || p.brandSlug === filters.brand) &&
      (!filters.kategori || matchesCategory(p, filters.kategori)) &&
      (!filters.gender || p.gender === filters.gender) &&
      (!filters.kondisi || p.condition === filters.kondisi) &&
      (!filters.harga || matchesPrice(p.price, filters.harga))
  );

  list = [...list].sort((a, b) => {
    if (filters.urut === 'termurah') return a.price - b.price;
    if (filters.urut === 'termahal') return b.price - a.price;
    return b.createdAt.localeCompare(a.createdAt);
  });

  // Jam terjual tetap tampil sebagai bukti sosial, tapi selalu di akhir.
  list = [...list.filter((p) => p.status === 'available'), ...list.filter((p) => p.status === 'sold')];

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.hal, totalPages);
  const items = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return { items, total, page, totalPages };
}

// Semua brand referensi ditampilkan di filter (termasuk yang belum ada
// jamnya) — count dipakai untuk info tambahan di UI kalau dibutuhkan, bukan
// untuk menyembunyikan brand.
export async function listBrands(): Promise<BrandOption[]> {
  const source = await allProducts();
  return brands.map((b) => ({
    slug: b.slug,
    name: b.name,
    count: source.filter((p) => p.brandSlug === b.slug).length,
  }));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const source = await allProducts();
  return source.find((p) => p.slug === slug);
}

// Jam yang masih tersedia dan paling mirip: satu keluarga model (mis. semua
// Datejust) lebih berat dari satu brand, lalu yang terbaru.
export async function getSimilarProducts(product: Product, limit = 4): Promise<Product[]> {
  const source = await allProducts();
  const familyOf = (p: Product) =>
    p.category ? (categories.find((c) => c.slug === p.category)?.family ?? p.category) : null;
  const family = familyOf(product);
  const score = (p: Product) => (family && familyOf(p) === family ? 3 : 0) + (p.brandSlug === product.brandSlug ? 2 : 0);

  return source
    .filter((p) => p.id !== product.id && p.status === 'available')
    .sort((a, b) => score(b) - score(a) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Admin CRUD (dipakai src/pages/admin/produk/* dan src/pages/api/admin/produk/*)
// ---------------------------------------------------------------------------

export async function listAllProductsAdmin(): Promise<Product[]> {
  return allProducts();
}

export async function getProductByIdAdmin(id: string): Promise<Product | undefined> {
  const [row] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  return row ? rowToProduct(row) : undefined;
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'slug'>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function buildProductSlug(input: Pick<ProductInput, 'brandName' | 'model' | 'reference'>): string {
  return slugify(`${input.brandName}-${input.model}-${input.reference}`);
}

export async function createProductAdmin(input: ProductInput): Promise<Product> {
  const slug = buildProductSlug(input);
  const [row] = await db
    .insert(productsTable)
    .values({
      slug,
      brandSlug: input.brandSlug,
      brandName: input.brandName,
      model: input.model,
      category: input.category,
      reference: input.reference,
      year: input.year,
      gender: input.gender,
      condition: input.condition,
      status: input.status,
      price: input.price,
      image: input.image,
      imageAlt: input.imageAlt,
      gallery: input.gallery ?? [],
      kelengkapan: input.kelengkapan,
      warranty: input.warranty,
      grade: input.grade,
      movement: input.movement,
      caseDetail: input.caseDetail,
      dial: input.dial,
      bracelet: input.bracelet,
      serial: input.serial,
      marketPrice: input.marketPrice,
    })
    .returning();
  return rowToProduct(row);
}

export async function updateProductAdmin(id: string, input: ProductInput): Promise<Product | undefined> {
  const [row] = await db
    .update(productsTable)
    .set({
      brandSlug: input.brandSlug,
      brandName: input.brandName,
      model: input.model,
      category: input.category,
      reference: input.reference,
      year: input.year,
      gender: input.gender,
      condition: input.condition,
      status: input.status,
      price: input.price,
      image: input.image,
      imageAlt: input.imageAlt,
      gallery: input.gallery ?? [],
      kelengkapan: input.kelengkapan,
      warranty: input.warranty,
      grade: input.grade,
      movement: input.movement,
      caseDetail: input.caseDetail,
      dial: input.dial,
      bracelet: input.bracelet,
      serial: input.serial,
      marketPrice: input.marketPrice,
      updatedAt: new Date(),
    })
    .where(eq(productsTable.id, id))
    .returning();
  return row ? rowToProduct(row) : undefined;
}

export async function deleteProductAdmin(id: string): Promise<Product | undefined> {
  const [row] = await db.delete(productsTable).where(eq(productsTable.id, id)).returning();
  return row ? rowToProduct(row) : undefined;
}

// ---------------------------------------------------------------------------
// Helper tampilan
// ---------------------------------------------------------------------------

// Tahun produksi untuk ditampilkan; jam tanpa tahun (year = null) tampil "Undated".
export function yearLabel(year: number | null): string {
  return year === null ? 'Undated' : String(year);
}

export function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

// Susun URL /produk dari filter. Nilai default (urut terbaru, halaman 1) tidak
// ditulis supaya URL tetap pendek.
export function catalogHref(filters: Partial<CatalogFilters> = {}): string {
  const q = new URLSearchParams();
  if (filters.brand) q.set('brand', filters.brand);
  if (filters.kategori) q.set('kategori', filters.kategori);
  if (filters.gender) q.set('gender', filters.gender);
  if (filters.kondisi) q.set('kondisi', filters.kondisi);
  if (filters.harga) q.set('harga', filters.harga);
  if (filters.urut && filters.urut !== 'terbaru') q.set('urut', filters.urut);
  if (filters.hal && filters.hal > 1) q.set('hal', String(filters.hal));
  const qs = q.toString();
  return qs ? `/produk?${qs}` : '/produk';
}

// Pesan WhatsApp otomatis dari kartu produk, pola yang sama dengan form Sell My Watch.
export function whatsappProductUrl(product: Product): string {
  const text = `Halo Jubejam, saya tertarik dengan ${product.brandName} ${product.model} (Ref. ${product.reference}, ${yearLabel(product.year)}). Apakah masih tersedia?`;
  return `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}

// Judul lengkap jam di kartu katalog: "<Brand> <Model>". Kalau kolom Model di admin
// sudah diawali nama brand, jangan diulang.
export function productTitle(product: Pick<Product, 'brandName' | 'model'>): string {
  const brand = product.brandName.trim();
  const model = product.model.trim();
  return model.toLowerCase().startsWith(brand.toLowerCase()) ? model : `${brand} ${model}`;
}

export function productHref(product: Pick<Product, 'slug'>): string {
  return `/produk/${product.slug}`;
}

// Foto sampul + foto tambahan, dalam urutan tampil di galeri.
export function productImages(product: Product): ProductImage[] {
  return [{ src: product.image, alt: product.imageAlt }, ...(product.gallery ?? [])];
}

// Label + gaya badge di pojok foto (dipakai kartu katalog dan galeri detail).
export function productBadge(product: Product): { label: string; className: string } {
  if (product.status === 'sold') return { label: 'Terjual', className: 'bg-[#3a1f1f] text-[#F09595]' };
  if (product.condition === 'brand-new') return { label: 'Brand new', className: 'bg-gold text-[#14110A]' };
  return { label: 'Pre-owned', className: 'bg-black/70 text-gold-light' };
}

// Sama untuk semua jam; nanti bisa jadi kolom sendiri kalau ada jam yang berbeda.
export const AUTHENTICITY_NOTE =
  '100% Authentic Or Moneyback, Jam ini sudah melalui quality check lebih dari 10x dari team Jubejam.';

export interface SpecRow {
  label: string;
  value: string;
}

const genderLabel: Record<Gender, string> = { men: 'Men', ladies: 'Woman', unisex: 'Men & Woman' };

// Baris tabel "Product specifications". Urutan mengikuti brief.
// Jam terjual tidak menampilkan harga, sama seperti kartu katalog.
export function specRows(product: Product): SpecRow[] {
  const forSale = product.status === 'available';
  const rows: (SpecRow | false)[] = [
    { label: 'Brand', value: product.brandName },
    forSale && { label: 'Regular Price', value: formatRupiah(product.price) },
    { label: 'Kelengkapan', value: product.kelengkapan },
    { label: 'Condition', value: product.grade },
    { label: 'Model Name/Number', value: `${product.model} Ref. ${product.reference}` },
    { label: 'Serial/Year', value: product.serial ? `${product.serial} / ${yearLabel(product.year)}` : yearLabel(product.year) },
    { label: 'Gender', value: genderLabel[product.gender] },
    { label: 'Movement', value: product.movement },
    { label: 'Case', value: product.caseDetail },
    { label: 'Dial', value: product.dial },
    { label: 'Bracelet', value: product.bracelet },
    { label: 'Authenticity', value: AUTHENTICITY_NOTE },
    forSale && product.marketPrice !== undefined && { label: 'Market Price', value: `${formatRupiah(product.marketPrice)}++` },
    { label: 'Warranty', value: product.warranty },
  ];
  return rows.filter((r): r is SpecRow => r !== false);
}