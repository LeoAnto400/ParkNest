import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Forgot password" };
export default function Page() {
  return (
    <AuthShell
      title="Let’s get you back in."
      description="Enter your email and we’ll send you a link to reset your password."
      footer={
        <Link href="/login" className="font-semibold text-primary">
          Back to log in
        </Link>
      }
    >
      <AuthForm mode="forgot" />
    </AuthShell>
  );
}
