import Link from "next/link";
export default function NotFound() {
  return (
    <div className="py-20">
      <h1 className="text-3xl font-semibold">This space is still empty.</h1>
      <p className="mt-4 text-muted-foreground">We couldn’t find that page.</p>
      <Link
        href="/"
        className="mt-6 inline-block font-semibold text-primary underline"
      >
        Back to ParkNest
      </Link>
    </div>
  );
}
