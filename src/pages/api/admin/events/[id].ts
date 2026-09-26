import type { APIRoute } from 'astro';
import { updateEventAdmin, deleteEventAdmin, getEventByIdAdmin } from '../../../../data/events';
import { parseEventInput } from '../../../../lib/event-validation';
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
  if (!id) return badRequest('ID event hilang dari URL.');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Body harus JSON.');
  }

  const parsed = parseEventInput(body);
  if (typeof parsed === 'string') return badRequest(parsed);

  const existing = await getEventByIdAdmin(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Event tidak ditemukan.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const updated = await updateEventAdmin(id, parsed);

  // Foto diganti → hapus foto lama dari storage (best-effort).
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
  if (!id) return badRequest('ID event hilang dari URL.');

  const deleted = await deleteEventAdmin(id);
  if (!deleted) {
    return new Response(JSON.stringify({ error: 'Event tidak ditemukan.' }), {
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
