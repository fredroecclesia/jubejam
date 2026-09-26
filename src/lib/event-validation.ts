import type { EventInput } from '../data/events';

// Event sekarang cuma butuh: nama (dipakai untuk slug, daftar admin, dan alt
// foto), foto, link tujuan (opsional), dan penanda featured.
//
// Kolom description/status/soon/linkLabel/imageAlt masih ada di tabel `events`
// (NOT NULL) supaya tidak perlu migrasi, jadi diisi nilai default di sini.
export function parseEventInput(body: unknown): EventInput | string {
  if (typeof body !== 'object' || body === null) return 'Payload tidak valid.';
  const b = body as Record<string, unknown>;

  for (const key of ['title', 'image']) {
    if (typeof b[key] !== 'string' || (b[key] as string).trim() === '') {
      return `Field "${key}" wajib diisi.`;
    }
  }
  if (b.href !== undefined && typeof b.href !== 'string') return 'Field "href" harus teks.';
  if (typeof b.featured !== 'boolean') return 'Field "featured" harus true/false.';

  const title = (b.title as string).trim();

  return {
    title,
    description: '',
    status: '',
    soon: false,
    featured: b.featured as boolean,
    image: b.image as string,
    imageAlt: title,
    href: ((b.href as string | undefined) ?? '').trim(),
    linkLabel: '',
  };
}
