import Link from "next/link";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { money, dateTime } from "@/lib/parking/format";

export const metadata = { title: "Parking spaces" };
export default async function Page() {
  const user = await requireUser("/listings");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error)
    throw new Error("Could not load spaces. Apply the demo parking migration.");
  return (
    <section className="space-y-8 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Parking spaces</h1>
          <p className="mt-2 text-muted-foreground">
            Shared spaces from the ParkNest community.
          </p>
        </div>
        <Button asChild>
          <Link href="/listings/new">Share a space</Link>
        </Button>
      </div>
      {!data.length && (
        <p className="rounded-2xl border border-border p-8">
          No spaces yet. Create the first space to begin the demo.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {data.map((space) => (
          <article
            key={space.id}
            className="space-y-3 rounded-2xl border border-border bg-white p-6"
          >
            <h2 className="text-xl font-semibold">
              <Link className="hover:underline" href={`/listings/${space.id}`}>
                {space.title}
              </Link>
            </h2>
            <p>{space.address}</p>
            <p className="font-medium text-primary">
              {money(space.hourly_rate_paise)} / hour
            </p>
            <p className="text-sm text-muted-foreground">
              {dateTime(space.available_from)} —{" "}
              {dateTime(space.available_until)}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="outline">
                <Link href={`/listings/${space.id}`}>View space</Link>
              </Button>
              {space.owner_id === user.id && (
                <span className="text-sm text-muted-foreground">
                  Your space
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
