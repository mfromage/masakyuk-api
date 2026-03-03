import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Masakyuk — Gak Perlu Pusing Masak Apa",
};

/* ------------------------------------------------------------------ */
/*  Reusable sub-components (co-located, not exported)                */
/* ------------------------------------------------------------------ */

function PhoneMockup({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-neutral-900 rounded-[2.5rem] p-2 shadow-2xl ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={280}
        height={560}
        sizes="(max-width: 768px) 240px, 280px"
        className="rounded-[2rem] w-full h-auto"
        priority
      />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="12" fill="#E0F2F1" />
      <path
        d="M8 12.5l2.5 2.5L16 9.5"
        stroke="#009688"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AppleStoreButton({ variant = "dark" }: { variant?: "dark" | "outline" }) {
  const base =
    variant === "dark"
      ? "bg-[#171A17] text-white"
      : "border border-white/30 bg-white/10 text-white";
  return (
    <a
      href="#"
      className={`inline-flex items-center gap-3 rounded-xl px-5 py-3 transition-opacity hover:opacity-90 ${base}`}
    >
      {/* Apple logo */}
      <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true">
        <path d="M16.52 12.46c-.03-2.85 2.33-4.22 2.44-4.29-1.33-1.94-3.4-2.21-4.13-2.24-1.76-.18-3.43 1.03-4.33 1.03-.89 0-2.27-1.01-3.73-.98-1.92.03-3.69 1.12-4.68 2.84-2 3.46-.51 8.59 1.43 11.4.95 1.38 2.09 2.92 3.58 2.87 1.44-.06 1.98-.93 3.72-.93 1.74 0 2.23.93 3.75.9 1.55-.03 2.53-1.4 3.47-2.78 1.09-1.6 1.54-3.14 1.57-3.22-.03-.02-3.01-1.16-3.04-4.6zM13.71 3.82c.79-.96 1.33-2.29 1.18-3.62-1.14.05-2.52.76-3.34 1.72-.73.85-1.37 2.2-1.2 3.5 1.27.1 2.57-.65 3.36-1.6z" />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] font-normal">Download on the</span>
        <span className="text-base font-semibold -mt-0.5">App Store</span>
      </div>
    </a>
  );
}

function PlayStoreButton({ variant = "dark" }: { variant?: "dark" | "outline" }) {
  const base =
    variant === "dark"
      ? "bg-[#171A17] text-white"
      : "border border-white/30 bg-white/10 text-white";
  return (
    <a
      href="#"
      className={`inline-flex items-center gap-3 rounded-xl px-5 py-3 transition-opacity hover:opacity-90 ${base}`}
    >
      {/* Play triangle */}
      <svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor" aria-hidden="true">
        <path d="M1.57.66C1.2 1.05 1 1.66 1 2.44v17.12c0 .78.2 1.39.57 1.78l.1.09L11.3 11.8v-.2L1.66.56 1.57.66zm3.23 19.66L15.66 11.8v-.2L4.8 3.08 4.8 3.08l-.01 17.24z" />
        <path d="M18.36 9.52l-3.3-1.88-3.76 3.16 3.76 3.17 3.3-1.88c.94-.53.94-1.41 0-1.97v-.6z" opacity=".8" />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] font-normal tracking-wider uppercase">GET IT ON</span>
        <span className="text-base font-semibold -mt-0.5">Google Play</span>
      </div>
    </a>
  );
}

/* Feature card icon wrappers */
function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
      {children}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#009688" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <rect x="8" y="14" width="2" height="2" rx="0.5" />
      <rect x="14" y="14" width="2" height="2" rx="0.5" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#009688" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#009688" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="9" y1="7" x2="16" y2="7" />
      <line x1="9" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#009688" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-white">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-50 opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-accent-light opacity-50 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 py-16 md:flex-row md:gap-16 md:py-24">
          {/* Text */}
          <div className="flex-1">
            {/* Badge */}
            <span className="mb-6 inline-block rounded-full bg-accent-light px-4 py-1.5 text-sm font-medium text-accent">
              10.000+ orang udah gak pusing masak apa lagi
            </span>

            <h1 className="text-4xl font-bold leading-tight text-neutral-900 md:text-5xl lg:text-6xl">
              Gak perlu pusing lagi mikirin mau masak apa.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-500">
              Masakyuk bantu kamu plan menu harian &amp; mingguan dalam hitungan
              menit. Pilih resep, atur jadwal, daftar belanja auto jadi. Besok
              mau masak apa? Udah beres.
            </p>

            {/* Bullet points */}
            <ul className="mt-8 space-y-3">
              {[
                "Plan menu seminggu, tinggal drag-drop",
                "Daftar belanja auto dari semua resep kamu",
                "100+ resep Nusantara siap dipilih",
              ].map((text) => (
                <li key={text} className="flex items-center gap-3 text-neutral-700">
                  <CheckIcon />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href="#download"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-primary-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-primary-500/25 transition-colors hover:bg-primary-600"
            >
              Download Gratis
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

            {/* Store buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <AppleStoreButton />
              <PlayStoreButton />
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative flex-shrink-0">
            {/* Decorative dots */}
            <div className="pointer-events-none absolute -top-6 -left-6 grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-2 w-2 rounded-full bg-primary-100" />
              ))}
            </div>
            <PhoneMockup
              src="/illustrations/home.png"
              alt="Masakyuk home screen"
              className="max-w-[280px]"
            />
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="bg-primary-50">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-10 px-6 py-16 md:flex-row md:items-center md:gap-16 md:py-24">
          <h2 className="max-w-xs flex-shrink-0 text-2xl font-bold leading-snug text-neutral-700">
            Ribuan orang udah bilang bye ke drama &lsquo;masak apa ya?&rsquo;
          </h2>

          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { value: "100+", label: "Resep Siap Masak" },
              { value: "200+", label: "Bahan Terindeks" },
              { value: "30+", label: "Masakan Daerah" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <p className="text-3xl font-bold text-primary-500">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-neutral-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="fitur" className="relative bg-neutral-50">
        {/* Decorative circle */}
        <div className="pointer-events-none absolute top-12 right-12 h-40 w-40 rounded-full bg-primary-100 opacity-30 blur-2xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold leading-tight text-neutral-900 md:text-4xl">
            Dari bingung jadi &lsquo;udah ke-plan semua.&rsquo; Satu app doang.
          </h2>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-neutral-100 bg-white p-8">
              <FeatureIcon><CalendarIcon /></FeatureIcon>
              <h3 className="text-xl font-bold text-neutral-900">
                Meal Plan yang Nge-handle Hidup Kamu
              </h3>
              <p className="mt-3 leading-relaxed text-neutral-500">
                Setiap Minggu malam, buka Masakyuk 5 menit. Drag-drop resep ke
                Senin sampai Minggu — sarapan, makan siang, makan malam. Done,
                seminggu udah ke-plan. Mendadak ganti mood? Geser aja, gak ada
                yang ribet.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-neutral-100 bg-white p-8">
              <FeatureIcon><CartIcon /></FeatureIcon>
              <h3 className="text-xl font-bold text-neutral-900">
                Daftar Belanja Auto-Generate
              </h3>
              <p className="mt-3 leading-relaxed text-neutral-500">
                Udah plan menu seminggu? Daftar belanja langsung jadi otomatis. 3
                resep butuh bawang putih? Masakyuk gabungin jadi satu baris.
                Tinggal bawa HP ke pasar atau supermarket, ceklis satu-satu,
                pulang, langsung masak.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-neutral-100 bg-white p-8">
              <FeatureIcon><BookIcon /></FeatureIcon>
              <h3 className="text-xl font-bold text-neutral-900">
                100+ Resep Nusantara, Tinggal Pilih
              </h3>
              <p className="mt-3 leading-relaxed text-neutral-500">
                Gak perlu cari resep dari nol. Masakyuk udah kurasi ratusan resep
                otentik — dari Rendang sampai Sayur Asem, dari yang 10 menit
                sampai yang buat weekend project. Filter by daerah, diet, atau
                waktu masak.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-neutral-100 bg-white p-8">
              <FeatureIcon><JournalIcon /></FeatureIcon>
              <h3 className="text-xl font-bold text-neutral-900">
                Jurnal Masak, Track Progress Kamu
              </h3>
              <p className="mt-3 leading-relaxed text-neutral-500">
                Setiap kali selesai masak, catat. Foto, rating, catatan — semua
                masuk jurnal. Buka kalender bulanan, lihat hari mana aja kamu
                masak. Satisfying banget ngeliat progress-nya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STEPS ===== */}
      <section id="cara-kerja" className="relative bg-white">
        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold leading-tight text-neutral-900 md:text-4xl">
            Cuma 3 langkah dari &lsquo;bingung&rsquo; ke &lsquo;udah siap masak.&rsquo;
          </h2>

          <div className="mt-20 space-y-24">
            {/* Step 1 — image left, text right */}
            <div className="flex flex-col items-center gap-12 md:flex-row">
              <div className="relative flex-shrink-0">
                {/* Decorative dots */}
                <div className="pointer-events-none absolute -bottom-4 -right-4 grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-accent-light" />
                  ))}
                </div>
                <PhoneMockup
                  src="/illustrations/meal-plan.png"
                  alt="Meal plan screen"
                  className="max-w-[260px]"
                />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold uppercase tracking-wide text-accent">
                  Langkah 1
                </span>
                <h3 className="mt-3 text-2xl font-bold text-neutral-900">
                  Pilih Resep, Masukin ke Plan
                </h3>
                <p className="mt-4 max-w-md leading-relaxed text-neutral-500">
                  Scroll koleksi resep atau cari yang kamu mau. Ketemu yang
                  cocok? Langsung tambahin ke meal plan hari apa aja. Mau plan
                  sehari atau seminggu sekaligus — terserah kamu. Yang penting
                  besok udah gak perlu mikir.
                </p>
                <a
                  href="#download"
                  className="mt-5 inline-flex items-center gap-1 font-semibold text-primary-500 transition-colors hover:text-primary-600"
                >
                  Mulai Sekarang
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10m0 0l-3-3m3 3l-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Step 2 — text left, image right */}
            <div className="flex flex-col-reverse items-center gap-12 md:flex-row">
              <div className="flex-1">
                <span className="text-sm font-semibold uppercase tracking-wide text-accent">
                  Langkah 2
                </span>
                <h3 className="mt-3 text-2xl font-bold text-neutral-900">
                  Cek Bahan, Belanja Gak Ribet
                </h3>
                <p className="mt-4 max-w-md leading-relaxed text-neutral-500">
                  Semua bahan dari meal plan kamu otomatis jadi satu daftar
                  belanja. Gak punya satu bahan? Tap, langsung ke toko online.
                  Belanja bahan semudah checkout di e-commerce. Satu klik, beres.
                </p>
                <a
                  href="#download"
                  className="mt-5 inline-flex items-center gap-1 font-semibold text-primary-500 transition-colors hover:text-primary-600"
                >
                  Mulai Sekarang
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10m0 0l-3-3m3 3l-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
              <div className="relative flex-shrink-0">
                <div className="pointer-events-none absolute -top-4 -left-4 grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary-100" />
                  ))}
                </div>
                <PhoneMockup
                  src="/illustrations/shopping-list.png"
                  alt="Shopping list screen"
                  className="max-w-[260px]"
                />
              </div>
            </div>

            {/* Step 3 — image left, text right */}
            <div className="flex flex-col items-center gap-12 md:flex-row">
              <div className="relative flex-shrink-0">
                <div className="pointer-events-none absolute -bottom-4 -left-4 grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-accent-light" />
                  ))}
                </div>
                <PhoneMockup
                  src="/illustrations/recipe.png"
                  alt="Recipe detail screen"
                  className="max-w-[260px]"
                />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold uppercase tracking-wide text-accent">
                  Langkah 3
                </span>
                <h3 className="mt-3 text-2xl font-bold text-neutral-900">
                  Masak, Catat, Plan Lagi
                </h3>
                <p className="mt-4 max-w-md leading-relaxed text-neutral-500">
                  Ikutin step-by-step guide yang jelas. Selesai? Foto hasilnya,
                  simpan di jurnal. Besok tinggal liat plan berikutnya. Loop yang
                  bikin kamu makin rajin masak tanpa kerasa.
                </p>
                <a
                  href="#download"
                  className="mt-5 inline-flex items-center gap-1 font-semibold text-primary-500 transition-colors hover:text-primary-600"
                >
                  Mulai Sekarang
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10m0 0l-3-3m3 3l-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA / CLOSING ===== */}
      <section id="download" className="bg-white pb-0 pt-16 md:pt-24">
        <div className="mx-4 max-w-5xl rounded-3xl bg-primary-500 p-12 text-center md:mx-8 md:p-16 lg:mx-auto">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -top-8 left-1/4 h-24 w-24 rounded-full bg-white/5 blur-xl" />
          <div className="pointer-events-none absolute -bottom-8 right-1/4 h-32 w-32 rounded-full bg-white/5 blur-xl" />

          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Gak ada lagi drama &lsquo;masak apa ya hari ini.&rsquo;
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-100">
            Plan menu, belanja otomatis, masak tinggal ikutin — semua di satu
            app. Gak perlu bikin akun. Bisa offline. Gratis selamanya. Mulai plan
            menu pertama kamu sekarang.
          </p>

          <a
            href="#"
            className="mt-10 inline-block rounded-full bg-white px-8 py-4 text-lg font-semibold text-primary-500 shadow-lg transition-colors hover:bg-neutral-50"
          >
            Download Sekarang
          </a>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <AppleStoreButton variant="outline" />
            <PlayStoreButton variant="outline" />
          </div>
        </div>

        {/* Spacer so the CTA card overlaps the footer visually */}
        <div className="h-20" />
      </section>
    </>
  );
}
