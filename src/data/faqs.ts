// Konten FAQ. Satu item = satu pertanyaan; setiap elemen `answer` dirender
// sebagai satu paragraf. Nomor WhatsApp di dalam teks otomatis jadi link.

export interface FaqItem {
  question: string;
  answer: string[];
}

export const WHATSAPP_DISPLAY = '087877999858';
// 0878... → format internasional untuk wa.me
export const WHATSAPP_URL = 'https://wa.me/6287877999858';

export const faqs: FaqItem[] = [
  {
    question: 'Bagaimana Cara Membeli Dari Jubejam',
    answer: [
      'Step 1: Screenshot ataupun copy nama dari yang dilihat dari website',
      'Step 2: Click “WhatsApp Us” lalu Anda akan dibawa ke WhatsApp kami',
      'Step 3: Kirimkan photo dan detail kepada admin WhatsApp kami',
      'Step 4: Melakukan DP/Pelunasan saat melihat barang ataupun sebelum dengan admin WhatsApp kami',
      'Happy Shopping Ladies and Gentlemen!',
    ],
  },
  {
    question: 'Apakah Harga Di Jubejam Sudah Nett?',
    answer: [
      'Karena kepuasan pelanggan merupakan misi kami, maka dari itu, Jubejam masih memberikan ruang untuk bernegosiasi kepada admin kami',
    ],
  },
  {
    question: 'Apakah Luxury Watch di Jubejam Authentic?',
    answer: [
      'Kami hanya menjual barang yang 100% Authentic. Maka dari itu kami menerapkan motto “100% Authentic Or Moneyback”. Jadi kalian tidak perlu khawatir',
    ],
  },
  {
    question: 'Offline Store Jubejam Dimana Saja?',
    answer: [
      'Kami saat ini hanya ada di Jakarta Utara, PIK Golf Island. Akan tetapi sebentar lagi akan memiliki cabang di Pondok Indah dan Pantai Mutiara. Stay Tune!',
    ],
  },
  {
    question: 'Bagaimana Jubejam Mengirim Ke Luar Kota?',
    answer: [
      'Kami sudah mengirim lebih dari 185 luxury watches ke luar kota maupun keluar negeri. Maka dari itu, semua jam yang akan dikirim akan kami packaging dengan sangat aman.',
      'Bukan hanya itu, customer juga akan mendapatkan asuransi dari pihak pengiriman',
    ],
  },
  {
    question: 'Consignment, Tukar Tambah, Dan Penjualan',
    answer: [
      'Kami menerima Consignment, Tukar Tambah dan Penjualan. Untuk penjualan dan consignment, kalian boleh mengirimkan detail dan photo pada website bagian “SELL MY WATCH”. Lalu admin kami akan mengirimkan penawaran kepada kalian melalui nomor yang kalian isi',
    ],
  },
  {
    question: 'Payment Methods/Pembayaran di Jubejam',
    answer: [
      `Kami menerima berbagai macam pembayaran. Seperti via Transfer, Cash, Kartu kredit maupun debit, dan transaksi melalui Tokopedia. Untuk informasi lanjut WhatsApp kami melalui ${WHATSAPP_DISPLAY}`,
    ],
  },
  {
    question: 'Apakah Jubejam Menerima Cicilan?',
    answer: [
      'Jubejam menerima cicilan up to 24x melalui Tokopedia. Untuk interest rates dapat ditanyakan langsung kepada Admin kami di WhatsApp maupun Instagram',
    ],
  },
  {
    question: 'Apakah Luxury Watch Di Jubejam Memiliki Warranty?',
    answer: [
      'Jubejam selalu memberikan 1 year movement warranty kepada semua customer Jubejam yang membeli jam tangan preowned. Dan untuk jam tangan brand new sudah mendapatkan warranty 5 tahun dari Rolex official',
    ],
  },
];
