import Link from "next/link";
import { site } from "@/lib/content";

const links = [
  { href: "/#server", label: "Server" },
  { href: "/#laptop", label: "Laptop" },
  { href: "/#phone", label: "Phone" },
  { href: "/asic", label: "ASIC" },
  { href: "/gguf", label: "GGUF" },
  { href: "/#contact", label: "Contact" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-bench/95 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6"
      >
        <Link href="/" className="text-base tracking-tight">
          <span className="font-light">{site.wordmark[0]} </span>
          <span className="wide font-bold">{site.wordmark[1]}</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hidden text-ink-soft hover:text-ink sm:inline"
            >
              {l.label}
            </Link>
          ))}
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            className="text-blue hover:text-blue-deep"
          >
            GitHub
          </a>
        </div>
      </nav>
    </header>
  );
}
