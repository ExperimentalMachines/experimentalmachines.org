import Link from "next/link";
import { links } from "@/lib/home";

// The homepage's own header, in the hero's cobalt and kept that colour on
// scroll. The other pages keep components/Nav.tsx, whose /#server, /#laptop and
// /#phone links land in "Where we started" here.
const sections = [
  { href: "#openweights", label: "OpenWeights" },
  { href: "#execuserve", label: "ExecuServe" },
  { href: "#execupack", label: "ExecuPack" },
  { href: "#upstream", label: "Upstream" },
  { href: "#people", label: "People" },
];

export default function HomeHeader() {
  return (
    <header className="on-blue sticky top-0 z-50 bg-blue text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-blue-deep"
      >
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="display shrink-0 whitespace-nowrap text-[1.05rem]">
          Experimental <span className="font-semibold">Machines</span>
        </Link>
        <div className="hidden items-center gap-8 text-[0.95rem] text-white/85 lg:flex">
          {sections.map((s) => (
            <a key={s.href} href={s.href} className="hover:text-white">
              {s.label}
            </a>
          ))}
          <a href={links.github} target="_blank" rel="noreferrer" className="hover:text-white">
            GitHub
          </a>
        </div>
        <a
          href="#contact"
          className="hidden shrink-0 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-medium text-blue-deep hover:bg-white/90 min-[380px]:inline-block"
        >
          Work with us
        </a>
      </nav>
      <nav aria-label="Sections" className="relative border-t border-white/15 lg:hidden">
        {/* A fade at the edge says the row scrolls. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-blue" />
        <div className="flex gap-6 overflow-x-auto px-4 pr-12 text-sm text-white/85 sm:px-6 sm:pr-12">
          {sections.map((s) => (
            <a key={s.href} href={s.href} className="inline-flex min-h-11 shrink-0 items-center hover:text-white">
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
