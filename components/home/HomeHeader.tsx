import Link from "next/link";
import { sibling } from "@/lib/content";
import { links } from "@/lib/home";

// The homepage's own header, in the hero's cobalt and kept that colour on
// scroll. The pages under /openweights use it too, naming themselves as
// `current`: that project's link goes to its page and marks it, and the rest
// lead back to the homepage's sections. The older pages keep components/Nav.tsx,
// whose /#server, /#laptop and /#phone links land in "Where we started" here.
const sections = [
  { id: "openweights", label: "OpenWeights" },
  { id: "execuserve", label: "ExecuServe" },
  { id: "execupack", label: "ExecuPack" },
  { id: "upstream", label: "Upstream" },
  { id: "people", label: "People" },
];

export default function HomeHeader({ current }: { current?: "openweights" }) {
  const home = current === undefined;
  const items = sections.map((s) => ({
    ...s,
    href: home ? `#${s.id}` : s.id === current ? `/${s.id}/` : `/#${s.id}`,
    here: s.id === current,
  }));
  return (
    <header className="on-blue sticky top-0 z-50 bg-blue text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-blue-deep"
      >
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 xl:gap-6">
        {/* The kit's one-colour light mark: its full-colour mark is not for blue. */}
        <Link href="/" className="flex shrink-0 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files */}
          <img src="/brand/em-mark-mono-dark.svg" alt="Experimental Machines" width={32} height={32} className="h-8 w-8" />
        </Link>
        <div className="hidden items-center gap-5 whitespace-nowrap text-[0.95rem] text-white/85 lg:flex xl:gap-8">
          {items.map((s) => (
            <a
              key={s.id}
              href={s.href}
              aria-current={s.here ? "page" : undefined}
              className={s.here ? "font-medium text-white" : "hover:text-white"}
            >
              {s.label}
            </a>
          ))}
          <a href={links.github} target="_blank" rel="noreferrer" className="hover:text-white">
            GitHub
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* The sister site, beside this page's own call to action. Its mark alone on narrow phones. */}
          <a
            href={sibling.url}
            aria-label={sibling.name}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/40 px-3 py-2 text-sm font-medium text-white hover:border-white sm:px-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files */}
            <img src="/brand/ei-mark-white.svg" alt="" width={35} height={14} className="h-3.5 w-auto" />
            <span className="hidden sm:inline">{sibling.name}</span>
          </a>
          <a
            href={home ? "#contact" : "/#contact"}
            className="hidden shrink-0 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-medium text-blue-deep hover:bg-white/90 min-[380px]:inline-block"
          >
            Work with us
          </a>
        </div>
      </nav>
      <nav aria-label="Sections" className="relative border-t border-white/15 lg:hidden">
        {/* A fade at the edge says the row scrolls. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-blue" />
        <div className="flex gap-6 overflow-x-auto px-4 pr-12 text-sm text-white/85 sm:px-6 sm:pr-12">
          {items.map((s) => (
            <a
              key={s.id}
              href={s.href}
              aria-current={s.here ? "page" : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center ${s.here ? "font-medium text-white" : "hover:text-white"}`}
            >
              {s.label}
            </a>
          ))}
          <a
            href={links.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 shrink-0 items-center hover:text-white"
          >
            GitHub
          </a>
        </div>
      </nav>
    </header>
  );
}
