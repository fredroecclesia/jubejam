import type { ProductInput } from '../data/products';

// Validasi minimal tapi eksplisit — field kosong/salah tipe langsung ditolak
// dengan pesan yang jelas, daripada nyusul jadi row rusak di DB.
export function parseProductInput(body: unknown): ProductInput | string {
  if (typeof body !== 'object' || body === null) return 'Payload tidak valid.';
  const b = body as Record<string, unknown>;

  const required = [
    'brandSlug', 'brandName', 'model', 'reference', 'gender', 'condition', 'status',
    'image', 'imageAlt', 'kelengkapan', 'warranty', 'grade', 'movement', 'caseDetail',
    'dial', 'bracelet',
  ];
  for (const key of required) {
    if (typeof b[key] !== 'string' || (b[key] as string).trim() === '') {
      return `Field "${key}" wajib diisi.`;
    }
  }
  // year boleh null = "Undated" (tahun tidak diketahui).
  if (b.year !== null && (typeof b.year !== 'number' || !Number.isInteger(b.year))) {
    return 'Field "year" harus angka atau null (Undated).';
  }
  if (typeof b.price !== 'number' || b.price <= 0) return 'Field "price" harus angka > 0.';
  if (b.category !== null && typeof b.category !== 'string') return 'Field "category" harus string atau null.';
  if (b.serial !== undefined && b.serial !== null && typeof b.serial !== 'string') return 'Field "serial" tidak valid.';
  if (b.marketPrice !== undefined && b.marketPrice !== null && typeof b.marketPrice !== 'number') {
    return 'Field "marketPrice" tidak valid.';
  }
  if (b.gallery !== undefined && !Array.isArray(b.gallery)) return 'Field "gallery" harus array.';

  return {
    brandSlug: b.brandSlug as string,
    brandName: b.brandName as string,
    model: b.model as string,
    category: (b.category as string | null) ?? null,
    reference: b.reference as string,
    year: b.year as number | null,
    gender: b.gender as ProductInput['gender'],
    condition: b.condition as ProductInput['condition'],
    status: b.status as ProductInput['status'],
    price: b.price as number,
    image: b.image as string,
    imageAlt: b.imageAlt as string,
    gallery: (b.gallery as ProductInput['gallery']) ?? [],
    kelengkapan: b.kelengkapan as string,
    warranty: b.warranty as string,
    grade: b.grade as string,
    movement: b.movement as string,
    caseDetail: b.caseDetail as string,
    dial: b.dial as string,
    bracelet: b.bracelet as string,
    serial: (b.serial as string | undefined) ?? undefined,
    marketPrice: (b.marketPrice as number | undefined) ?? undefined,
  };
}
