"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { saveListing } from "@/app/listings/manage-actions";
import {
  VEHICLES,
  FACILITIES,
  facilityLabels,
  MAX_IMAGE_BYTES,
  MAX_PHOTOS,
} from "@/lib/listings/validation";
import type { Listing } from "@/lib/supabase/types";
import type { FormState } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ListingForm({
  listing,
  photos = {},
}: {
  listing?: Listing;
  photos?: Record<string, string>;
}) {
  const selectedFiles = useRef<File[]>([]);
  const [state, action, pending] = useActionState(
    async (previous: FormState, form: FormData) => {
      // React resets native file inputs after an action. Preserve selected files
      // alongside previews so a validation error can be corrected and retried.
      form.delete("photos");
      selectedFiles.current.forEach((file) => form.append("photos", file));
      return saveListing(previous, form);
    },
    {},
  );
  const [values, setValues] = useState({
    title: listing?.title || "",
    description: listing?.description || "",
    address: listing?.address || "",
    city: listing?.city || "",
    rate: listing ? (listing.hourly_rate_paise / 100).toFixed(2) : "",
    parking_type: listing?.parking_type || "open",
  });
  const [vehicles, setVehicles] = useState<string[]>(
    listing?.vehicle_types || ["car"],
  );
  const [facilities, setFacilities] = useState<string[]>(
    listing?.facilities || [],
  );
  const [retained, setRetained] = useState(listing?.photo_paths || []);
  const [newPhotos, setNewPhotos] = useState<{ url: string; name: string }[]>(
    [],
  );
  const previewUrls = useRef<string[]>([]);
  useEffect(
    () => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)),
    [],
  );
  const [main, setMain] = useState(
    listing?.photo_path ? `existing:${listing.photo_path}` : "",
  );
  const choices = [
    ...retained.map((path) => ({
      value: `existing:${path}`,
      url: photos[path],
      name: "Saved photo",
    })),
    ...newPhotos.map((photo, index) => ({ value: `new:${index}`, ...photo })),
  ];
  const selectedMain = choices.some((c) => c.value === main)
    ? main
    : choices[0]?.value || "";
  const field = (name: keyof typeof values) => ({
    value: values[name],
    onChange: (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => setValues({ ...values, [name]: event.target.value }),
  });
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={listing?.id || ""} />
      <input type="hidden" name="revision" value={listing?.revision || ""} />
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-60">
        <label className="block space-y-2">
          <span>Title</span>
          <Input
            name="title"
            required
            minLength={3}
            maxLength={100}
            {...field("title")}
          />
        </label>
        <label className="block space-y-2">
          <span>Description</span>
          <textarea
            name="description"
            maxLength={1000}
            rows={4}
            {...field("description")}
            className="w-full rounded-xl border border-input bg-background p-3 focus-visible:outline-2 focus-visible:outline-ring"
          />
          <span className="text-xs text-muted-foreground">
            At least 10 characters to publish. Describe access, size, and useful
            landmarks.
          </span>
        </label>
        <label className="block space-y-2">
          <span>Street address</span>
          <Input
            name="address"
            required
            minLength={5}
            maxLength={250}
            {...field("address")}
          />
          <span className="text-xs text-muted-foreground">
            Include the building or plot, street, and nearby landmark. Published
            addresses are public.
          </span>
        </label>
        <label className="block space-y-2">
          <span>City</span>
          <Input
            name="city"
            required
            minLength={2}
            maxLength={100}
            {...field("city")}
          />
        </label>
        <label className="block space-y-2">
          <span>Hourly price (INR)</span>
          <Input
            name="rate"
            inputMode="decimal"
            required
            pattern="[0-9]+([.][0-9]{1,2})?"
            placeholder="50.00"
            {...field("rate")}
          />
          <span className="text-xs text-muted-foreground">
            ₹1–₹10,000; at most two decimal places.
          </span>
        </label>
        <fieldset className="space-y-3">
          <legend className="mb-2 font-medium">Supported vehicle types</legend>
          {VEHICLES.map((v) => (
            <label
              key={v}
              className="mr-5 inline-flex items-center gap-2 capitalize"
            >
              <input
                type="checkbox"
                name="vehicle_types"
                value={v}
                checked={vehicles.includes(v)}
                onChange={(e) =>
                  setVehicles(
                    e.target.checked
                      ? [...vehicles, v]
                      : vehicles.filter((x) => x !== v),
                  )
                }
              />
              {v}
            </label>
          ))}
        </fieldset>
        <label className="block space-y-2">
          <span>Parking type</span>
          <select
            name="parking_type"
            {...field("parking_type")}
            className="h-12 w-full rounded-xl border border-input bg-background px-3"
          >
            <option value="open">Open</option>
            <option value="covered">Covered</option>
          </select>
        </label>
        <fieldset className="space-y-3">
          <legend className="mb-2 font-medium">Facilities (optional)</legend>
          {FACILITIES.map((f) => (
            <label key={f} className="mr-5 inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="facilities"
                value={f}
                checked={facilities.includes(f)}
                onChange={(e) =>
                  setFacilities(
                    e.target.checked
                      ? [...facilities, f]
                      : facilities.filter((x) => x !== f),
                  )
                }
              />
              {facilityLabels[f]}
            </label>
          ))}
        </fieldset>
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Photos</h2>
          <p className="text-sm text-muted-foreground">
            Up to six JPEG, PNG, or WebP photos, each no larger than 512 KB.
            Photos are optional. Choose one as the main photo.
          </p>
          {listing?.photo_paths.map((path, index) => (
            <label key={path} className="flex items-center gap-3">
              <input
                type="checkbox"
                name="keep_photo"
                value={path}
                checked={retained.includes(path)}
                onChange={(e) =>
                  setRetained(
                    e.target.checked
                      ? [...retained, path]
                      : retained.filter((x) => x !== path),
                  )
                }
              />
              Keep saved photo {index + 1}
            </label>
          ))}
          <label className="block space-y-2">
            <span>Add photos (select several at once)</span>
            <Input
              type="file"
              name="photos"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files || []);
                selectedFiles.current = files;
                const invalid =
                  files.length > MAX_PHOTOS ||
                  files.some(
                    (f) =>
                      f.size > MAX_IMAGE_BYTES ||
                      !["image/jpeg", "image/png", "image/webp"].includes(
                        f.type,
                      ),
                  );
                event.currentTarget.setCustomValidity(
                  invalid
                    ? "Choose at most six JPEG, PNG or WebP photos, each at most 512 KB."
                    : "",
                );
                previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
                previewUrls.current = invalid
                  ? []
                  : files.map((f) => URL.createObjectURL(f));
                setNewPhotos(
                  invalid
                    ? []
                    : files.map((f, i) => ({
                        name: f.name,
                        url: previewUrls.current[i],
                      })),
                );
              }}
            />
          </label>
          {choices.length > 6 && (
            <p role="alert" className="text-sm text-destructive">
              Remove saved photos or select fewer new photos. Maximum six total.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {choices.map((photo, index) => (
              <label
                key={photo.value}
                className="space-y-2 rounded-xl border border-border p-3"
              >
                {photo.url ? (
                  <Image
                    unoptimized
                    src={photo.url}
                    width={180}
                    height={120}
                    alt={`Photo ${index + 1}`}
                    className="h-28 w-full rounded-lg object-cover"
                  />
                ) : (
                  <p className="text-sm">
                    Preview unavailable; reload to refresh it.
                  </p>
                )}
                <span className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="main_photo"
                    value={photo.value}
                    checked={selectedMain === photo.value}
                    onChange={() => setMain(photo.value)}
                  />
                  Main photo {index + 1}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {photo.name}
                </span>
              </label>
            ))}
          </div>
        </section>
        {state.error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
          >
            {state.error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            variant="outline"
            name="status"
            value="draft"
            disabled={choices.length > 6}
            aria-busy={pending}
          >
            {pending ? "Saving…" : "Save as draft"}
          </Button>
          <Button
            type="submit"
            name="status"
            value="published"
            disabled={choices.length > 6}
            aria-busy={pending}
          >
            {listing?.status === "published"
              ? "Save published listing"
              : "Publish listing"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Drafts are visible only to you. Publishing makes the listing and
          selected photos visible to visitors.
        </p>
      </fieldset>
    </form>
  );
}
