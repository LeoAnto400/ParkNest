import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
import { safeNext } from "@/lib/auth/redirect";
export const metadata = { title: "Create account" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);
  return (
    <AuthShell
      title="Find your place."
      description="Create one account to drive and host. No need to choose a side."
      footer={
        <>
          Already part of ParkNest?{" "}
          <Link
            className="font-semibold text-primary hover:underline"
            href={`/login?next=${encodeURIComponent(next)}`}
          >
            Log in
          </Link>
        </>
      }
    >
      <AuthForm mode="signup" next={next} />
    </AuthShell>
  );
}
