import { Fragment } from "react";
import Go from "@/components/home/Go";
import { h2, lede as ledeClass, link } from "@/components/home/ui";
import { Scroll, th } from "@/components/openweights/pd-parts";

// The parts OpenWeights' and ExecuServe's pages share, so a reader who has learned one page can find
// their way around the other: what it does, a quick start, a reference, and the documents behind it.

export function ProductSection({
  id,
  title,
  lede,
  tint,
  children,
}: {
  id: string;
  title: string;
  lede?: string;
  tint?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-28 lg:scroll-mt-16 ${tint ? "bg-bench" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 className={h2}>{title}</h2>
        {lede && <p className={`${ledeClass} mt-4 max-w-3xl`}>{lede}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export function Points({ items }: { items: { title: string; body: string }[] }) {
  return (
    <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <div key={p.title} className="border-t-2 border-blue pt-4">
          <dt className="display text-xl">{p.title}</dt>
          <dd className="mt-2 leading-7 text-ink-soft">{p.body}</dd>
        </div>
      ))}
    </dl>
  );
}

// Numbered because the order is the point: each step needs the one before it.
export function Steps({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((s, i) => (
        <li key={s.title} className="border-t-2 border-blue pt-4">
          <p className="display text-3xl text-blue-deep">{i + 1}</p>
          <p className="display mt-2 text-xl">{s.title}</p>
          <p className="mt-2 leading-7 text-ink-soft">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

// Lets the data stay plain strings in lib/ while commands and addresses still read as code.
const withCode = (text: string) =>
  text.split("`").map((part, i) =>
    i % 2 ? (
      <code key={i} className="text-[0.9em] text-ink">
        {part}
      </code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );

export function RefTable({ title, note, head, rows, min = "36rem" }: { title: string; note?: string; head: string[]; rows: string[][]; min?: string }) {
  return (
    <div>
      <h3 className="display text-2xl">{title}</h3>
      {note && <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-soft">{note}</p>}
      <Scroll label={title}>
        <table className="w-full text-sm leading-6" style={{ minWidth: min }}>
          <thead>
            <tr className="align-bottom">
              {head.map((h) => (
                <th key={h} scope="col" className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-rule align-top">
                {r.map((c, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="whitespace-nowrap py-2.5 pr-6 text-left font-medium">
                      {withCode(c)}
                    </th>
                  ) : (
                    <td key={i} className="py-2.5 pr-4 text-ink-soft">
                      {withCode(c)}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Scroll>
    </div>
  );
}

export function DocLinks({ items }: { items: { label: string; href: string; what: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-sm leading-6">
        <tbody>
          {items.map((d) => (
            <tr key={d.label} className="border-b border-rule align-top">
              <th scope="row" className="whitespace-nowrap py-2.5 pr-6 text-left font-medium">
                <Go href={d.href} className={link}>
                  {d.label}
                </Go>
              </th>
              <td className="py-2.5 text-ink-soft">{d.what}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
