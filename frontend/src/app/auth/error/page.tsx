import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
export default function Page() {
  return (
    <AuthShell
      title="This link didn’t work."
      description="It may have expired or already been used. Request a new reset link, or log in if your email is already confirmed."
    >
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/forgot-password">New reset link</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Log in</Link>
        </Button>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Still confirming a new account?{" "}
        <Link href="/signup" className="text-primary underline">
          Submit the signup form again
        </Link>{" "}
        to request another confirmation.
      </p>
    </AuthShell>
  );
}
