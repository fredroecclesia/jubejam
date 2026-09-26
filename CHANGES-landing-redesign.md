# Redesign landing page Jubejam — daftar perubahan

Ekstrak zip ini ke folder project (root `jubejam/`), timpa file yang sudah ada.

## Urutan section baru (src/pages/index.astro)
1. Header
2. Hero (HeroFrameSequence)
3. TrustStrip
4. EventsSection (id="event"; event unggulan + maks. 3 event lain, sebelum "Baru datang")
5. FeaturedProducts ("Baru datang", 4 jam terbaru yang tersedia)
6. CollectionExplorer (Model / Brand / Gender dalam satu section bertab)
7. ProcessSection (id="proses"; tujuan tombol "Lihat proses kami" di hero)
8. VideoSection (id="video")
9. TestimonialSection
10. SellSection
11. OfflineStoreSection
12. UpdatesSection (id="update"; 3 update terbaru, sebelum FAQ singkat)
13. FaqPreview
14. FinalCta
15. Footer

Catatan: padding ProcessSection disamakan dengan section lain (py-16 sm:py-24) karena sudah tidak menempel ke hero.

## File baru
src/components/home/{TrustStrip,FeaturedProducts,CollectionExplorer,ProcessSection,SellSection,FaqPreview,FinalCta}.astro

## File diubah
- src/styles/global.css            -> kelas bersama: .eyebrow .section-title .section-lead .btn .btn-gold .btn-outline .btn-ghost
- src/pages/index.astro            -> susunan baru + <main>
- src/components/home/HeroFrameSequence.jsx
- src/components/home/TestimonialSection.astro
- src/components/home/OfflineStoreSection.astro
- src/components/home/EventsSection.astro   (baru, menggantikan EventsUpdateSection.astro)
- src/components/home/UpdatesSection.astro  (baru)
- src/components/events/UpdateList.astro    -> tambah id="update"
- src/components/common/Header.astro   -> breakpoint nav md -> lg (label nav TIDAK diubah)
- src/components/common/Footer.astro   -> footer gelap, label Indonesia
- src/layouts/Layout.astro         -> meta default "pre-owned"
- src/data/products.ts             -> label "Preloved" -> "Pre-owned" (nilai DB 'preloved' tetap)

## File yang HARUS dihapus (sudah tidak dipakai)
PowerShell, dari root project:
Remove-Item src\components\home\EventSection.astro, src\components\home\RolexCategoriesSection.astro, src\components\home\OtherBrandsSection.astro, src\components\home\GenderSection.astro

## Tambahan: opsi "Undated" untuk Tahun produk (admin CRUD)
Tahun sekarang boleh kosong (null = Undated). Tampil sebagai "Undated" di katalog, detail, spesifikasi, WhatsApp, dan daftar admin.
- src/db/schema.ts                        -> kolom `year` jadi nullable
- src/data/products.ts                    -> tipe year: number | null, helper yearLabel(), teks WhatsApp & spesifikasi
- src/lib/product-validation.ts           -> year boleh null
- src/components/admin/ProductForm.jsx    -> checkbox "Undated" di bawah input Tahun
- src/components/catalog/ProductCard.astro
- src/pages/produk/[slug].astro
- src/pages/admin/produk/index.astro
WAJIB setelah pasang: jalankan `npm run db:push` (mengubah kolom year jadi boleh kosong).
