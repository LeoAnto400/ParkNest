import Image from "next/image";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { photoUrls } from "@/lib/listings/photos";
import { facilityLabels } from "@/lib/listings/validation";
import { ListingControls } from "@/components/listing-controls";
import { money } from "@/lib/parking/format";

export const metadata = {
  title: "Space details",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; cleanup?: string }>;
}) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const user = await getUser();
  const supabase = await createClient();
  // RLS ensures a direct draft URL is invisible to visitors and other users.
  const { data: space, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error("Could not load this space.");
  if (!space) notFound();
  const own = space.owner_id === user?.id;
  const ordered = [
    ...(space.photo_path ? [space.photo_path] : []),
    ...space.photo_paths.filter((path) => path !== space.photo_path),
  ];
  const photos = await photoUrls(ordered);
  const message = await searchParams;
  return (
    <section className="mx-auto max-w-3xl space-y-6 py-12">
      {own && message.saved === "1" && (
        <p role="status" className="rounded-xl bg-emerald-50 p-3 text-primary">
          Listing saved.
        </p>
      )}
      {own && message.cleanup === "1" && (
        <p role="status" className="text-sm">
          The listing was saved, but some unused photos could not be removed
          from Storage. They are no longer shown here.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{space.title}</h1>
        {own && (
          <span className="rounded-full bg-muted px-3 py-1 text-sm capitalize">
            {space.status}
          </span>
        )}
      </div>
      {own && (
        <ListingControls
          id={id}
          status={space.status}
          revision={space.revision}
        />
      )}
      {own && space.status === "draft" && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm">
          Private draft. Only you can view this page until you publish it.
        </p>
      )}
      <p className="text-muted-foreground">
        {space.address}
        {space.city && `, ${space.city}`}
      </p>
      {ordered.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {ordered.map((path, i) =>
            photos[path] ? (
              <Image
                key={path}
                src={photos[path]}
                alt={`${space.title} — ${i === 0 ? "main photo" : `photo ${i + 1}`}`}
                width={900}
                height={600}
                unoptimized
                className={`${i === 0 ? "col-span-2 max-h-96" : "h-48"} w-full rounded-2xl object-cover`}
              />
            ) : (
              <p key={path} className="text-sm text-muted-foreground">
                Photo unavailable. Refresh to try again.
              </p>
            ),
          )}
        </div>
      )}
      <p className="whitespace-pre-wrap leading-7">
        {space.description || "No description added yet."}
      </p>
      <p className="text-2xl font-semibold text-primary">
        {money(space.hourly_rate_paise)} / hour
      </p>
      <dl className="grid gap-5 rounded-2xl bg-muted p-6 sm:grid-cols-2">
        <div>
          <dt className="font-semibold">Parking type</dt>
          <dd className="mt-1 capitalize">{space.parking_type}</dd>
        </div>
        <div>
          <dt className="font-semibold">Supported vehicles</dt>
          <dd className="mt-1 capitalize">{space.vehicle_types.join(", ")}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold">Facilities</dt>
          <dd className="mt-1">
            {space.facilities.map((f) => facilityLabels[f]).join(" · ") ||
              "No additional facilities listed"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
