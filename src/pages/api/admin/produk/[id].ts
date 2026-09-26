import type { APIRoute } from 'astro';
import { updateProductAdmin, deleteProductAdmin, getProductByIdAdmin } from '../../../../data/products';
import { parseProductInput } from '../../../../lib/product-validation';
import { deleteProductImage } from '../../../../lib/storage';

export const prerender = false;

function badRequest(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return badRequest('ID produk hilang dari URL.');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Body harus JSON.');
  }

  const parsed = parseProductInput(body);
  if (typeof parsed === 'string') return badRequest(parsed);

  const existing = await getProductByIdAdmin(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Produk tidak ditemukan.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const updated = await updateProductAdmin(id, parsed);

  // Foto sampul diganti → hapus foto lama dari R2 (best-effort, tidak
  // menggagalkan response kalau gagal).
  if (existing.image !== parsed.image) {
    void deleteProductImage(existing.image);
  }

  return new Response(JSON.stringify(updated), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return badRequest('ID produk hilang dari URL.');

  const deleted = await deleteProductAdmin(id);
  if (!deleted) {
    return new Response(JSON.stringify({ error: 'Produk tidak ditemukan.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Bersihkan foto-foto produk di R2 (best-effort).
  void deleteProductImage(deleted.image);
  for (const g of deleted.gallery ?? []) void deleteProductImage(g.src);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
