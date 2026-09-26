import { useState } from 'react';

// Form React (island) dipakai untuk create & edit testimoni. Kirim JSON ke
// POST /api/admin/testimoni (create) atau PUT /api/admin/testimoni/:id
// (edit). Upload foto dilakukan terpisah ke POST /api/admin/upload (folder
// "testimoni") sebelum submit, hasil URL-nya yang disimpan di field `image`.

const emptyTestimonial = {
  name: '',
  role: '',
  quote: '',
  image: '',
  imageAlt: '',
  productId: '',
  sortOrder: 0,
};

function Field({ label, children, required, hint }) {
  return (
    <label className="block">
      <span className="block text-sm text-ink-dim mb-1">
        {label}
        {required && <span className="text-gold-light"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-ink-dim mt-1">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded border border-hairline bg-bg-panel-2 px-3 py-2 text-ink text-sm outline-none focus:border-gold';

/**
 * @param {{
 *   initialTestimonial?: import('../../data/testimonials').Testimonial | null,
 *   testimonialId?: string | null,
 *   productOptions?: { id: string, label: string, sold: boolean }[],
 * }} props
 */
export default function TestimonialForm({ initialTestimonial = null, testimonialId = null, productOptions = [] }) {
  const isEdit = Boolean(testimonialId);
  const [form, setForm] = useState(() =>
    initialTestimonial
      ? { ...emptyTestimonial, ...initialTestimonial, role: initialTestimonial.role ?? '', productId: initialTestimonial.productId ?? '' }
      : emptyTestimonial
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', 'testimoni');
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload gagal.');
      set('image', data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.image) {
      setError('Foto testimoni wajib diupload dulu.');
      return;
    }

    const payload = {
      name: form.name,
      role: form.role,
      quote: form.quote,
      image: form.image,
      imageAlt: form.imageAlt,
      productId: form.productId || null,
      sortOrder: Number(form.sortOrder) || 0,
    };

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/testimoni/${testimonialId}` : '/api/admin/testimoni', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan testimoni.');
      window.location.href = '/admin/testimoni';
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {error && (
        <p className="text-sm text-[#F09595] bg-[#3a1f1f] border border-[#5a2f2f] rounded px-3 py-2">{error}</p>
      )}

      <section className="space-y-4">
        <h2 className="font-serif text-lg text-ink">Detail Testimoni</h2>
        <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
          <Field label="Nama pelanggan" required>
            <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="mis. Vivi Cen" />
          </Field>
          <Field label="Urutan tampil" hint="Makin kecil makin di depan">
            <input
              type="number"
              className={`${inputClass} w-28`}
              value={form.sortOrder}
              onChange={(e) => set('sortOrder', e.target.value)}
            />
          </Field>
        </div>
        <Field label="Profesi / jabatan" hint="Tampil di bawah nama. Boleh dikosongkan.">
          <input className={inputClass} value={form.role} onChange={(e) => set('role', e.target.value)} maxLength={120} placeholder="mis. Content Creator and FnB" />
        </Field>
        <Field label="Kutipan" required hint="Tampil besar di sebelah foto. Dua sampai empat kalimat pendek paling enak dibaca.">
          <textarea className={inputClass} rows={4} value={form.quote} onChange={(e) => set('quote', e.target.value)} required placeholder="mis. Kalau beli di Jubejam itu gw suka detailnya…" />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-lg text-ink">Jam yang Dibeli</h2>
        <Field
          label="Produk"
          hint="Opsional. Kartu kecil di pojok foto (brand, nama, foto jam, dan status Sold out) diambil otomatis dari produk ini dan ikut berubah kalau produknya diedit. Kosongkan kalau tidak ingin menampilkan kartu."
        >
          <select className={inputClass} value={form.productId} onChange={(e) => set('productId', e.target.value)}>
            <option value="">— Tanpa kartu produk —</option>
            {productOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
                {p.sold ? ' (terjual)' : ''}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-lg text-ink">Foto</h2>
        <Field label="Alt text foto (untuk aksesibilitas &amp; SEO)" required>
          <input className={inputClass} value={form.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} required placeholder="mis. Foto Vivi Cen" />
        </Field>

        <div>
          <span className="block text-sm text-ink-dim mb-1">Foto (lanskap, rasio ±16:10) <span className="text-gold-light">*</span></span>
          <span className="block text-xs text-ink-dim mb-2">
            Foto tampil besar di sisi kiri slider. Pakai foto horizontal, lebar minimal 1200px, dengan wajah di tengah/kiri
            (pojok kanan bawah tertutup kartu produk).
          </span>
          {form.image && (
            <img src={form.image} alt="" className="w-64 aspect-[16/10] object-cover rounded border border-hairline mb-2" />
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} disabled={uploading} className="text-sm text-ink-dim" />
          {uploading && <p className="text-xs text-ink-dim mt-1">Mengupload…</p>}
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="rounded bg-gold text-[#14110A] font-medium px-5 py-2 hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {submitting ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Testimoni'}
        </button>
        <a href="/admin/testimoni" className="rounded border border-hairline px-5 py-2 text-ink-dim hover:text-ink">
          Batal
        </a>
      </div>
    </form>
  );
}
