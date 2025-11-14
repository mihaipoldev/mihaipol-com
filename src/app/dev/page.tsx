import Link from "next/link";

import { albumsFeature } from "@/features/albums";
import { artistsFeature } from "@/features/artists";
import { authFeature } from "@/features/auth";
import { labelsFeature } from "@/features/labels";
import { updatesFeature } from "@/features/updates";

const featureSections = [
  { ...albumsFeature, href: "#" },
  { ...artistsFeature, href: "#" },
  { ...labelsFeature, href: "#" },
  { ...updatesFeature, href: "#" },
  { ...authFeature, href: "/login" },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <section className="space-y-6 text-center">
        <p className="text-sm uppercase tracking-wider text-muted-foreground">mihai-pol</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          A modern workspace for music makers.
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          Fast iterations on artists, labels, albums, and release updates—structured for scale and
          collaboration.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Go to Admin
          </Link>
          <Link
            href="#features"
            className="rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            Explore Features
          </Link>
        </div>
      </section>
      <section id="features" className="grid gap-6 md:grid-cols-2">
        {featureSections.map((feature) => (
          <article
            key={feature.name}
            className="rounded-lg border border-border bg-card p-6 shadow-sm transition hover:border-primary/70"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{feature.name}</h2>
              <span className="text-sm text-muted-foreground">coming soon</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            <Link
              href={feature.href}
              className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
            >
              Learn more →
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}

