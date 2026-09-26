import { useEffect, useRef, useState } from 'react';

// 192 frame WebP (1600x900) di /public/frames/. Di layar kecil / mode hemat data hanya
// setiap frame ke-2 yang dimuat (96 frame) — animasi tetap mulus, unduhan ~separuh.
const TOTAL_FRAMES = 192;
// Loader hilang setelah sekian frame AWAL siap; sisanya dimuat di latar belakang
// sambil pengunjung sudah bisa membaca headline dan mulai scroll.
const READY_FRAMES = 20;

// Alur animasi (dalam progres frame pf = 0..1, dari 192 frame):
//   pf 0    - 0.30  : jam utuh, membesar dan berputar
//   pf 0.30 - 0.66  : jam terbongkar (frame ±58–127, gerakan paling deras)
//   pf 0.66 - 1     : komponen melayang pelan
// Nilai di bawah mengikuti alur itu. Kalau animasinya diganti lagi, sesuaikan tiga angka ini.
const EXPLODE_FROM = 0.3;
const EXPLODE_TO = 0.66;

// Layar portrait (HP): frame 16:9 tidak muat utuh, jadi hanya sebagian lebarnya yang tampil.
//  - crop: porsi lebar frame yang tampil. Awalnya rapat (jam terlihat besar), lalu melebar
//    selama ledakan supaya komponen di kiri-kanan tidak terpotong (kamera "menjauh").
//  - shiftStart: geser vertikal di awal (fraksi tinggi layar, negatif = naik) supaya jam
//    berada di atas teks pembuka; kembali ke tengah di pf 0.25.
const PORTRAIT = { cropStart: 0.5, cropEnd: 0.92, shiftStart: -0.12 };

// Tinggi area scroll hero. Progres scroll mentah (0..1) dibagi tiga fase:
//  - 0 .. FRAME_END           : frame diputar
//  - SCRIM_START .. SCRIM_END : tepi bawah frame dileburkan ke hitam supaya menyambung ke
//                               section berikutnya.
//  - OUTRO_AT .. 1           : teks penutup (di atas jam yang sudah terbongkar) tampil dan DIAM
//                               sebelum hero lepas dari pin.
// Dengan 360vh, jarak scroll ±270vh: teks penutup punya ±60vh untuk dibaca dan diklik.
const PIN_HEIGHT = '360vh';
const FRAME_END = 0.78;
const SCRIM_START = 0.7;
const SCRIM_END = 0.78;
const OUTRO_AT = 0.58;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

const frameSrc = (i) => `/frames/frame-${String(i + 1).padStart(3, '0')}.webp`;

export default function HeroFrameSequence() {
  const canvasRef = useRef(null);
  const heroPinRef = useRef(null);
  const stageRef = useRef(null);

  const [loadedPct, setLoadedPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [outroVisible, setOutroVisible] = useState(false);
  const [scrimOpacity, setScrimOpacity] = useState(0);
  const [chapter, setChapter] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const heroPin = heroPinRef.current;
    const stage = stageRef.current;
    if (!canvas || !heroPin || !stage) return;

    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduced(reduceMotion);

    const lowData = window.innerWidth < 768 || navigator.connection?.saveData === true;
    const step = lowData ? 2 : 1;
    const total = Math.ceil(TOTAL_FRAMES / step);
    const readyCount = Math.min(READY_FRAMES, total);
    const images = new Array(total);

    let lastTarget = 0;
    let ticking = false;
    let phase1Done = 0;
    // Jarak tempel panggung dari atas layar (= tinggi header). Dibaca dari CSS supaya
    // selalu sama dengan yang dipakai browser untuk `position: sticky`.
    let stickTop = 0;

    // Ukuran canvas mengikuti PANGGUNG (layar dikurangi header), bukan window penuh.
    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      stickTop = parseFloat(getComputedStyle(stage).top) || 0;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      drawFrame(lastTarget);
      updateHero();
    }

    // pf: progres frame 0..1 untuk frame yang dituju (dipakai framing portrait).
    function drawImageFit(img, pf) {
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const canvasRatio = cw / ch;

      ctx.fillStyle = '#0a0a0b';
      ctx.fillRect(0, 0, cw, ch);

      if (canvasRatio < 1) {
        // Portrait: tampilkan bagian tengah frame, diskalakan selebar layar. Crop melebar
        // selama ledakan; geseran vertikal awal hilang menjelang pf 0.25 (lihat PORTRAIT).
        const zoomOut = smooth(clamp01((pf - EXPLODE_FROM) / (EXPLODE_TO - EXPLODE_FROM)));
        const crop = lerp(PORTRAIT.cropStart, PORTRAIT.cropEnd, zoomOut);
        const shift = PORTRAIT.shiftStart * (1 - smooth(clamp01(pf / 0.25)));
        const sw = iw * crop;
        // Di frame awal jam berada ±12% di kanan tengah; crop mengikutinya lalu kembali ke tengah.
        const cx = lerp(0.62, 0.5, smooth(clamp01(pf / 0.3)));
        const sx = Math.min(iw - sw, Math.max(0, cx * iw - sw / 2));
        const scale = cw / sw;
        const dh = ih * scale;
        const top = (ch - dh) / 2 + shift * ch;
        ctx.drawImage(img, sx, 0, sw, ih, 0, top, cw, dh);

        // Frame lebih pendek dari layar, jadi ada pita polos di atas & bawah. Tepi frame
        // dilebur ke warna pita supaya tidak tampak sebagai garis horizontal.
        const fade = dh * 0.26;
        const edges = [
          [top, top + fade, top],
          [top + dh, top + dh - fade, top + dh - fade],
        ];
        for (const [from, to, rectY] of edges) {
          const g = ctx.createLinearGradient(0, from, 0, to);
          g.addColorStop(0, '#0a0a0b');
          g.addColorStop(1, 'rgba(10,10,11,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, rectY, cw, fade);
        }
        return;
      }

      // Landscape: `cover`, dengan kamera yang mulai sedikit zoom-in dan bergeser sehingga jam
      // berada di kanan (ruang kiri untuk headline), lalu meluas ke tengah menjelang ledakan.
      const imgRatio = iw / ih;
      let sx, sy, sw, sh;
      if (imgRatio > canvasRatio) {
        sh = ih;
        sw = ih * canvasRatio;
        sx = (iw - sw) / 2;
        sy = 0;
      } else {
        sw = iw;
        sh = iw / canvasRatio;
        sx = 0;
        sy = (ih - sh) / 2;
      }
      const e = smooth(clamp01(pf / 0.4));
      const zoom = 1 + 0.15 * (1 - e);
      const dw = cw * zoom;
      const dh2 = ch * zoom;
      // Tepi kiri frame tetap di x=0: kelebihan zoom jatuh ke kanan, jadi jam tampak bergeser kanan.
      ctx.drawImage(img, sx, sy, sw, sh, 0, -((zoom - 1) / 2) * ch, dw, dh2);
    }

    // naturalWidth > 0 menyaring gambar yang gagal dimuat (complete tapi kosong).
    const usable = (img) => img && img.complete && img.naturalWidth > 0;

    function nearestLoaded(idx) {
      if (usable(images[idx])) return idx;
      for (let d = 1; d < total; d++) {
        if (idx - d >= 0 && usable(images[idx - d])) return idx - d;
        if (idx + d < total && usable(images[idx + d])) return idx + d;
      }
      return -1;
    }

    function drawFrame(idx) {
      lastTarget = idx;
      const use = nearestLoaded(idx);
      if (use === -1) return;
      drawImageFit(images[use], total > 1 ? idx / (total - 1) : 0);
    }

    function loadFrame(i, onSettle) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (i === lastTarget) drawFrame(lastTarget); // frame yang sedang dituju baru datang
        onSettle?.();
      };
      // onerror juga dianggap "selesai", supaya loader tidak macet kalau ada frame yang gagal.
      img.onerror = () => onSettle?.();
      img.src = frameSrc(Math.min(i * step, TOTAL_FRAMES - 1));
      images[i] = img;
    }

    function onPhase1Settle() {
      phase1Done++;
      setLoadedPct(Math.round((phase1Done / readyCount) * 100));
      if (phase1Done === readyCount) {
        setReady(true);
        for (let i = readyCount; i < total; i++) loadFrame(i);
      }
    }

    function updateHero() {
      ticking = false;
      const rect = heroPin.getBoundingClientRect();
      // Panggung mulai menempel saat atas wrapper mencapai `stickTop`, dan lepas setelah
      // wrapper habis dikurangi tinggi panggung.
      const totalScroll = heroPin.offsetHeight - stage.clientHeight;
      let raw = totalScroll > 0 ? (stickTop - rect.top) / totalScroll : 0;
      raw = Math.min(1, Math.max(0, raw));

      // p = progres frame (selesai di FRAME_END, sisanya frame terakhir diam).
      const p = Math.min(1, raw / FRAME_END);
      drawFrame(Math.min(total - 1, Math.floor(p * total)));

      setIntroVisible(p < 0.14);
      setOutroVisible(raw > OUTRO_AT);
      setChapter(p < 0.14 ? 1 : raw > OUTRO_AT ? 3 : 2);
      // Scrim gelap di belakang teks penutup: baru naik setelah ledakan selesai, dan
      // sudah penuh saat teksnya muncul.
      setScrimOpacity(clamp01((raw - SCRIM_START) / (SCRIM_END - SCRIM_START)));
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateHero);
      }
    }

    resizeCanvas();
    for (let i = 0; i < readyCount; i++) loadFrame(i, onPhase1Settle);

    // ResizeObserver menangkap resize window DAN perubahan --header-h (yang mengubah
    // tinggi panggung), jadi tidak perlu listener `resize` terpisah.
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(stage);
    // Reduced motion: tidak ada animasi scroll; tampilkan frame pertama + headline saja.
    if (!reduceMotion) {
      window.addEventListener('scroll', onScroll, { passive: true });
      updateHero();
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setLoaderGone(true), 600);
    return () => clearTimeout(t);
  }, [ready]);

  // Loncat ke bab tertentu (progres scroll mentah 0..1 di dalam hero).
  const goTo = (raw) => {
    const pin = heroPinRef.current;
    const stage = stageRef.current;
    if (!pin || !stage) return;
    const total = pin.offsetHeight - stage.clientHeight;
    const stickTop = parseFloat(getComputedStyle(stage).top) || 0;
    window.scrollTo({ top: window.scrollY + pin.getBoundingClientRect().top - stickTop + raw * total, behavior: 'smooth' });
  };

  const show = 'opacity-100 translate-y-0 pointer-events-auto';
  const hideUp = 'opacity-0 -translate-y-4 pointer-events-none';
  const hideDown = 'opacity-0 translate-y-4 pointer-events-none';
  const iconCls = 'h-6 w-6 text-gold-light';
  const chapters = [
    { n: 1, label: 'Jam utuh', at: 0 },
    { n: 2, label: 'Jam dibongkar', at: 0.36 },
    { n: 3, label: 'Komponen jam', at: 0.64 },
  ];
  const features = [
    {
      title: '100% Authentic',
      sub: 'Or moneyback',
      icon: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zm-3 9l2.5 2.5L15.5 9.5" />,
    },
    {
      title: 'Diperiksa Teliti',
      sub: 'Satu per satu',
      icon: <path d="M10.5 4a6.500 6.500 0 105 10.600l4.400 4.400M8 10.5l2 2 3.500-3.500" />,
    },
    {
      title: 'Siap Dipakai',
      sub: 'Hari ini',
      icon: <path d="M12 8v4l2.5 1.500M9 3h6l1 3.500a7 7 0 010 11L15 21H9l-1-3.500a7 7 0 010-11L9 3z" />,
    },
  ];
  const arrow = (
    <svg viewBox="0 0 24 24" className="ml-3 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
  const panel = 'absolute inset-x-0 z-[5] px-6 text-center transition-all duration-500 ease-out md:landscape:text-left md:landscape:pl-[6vw] md:landscape:pr-0';

  return (
    <div ref={heroPinRef} className="relative bg-black" style={reduced ? undefined : { height: PIN_HEIGHT }}>
      <div ref={stageRef} className="hero-stage flex items-center justify-center overflow-hidden bg-black">
        <canvas ref={canvasRef} className="absolute left-0 top-0 block h-full w-full" />
        <div className="hero-vignette-bg pointer-events-none absolute inset-0" />

        {/* Gradient pendukung teks: kiri di desktop, bawah di HP. Berlaku untuk pembuka & penutup. */}
        <div
          className="pointer-events-none absolute inset-0 z-[4] hidden transition-opacity duration-500 md:landscape:block"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.7), transparent 55%)', opacity: introVisible ? 1 : 0 }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-[4] hidden transition-opacity duration-500 md:landscape:block"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent 38%), linear-gradient(to top, rgba(0,0,0,0.8), transparent 30%)', opacity: outroVisible ? 1 : 0 }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-[4] transition-opacity duration-500 md:landscape:hidden"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92), transparent 62%)', opacity: introVisible || outroVisible ? 1 : 0 }}
        />
        {/* Tepi bawah dileburkan ke hitam di akhir scroll agar menyambung ke section berikutnya. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-32 bg-gradient-to-t from-black to-transparent"
          style={{ opacity: scrimOpacity }}
        />

        {/* Pembuka — <h1> halaman */}
        <div
          className={`${panel} bottom-[15vh] md:landscape:bottom-0 md:landscape:top-0 md:landscape:flex md:landscape:flex-col md:landscape:justify-center ${
            introVisible ? show : hideUp
          }`}
        >
          <div className="mx-auto max-w-[44rem] md:landscape:mx-0">
            <p className="eyebrow mb-5">Certified pre-owned</p>
            <h1 className="font-serif text-[clamp(2rem,3.6vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.01em]">
              <span className="block">Jam mewah bersertifikat,</span>
              <em className="block font-medium italic text-gold-light">siap dipakai hari ini.</em>
            </h1>
            <p className="mx-auto mt-6 max-w-[38ch] text-[0.98rem] leading-relaxed text-ink/80 md:landscape:mx-0">
              Setiap komponen diperiksa satu per satu. 100% authentic or moneyback.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:landscape:justify-start">
              <a href="/produk" tabIndex={introVisible ? 0 : -1} className="btn btn-gold">
                Lihat koleksi {arrow}
              </a>
              <a href="/sell-my-watch" tabIndex={introVisible ? 0 : -1} className="btn btn-ghost backdrop-blur-sm">
                Jual jam Anda
              </a>
            </div>
          </div>
        </div>

        {/* Tiga keunggulan di kiri bawah (desktop) */}
        <ul
          className={`absolute bottom-[9vh] left-[6vw] z-[5] hidden items-stretch transition-all duration-500 md:landscape:flex ${
            introVisible ? show : hideDown
          }`}
        >
          {features.map((f, i) => (
            <li key={f.title} className={`px-6 first:pl-0 ${i > 0 ? 'border-l border-gold/40' : ''}`}>
              <svg viewBox="0 0 24 24" className={iconCls} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {f.icon}
              </svg>
              <p className="mt-2 font-serif text-[1rem] text-ink">{f.title}</p>
              <p className="mt-0.5 text-[0.75rem] text-ink-dim">{f.sub}</p>
            </li>
          ))}
        </ul>

        {/* Penutup — judul di atas jam yang sudah terbongkar, aksi di area pantulan di bawahnya */}
        <div className={`${panel} bottom-[27vh] md:landscape:bottom-auto md:landscape:top-[4vh] ${outroVisible ? show : hideDown}`}>
          <div className="mx-auto max-w-[34rem] md:landscape:mx-0 md:landscape:max-w-[44rem]">
            <p className="eyebrow mb-3">Di balik pemeriksaan kami</p>
            <h2 className="font-serif text-[clamp(2rem,3.8vw,3.4rem)] font-medium leading-[1.06] tracking-[-0.01em]">
              <span className="block">Setiap komponen</span>
              <em className="block font-medium italic text-gold-light">diperiksa satu per satu.</em>
            </h2>
          </div>
        </div>
        <div className={`${panel} bottom-[9vh] md:landscape:bottom-[7vh] ${outroVisible ? show : hideDown}`}>
          <div className="mx-auto flex max-w-[34rem] flex-col gap-5 md:landscape:mx-0 md:landscape:max-w-[60rem] md:landscape:flex-row md:landscape:items-center md:landscape:gap-8">
            <p className="mx-auto max-w-[40ch] text-[0.95rem] leading-relaxed text-ink/80 md:landscape:mx-0 md:landscape:max-w-[34ch]">
              Dari case sampai movement, setiap bagian dicek keasliannya sebelum jam sampai ke tangan Anda.
            </p>
            <div className="flex flex-wrap justify-center gap-3 md:landscape:justify-start">
              <a href="/produk" tabIndex={outroVisible ? 0 : -1} className="btn btn-gold">
                Lihat koleksi {arrow}
              </a>
              <a href="#proses" tabIndex={outroVisible ? 0 : -1} className="btn btn-ghost backdrop-blur-sm">
                Lihat proses kami
              </a>
            </div>
          </div>
        </div>

        {/* Label kanan atas saat jam terbongkar */}
        <div
          className={`absolute right-[6vw] top-[6vh] z-[5] hidden items-center gap-5 transition-opacity duration-500 md:landscape:flex ${
            outroVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="h-px w-12 bg-gold" />
          <div>
            <p className="eyebrow">Anatomi sebuah jam</p>
            <p className="mt-1 text-[0.85rem] text-ink/80">Ketelitian di setiap detail.</p>
          </div>
        </div>

        {/* Penanda bab, kanan tengah */}
        {!reduced && (
          <nav aria-label="Bab animasi" className="absolute right-[3vw] top-1/2 z-[6] hidden -translate-y-1/2 flex-col items-center gap-3 md:landscape:flex">
            {chapters.map((c) => (
              <button
                key={c.n}
                type="button"
                onClick={() => goTo(c.at)}
                aria-label={c.label}
                aria-current={chapter === c.n ? 'step' : undefined}
                className={`flex flex-col items-center gap-1.5 font-sans text-[0.85rem] tracking-[0.1em] transition-colors duration-300 ${
                  chapter === c.n ? 'text-gold-light' : 'text-ink-dim/70 hover:text-ink'
                }`}
              >
                {String(c.n).padStart(2, '0')}
                <span className={`h-px bg-gold-light transition-all duration-300 ${chapter === c.n ? 'w-4' : 'w-0'}`} />
              </button>
            ))}
          </nav>
        )}

        {/* Isyarat scroll */}
        <div
          className="absolute bottom-[24px] left-1/2 z-[5] flex -translate-x-1/2 flex-col items-center gap-2 text-[0.68rem] tracking-[0.25em] text-ink-dim transition-opacity duration-300"
          style={{ opacity: introVisible && !reduced ? 0.8 : 0 }}
        >
          <span className="flex h-7 w-4 justify-center rounded-full border border-ink-dim/70 pt-1.5" aria-hidden="true">
            <span className="h-1.5 w-px bg-gold-light" />
          </span>
          <span>SCROLL DOWN</span>
        </div>

        {!loaderGone && (
          <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black transition-opacity duration-500 ${
              ready ? 'pointer-events-none opacity-0' : ''
            }`}
          >
            <img src="/logo.webp" alt="Jubejam" className="h-11 w-auto opacity-90" />
            <div className="relative h-px w-[180px] overflow-hidden bg-hairline">
              <div className="absolute left-0 top-0 h-full bg-gold-light transition-[width] duration-150 ease-out" style={{ width: `${loadedPct}%` }} />
            </div>
            <div className="text-[0.68rem] tracking-[0.25em] text-ink-dim">MEMUAT {loadedPct}%</div>
          </div>
        )}
      </div>
    </div>
  );
}
