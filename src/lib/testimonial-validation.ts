import type { TestimonialInput } from '../data/testimonials';

// Validasi minimal tapi eksplisit — pola sama dengan event-validation.ts.
export function parseTestimonialInput(body: unknown): TestimonialInput | string {
  if (typeof body !== 'object' || body === null) return 'Payload tidak valid.';
  const b = body as Record<string, unknown>;

  const requiredStrings = ['name', 'quote', 'image', 'imageAlt'];
  for (const key of requiredStrings) {
    if (typeof b[key] !== 'string' || (b[key] as string).trim() === '') {
      return `Field "${key}" wajib diisi.`;
    }
  }

  const sortOrderRaw = b.sortOrder;
  const sortOrder = typeof sortOrderRaw === 'number' ? sortOrderRaw : Number(sortOrderRaw);
  if (!Number.isFinite(sortOrder)) return 'Field "sortOrder" harus angka.';

  // Profesi opsional (boleh kosong).
  const role = typeof b.role === 'string' ? b.role.trim() : '';
  if (role.length > 120) return 'Field "role" maksimal 120 karakter.';

  // Jam yang dibeli opsional: string kosong / null = tidak ada.
  let productId: string | null = null;
  if (typeof b.productId === 'string' && b.productId.trim() !== '') {
    const id = b.productId.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return 'Field "productId" bukan ID produk yang valid.';
    }
    productId = id;
  }

  return {
    name: b.name as string,
    role,
    quote: b.quote as string,
    image: b.image as string,
    imageAlt: b.imageAlt as string,
    productId,
    sortOrder,
  };
}
