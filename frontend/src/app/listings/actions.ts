"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  listingSchema,
  bookingSchema,
  bookingError,
} from "@/lib/parking/validation";
import type { FormState } from "@/lib/auth/validation";

export async function createListing(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const input = listingSchema.safeParse({
    title: form.get("title"),
    address: form.get("address"),
    description: form.get("description") || "",
    hourly_rate_paise: Math.round(Number(form.get("rate")) * 100),
    available_from: form.get("available_from"),
    available_until: form.get("available_until"),
  });
  if (!input.success) return { error: input.error.issues[0].message };
  if (Date.parse(input.data.available_until) <= Date.now())
    return { error: "Availability must include a future time." };
  const photo = form.get("photo");
  if (
    photo instanceof File &&
    photo.size &&
    (photo.size > 524288 ||
      !["image/jpeg", "image/png", "image/webp"].includes(photo.type))
  )
    return {
      error: "Choose a JPEG, PNG, or WebP photo no larger than 512 KB.",
    };
  let id: string;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Log in before creating a space." };
    let photo_path: string | null = null;
    if (photo instanceof File && photo.size) {
      photo_path = `${user.id}/${crypto.randomUUID()}`;
      const { error } = await supabase.storage
        .from("listing-photos")
        .upload(photo_path, photo, { contentType: photo.type, upsert: false });
      if (error)
        return {
          error:
            "Photo upload failed. Check that the demo migration created the listing-photos bucket, or try without a photo.",
        };
    }
    const { data, error } = await supabase
      .from("listings")
      .insert({ ...input.data, owner_id: user.id, photo_path })
      .select("id")
      .single();
    if (error || !data) {
      if (photo_path)
        await supabase.storage.from("listing-photos").remove([photo_path]);
      return {
        error:
          "Could not save the space. Check the demo migration and try again.",
      };
    }
    id = data.id;
  } catch {
    return {
      error:
        "Unable to connect. Refresh My spaces before retrying to check whether the space was saved.",
    };
  }
  revalidatePath("/listings");
  revalidatePath("/dashboard");
  redirect(`/listings/${id}`);
}

export async function bookSpace(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const input = bookingSchema.safeParse({
    listing_id: form.get("listing_id"),
    starts_at: form.get("starts_at"),
    ends_at: form.get("ends_at"),
  });
  if (!input.success) return { error: input.error.issues[0].message };
  if (Date.parse(input.data.starts_at) < Date.now())
    return { error: "Choose a future start time." };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Log in before reserving a space." };
    // The database computes the price and enforces availability and no overlaps.
    const { error } = await supabase
      .from("bookings")
      .insert({ ...input.data, driver_id: user.id });
    if (error) return { error: bookingError(error.code) };
  } catch {
    return { error: bookingError() };
  }
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  redirect("/bookings?created=1");
}
