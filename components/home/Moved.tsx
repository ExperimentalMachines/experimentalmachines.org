import type { Metadata } from "next";
import MovedForward from "@/components/home/MovedForward";

// An address whose page moved. GitHub Pages serves a static export and has no server redirects, so the
// old address keeps a page that forwards. The inline script runs while the page loads and carries the
// #section along. A meta refresh drops it, and during a client-side navigation it could beat the script,
// so it sits in <noscript>; the link is there if that fails too. The canonical and Open Graph URLs name
// the new page, so a search engine or a shared link never advertises this one.

export const movedMetadata = (to: string, title: string): Metadata => ({
  title: `${title} (moved)`,
  robots: { index: false, follow: true },
  alternates: { canonical: to },
  openGraph: { title, url: to },
});

export default function Moved({ to, title }: { to: string; title: string }) {
  return (
    <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
      <noscript>
        <meta httpEquiv="refresh" content={`0; url=${to}`} />
      </noscript>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__moved=1;location.replace(${JSON.stringify(to)}+location.search+location.hash);`,
        }}
      />
      <MovedForward to={to} />
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="text-sm text-ink-soft">Moved</p>
        <h1 className="display mt-4 max-w-4xl text-balance text-4xl font-medium leading-[1.05] tracking-[-0.03em] sm:text-5xl">{title}</h1>
        <p className="mt-6 text-lg leading-8 text-ink-soft">
          This page now lives at{" "}
          <a href={to} className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">
            {to}
          </a>
          .
        </p>
      </div>
    </main>
  );
}
