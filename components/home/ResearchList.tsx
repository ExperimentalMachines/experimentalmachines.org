import Go from "@/components/home/Go";
import { cardLink, link } from "@/components/home/ui";
import type { ResearchItem } from "@/lib/research";

// A list of pages: a research area's studies, tools or talks, or the 404 page's way back in. Each is a
// card that clicks anywhere, because a title alone in body type did not read as a link; extra links
// sit above the stretched title link so they stay separately clickable.
export default function ResearchList({ items, columns = 3 }: { items: ResearchItem[]; columns?: 2 | 3 }) {
  return (
    <ul className={`grid gap-6 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""}`}>
      {items.map((r) => (
        <li key={r.href} className="group relative flex flex-col rounded-[1.25rem] border border-rule bg-white p-6 transition-colors hover:border-ink">
          <p className="text-sm text-ink-soft">{r.meta}</p>
          <p className="display mt-2 text-xl leading-snug">
            <Go href={r.href} className={`${cardLink} underline-offset-4 after:rounded-[1.25rem]`}>
              {r.title}
            </Go>
          </p>
          <p className="mt-2 flex-1 leading-7 text-ink-soft">{r.line}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span aria-hidden className="rounded-full border border-rule px-4 py-1.5 font-medium group-hover:border-ink">
              {r.href.startsWith("/") ? "Read" : "Open"}
            </span>
            {r.more?.map((m) => (
              <Go key={m.href} href={m.href} className={`${link} relative z-10`}>
                {m.label}
              </Go>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
