import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redirecting to the tag reference — SemText",
  description:
    "The elements glossary has moved to the tag reference at /reference/.",
  alternates: { canonical: "https://semtext.dev/reference/" },
  robots: { index: false },
};

/*
 * The /elements/ glossary page was retired: its entries live on
 * /reference/ now (data/reference-glossary.ts). This route remains only
 * as a static redirect for old links — meta refresh plus a manual link,
 * so it works from any dumb file server. nginx also 301s this path (see
 * nginx.conf); the static page is the fallback for hosts that cannot.
 *
 * The <meta> is hoisted into <head> by React 19.
 */
export default function ElementsRedirectPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-docs px-4 pb-24 pt-12 sm:px-6">
      <meta httpEquiv="refresh" content="0; url=/reference/" />
      <p className="g-eyebrow">Reference</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        The elements moved
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
        The elements glossary is now part of the{" "}
        <a
          href="/reference/"
          className="font-mono text-violet-soft underline-offset-4 hover:underline"
        >
          tag reference
        </a>
        . Redirecting…
      </p>
    </main>
  );
}
