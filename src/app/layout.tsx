import type { Metadata } from "next";
import { IBM_Plex_Mono, Outfit, Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Manifest Evaluator",
  description:
    "Import B-Stock manifests, check real market value, and see vehicle fitment per SKU.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-line/80 bg-white/70 backdrop-blur-md sticky top-0 z-40">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="group flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-steel sm:text-2xl">
                Manifest Evaluator
              </span>
              <span className="hidden text-xs uppercase tracking-[0.14em] text-muted sm:inline">
                B-Stock lots
              </span>
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-muted hover:bg-accent-soft hover:text-accent transition-colors"
              >
                Lots
              </Link>
              <Link
                href="/compare"
                className="rounded-md px-3 py-1.5 text-muted hover:bg-accent-soft hover:text-accent transition-colors"
              >
                Compare
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
