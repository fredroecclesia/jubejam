import type { APIRoute } from 'astro';
import { checkPassword, createSessionToken, SESSION_COOKIE } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const password = String(form.get('password') ?? '');
  const next = String(form.get('next') ?? '/admin/produk');

  if (!checkPassword(password)) {
    return redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const session = await createSessionToken();
  cookies.set(SESSION_COOKIE, session.value, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: session.maxAge,
  });

  return redirect(next.startsWith('/') ? next : '/admin/produk');
};
