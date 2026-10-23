"use client";
import { useActionState, useState } from "react";
import { bookSpace } from "@/app/listings/actions";
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
