import Link from "next/link";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, UserRound, ShieldCheck } from "lucide-react";
export const metadata = { title: "Dashboard" };
export default async function Page() {
  const user = await requireUser("/dashboard");
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();
  if (error)
    throw new Error(
      "Could not load your profile. Check that the database migration has been applied.",
    );
  return (
    <div className="py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        Your ParkNest
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        Welcome, {profile.name || "neighbor"}.
      </h1>
      <p className="mt-4 text-muted-foreground">
        A little space for everything ahead.
      </p>
      <section className="mt-10 rounded-3xl bg-[#153d32] p-8 text-white sm:p-12">
        <ShieldCheck className="mb-6 size-8 text-lime-200" />
        <h2 className="text-2xl font-semibold">
          You’re in. Make yourself at home.
        </h2>
        <p className="mt-3 max-w-xl leading-7 text-emerald-50/80">
          Your account is ready. Keep your details up to date so you’re all set
          for your next chapter with ParkNest.
        </p>
        <Button variant="outline" asChild className="mt-6 text-foreground">
          <Link href="/profile">
            View your profile <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </section>
      <section className="mt-6 rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center gap-3">
          <UserRound className="size-5 text-primary" />
          <h2 className="font-semibold">One account, both possibilities</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          You can be a driver and a space owner with this account. Parking
          listings, search, bookings, and payments are coming in future
          releases.
        </p>
      </section>
    </div>
  );
}
