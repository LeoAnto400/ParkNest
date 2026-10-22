import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254);
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use at most 72 characters.");
export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(100, "Name must be 100 characters or fewer."),
  phone: z
    .string()
    .trim()
    .max(30, "Phone number is too long.")
    .refine(
      (v) => !v || /^[+0-9() .-]{7,30}$/.test(v),
      "Enter a valid phone number, or leave it blank.",
    ),
});
export type FormState = { error?: string; success?: string };
