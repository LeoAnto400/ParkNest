import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { photoUrls } from "@/lib/listings/photos";
import { ListingForm } from "@/components/listing-form";

export const metadata = { title: "Edit listing" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/listings/${id}/edit`);
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error("Could not load listing.");
  if (!data) notFound();
  return (
    <section className="mx-auto max-w-2xl space-y-6 py-12">
      <h1 className="text-3xl font-semibold">Edit your listing</h1>
      <ListingForm listing={data} photos={await photoUrls(data.photo_paths)} />
    </section>
  );
}
