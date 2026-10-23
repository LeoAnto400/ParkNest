import Link from "next/link";
import Image from "next/image";
import { getUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { photoUrls } from "@/lib/listings/photos";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/parking/format";

export const metadata = { title: "Parking spaces" };
export default async function Page() {
  const user = await getUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error)
    throw new Error("Could not load spaces. Check listing migration 003.");
  const photos = await photoUrls(
    data.flatMap((s) => (s.photo_path ? [s.photo_path] : [])),
  );
  return (
    <section className="space-y-8 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Parking spaces</h1>
          <p className="mt-2 text-muted-foreground">
            Published spaces from the ParkNest community.
          </p>
        </div>
        <Button asChild>
          <Link href="/listings/new">Share a space</Link>
        </Button>
      </div>
      {!data.length && (
        <p className="rounded-2xl border border-border p-8">
          No published spaces yet. Owners can publish their listings from the
          dashboard.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {data.map((space) => (
          <article
            key={space.id}
            className="space-y-3 rounded-2xl border border-border bg-white p-6"
          >
            {space.photo_path && photos[space.photo_path] && (
              <Image
                src={photos[space.photo_path]}
                width={500}
                height={300}
                unoptimized
                alt={space.title}
                className="h-48 w-full rounded-xl object-cover"
              />
            )}
            <h2 className="text-xl font-semibold">
              <Link className="hover:underline" href={`/listings/${space.id}`}>
                {space.title}
              </Link>
            </h2>
            <p>
              {space.address}, {space.city}
            </p>
            <p className="font-medium text-primary">
              {money(space.hourly_rate_paise)} / hour
            </p>
            <p className="text-sm capitalize">
              {space.parking_type} · {space.vehicle_types.join(", ")}
            </p>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline">
                <Link href={`/listings/${space.id}`}>View details</Link>
              </Button>
              {space.owner_id === user?.id && (
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
