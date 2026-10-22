import test from "node:test";
import assert from "node:assert/strict";
import {
  listingSchema,
  bookingSchema,
  localToISO,
  bookingError,
} from "../src/lib/parking/validation.ts";

const listing = {
  title: "Campus parking",
  address: "12 College Road",
  description: "",
  hourly_rate_paise: 5000,
  available_from: "2030-01-01T09:00:00+05:30",
  available_until: "2030-01-01T18:00:00+05:30",
};
test("availability rejects backwards windows and invalid prices", () => {
  assert.equal(listingSchema.safeParse(listing).success, true);
  assert.equal(
    listingSchema.safeParse({
      ...listing,
      available_until: listing.available_from,
    }).success,
    false,
  );
  for (const price of [0, -100, 100.5, Infinity, 1000001])
    assert.equal(
      listingSchema.safeParse({ ...listing, hourly_rate_paise: price }).success,
      false,
    );
});
test("booking input requires explicit timezone and a bounded positive duration", () => {
  const booking = {
    listing_id: "11111111-1111-4111-8111-111111111111",
    starts_at: "2030-01-01T09:00:00+05:30",
    ends_at: "2030-01-01T10:00:00+05:30",
  };
  assert.equal(bookingSchema.safeParse(booking).success, true);
  assert.equal(
    bookingSchema.safeParse({ ...booking, ends_at: booking.starts_at }).success,
    false,
  );
  assert.equal(
    bookingSchema.safeParse({ ...booking, starts_at: "2030-01-01T09:00" })
      .success,
    false,
  );
  assert.equal(
    bookingSchema.safeParse({ ...booking, ends_at: "2030-03-01T10:00:00Z" })
      .success,
    false,
  );
  assert.equal(
    bookingSchema.safeParse({ ...booking, listing_id: "not-a-uuid" }).success,
    false,
  );
});
test("date conversion preserves instants and handles invalid input", () => {
  assert.equal(
    localToISO("2030-01-01T09:00:00+05:30"),
    "2030-01-01T03:30:00.000Z",
  );
  assert.equal(localToISO(""), "");
  assert.equal(localToISO("broken"), "");
});
test("database conflict errors have an actionable user message", () => {
  assert.match(bookingError("23P01"), /already booked/);
  assert.match(bookingError("23514"), /availability window/);
  assert.match(bookingError(), /Refresh My bookings/);
});
