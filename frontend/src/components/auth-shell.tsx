import Link from "next/link";
import { ShieldCheck, ArrowUpRight } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-170px)] items-center gap-12 py-10 lg:grid-cols-2 lg:gap-24">
      <aside className="hidden self-stretch rounded-3xl bg-[#153d32] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
            A little space. A lot of possibility.
          </p>
          <h2 className="mt-8 text-5xl font-semibold leading-tight tracking-tight">
            Your next stop
            <br />
            starts here.
          </h2>
          <p className="mt-6 max-w-sm leading-7 text-emerald-50/75">
            One account for every side of your journey. A place to park, a space
            to share, and a simpler way forward.
          </p>
        </div>
        <div className="my-12 flex items-center justify-center">
          <div className="flex size-36 -rotate-6 items-center justify-center rounded-3xl border border-white/25 bg-white/10 text-8xl font-semibold shadow-xl">
            P<span className="text-lime-300">.</span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-white/20 pt-6 text-sm text-emerald-50/80">
          <ShieldCheck className="size-5" /> Your account, securely in one
          place.
        </div>
      </aside>
      <section className="mx-auto w-full max-w-md py-4">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary"
        >
          Welcome to ParkNest <ArrowUpRight className="size-4" />
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mb-8 mt-3 leading-6 text-muted-foreground">
          {description}
        </p>
        {children}
        {footer && (
          <div className="mt-7 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </section>
    </div>
  );
}
