"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  listingDetailsSchema,
  rupeesToPaise,
  imageValidationError,
  MAX_PHOTOS,
  MAX_IMAGE_BYTES,
} from "@/lib/listings/validation";
import type { FormState } from "@/lib/auth/validation";

function refreshListings(id: string) {
  revalidatePath("/listings");
  revalidatePath("/dashboard");
  revalidatePath(`/listings/${id}`);
  revalidatePath(`/listings/${id}/edit`);
}

export async function saveListing(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const price = rupeesToPaise(form.get("rate"));
  if (price === null)
    return {
      error:
        "Enter a price from ₹1 to ₹10,000 with at most two decimal places.",
    };
  const input = listingDetailsSchema.safeParse({
    title: form.get("title"),
    description: form.get("description") || "",
    address: form.get("address"),
    city: form.get("city"),
    hourly_rate_paise: price,
    vehicle_types: form.getAll("vehicle_types"),
    parking_type: form.get("parking_type"),
    facilities: form.getAll("facilities"),
    status: form.get("status"),
  });
  if (!input.success) return { error: input.error.issues[0].message };
  const rawId = form.get("id");
  if (rawId && !z.string().uuid().safeParse(rawId).success)
    return { error: "Invalid listing." };
  let id = typeof rawId === "string" ? rawId : "";
  const supabase = await createClient();
  const uploaded: string[] = [];
  let cleanupFailed = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Log in before saving a listing." };
    const current = id
      ? await supabase
          .from("listings")
          .select("*")
          .eq("id", id)
          .eq("owner_id", user.id)
          .is("deleted_at", null)
          .maybeSingle()
      : null;
    if (id && (current?.error || !current?.data))
      return { error: "Listing not found or you do not own it." };
    const revision = Number(form.get("revision"));
    if (
      id &&
      (!Number.isInteger(revision) || revision !== current?.data?.revision)
    )
      return {
        error: "This listing changed in another tab. Reload before saving.",
      };
    const retained = form
      .getAll("keep_photo")
      .filter((v): v is string => typeof v === "string");
    if (
      new Set(retained).size !== retained.length ||
      retained.some((path) => !current?.data?.photo_paths.includes(path))
    )
      return {
        error: "Invalid retained photo selection. Reload and try again.",
      };
    const files = form
      .getAll("photos")
      .filter(
        (v): v is File => v instanceof File && (v.size > 0 || v.name !== ""),
      );
    if (files.length + retained.length > MAX_PHOTOS)
      return { error: "Keep at most six photos in total." };
    const main = form.get("main_photo");
    const choices = [
      ...retained.map((path) => `existing:${path}`),
      ...files.map((_, i) => `new:${i}`),
    ];
    if (choices.length && (typeof main !== "string" || !choices.includes(main)))
      return { error: "Choose a main photo from the photos you are keeping." };
    // Validate all files before uploading any, including their content signature.
    const buffers: Uint8Array[] = [];
    for (const file of files) {
      if (file.size > MAX_IMAGE_BYTES)
        return { error: "Each photo must be no larger than 512 KB." };
      const bytes = new Uint8Array(await file.arrayBuffer());
      const problem = imageValidationError(file.type, file.size, bytes);
      if (problem) return { error: problem };
      buffers.push(bytes);
    }
    for (let i = 0; i < files.length; i++) {
      const path = `${user.id}/${crypto.randomUUID()}`;
      const { error } = await supabase.storage
        .from("listing-photos")
        .upload(path, buffers[i], {
          contentType: files[i].type,
          cacheControl: "0",
          upsert: false,
        });
      if (error)
        throw new Error(
          "Photo upload failed. Check your connection and the listing-photos bucket setup.",
        );
      uploaded.push(path);
    }
    const photo_paths = [...retained, ...uploaded];
    const photo_path = choices.length
      ? photo_paths[choices.indexOf(String(main))]
      : null;
    const values = { ...input.data, photo_paths, photo_path };
    // Ownership comes only from the verified session. RLS independently enforces it.
    const result = id
      ? await supabase
          .from("listings")
          .update(values)
          .eq("id", id)
          .eq("owner_id", user.id)
          .eq("revision", revision)
          .is("deleted_at", null)
          .select("id")
          .maybeSingle()
      : await supabase
          .from("listings")
          .insert({ ...values, owner_id: user.id })
          .select("id")
          .single();
    if (result.error || !result.data)
      throw new Error(
        "Could not save. The listing may have changed in another tab; reload and try again. Check migration 003 if this is a new setup.",
      );
    id = result.data.id;
    const removed =
      current?.data?.photo_paths.filter((path) => !retained.includes(path)) ||
      [];
    if (removed.length)
      cleanupFailed = Boolean(
        (await supabase.storage.from("listing-photos").remove(removed)).error,
      );
  } catch (error) {
    // The Storage delete policy refuses to remove photos attached to a live row,
    // including if a successful DB response was lost during a network failure.
    if (uploaded.length)
      await supabase.storage
        .from("listing-photos")
        .remove(uploaded)
        .catch(() => {});
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to save. Check your connection and reload your dashboard before retrying.",
    };
  }
  refreshListings(id);
  redirect(`/listings/${id}?saved=1${cleanupFailed ? "&cleanup=1" : ""}`);
}

export async function changeListing(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      id: z.string().uuid(),
      revision: z.coerce.number().int().positive(),
      operation: z.enum(["publish", "unpublish", "delete"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Invalid listing action." };
  const { id, revision, operation } = parsed.data;
  let cleanupFailed = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Please log in again." };
    const { data: current, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error || !current)
      return { error: "Listing not found or you do not own it." };
    if (operation === "publish") {
      const checked = listingDetailsSchema.safeParse({
        ...current,
        status: "published",
      });
      if (!checked.success)
        return {
          error: `Edit this listing before publishing: ${checked.error.issues[0].message}`,
        };
    }
    const update =
      operation === "delete"
        ? { status: "draft" as const, deleted_at: new Date().toISOString() }
        : {
            status:
              operation === "publish"
                ? ("published" as const)
                : ("draft" as const),
          };
    const result = await supabase
      .from("listings")
      .update(update)
      .eq("id", id)
      .eq("owner_id", user.id)
      .eq("revision", revision)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (result.error || !result.data)
      return {
        error:
          "This listing changed or could not be saved. Reload and try again.",
      };
    if (operation === "delete" && current.photo_paths.length)
      cleanupFailed = Boolean(
        (
          await supabase.storage
            .from("listing-photos")
            .remove(current.photo_paths)
        ).error,
      );
  } catch {
    return {
      error:
        "Connection interrupted. Refresh your dashboard to check the result before retrying.",
    };
  }
  refreshListings(id);
  if (operation === "delete")
    redirect(`/dashboard?deleted=1${cleanupFailed ? "&cleanup=1" : ""}`);
  return {
    success:
      operation === "publish"
        ? "Listing published."
        : "Listing is now a private draft.",
  };
}
