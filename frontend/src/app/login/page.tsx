import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
import { safeNext } from "@/lib/auth/redirect";
export const metadata = { title: "Log in" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  return (
    <AuthShell
      title="Welcome back."
      description="Log in and pick up where you left off."
      footer={
        <>
          New to ParkNest?{" "}
          <Link
            className="font-semibold text-primary hover:underline"
            href={`/signup?next=${encodeURIComponent(next)}`}
          >
            Create an account
          </Link>
        </>
      }
    >
      {params.message === "password-updated" && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-emerald-50 p-3 text-sm text-primary"
        >
          Password updated. Log in with your new password.
        </p>
      )}
      {params.message === "logged-out" && (
        <p role="status" className="mb-5 text-sm text-primary">
          You’ve been logged out.
        </p>
      )}
      {params.message === "email-deferred" && (
        <p role="status" className="mb-5 text-sm text-muted-foreground">
          Email confirmation and password recovery are deferred for this
          classroom demo. Use your demo account password, or create a new
          account.
        </p>
      )}
      <AuthForm mode="login" next={next} />
    </AuthShell>
  );
}
