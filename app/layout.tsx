import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Masakyuk — Gak Perlu Pusing Masak Apa",
  description:
    "Plan menu harian & mingguan dalam hitungan menit. Pilih resep, atur jadwal, daftar belanja auto jadi.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.className}>
      <body className="min-h-screen flex flex-col bg-white antialiased">
        <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-neutral-900"
            >
              Masakyuk
            </Link>
            <ul className="flex items-center gap-6 text-sm font-medium text-neutral-500">
              <li>
                <Link
                  href="#fitur"
                  className="hover:text-neutral-900 transition-colors"
                >
                  Fitur
                </Link>
              </li>
              <li>
                <Link
                  href="#cara-kerja"
                  className="hover:text-neutral-900 transition-colors"
                >
                  Cara Kerja
                </Link>
              </li>
              <li>
                <Link
                  href="#download"
                  className="hover:text-neutral-900 transition-colors"
                >
                  Download
                </Link>
              </li>
              <li>
                <Link
                  href="#download"
                  className="rounded-full bg-primary-500 px-6 py-2 text-white hover:bg-primary-600 transition-colors"
                >
                  Coba Sekarang
                </Link>
              </li>
            </ul>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-neutral-900">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-10 text-sm text-neutral-500 md:flex-row md:justify-between">
            <p>Masakyuk — Biar kamu gak pusing masak apa lagi.</p>
            <ul className="flex items-center gap-6">
              <li>
                <Link
                  href="/privacy"
                  className="text-primary-100 hover:text-white transition-colors"
                >
                  Privasi
                </Link>
              </li>
              <li>
                <Link
                  href="/tos"
                  className="text-primary-100 hover:text-white transition-colors"
                >
                  Ketentuan
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@masakyuk.com"
                  className="text-primary-100 hover:text-white transition-colors"
                >
                  Kontak
                </a>
              </li>
            </ul>
            <p>&copy; 2026 Setiap Hari</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
