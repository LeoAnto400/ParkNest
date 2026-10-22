import Link from "next/link";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { money, dateTime } from "@/lib/parking/format";
export const metadata = { title: "My bookings" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireUser("/bookings");
  const supabase = await createClient();
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("driver_id", user.id)
    .order("created_at", { ascending: false });
  if (error)
    throw new Error(
      "Could not load bookings. Apply the demo parking migration.",
    );
  const ids = [...new Set(bookings.map((b) => b.listing_id))];
  const spaces = ids.length
    ? await supabase.from("listings").select("id,title,address").in("id", ids)
    : null;
  if (spaces?.error) throw new Error("Could not load booked spaces.");
  const created = (await searchParams).created === "1";
  return (
    <section className="space-y-6 py-12">
      <h1 className="text-3xl font-semibold">My bookings</h1>
      {created && (
        <p role="status" className="rounded-xl bg-emerald-50 p-4 text-primary">
          Booking saved. Simulated payment — no money was charged.
        </p>
      )}
      {!bookings.length && (
        <p>
          No bookings yet.{" "}
          <Link href="/listings" className="text-primary underline">
            Browse parking spaces
          </Link>
          .
        </p>
      )}
      {bookings.map((booking) => {
        const space = spaces?.data?.find((s) => s.id === booking.listing_id);
        return (
          <article
            key={booking.id}
            className="space-y-3 rounded-2xl border border-border bg-white p-6"
          >
            <h2 className="text-xl font-semibold">
              <Link
                href={`/listings/${booking.listing_id}`}
                className="hover:underline"
              >
                {space?.title || "Parking space"}
              </Link>
            </h2>
            <p>{space?.address}</p>
            <p>
              {dateTime(booking.starts_at)} — {dateTime(booking.ends_at)}
            </p>
            <p className="font-semibold">
              {money(booking.total_paise)} · Simulated payment
            </p>
            <p className="text-sm text-muted-foreground">
              Confirmed reservation · No money charged
            </p>
            <p className="break-all text-xs text-muted-foreground">
              Booking ID: {booking.id}
            </p>
          </article>
        );
      })}
    </section>
  );
}
