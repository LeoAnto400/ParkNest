import Link from "next/link";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, UserRound, ShieldCheck } from "lucide-react";
import { money, dateTime } from "@/lib/parking/format";
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
  const { data: spaces, error: spacesError } = await supabase
    .from("listings")
    .select("id,title")
    .eq("owner_id", user.id);
  if (spacesError)
    throw new Error("Apply the demo parking migration to load your dashboard.");
  const reservations = spaces.length
    ? await supabase
        .from("bookings")
        .select("*")
        .in(
          "listing_id",
          spaces.map((s) => s.id),
        )
        .order("starts_at")
    : null;
  if (reservations?.error) throw new Error("Could not load incoming bookings.");
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
          You can drive and host with the same account. All demo payments are
          simulated; no money is charged.
        </p>
      </section>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/listings">Browse spaces</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/listings/new">Share a space</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/bookings">My bookings</Link>
        </Button>
      </div>
      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold">My spaces</h2>
        {!spaces.length && (
          <p className="text-muted-foreground">
            You haven’t shared a space yet.
          </p>
        )}
        {spaces.map((space) => (
          <Link
            key={space.id}
            href={`/listings/${space.id}`}
            className="block rounded-xl border border-border bg-white p-4 font-medium text-primary hover:underline"
          >
            {space.title}
          </Link>
        ))}
      </section>
      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold">Incoming reservations</h2>
        {!reservations?.data?.length && (
          <p className="text-muted-foreground">
            No reservations for your spaces yet.
          </p>
        )}
        {reservations?.data?.map((booking) => (
          <article
            key={booking.id}
            className="space-y-2 rounded-xl border border-border bg-white p-4"
          >
            <h3 className="font-semibold">
              {spaces.find((s) => s.id === booking.listing_id)?.title}
            </h3>
            <p>
              {dateTime(booking.starts_at)} — {dateTime(booking.ends_at)}
            </p>
            <p>{money(booking.total_paise)} · Simulated payment</p>
            <p className="break-all text-xs text-muted-foreground">
              Booking ID: {booking.id}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
