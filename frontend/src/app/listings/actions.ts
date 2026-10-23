"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bookingSchema, bookingError } from "@/lib/parking/validation";
import type { FormState } from "@/lib/auth/validation";

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
