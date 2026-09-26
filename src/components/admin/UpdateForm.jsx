import { useState } from 'react';

// Form React (island) dipakai untuk create & edit update/artikel. Kirim JSON
// ke POST /api/admin/updates (create) atau PUT /api/admin/updates/:id (edit).
// Upload foto dilakukan terpisah ke POST /api/admin/upload (folder "updates")
// sebelum submit, hasil URL-nya yang disimpan di field `image`.

// Update cukup foto: nama (untuk daftar admin, slug, dan alt foto), foto, dan
// link tujuan (opsional, foto jadi bisa diklik).
const emptyUpdate = {
  title: '',
  image: '',
  href: '',
};

function pickFields(u) {
  return {
    title: u.title ?? '',
    image: u.image ?? '',
    // '#' = placeholder lama untuk "belum ada link"
    href: u.href && u.href !== '#' ? u.href : '',
  };
}

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
 *   initialUpdate?: import('../../data/updates').Update | null,
 *   updateId?: string | null,
 * }} props
 */
export default function UpdateForm({ initialUpdate = null, updateId = null }) {
  const isEdit = Boolean(updateId);
  const [form, setForm] = useState(() => (initialUpdate ? pickFields(initialUpdate) : emptyUpdate));
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
      body.append('folder', 'updates');
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
      setError('Foto update wajib diupload dulu.');
      return;
    }

    const payload = { ...form, href: form.href.trim() || '#' };

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/updates/${updateId}` : '/api/admin/updates', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan update.');
      window.location.href = '/admin/updates';
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
        <h2 className="font-serif text-lg text-ink">Update</h2>
        <Field label="Nama update" required hint="Untuk penanda di daftar admin dan alt text foto. Tidak tampil di website.">
          <input className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="mis. What Is A GMT Master?" />
        </Field>
        <Field label="Link tujuan" hint="Opsional. Kalau diisi, foto bisa diklik (mis. link artikel lengkap atau Instagram).">
          <input className={inputClass} value={form.href} onChange={(e) => set('href', e.target.value)} placeholder="https://... atau /produk" />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-lg text-ink">Foto</h2>
        <div>
          <span className="block text-sm text-ink-dim mb-1">Foto <span className="text-gold-light">*</span></span>
          {form.image && (
            <img src={form.image} alt="" className="w-full max-w-sm aspect-[537/354] object-cover rounded border border-hairline mb-2" />
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} disabled={uploading} className="text-sm text-ink-dim" />
          <span className="block text-xs text-ink-dim mt-1">Semua teks (judul, kategori, dll.) dimasukkan langsung ke dalam gambar. Rasio ideal sekitar 3:2.</span>
          {uploading && <p className="text-xs text-ink-dim mt-1">Mengupload…</p>}
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="rounded bg-gold text-[#14110A] font-medium px-5 py-2 hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {submitting ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Update'}
        </button>
        <a href="/admin/updates" className="rounded border border-hairline px-5 py-2 text-ink-dim hover:text-ink">
          Batal
        </a>
      </div>
    </form>
  );
}
