import type { APIRoute } from 'astro';
import { updateUpdateAdmin, deleteUpdateAdmin, getUpdateByIdAdmin } from '../../../../data/updates';
import { parseUpdateInput } from '../../../../lib/update-validation';
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
  if (!id) return badRequest('ID update hilang dari URL.');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Body harus JSON.');
  }

  const parsed = parseUpdateInput(body);
  if (typeof parsed === 'string') return badRequest(parsed);

  const existing = await getUpdateByIdAdmin(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Update tidak ditemukan.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const updated = await updateUpdateAdmin(id, parsed);

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
  if (!id) return badRequest('ID update hilang dari URL.');

  const deleted = await deleteUpdateAdmin(id);
  if (!deleted) {
    return new Response(JSON.stringify({ error: 'Update tidak ditemukan.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  void deleteProductImage(deleted.image);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
