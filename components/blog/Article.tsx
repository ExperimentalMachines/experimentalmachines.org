import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import { Byline, Cover } from "@/components/blog/BlogCards";
import type { BlogPost } from "@/lib/blog";

// The parts a long blog post is built from: a header, sections whose headings carry an anchor, short paragraphs,
// formulas set apart, plain tables and a list of sources. Prose sits in a readable column; figures and tables
// may run wider.

export function ArticleHeader({ post }: { post: BlogPost }) {
  return (
    <header className="mx-auto max-w-3xl">
      <Go href="/blog/" className={`${link} text-sm`}>
        All posts
      </Go>
      <p className="mt-8 text-sm text-ink-soft">{post.date}</p>
      <h1 className="display mt-2 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.03em] sm:text-5xl">{post.title}</h1>
      <p className="mt-5 text-xl leading-8 text-ink-soft">{post.summary}</p>
      <div className="mt-6">
        <Byline name={post.author} />
      </div>
      <div className="mt-10 overflow-hidden rounded-[1.5rem]">
        <Cover post={post} />
      </div>
    </header>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-16 scroll-mt-28 lg:scroll-mt-16">
      <h2 className="display mx-auto max-w-3xl text-3xl font-normal leading-tight tracking-[-0.02em] sm:text-4xl">
        <a href={`#${id}`} className="hover:text-blue-deep">
          {title}
        </a>
      </h2>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

export const H3 = ({ children }: { children: React.ReactNode }) => <h3 className="display mx-auto max-w-3xl pt-4 text-2xl font-normal tracking-[-0.01em]">{children}</h3>;

export const P = ({ children }: { children: React.ReactNode }) => <p className="mx-auto max-w-3xl text-lg leading-8 text-ink-soft">{children}</p>;

export const Bullets = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="mx-auto max-w-3xl list-disc space-y-2 pl-6 text-lg leading-8 text-ink-soft marker:text-blue">
    {items.map((x, i) => (
      <li key={i}>{x}</li>
    ))}
  </ul>
);

// A real sequence, so numbered.
export const Steps = ({ items }: { items: React.ReactNode[] }) => (
  <ol className="mx-auto max-w-3xl list-decimal space-y-2 pl-6 text-lg leading-8 text-ink-soft marker:text-ink-soft">
    {items.map((x, i) => (
      <li key={i} className="pl-1">
        {x}
      </li>
    ))}
  </ol>
);

// A formula set apart: what it computes, the formula, and one line on what each letter is.
export function Formula({ label, children, where }: { label: string; children: React.ReactNode; where?: string }) {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-rule bg-white px-5 py-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 text-xl leading-8 tabular-nums sm:text-2xl">{children}</p>
      {where && <p className="mt-1 text-sm leading-6 text-ink-soft">{where}</p>}
    </div>
  );
}

// A wide figure: an interactive card or a table, with a line under it.
export const Wide = ({ children, note }: { children: React.ReactNode; note?: React.ReactNode }) => (
  <figure className="mx-auto max-w-5xl">
    {children}
    {note && <figcaption className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-ink-soft">{note}</figcaption>}
  </figure>
);

export function DataTable({ head, rows, label, right = [] }: { head: string[]; rows: React.ReactNode[][]; label: string; right?: number[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-rule" role="region" aria-label={`${label}, scrolls sideways on small screens`} tabIndex={0}>
      <table className="w-full min-w-[36rem] text-sm tabular-nums">
        <caption className="sr-only">{label}</caption>
        <thead className="bg-bench">
          <tr>
            {head.map((h, i) => (
              <th key={h} scope="col" className={`px-4 py-3 text-xs font-normal text-ink-soft ${right.includes(i) ? "text-right" : "text-left"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, k) => (
            <tr key={k} className="border-t border-rule">
              {r.map((c, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="px-4 py-3 text-left font-medium">
                    {c}
                  </th>
                ) : (
                  <td key={i} className={`px-4 py-3 ${right.includes(i) ? "whitespace-nowrap text-right" : ""}`}>
                    {c}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Sources({ items }: { items: { label: string; href: string; note: string }[] }) {
  return (
    <ol className="mx-auto max-w-3xl list-decimal space-y-3 pl-6 text-base leading-7 text-ink-soft">
      {items.map((s) => (
        <li key={s.href}>
          <a href={s.href} className={link} target="_blank" rel="noreferrer">
            {s.label}
          </a>
          : {s.note}
        </li>
      ))}
    </ol>
  );
}
