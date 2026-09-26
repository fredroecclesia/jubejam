import type { APIRoute } from 'astro';
import { createProductAdmin } from '../../../../data/products';
import { parseProductInput } from '../../../../lib/product-validation';

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

  const parsed = parseProductInput(body);
  if (typeof parsed === 'string') return badRequest(parsed);

  try {
    const product = await createProductAdmin(parsed);
    return new Response(JSON.stringify(product), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Gagal membuat produk:', err);
    const message = err instanceof Error && /unique/i.test(err.message)
      ? 'Slug produk ini sudah dipakai (kemungkinan kombinasi brand/model/reference sama).'
      : 'Gagal menyimpan produk.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
