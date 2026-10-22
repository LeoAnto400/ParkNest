import { requireUser } from "@/lib/auth/user";
import { ListingForm } from "@/components/parking-forms";
export const metadata = { title: "Share a space" };
export default async function Page() {
  await requireUser("/listings/new");
  return (
    <section className="mx-auto max-w-xl space-y-6 py-12">
      <h1 className="text-3xl font-semibold">Share a space</h1>
      <p className="text-muted-foreground">
        Add a space and the times it is available for parking.
      </p>
      <ListingForm />
    </section>
  );
}
