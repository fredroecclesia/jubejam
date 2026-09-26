import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, isValidSessionToken } from './lib/auth';

// Lindungi semua /admin/* (kecuali halaman & API login) dengan cookie sesi.
// API /api/admin/* juga dilindungi supaya endpoint CRUD tidak bisa dipanggil
// langsung tanpa login.
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isAdminArea = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');
  const isLoginPage = pathname === '/admin/login';
  const isLoginApi = pathname === '/api/admin/login';

  if ((isAdminArea && !isLoginPage) || (isAdminApi && !isLoginApi)) {
    const token = context.cookies.get(SESSION_COOKIE)?.value;
    const valid = await isValidSessionToken(token);

    if (!valid) {
      if (isAdminApi) {
        return new Response(JSON.stringify({ error: 'Belum login.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return context.redirect(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
  }

  return next();
});
