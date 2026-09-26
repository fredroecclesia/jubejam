import type { APIRoute } from 'astro';
import { uploadProductImage, UploadError } from '../../../lib/storage';

export const prerender = false;

// Folder yang boleh dipakai — whitelist supaya field "folder" dari client
// tidak bisa dipakai untuk menulis ke path sembarang di bucket.
const ALLOWED_FOLDERS = new Set(['produk', 'events', 'updates', 'testimoni']);

// multipart/form-data dengan field "file" (+ opsional "folder", default
// "produk"). Return { url } yang langsung dipakai admin form untuk mengisi
// `image` (produk/event/update) atau salah satu item `gallery` produk.
export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Request harus multipart/form-data.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'Field "file" tidak ditemukan.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const folderRaw = form.get('folder');
  const folder = typeof folderRaw === 'string' && ALLOWED_FOLDERS.has(folderRaw) ? folderRaw : 'produk';

  try {
    const url = await uploadProductImage(file, folder);
    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof UploadError ? err.message : 'Gagal upload foto ke R2.';
    if (!(err instanceof UploadError)) console.error('Upload R2 gagal:', err);
    return new Response(JSON.stringify({ error: message }), {
      status: err instanceof UploadError ? 400 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
