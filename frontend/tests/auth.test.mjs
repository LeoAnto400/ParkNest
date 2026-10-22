import test from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "../src/lib/auth/redirect.ts";
import {
  profileSchema,
  emailSchema,
  passwordSchema,
} from "../src/lib/auth/validation.ts";

test("login redirect preserves local destinations and rejects external or auth loops", () => {
  assert.equal(
    safeNext("/profile?tab=details#phone"),
    "/profile?tab=details#phone",
  );
  for (const input of [
    undefined,
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\nevil.example",
    "/login",
    "/auth/confirm",
    "/x/../login",
  ]) {
    assert.equal(safeNext(input), "/dashboard", String(input));
  }
});
test("profiles trim names and allow optional phone without allowing malformed data", () => {
  assert.deepEqual(profileSchema.parse({ name: " Alex ", phone: "" }), {
    name: "Alex",
    phone: "",
  });
  assert.equal(
    profileSchema.safeParse({ name: " ", phone: "" }).success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ name: "A", phone: "not-a-phone" }).success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ name: "A", phone: "+91 98765 43210" }).success,
    true,
  );
  assert.equal(
    profileSchema.safeParse({ name: "A".repeat(101), phone: "" }).success,
    false,
  );
});
test("email and new password validation", () => {
  assert.equal(emailSchema.safeParse("broken").success, false);
  assert.equal(emailSchema.parse(" test@example.com "), "test@example.com");
  assert.equal(passwordSchema.safeParse("short").success, false);
  assert.equal(passwordSchema.safeParse("a".repeat(73)).success, false);
  assert.equal(passwordSchema.safeParse("long enough password").success, true);
});
