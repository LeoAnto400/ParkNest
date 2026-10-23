import { z } from "zod";

export const VEHICLES = ["car", "motorcycle", "bicycle"] as const;
export const FACILITIES = [
  "ev_charging",
  "cctv",
  "security",
  "lighting",
  "accessible",
] as const;
export const facilityLabels: Record<(typeof FACILITIES)[number], string> = {
  ev_charging: "EV charging",
  cctv: "CCTV",
  security: "Security staff",
  lighting: "Lighting",
  accessible: "Accessible parking",
};
export const MAX_PHOTOS = 6;
export const MAX_IMAGE_BYTES = 524288;

/** Decimal string arithmetic: never round a binary floating-point price. */
export function rupeesToPaise(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{1,5}(\.\d{1,2})?$/.test(value.trim()))
    return null;
  const [whole, fraction = ""] = value.trim().split(".");
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return paise >= 100 && paise <= 1000000 ? paise : null;
}

export const listingDetailsSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Enter a title with at least 3 characters.")
      .max(100),
    description: z.string().trim().max(1000),
    address: z
      .string()
      .trim()
      .min(5, "Enter a usable street address.")
      .max(250),
    city: z.string().trim().min(2, "Enter the city.").max(100),
    hourly_rate_paise: z
      .number()
      .int()
      .min(
        100,
        "Enter a price from ₹1 to ₹10,000 with at most two decimal places.",
      )
      .max(1000000),
    vehicle_types: z
      .array(z.enum(VEHICLES))
      .min(1, "Choose at least one vehicle type.")
      .max(3),
    parking_type: z.enum(["covered", "open"]),
    facilities: z.array(z.enum(FACILITIES)).max(5),
    status: z.enum(["draft", "published"]),
  })
  .refine(
    (v) => v.status === "draft" || v.description.length >= 10,
    "Add a description of at least 10 characters before publishing.",
  );

export function imageValidationError(
  type: string,
  size: number,
  bytes: Uint8Array,
): string | null {
  if (size < 12 || size > MAX_IMAGE_BYTES)
    return "Each photo must be nonempty and no larger than 512 KB.";
  const png =
    bytes[0] === 137 &&
    bytes[1] === 80 &&
    bytes[2] === 78 &&
    bytes[3] === 71 &&
    bytes[4] === 13 &&
    bytes[5] === 10 &&
    bytes[6] === 26 &&
    bytes[7] === 10;
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!(
    (type === "image/png" && png) ||
    (type === "image/jpeg" && jpeg) ||
    (type === "image/webp" && webp)
  ))
    return "Use a JPEG, PNG, or WebP image whose content matches its file type. SVG is not supported.";
  return null;
}
