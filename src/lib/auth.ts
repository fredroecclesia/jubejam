// Auth admin sederhana: satu password (env), sesi ditandai lewat cookie
// httpOnly berisi token "expiry.signature" (HMAC-SHA256). Tidak butuh
// tabel/session store di DB — cukup untuk satu admin.
//
// ENV yang dibutuhkan:
//   ADMIN_PASSWORD — password login ke /admin
//   SESSION_SECRET — string acak panjang untuk menandatangani cookie sesi
//                    (mis. hasil `openssl rand -hex 32`)

export const SESSION_COOKIE = 'jubejam_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 hari

function env(name: string): string {
  const value = import.meta.env[name] ?? process.env[name];
  if (!value) throw new Error(`${name} belum diset di environment variables.`);
  return value;
}

async function hmac(message: string): Promise<string> {
  const secret = env('SESSION_SECRET');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Buffer.from(sig).toString('base64url');
}

export function checkPassword(input: string): boolean {
  return input === env('ADMIN_PASSWORD');
}

export async function createSessionToken(): Promise<{ value: string; maxAge: number }> {
  const expiry = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const signature = await hmac(String(expiry));
  return { value: `${expiry}.${signature}`, maxAge: SESSION_MAX_AGE_SECONDS };
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expiryStr, signature] = token.split('.');
  if (!expiryStr || !signature) return false;

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false;

  const expected = await hmac(expiryStr);
  // Perbandingan panjang-tetap sederhana; cukup untuk skala token ini.
  return expected === signature;
}
