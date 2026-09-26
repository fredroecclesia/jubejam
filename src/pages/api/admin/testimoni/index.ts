import type { APIRoute } from 'astro';
import { createTestimonialAdmin } from '../../../../data/testimonials';
import { parseTestimonialInput } from '../../../../lib/testimonial-validation';

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

  const parsed = parseTestimonialInput(body);
  if (typeof parsed === 'string') return badRequest(parsed);

  try {
    const testimonial = await createTestimonialAdmin(parsed);
    return new Response(JSON.stringify(testimonial), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Gagal membuat testimoni:', err);
    return new Response(JSON.stringify({ error: 'Gagal menyimpan testimoni.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
