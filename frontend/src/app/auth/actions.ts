"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/config";
import { safeNext } from "@/lib/auth/redirect";
import {
  emailSchema,
  passwordSchema,
  profileSchema,
  type FormState,
} from "@/lib/auth/validation";

function siteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value) throw new Error("Missing site URL");
  return new URL(value).origin;
}
const unavailable = {
  error:
    "Authentication is not configured yet. Follow the setup steps in README.md.",
};
const networkError = {
  error: "Unable to connect. Please try again in a moment.",
};

export async function login(_: FormState, form: FormData): Promise<FormState> {
  if (!isConfigured()) return unavailable;
  const email = emailSchema.safeParse(form.get("email"));
  const password = form.get("password");
  if (!email.success || typeof password !== "string" || !password)
    return { error: "Enter your email and password." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.data,
      password,
    });
    if (error)
      return {
        error:
          error.code === "email_not_confirmed"
            ? "Check your inbox and confirm your email before logging in."
            : "Could not log in. Check your details or try again shortly.",
      };
  } catch {
    return networkError;
  }
  revalidatePath("/", "layout");
  redirect(safeNext(form.get("next")));
}

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  if (!isConfigured()) return unavailable;
  const email = emailSchema.safeParse(form.get("email"));
  const password = passwordSchema.safeParse(form.get("password"));
  const profile = profileSchema.safeParse({
    name: form.get("name"),
    phone: form.get("phone") || "",
  });
  if (!email.success) return { error: email.error.issues[0].message };
  if (!password.success) return { error: password.error.issues[0].message };
  if (!profile.success) return { error: profile.error.issues[0].message };
  if (password.data !== form.get("confirmPassword"))
    return { error: "Passwords do not match." };
  const next = safeNext(form.get("next"));
  let signedIn = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.data,
      password: password.data,
      options: {
        data: profile.data,
        emailRedirectTo: `${siteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });
    if (error)
      return {
        error:
          "Could not create your account. Check your details and try again, or log in if you already have an account.",
      };
    signedIn = Boolean(data.session);
  } catch {
    return networkError;
  }
  if (signedIn) {
    revalidatePath("/", "layout");
    redirect(next);
  }
  return {
    success:
      "Check your inbox for a confirmation link. If this email already has an account, you can log in or reset your password.",
  };
}

export async function forgotPassword(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  if (!isConfigured()) return unavailable;
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return { error: email.error.issues[0].message };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${siteUrl()}/auth/confirm?next=/reset-password`,
    });
    if (error)
      return {
        error:
          "Unable to send a reset link right now. Please wait a moment and try again.",
      };
  } catch {
    return networkError;
  }
  return {
    success:
      "If an account exists for this email, you’ll receive a password reset link shortly.",
  };
}

export async function resetPassword(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  if (!isConfigured()) return unavailable;
  const password = passwordSchema.safeParse(form.get("password"));
  if (!password.success) return { error: password.error.issues[0].message };
  if (password.data !== form.get("confirmPassword"))
    return { error: "Passwords do not match." };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return {
        error: "Your reset session has expired. Request a new reset link.",
      };
    const { error } = await supabase.auth.updateUser({
      password: password.data,
    });
    if (error)
      return {
        error:
          "Could not update your password. Try a different password or request a new link.",
      };
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError)
      return {
        success: "Password updated. You can now return to your dashboard.",
      };
  } catch {
    return networkError;
  }
  revalidatePath("/", "layout");
  redirect("/login?message=password-updated");
}

export async function updateProfile(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  if (!isConfigured()) return unavailable;
  const profile = profileSchema.safeParse({
    name: form.get("name"),
    phone: form.get("phone") || "",
  });
  if (!profile.success) return { error: profile.error.issues[0].message };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return { error: "Your session expired. Log in again to save changes." };
    const { data, error } = await supabase
      .from("profiles")
      .update({ name: profile.data.name, phone: profile.data.phone || null })
      .eq("id", user.id)
      .select("id")
      .single();
    if (error || !data)
      return { error: "Could not save your profile. Please try again." };
  } catch {
    return networkError;
  }
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: "Your profile has been saved." };
}

export async function logout(): Promise<FormState> {
  if (!isConfigured()) return unavailable;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return { error: "Could not log out. Please try again." };
  } catch {
    return networkError;
  }
  revalidatePath("/", "layout");
  redirect("/login?message=logged-out");
}
