import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
      className={cn(geistSans.variable, geistMono.variable, "h-full antialiased")}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <PackageSearch className="size-4" />
              </span>
              <span className="text-sm font-semibold tracking-tight sm:text-base">
                Manifest Evaluator
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Lots
              </Link>
              <Link
                href="/compare"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Compare
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
