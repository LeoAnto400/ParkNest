import test from "node:test";
import assert from "node:assert/strict";
import {
  rupeesToPaise,
  listingDetailsSchema,
  imageValidationError,
  MAX_IMAGE_BYTES,
} from "../src/lib/listings/validation.ts";

test("INR prices are parsed exactly without rounding extra decimals", () => {
  for (const [value, expected] of [
    ["10.01", 1001],
    ["1.1", 110],
    ["10000", 1000000],
    ["123.45", 12345],
    [" 20.00 ", 2000],
  ])
    assert.equal(rupeesToPaise(value), expected);
  for (const value of [
    "0.99",
    "-1",
    "1.005",
    "1e3",
    "10000.01",
    "",
    null,
    "NaN",
  ])
    assert.equal(rupeesToPaise(value), null);
});
test("listing fields validate options and publication completeness", () => {
  const draft = {
    title: "Campus space",
    description: "",
    address: "12 College Road",
    city: "Pune",
    hourly_rate_paise: 5000,
    vehicle_types: ["car"],
    parking_type: "covered",
    facilities: ["ev_charging"],
    status: "draft",
  };
  assert.equal(listingDetailsSchema.safeParse(draft).success, true);
  assert.equal(
    listingDetailsSchema.safeParse({ ...draft, status: "published" }).success,
    false,
  );
  assert.equal(
    listingDetailsSchema.safeParse({
      ...draft,
      status: "published",
      description: "Covered space near the entrance.",
    }).success,
    true,
  );
  for (const overrides of [
    { vehicle_types: [] },
    { vehicle_types: ["truck"] },
    { parking_type: "garage" },
    { facilities: ["fake"] },
    { city: "" },
    { hourly_rate_paise: 100.5 },
  ])
    assert.equal(
      listingDetailsSchema.safeParse({ ...draft, ...overrides }).success,
      false,
    );
});
test("image validation checks size, MIME and content signature", () => {
  const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);
  const jpg = Uint8Array.from([255, 216, 255, 224, 0, 0, 0, 0, 0, 0, 0, 0]);
  const webp = new TextEncoder().encode("RIFF1234WEBP");
  assert.equal(imageValidationError("image/png", png.length, png), null);
  assert.equal(imageValidationError("image/jpeg", jpg.length, jpg), null);
  assert.equal(imageValidationError("image/webp", webp.length, webp), null);
  assert.ok(imageValidationError("image/png", MAX_IMAGE_BYTES + 1, png));
  assert.ok(imageValidationError("image/jpeg", png.length, png));
  assert.ok(
    imageValidationError(
      "image/png",
      24,
      new TextEncoder().encode("<svg onload='alert(1)'/>"),
    ),
  );
  assert.ok(imageValidationError("image/svg+xml", png.length, png));
});
