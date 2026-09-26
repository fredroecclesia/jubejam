import { useState } from 'react';

// Form React (island) dipakai untuk create & edit event. Kirim JSON ke
// POST /api/admin/events (create) atau PUT /api/admin/events/:id (edit).
// Upload foto dilakukan terpisah ke POST /api/admin/upload (folder "events")
// sebelum submit, hasil URL-nya yang disimpan di field `image`.

// Event cukup foto: nama (untuk daftar admin, slug, dan alt foto), foto,
// link tujuan (opsional, foto jadi bisa diklik), dan penanda featured.
const emptyEvent = {
  title: '',
  featured: false,
  image: '',
  href: '',
};

function pickFields(ev) {
  return {
    title: ev.title ?? '',
    featured: Boolean(ev.featured),
    image: ev.image ?? '',
    href: ev.href ?? '',
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
 *   initialEvent?: import('../../data/events').Event | null,
 *   eventId?: string | null,
 * }} props
 */
export default function EventForm({ initialEvent = null, eventId = null }) {
  const isEdit = Boolean(eventId);
  const [form, setForm] = useState(() => (initialEvent ? pickFields(initialEvent) : emptyEvent));
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
      body.append('folder', 'events');
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
      setError('Foto event wajib diupload dulu.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/events/${eventId}` : '/api/admin/events', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan event.');
      window.location.href = '/admin/events';
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
        <h2 className="font-serif text-lg text-ink">Event</h2>
        <Field label="Nama event" required hint="Untuk penanda di daftar admin dan alt text foto. Tidak tampil di website.">
          <input className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="mis. Steal Deal: GMT-Master Steel Coke" />
        </Field>
        <Field label="Link tujuan" hint="Opsional. Kalau diisi, foto bisa diklik. Boleh link internal (mis. /produk) atau eksternal (WhatsApp, Instagram, dst.)">
          <input className={inputClass} value={form.href} onChange={(e) => set('href', e.target.value)} placeholder="https://... atau /produk" />
        </Field>

        <label className="flex items-center gap-2 text-sm text-ink pt-1">
          <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
          Jadikan banner utama (featured)
        </label>
        {form.featured && (
          <p className="text-xs text-ink-dim">
            Hanya boleh satu event featured aktif — event featured lain (kalau ada) otomatis dilepas statusnya saat disimpan.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-lg text-ink">Foto</h2>
        <div>
          <span className="block text-sm text-ink-dim mb-1">Foto <span className="text-gold-light">*</span></span>
          {form.image && (
            <img src={form.image} alt="" className="w-full max-w-sm aspect-[1600/778] object-cover rounded border border-hairline mb-2" />
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} disabled={uploading} className="text-sm text-ink-dim" />
          <span className="block text-xs text-ink-dim mt-1">Semua teks (judul, harga, tombol) dimasukkan langsung ke dalam gambar. Rasio ideal sekitar 2:1.</span>
          {uploading && <p className="text-xs text-ink-dim mt-1">Mengupload…</p>}
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="rounded bg-gold text-[#14110A] font-medium px-5 py-2 hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {submitting ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Event'}
        </button>
        <a href="/admin/events" className="rounded border border-hairline px-5 py-2 text-ink-dim hover:text-ink">
          Batal
        </a>
      </div>
    </form>
  );
}
