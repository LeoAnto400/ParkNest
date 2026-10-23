import Link from "next/link";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ListingControls } from "@/components/listing-controls";
import { money, dateTime } from "@/lib/parking/format";
export const metadata = { title: "Owner dashboard" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; cleanup?: string }>;
}) {
  const user = await requireUser("/dashboard");
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();
  if (error) throw new Error("Could not load your profile.");
  const { data: spaces, error: spacesError } = await supabase
    .from("listings")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  if (spacesError)
    throw new Error("Could not load listings. Apply migration 003.");
  const active = spaces.filter((s) => !s.deleted_at);
  // Preserve the earlier demo's booking history, including deleted listing rows.
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
  if (reservations?.error)
    throw new Error("Could not load existing reservations.");
  const message = await searchParams;
  return (
    <section className="space-y-8 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-primary">Owner dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold">
            Welcome, {profile.name || "neighbor"}.
          </h1>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/profile">My profile</Link>
          </Button>
          <Button asChild>
            <Link href="/listings/new">Create listing</Link>
          </Button>
        </div>
      </div>
      {message.deleted === "1" && (
        <p role="status" className="rounded-xl bg-emerald-50 p-3 text-primary">
          Listing deleted from your dashboard and public pages. Historical
          reservations are retained.
        </p>
      )}
      {message.cleanup === "1" && (
        <p role="status" className="text-sm">
          Some unused photos could not be removed from Storage. The listing is
          still deleted.
        </p>
      )}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Your listings</h2>
        {!active.length && (
          <p className="rounded-2xl border border-border p-6">
            No listings yet. Create one and save a draft or publish it.
          </p>
        )}
        {active.map((space) => (
          <article
            key={space.id}
            className="space-y-4 rounded-2xl border border-border bg-white p-6"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <h3 className="text-xl font-semibold">
                <Link
                  href={`/listings/${space.id}`}
                  className="hover:underline"
                >
                  {space.title}
                </Link>
              </h3>
              <span className="rounded-full bg-muted px-3 py-1 text-sm capitalize">
                {space.status}
              </span>
            </div>
            <p>
              {space.address}
              {space.city && `, ${space.city}`}
            </p>
            <p className="font-medium text-primary">
              {money(space.hourly_rate_paise)} / hour
            </p>
            <ListingControls
              id={space.id}
              status={space.status}
              revision={space.revision}
            />
          </article>
        ))}
      </section>
      {Boolean(reservations?.data?.length) && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Existing demo reservations</h2>
          {reservations?.data?.map((booking) => (
            <article
              key={booking.id}
              className="space-y-2 rounded-xl border border-border p-4"
            >
              <h3 className="font-semibold">
                {spaces.find((s) => s.id === booking.listing_id)?.title}
              </h3>
              <p>
                {dateTime(booking.starts_at)} — {dateTime(booking.ends_at)}
              </p>
              <p>{money(booking.total_paise)} · Simulated payment</p>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
