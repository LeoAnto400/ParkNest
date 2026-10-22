import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "My profile" };
export default async function Page() {
  const user = await requireUser("/profile");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error || !data)
    throw new Error(
      "Unable to load your profile. Check the database migration and retry.",
    );
  return (
    <div className="mx-auto max-w-2xl py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        Account settings
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        Your profile.
      </h1>
      <p className="mb-8 mt-3 text-muted-foreground">
        The details that make ParkNest yours.
      </p>
      <section className="rounded-3xl border border-border bg-white p-6 sm:p-9">
        <AuthForm mode="profile" profile={data} />
      </section>
    </div>
  );
}
