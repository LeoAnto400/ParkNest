import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/auth/user";
import { isConfigured } from "@/lib/supabase/config";
import { LogoutButton } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import "./globals.css";

// Auth state and redirects must never be frozen at build time, even without env.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "ParkNest — A place for every journey",
    template: "%s | ParkNest",
  },
  description: "One account to park and share your space. Welcome to ParkNest.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4"
        >
          Skip to content
        </a>
        <header className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
            <Link
              href="/"
              aria-label="ParkNest home"
              className="flex items-center gap-2.5 text-xl font-bold tracking-tight"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
                P<span className="text-lime-300">.</span>
              </span>
              ParkNest
            </Link>
            <nav
              aria-label="Main navigation"
              className="flex flex-wrap items-center gap-4 text-sm font-medium sm:gap-7"
            >
              <Link href="/listings" className="hover:text-primary">
                Spaces
              </Link>
              {user && (
                <Link href="/bookings" className="hover:text-primary">
                  My bookings
                </Link>
              )}
              <Link href="/dashboard" className="hover:text-primary">
                Dashboard
              </Link>
              {user ? (
                <>
                  <Link href="/profile" className="hover:text-primary">
                    My profile
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-primary">
                    Log in
                  </Link>
                  <Button asChild size="sm">
                    <Link href="/signup">Get started</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </header>
        {!isConfigured() && (
          <div
            role="status"
            className="bg-amber-50 px-5 py-3 text-center text-sm text-amber-900"
          >
            Local setup needed: add your Supabase credentials to .env.local. See
            README.md.
          </div>
        )}
        <main id="main" className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          {children}
        </main>
        <footer className="mx-auto mt-8 flex w-full max-w-6xl flex-wrap justify-between gap-2 border-t border-border px-5 py-6 text-xs text-muted-foreground sm:px-8">
          <span>ParkNest · Room for your next journey.</span>
          <span>One community. More possibilities.</span>
        </footer>
      </body>
    </html>
  );
}
