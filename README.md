# Jubejam — Header & Hero (Astro)

Hasil konversi dari `jubejam-header-hero.html` (single-file HTML) ke struktur
Astro sesuai **Stack Final**:

```
jubejam-astro/
├── astro.config.mjs        # integrasi @astrojs/react + @astrojs/tailwind
├── tailwind.config.mjs     # token warna & font dari :root asli
├── package.json
├── public/
│   ├── logo.webp           # di-extract dari base64 asli
│   └── frames/
│       └── frame-001.jpg … frame-192.jpg   # di-extract dari FRAME_SOURCES
└── src/
    ├── layouts/
    │   └── Layout.astro    # <head>, Google Fonts, import global.css
    ├── styles/
    │   └── global.css      # @tailwind + sisa CSS yang belum ada padanan utility-nya
    ├── components/
    │   ├── Header.astro    # statis, toggle menu mobile pakai <script> kecil (bukan React)
    │   └── HeroFrameSequence.jsx  # REACT ISLAND — canvas scroll-pinned animation
    └── pages/
        └── index.astro     # <Header /> + <HeroFrameSequence client:load />
```

## Kenapa dipecah begini

- **Astro statis untuk katalog publik** → `Header.astro` dan `index.astro`
  di-render sebagai HTML statis di build time, zero JS kecuali yang memang
  perlu (toggle menu mobile pakai `<script>` polos, bukan React, karena cuma
  add/remove class).
- **Island React untuk efek scroll-animasi** → `HeroFrameSequence.jsx` adalah
  satu-satunya bagian yang butuh state + lifecycle (preload gambar, canvas
  drawing, scroll listener), jadi dihidrasi dengan `client:load`.
- **192 frame base64 di-extract jadi file `.jpg` asli** di `public/frames/`.
  Total ~7.9 MB. Ini WAJIB dipisah dari HTML — sebelumnya semua base64
  nge-blok parsing HTML (file asli 490 baris tapi puluhan KB per baris).
  Dengan file terpisah, browser bisa cache per-frame dan request-nya paralel.

## Yang belum termasuk di sini (di luar scope header/hero)

Sesuai Stack Final, langkah lanjutan yang perlu disiapkan terpisah:

- `src/pages/api/*.ts` — endpoint CRUD admin (produk, kategori, dll), query ke
  Neon lewat Drizzle.
- `src/db/schema.ts` + `drizzle.config.ts` — skema Drizzle ke Neon Postgres.
- Auth admin (Lucia/Clerk) sebelum halaman `/admin` bisa diakses.
- Upload gambar produk ke Cloudflare R2 / Uploadthing, bukan base64 di DB.

## Menjalankan

```bash
npm install
npm run dev
```

## Catatan optimasi (opsional, tidak wajib untuk PR ini)

192 frame JPEG @ ~40KB rata-rata = 7.9 MB total yang di-preload semua di
awal. Ini sama seperti perilaku file HTML aslinya, jadi UX-nya tidak berubah.
Kalau nanti mau dioptimasi lebih lanjut:

1. Convert frame ke WebP/AVIF (bisa potong ukuran 30–50%).
2. Turunkan jumlah frame (mis. 96 frame masih mulus untuk scroll animation)
   dan interpolasi index di JS.
3. Preload lazy: load frame beresolusi rendah dulu, ganti ke resolusi tinggi
   setelah idle.
4. Pertimbangkan `<video>` + `requestVideoFrameCallback` alih-alih frame
   sequence kalau butuh lebih ringan (browser support: mostly Chromium).
