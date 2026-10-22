export default function Loading() {
  return (
    <div role="status" className="space-y-5 py-16">
      <p className="text-sm text-muted-foreground">Loading ParkNest…</p>
      <div className="h-10 w-2/3 animate-pulse rounded-xl bg-muted" />
      <div className="h-56 animate-pulse rounded-3xl bg-muted" />
    </div>
  );
}
