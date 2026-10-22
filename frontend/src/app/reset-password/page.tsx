import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/user";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Reset password" };
export default async function Page() {
  if (!(await getUser())) redirect("/auth/error");
  return (
    <AuthShell
      title="A fresh start."
      description="Choose a new password to keep your account secure."
    >
      <AuthForm mode="reset" />
    </AuthShell>
  );
}
