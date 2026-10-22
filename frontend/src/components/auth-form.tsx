"use client";
import { useActionState } from "react";
import { login, signup, updateProfile, logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Profile } from "@/lib/supabase/types";

type Mode = "login" | "signup" | "profile";
const actions = {
  login,
  signup,
  profile: updateProfile,
};
const labels = {
  login: "Log in",
  signup: "Create account",
  profile: "Save changes",
};

export function AuthForm({
  mode,
  next = "/dashboard",
  profile,
}: {
  mode: Mode;
  next?: string;
  profile?: Profile;
}) {
  const [state, action, pending] = useActionState(actions[mode], {});
  const password = ["login", "signup"].includes(mode);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        {mode === "profile" && (
          <Field
            label="Full name"
            name="name"
            autoComplete="name"
            maxLength={100}
            required
            defaultValue={profile?.name}
            placeholder="Alex Morgan"
          />
        )}
        {
          <Field
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            readOnly={mode === "profile"}
            defaultValue={profile?.email}
            placeholder="you@example.com"
          />
        }
        {mode === "profile" && (
          <p className="-mt-3 text-xs text-muted-foreground">
            Your email is managed by your account and cannot be edited here.
          </p>
        )}
        {mode === "profile" && (
          <Field
            label="Phone number (optional)"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            defaultValue={profile?.phone ?? ""}
            placeholder="+91 98765 43210"
          />
        )}
        {password && (
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            minLength={mode === "login" ? undefined : 8}
            maxLength={72}
            required
            aria-describedby={mode === "login" ? undefined : "password-help"}
          />
        )}
        {mode === "signup" && (
          <p id="password-help" className="text-xs text-muted-foreground">
            Use 8–72 characters. You will be signed in immediately. Add your
            name later in My profile.
          </p>
        )}
        {state.error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
          >
            {state.error}
          </p>
        )}
        {state.success && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"
          >
            {state.success}
          </p>
        )}
        <Button type="submit" className="w-full" aria-busy={pending}>
          {pending ? "Please wait…" : labels[mode]}
        </Button>
      </fieldset>
    </form>
  );
}

function Field({
  label,
  name,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; name: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}

export function LogoutButton() {
  const [state, action, pending] = useActionState(logout, {});
  return (
    <form action={action}>
      <Button variant="outline" size="sm" disabled={pending}>
        {pending ? "Logging out…" : "Log out"}
      </Button>
      {state.error && (
        <p role="alert" className="max-w-48 text-xs text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
