import Image from "next/image";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "@/components/parking-forms";
import { money, dateTime } from "@/lib/parking/format";

export const metadata = { title: "Space details" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    notFound();
  const user = await requireUser(`/listings/${id}`);
  const supabase = await createClient();
  const { data: space, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Could not load this space.");
  if (!space) notFound();
  const photo = space.photo_path
    ? await supabase.storage
        .from("listing-photos")
        .createSignedUrl(space.photo_path, 3600)
    : null;
  return (
    <section className="mx-auto max-w-2xl space-y-6 py-12">
      <h1 className="text-3xl font-semibold">{space.title}</h1>
      <p className="text-muted-foreground">{space.address}</p>
      {photo?.data?.signedUrl && (
        <Image
          src={photo.data.signedUrl}
          alt={`Parking space: ${space.title}`}
          width={800}
          height={500}
          unoptimized
          className="max-h-96 w-full rounded-2xl object-cover"
        />
      )}
      {photo?.error && (
        <p role="status">
          The photo could not be loaded. Refresh to try again.
        </p>
      )}
      <p className="whitespace-pre-wrap">{space.description}</p>
      <p className="text-xl font-semibold text-primary">
        {money(space.hourly_rate_paise)} / hour
      </p>
      <div className="rounded-xl bg-muted p-5">
        <h2 className="font-semibold">Availability</h2>
        <p className="mt-2">
          {dateTime(space.available_from)} — {dateTime(space.available_until)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          A reservation must fit inside this window. Already-reserved times are
          rejected when you confirm.
        </p>
      </div>
      {space.owner_id === user.id ? (
        <p className="rounded-xl border border-border p-5">
          This is your space. Use another demo account to book it. Incoming
          reservations appear on your dashboard.
        </p>
      ) : (
        <BookingForm listingId={id} />
      )}
    </section>
  );
}
