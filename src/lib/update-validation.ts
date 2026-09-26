import type { UpdateInput } from '../data/updates';

// Update sekarang cuma butuh: nama (dipakai untuk slug, daftar admin, dan alt
// foto), foto, dan link tujuan (opsional).
//
// Kolom tag/excerpt/meta/imageAlt masih ada di tabel `updates` (NOT NULL)
// supaya tidak perlu migrasi, jadi diisi nilai default di sini.
export function parseUpdateInput(body: unknown): UpdateInput | string {
  if (typeof body !== 'object' || body === null) return 'Payload tidak valid.';
  const b = body as Record<string, unknown>;

  for (const key of ['title', 'image']) {
    if (typeof b[key] !== 'string' || (b[key] as string).trim() === '') {
      return `Field "${key}" wajib diisi.`;
    }
  }
  if (b.href !== undefined && typeof b.href !== 'string') return 'Field "href" tidak valid.';

  const title = (b.title as string).trim();

  return {
    tag: '',
    title,
    excerpt: '',
    meta: '',
    image: b.image as string,
    imageAlt: title,
    href: (b.href as string | undefined)?.trim() || '#',
  };
}
