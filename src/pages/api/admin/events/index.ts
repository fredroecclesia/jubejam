import type { APIRoute } from 'astro';
import { createEventAdmin } from '../../../../data/events';
import { parseEventInput } from '../../../../lib/event-validation';

export const prerender = false;

function badRequest(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Body harus JSON.');
  }

  const parsed = parseEventInput(body);
  if (typeof parsed === 'string') return badRequest(parsed);

  try {
    const event = await createEventAdmin(parsed);
    return new Response(JSON.stringify(event), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Gagal membuat event:', err);
    const message = err instanceof Error && /unique/i.test(err.message)
      ? 'Sudah ada event dengan judul yang sama (slug bentrok).'
      : 'Gagal menyimpan event.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
