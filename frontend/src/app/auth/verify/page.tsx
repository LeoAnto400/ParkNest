import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth/redirect";
export const metadata = {
  title: "Confirm your email",
  referrer: "no-referrer" as const,
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const { token_hash, type, next } = await searchParams;
  if (!token_hash || (type !== "email" && type !== "recovery"))
    redirect("/auth/error");
  return (
    <AuthShell
      title={
        type === "recovery" ? "Reset your password." : "You’re nearly home."
      }
      description="Select continue to securely verify your email link."
    >
      <form method="post" action="/auth/confirm">
        <input type="hidden" name="token_hash" value={token_hash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={safeNext(next)} />
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </AuthShell>
  );
}
