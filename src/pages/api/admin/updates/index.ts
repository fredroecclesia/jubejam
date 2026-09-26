import type { APIRoute } from 'astro';
import { createUpdateAdmin } from '../../../../data/updates';
import { parseUpdateInput } from '../../../../lib/update-validation';

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

  const parsed = parseUpdateInput(body);
  if (typeof parsed === 'string') return badRequest(parsed);

  try {
    const update = await createUpdateAdmin(parsed);
    return new Response(JSON.stringify(update), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Gagal membuat update:', err);
    const message = err instanceof Error && /unique/i.test(err.message)
      ? 'Sudah ada update dengan judul yang sama (slug bentrok).'
      : 'Gagal menyimpan update.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
