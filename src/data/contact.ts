// Data kontak toko. Dipakai halaman /contact-us.
// Nomor WhatsApp ada di data/faqs.ts (WHATSAPP_DISPLAY, WHATSAPP_URL) supaya tetap satu sumber.

export const CONTACT_EMAIL = 'admin@jubejam.com';

export const STORE_NAME = 'Jubejam Store';
export const STORE_ADDRESS = 'Pantai Indah Kapuk No.21 Lantai 2, 14460, Indonesia';

// Titik toko di Google Maps (dari link "Jubejam Store - Google Maps").
export const STORE_LAT = -6.0921802;
export const STORE_LNG = 106.7478994;

// ID tempat Jubejam Store di Google (bagian "!1s..." pada link Google Maps).
const STORE_PLACE_FID = '0x2e6a1dca793b15ed:0xeed2b68dc855fb22';

// Embed resmi Google untuk tempat ini (format yang sama dengan Share → Embed a map),
// jadi yang tampil kartu tempat lengkap: nama, alamat, rating, seperti referensi.
// Kalau tampilannya perlu diganti, salin isi src="..." dari Google Maps → Share → Embed a map.
export const MAP_EMBED_URL =
  'https://www.google.com/maps/embed?pb=' +
  `!1m18!1m12!1m3!1d2000!2d${STORE_LNG}!3d${STORE_LAT}` +
  '!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1' +
  `!3m3!1m2!1s${encodeURIComponent(STORE_PLACE_FID)}!2s${encodeURIComponent(STORE_NAME)}` +
  '!5e0!3m2!1sid!2sid!4v1758000000000!5m2!1sid!2sid';

// Link "Buka di Google Maps": halaman tempat Jubejam Store (tanpa parameter pelacakan).
export const MAP_LINK_URL =
  'https://www.google.com/maps/place/Jubejam+Store/@-6.09218,106.747899,15z/data=!4m6!3m5!1s0x2e6a1dca793b15ed:0xeed2b68dc855fb22!8m2!3d-6.0921802!4d106.7478994!16s%2Fg%2F11sqkrns86';