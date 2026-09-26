// Upload foto produk ke Neon Object Storage (S3-compatible, dibawaan dari
// project Neon yang sama dengan database — jadi tidak perlu akun Cloudflare
// terpisah). Cocok buat demo; kalau nanti serius produksi & butuh CDN publik
// yang lebih matang, gampang pindah ke provider lain karena API-nya S3 juga.
//
// ENV yang dibutuhkan (ambil dari Neon Console > project > branch >
// "Credentials" di sidebar APP BACKEND > Create credential, centang
// storage:read + storage:write, lalu "Download .env"):
//   AWS_ENDPOINT_URL_S3  — endpoint S3 branch ini, mis.
//                          https://br-xxxx.storage.c-1.ap-southeast-1.aws.neon.build
//   AWS_ACCESS_KEY_ID    — dari credential di atas (field token_id)
//   AWS_SECRET_ACCESS_KEY — dari credential di atas (field s3_secret_access_key)
//   AWS_REGION           — mis. ap-southeast-1
//   NEON_STORAGE_BUCKET  — nama bucket, HARUS dibuat dengan access level
//                          "public_read" (tab Storage di Console > New bucket)
//                          supaya foto bisa ditampilkan publik di halaman
//                          produk. Default access level "private" tidak akan
//                          bisa diakses browser.

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

function env(name: string): string {
  const value = import.meta.env[name] ?? process.env[name];
  if (!value) throw new Error(`${name} belum diset di environment variables.`);
  return value;
}

function storageClient(): S3Client {
  return new S3Client({
    region: env('AWS_REGION'),
    endpoint: env('AWS_ENDPOINT_URL_S3'),
    credentials: {
      accessKeyId: env('AWS_ACCESS_KEY_ID'),
      secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
    },
    forcePathStyle: true, // wajib true — Neon Storage cuma dukung path-style URL
  });
}

// URL publik = endpoint + /bucket (path-style), berlaku kalau bucket-nya
// access level "public_read". Tidak ada custom domain/CDN terpisah seperti R2.
function publicBaseUrl(): string {
  return `${env('AWS_ENDPOINT_URL_S3')}/${env('NEON_STORAGE_BUCKET')}`;
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export class UploadError extends Error {}

// Upload satu file, return URL publik. `folder` mis. "produk" supaya key-nya
// rapi: produk/<uuid>.webp
export async function uploadProductImage(file: File, folder = 'produk'): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError('Format gambar harus JPG, PNG, atau WebP.');
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new UploadError('Ukuran gambar maksimal 8MB.');
  }

  const bucket = env('NEON_STORAGE_BUCKET');
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const key = `${folder}/${crypto.randomUUID()}.${ext}`;

  const buffer = new Uint8Array(await file.arrayBuffer());

  await storageClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return `${publicBaseUrl()}/${key}`;
}

// Hapus foto lama. Dipanggil best-effort saat produk dihapus/diganti
// fotonya — kegagalan di sini tidak boleh menggagalkan operasi utama.
export async function deleteProductImage(url: string): Promise<void> {
  try {
    const base = publicBaseUrl();
    if (!url.startsWith(base)) return; // bukan aset kita (mis. demo /public), skip
    const key = url.slice(base.length + 1);
    const bucket = env('NEON_STORAGE_BUCKET');
    await storageClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.error('Gagal hapus foto lama di Neon Object Storage:', err);
  }
}
