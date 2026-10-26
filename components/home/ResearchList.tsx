import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import type { ResearchItem } from "@/lib/research";

// A list of pages: a research area's studies, tools or talks, or the 404 page's
// way back in. Each shows its date or kind, its title as the link, and one line
// on what it found or does.
export default function ResearchList({ items, columns = 3 }: { items: ResearchItem[]; columns?: 2 | 3 }) {
  return (
    <ul className={`grid gap-x-8 gap-y-10 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : "lg:gap-x-16"}`}>
      {items.map((r) => (
        <li key={r.href} className="border-t border-rule pt-4">
          <p className="text-sm text-ink-soft">{r.meta}</p>
          <p className="display mt-1 text-xl">
            <Go href={r.href} className="hover:text-blue-deep">
              {r.title}
            </Go>
          </p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">{r.line}</p>
          {r.more && (
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {r.more.map((m) => (
                <Go key={m.href} href={m.href} className={link}>
                  {m.label}
                </Go>
              ))}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
