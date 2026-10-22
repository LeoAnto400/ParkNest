import Link from "next/link";
import { ArrowUpRight, CarFront, House, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function Home() {
  return (
    <div className="py-12 sm:py-20">
      <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-primary">
            Welcome to a little more possibility
          </span>
          <h1 className="mt-7 text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            A place for
            <br />
            every <span className="text-primary">journey.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-muted-foreground">
            ParkNest brings drivers and space owners together. Start with one
            simple account, wherever life takes you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Make yourself at home <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Free to join. One account to drive and host.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] bg-[#e6eddf] p-8 sm:p-12">
          <div className="mb-10 flex items-center justify-between text-xs font-medium uppercase tracking-widest text-primary">
            <span>A shared space</span>
            <span>Est. 2026</span>
          </div>
          <div className="mx-auto grid aspect-square max-w-72 grid-cols-2 gap-4 rounded-3xl bg-[#153d32] p-6 shadow-xl">
            <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-white/30">
              <CarFront className="size-16 text-lime-200" strokeWidth={1.3} />
            </div>
            <div className="flex items-center justify-center rounded-2xl bg-lime-200 text-7xl font-semibold text-[#153d32]">
              P
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-2xl bg-white/10 px-5 text-white">
              <span className="text-sm">Room for what’s next.</span>
              <ArrowUpRight className="size-7" />
            </div>
          </div>
          <p className="mt-10 text-center text-sm text-primary">
            Good things start with a little space.
          </p>
        </div>
      </section>
      <section
        aria-label="Your ParkNest account"
        className="mt-16 grid gap-6 border-t border-border pt-8 sm:grid-cols-3"
      >
        {[
          {
            icon: CarFront,
            title: "For your everyday journeys",
            text: "Your driver profile, ready for the road ahead.",
          },
          {
            icon: House,
            title: "For the space you can share",
            text: "The same account will work for hosting, too.",
          },
          {
            icon: ShieldCheck,
            title: "Built around you",
            text: "Secure sign-in and a profile you control.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title}>
            <Icon className="mb-4 size-6 text-primary" />
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {text}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
