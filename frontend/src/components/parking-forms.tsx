"use client";
import { useActionState, useState } from "react";
import { createListing, bookSpace } from "@/app/listings/actions";
import { localToISO } from "@/lib/parking/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/auth/validation";

function DateField({ name, label }: { name: string; label: string }) {
  const [value, setValue] = useState("");
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <Input
        type="datetime-local"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <input type="hidden" name={name} value={localToISO(value)} />
    </label>
  );
}
function Status({ state }: { state: FormState }) {
  return state.error ? (
    <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
      {state.error}
    </p>
  ) : null;
}

export function ListingForm() {
  const [state, action, pending] = useActionState(createListing, {});
  return (
    <form action={action}>
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-60">
        <label className="block space-y-2">
          <span>Space title</span>
          <Input
            name="title"
            required
            minLength={3}
            maxLength={100}
            placeholder="Covered space near campus"
          />
        </label>
        <label className="block space-y-2">
          <span>Address</span>
          <Input
            name="address"
            required
            minLength={5}
            maxLength={250}
            placeholder="Building, street, city"
          />
        </label>
        <label className="block space-y-2">
          <span>Description (optional)</span>
          <Input
            name="description"
            maxLength={1000}
            placeholder="Entry instructions, size, or landmarks"
          />
        </label>
        <label className="block space-y-2">
          <span>Hourly rate (₹, simulated)</span>
          <Input
            name="rate"
            type="number"
            min="1"
            max="10000"
            step="0.01"
            required
          />
        </label>
        <p className="text-sm text-muted-foreground">
          Choose one availability window. Enter times in your device’s local
          time zone; saved times are displayed in IST. The window is fixed for
          this demo.
        </p>
        <DateField name="available_from" label="Available from" />
        <DateField name="available_until" label="Available until" />
        <label className="block space-y-2">
          <span>Photo (optional, maximum 512 KB)</span>
          <Input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.setCustomValidity(
                file && file.size > 524288
                  ? "Choose a photo no larger than 512 KB."
                  : "",
              );
            }}
          />
        </label>
        <Status state={state} />
        <Button type="submit" aria-busy={pending}>
          {pending ? "Saving space…" : "Save space"}
        </Button>
      </fieldset>
    </form>
  );
}

export function BookingForm({ listingId }: { listingId: string }) {
  const [state, action, pending] = useActionState(bookSpace, {});
  return (
    <form action={action}>
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-60">
        <input type="hidden" name="listing_id" value={listingId} />
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Simulated payment.</strong> No money is charged. No card
          details or Razorpay account are needed. Confirming saves a real
          reservation in the demo database.
        </p>
        <p className="text-sm text-muted-foreground">
          Enter times in your device’s local time zone, within the listed
          availability. Maximum booking: 30 days. The total is calculated by
          duration at the hourly rate and rounded up to the nearest paise.
        </p>
        <DateField name="starts_at" label="Arrival" />
        <DateField name="ends_at" label="Departure" />
        <Status state={state} />
        <Button type="submit" aria-busy={pending}>
          {pending ? "Reserving…" : "Confirm booking · Simulated payment"}
        </Button>
      </fieldset>
    </form>
  );
}
