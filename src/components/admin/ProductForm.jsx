import { useState } from 'react';

// Form React (island) dipakai untuk create & edit produk. Kirim JSON ke
// POST /api/admin/produk (create) atau PUT /api/admin/produk/:id (edit).
// Upload foto dilakukan terpisah ke POST /api/admin/upload sebelum submit,
// hasil URL-nya yang disimpan di field `image` / `gallery[].src`.

const emptyProduct = {
  brandSlug: '',
  brandName: '',
  model: '',
  category: '',
  reference: '',
  year: new Date().getFullYear(),
  gender: 'men',
  condition: 'preloved',
  status: 'available',
  price: '',
  image: '',
  imageAlt: '',
  gallery: [],
  kelengkapan: 'Full set',
  warranty: '',
  grade: '',
  movement: '',
  caseDetail: '',
  dial: '',
  bracelet: '',
  serial: '',
  marketPrice: '',
};

function Field({ label, children, required }) {
  return (
    <label className="block">
      <span className="block text-sm text-ink-dim mb-1">
        {label}
        {required && <span className="text-gold-light"> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded border border-hairline bg-bg-panel-2 px-3 py-2 text-ink text-sm outline-none focus:border-gold';

/**
 * @param {{
 *   brands: readonly { slug: string, name: string }[],
 *   categories: { slug: string, label: string }[],
 *   genderOptions: { value: string, label: string }[],
 *   conditionOptions: { value: string, label: string }[],
 *   initialProduct?: import('../../data/products').Product | null,
 *   productId?: string | null,
 * }} props
 */
export default function ProductForm({ brands, categories, genderOptions, conditionOptions, initialProduct = null, productId = null }) {
  const isEdit = Boolean(productId);
  const [form, setForm] = useState(() =>
    initialProduct
      ? { ...initialProduct, category: initialProduct.category ?? '', serial: initialProduct.serial ?? '', marketPrice: initialProduct.marketPrice ?? '' }
      : emptyProduct
  );
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function uploadFile(file) {
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Upload gagal.');
    return data.url;
  }

  async function handleMainImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    setError('');
    try {
      const url = await uploadFile(file);
      set('image', url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingMain(false);
      e.target.value = '';
    }
  }

  async function handleGalleryImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGallery(true);
    setError('');
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, gallery: [...f.gallery, { src: url, alt: f.imageAlt || f.model }] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  }

  function removeGalleryImage(index) {
    setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.image) {
      setError('Foto sampul wajib diupload dulu.');
      return;
    }

    const payload = {
      ...form,
      category: form.category || null,
      year: form.year === null || form.year === '' ? null : Number(form.year),
      price: Number(form.price),
      serial: form.serial || undefined,
      marketPrice: form.marketPrice === '' ? undefined : Number(form.marketPrice),
    };

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/produk/${productId}` : '/api/admin/produk', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan produk.');
      window.location.href = '/admin/produk';
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  function handleBrandChange(slug) {
    const brand = brands.find((b) => b.slug === slug);
    setForm((f) => ({ ...f, brandSlug: slug, brandName: brand?.name ?? '' }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {error && (
        <p className="text-sm text-[#F09595] bg-[#3a1f1f] border border-[#5a2f2f] rounded px-3 py-2">{error}</p>
      )}

      <section className="space-y-4">
        <h2 className="font-serif text-lg text-ink">Identitas Produk</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Brand" required>
            <select className={inputClass} value={form.brandSlug} onChange={(e) => handleBrandChange(e.target.value)} required>
              <option value="" disabled>Pilih brand</option>
              {brands.map((b) => (
                <option key={b.slug} value={b.slug}>{b.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Model" required>
            <input className={inputClass} value={form.model} onChange={(e) => set('model', e.target.value)} required placeholder="mis. Submariner Date" />
          </Field>
          <Field label="Kategori (opsional, khusus Rolex)">
            <select className={inputClass} value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Tidak ada</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Reference" required>
            <input className={inputClass} value={form.reference} onChange={(e) => set('reference', e.target.value)} required placeholder="mis. 126613LB" />
          </Field>
          <div>
            <Field label="Tahun" required={form.year !== null}>
              <input
                type="number"
                className={`${inputClass} disabled:opacity-50`}
                value={form.year ?? ''}
                onChange={(e) => set('year', e.target.value)}
                disabled={form.year === null}
                required={form.year !== null}
              />
            </Field>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-ink-dim">
              <input
                type="checkbox"
                checked={form.year === null}
                onChange={(e) => set('year', e.target.checked ? null : new Date().getFullYear())}
              />
              Undated (tahun tidak diketahui)
            </label>
          </div>
          <Field label="Serial (opsional)">
            <input className={inputClass} value={form.serial} onChange={(e) => set('serial', e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-lg text-ink">Kondisi &amp; Harga</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Gender" required>
            <select className={inputClass} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              {genderOptions.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Kondisi" required>
            <select className={inputClass} value={form.condition} onChange={(e) => set('condition', e.target.value)}>
              {conditionOptions.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Status" required>
            <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="available">Tersedia</option>
              <option value="sold">Terjual</option>
            </select>
          </Field>
          <Field label="Grade / kondisi fisik" required>
            <input className={inputClass} value={form.grade} onChange={(e) => set('grade', e.target.value)} placeholder="mis. Excellent, Unworn" required />
          </Field>
          <Field label="Harga (Rp)" required>
            <input type="number" className={inputClass} value={form.price} onChange={(e) => set('price', e.target.value)} required min="1" />
          </Field>
          <Field label="Market price pembanding (Rp, opsional)">
            <input type="number" className={inputClass} value={form.marketPrice} onChange={(e) => set('marketPrice', e.target.value)} />
          </Field>
          <Field label="Kelengkapan" required>
            <input className={inputClass} value={form.kelengkapan} onChange={(e) => set('kelengkapan', e.target.value)} placeholder="mis. Full set" required />
          </Field>
          <Field label="Warranty" required>
            <input className={inputClass} value={form.warranty} onChange={(e) => set('warranty', e.target.value)} placeholder="mis. Garansi 1 tahun movement" required />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-lg text-ink">Spesifikasi</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Movement" required>
            <input className={inputClass} value={form.movement} onChange={(e) => set('movement', e.target.value)} required />
          </Field>
          <Field label="Case" required>
            <input className={inputClass} value={form.caseDetail} onChange={(e) => set('caseDetail', e.target.value)} required />
          </Field>
          <Field label="Dial" required>
            <input className={inputClass} value={form.dial} onChange={(e) => set('dial', e.target.value)} required />
          </Field>
          <Field label="Bracelet" required>
            <input className={inputClass} value={form.bracelet} onChange={(e) => set('bracelet', e.target.value)} required />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-lg text-ink">Foto</h2>
        <Field label="Alt text foto (untuk aksesibilitas &amp; SEO)" required>
          <input className={inputClass} value={form.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} required placeholder="mis. Rolex Submariner Date dial biru" />
        </Field>

        <div>
          <span className="block text-sm text-ink-dim mb-1">Foto sampul <span className="text-gold-light">*</span></span>
          {form.image && (
            <img src={form.image} alt="" className="w-40 h-40 object-cover rounded border border-hairline mb-2" />
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleMainImage} disabled={uploadingMain} className="text-sm text-ink-dim" />
          {uploadingMain && <p className="text-xs text-ink-dim mt-1">Mengupload…</p>}
        </div>

        <div>
          <span className="block text-sm text-ink-dim mb-2">Foto galeri (opsional, boleh lebih dari satu)</span>
          <div className="flex flex-wrap gap-3 mb-2">
            {form.gallery.map((g, i) => (
              <div key={g.src} className="relative">
                <img src={g.src} alt="" className="w-20 h-20 object-cover rounded border border-hairline" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#3a1f1f] text-[#F09595] text-xs leading-5"
                  aria-label="Hapus foto"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleGalleryImage} disabled={uploadingGallery} className="text-sm text-ink-dim" />
          {uploadingGallery && <p className="text-xs text-ink-dim mt-1">Mengupload…</p>}
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || uploadingMain || uploadingGallery}
          className="rounded bg-gold text-[#14110A] font-medium px-5 py-2 hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {submitting ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
        </button>
        <a href="/admin/produk" className="rounded border border-hairline px-5 py-2 text-ink-dim hover:text-ink">
          Batal
        </a>
      </div>
    </form>
  );
}
