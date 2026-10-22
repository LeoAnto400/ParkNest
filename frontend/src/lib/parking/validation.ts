import { z } from "zod";

const instant = z.string().datetime({ offset: true });
export const listingSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Enter a title of at least 3 characters.")
      .max(100),
    address: z
      .string()
      .trim()
      .min(5, "Enter an address of at least 5 characters.")
      .max(250),
    description: z.string().trim().max(1000),
    hourly_rate_paise: z
      .number()
      .int()
      .min(100, "The hourly rate must be at least ₹1.")
      .max(1000000),
    available_from: instant,
    available_until: instant,
  })
  .refine(
    (v) => Date.parse(v.available_until) > Date.parse(v.available_from),
    "Availability must end after it starts.",
  );

export const bookingSchema = z
  .object({
    listing_id: z.string().uuid(),
    starts_at: instant,
    ends_at: instant,
  })
  .refine(
    (v) =>
      Date.parse(v.ends_at) > Date.parse(v.starts_at) &&
      Date.parse(v.ends_at) - Date.parse(v.starts_at) <= 30 * 86400000,
    "Choose an end time after the start, within 30 days.",
  );

// The browser converts datetime-local to an explicit instant before submission.
// No server-local time zone is used to interpret a user's selection.
export function localToISO(value: string): string {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime()) ? date.toISOString() : "";
}

export function bookingError(code?: string) {
  if (code === "23P01")
    return "That space is already booked for part of this time. Choose a different time.";
  if (code === "23514")
    return "Choose a future time within the availability window (maximum 30 days). You cannot book your own space.";
  if (code === "42501")
    return "Your session cannot make this booking. Please log in again.";
  return "Could not save the booking. Check your connection and try again. Refresh My bookings first if the connection was interrupted.";
}
