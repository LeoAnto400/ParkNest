"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="py-20">
      <h1 className="text-3xl font-semibold">We couldn’t load this page.</h1>
      <p role="alert" className="my-5 text-muted-foreground">
        Please try again. If you’re setting up ParkNest, check your Supabase
        connection and database migration.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    </section>
  );
}
