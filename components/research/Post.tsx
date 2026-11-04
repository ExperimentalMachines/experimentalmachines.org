import type { Metadata } from "next";
import { Fragment } from "react";
import { Action, Actions, PrimaryAction } from "@/components/home/Actions";
import Go from "@/components/home/Go";
import { Banner, StudyGrid } from "@/components/home/StudyCards";
import { link } from "@/components/home/ui";
import { Scroll, th } from "@/components/openweights/pd-parts";
import { team } from "@/lib/home";
import { studies } from "@/lib/studies";
import { talks } from "@/lib/talks";

// The one frame every research post and conference talk sits in: a banner, a title and one sentence from
// the feed, then the same sections in the same order. A study has What we found, The results, How we ran it,
// Limits and Sources. A talk has The talk, The evidence, Where and when, and Watch and read. Both end on Keep
// reading. A reader who has learned one page can find their way around the next, and a long post is kept to
// the same shape as a short one by folding its detail into More. Sizes live here and nowhere else.

const study = (href: string) => [...studies, ...talks].find((s) => s.href === href)!;

export const postMetadata = (href: string, description?: string): Metadata => {
  const s = study(href);
  const d = description ?? s.line;
  // A question already ends its own clause: "worth it?: Experimental Machines" reads as a typo.
  const title = s.title.endsWith("?") ? `${s.title} Experimental Machines` : `${s.title}: Experimental Machines`;
  return { title, description: d, openGraph: { title: s.title, description: d, url: href } };
};

const measure = "max-w-[44rem]";
const body = "text-[17px] leading-[1.7] text-ink-soft";
const anchor = "scroll-mt-28 lg:scroll-mt-16";

// Titles on cards carry no full stop; a page's h1 does, as every h1 on the site does.
const sentence = (t: string) => (/[.?!]$/.test(t) ? t : `${t}.`);

export default function Post({
  href,
  primary,
  sources,
  sourcesTitle = "Sources",
  sourcesNote,
  related,
  children,
}: {
  href: string;
  // A talk's one obvious next step, under its title: the recording, or the conference's listing.
  primary?: { label: string; href: string };
  sources: { label: string; href: string }[];
  sourcesTitle?: string;
  sourcesNote?: React.ReactNode;
  // The posts to end on, when the neighbours in the feed are not the ones a reader wants next.
  related?: string[];
  children: React.ReactNode;
}) {
  const s = study(href);
  const isTalk = talks.some((x) => x.href === href);
  const feed = isTalk ? talks : studies;
  const index = isTalk ? { href: "/conferences/", label: "All conferences" } : { href: "/research/", label: "All research" };
  const at = feed.indexOf(s);
  const next = related ? related.map(study) : [1, 2, 3].map((k) => feed[(at + k) % feed.length]);
  return (
    <main id="main" className={`post ${anchor}`}>
      <article id="top" className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <Go href={index.href} className="text-sm font-medium text-blue-deep underline decoration-blue/30 underline-offset-4 hover:decoration-blue">
          {index.label}
        </Go>
        <div className="mt-4">
          <Banner s={s} />
        </div>
        <p className="mt-8 text-sm text-ink-soft">{s.meta ?? `${s.project}, ${s.date}`}</p>
        <h1 className="display mt-2 max-w-4xl text-balance text-4xl font-medium leading-[1.05] tracking-[-0.03em] sm:text-5xl">{sentence(s.fullTitle ?? s.title)}</h1>
        <p className={`mt-4 ${measure} text-xl leading-8 text-ink-soft`}>{s.line}</p>
        {primary && (
          <Actions className="mt-6">
            <PrimaryAction href={primary.href} className="bg-blue text-white hover:bg-blue-deep">
              {primary.label}
            </PrimaryAction>
          </Actions>
        )}
        {children}
        <Section id="sources" title={sourcesTitle}>
          <div>
            {sourcesNote && <P>{sourcesNote}</P>}
            <Actions className={sourcesNote ? "mt-6" : ""}>
              {sources.map((l) => (
                <Action key={l.href} href={l.href}>
                  {l.label}
                </Action>
              ))}
            </Actions>
          </div>
        </Section>
      </article>
      <section aria-labelledby="keep-reading" className="mt-16 bg-bench sm:mt-20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <h2 id="keep-reading" className="display text-3xl font-normal leading-tight tracking-[-0.025em] sm:text-4xl">
              Keep reading
            </h2>
            <Go href={index.href} className="rounded-full bg-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-deep">
              {index.label}
            </Go>
          </div>
          <div className="mt-8">
            <StudyGrid items={next} />
          </div>
        </div>
      </section>
    </main>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`mt-14 border-t border-rule pt-10 sm:mt-20 sm:pt-12 ${anchor}`}>
      <h2 className="display text-3xl font-normal leading-tight tracking-[-0.025em] sm:text-4xl">{title}</h2>
      <div className="mt-8 space-y-14">{children}</div>
    </section>
  );
}

// Who gives a talk, each name linking to the person.
export const Speakers = ({ names }: { names: string[] }) =>
  names.map((n, i) => (
    <Fragment key={n}>
      {i > 0 && (i === names.length - 1 ? " and " : ", ")}
      <Go href={team.find((m) => m.name === n)!.linkedin} className={link}>
        {n}
      </Go>
    </Fragment>
  ));

export const P = ({ children }: { children: React.ReactNode }) => <p className={`${measure} ${body}`}>{children}</p>;

export const Note = ({ children }: { children: React.ReactNode }) => <p className={`mt-4 ${measure} text-sm leading-6 text-ink-soft`}>{children}</p>;

export const H4 = ({ children }: { children: React.ReactNode }) => <h4 className="display text-xl leading-snug">{children}</h4>;

// Each finding on its own line of the page: what we found on the left, the evidence beside it.
export function Findings({ items }: { items: { headline: React.ReactNode; line: React.ReactNode }[] }) {
  return (
    <ul className="divide-y divide-rule">
      {items.map((f, i) => (
        <li key={i} className="grid gap-x-12 gap-y-2 py-6 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <p className="display text-balance text-2xl leading-snug">{f.headline}</p>
          <p className={body}>{f.line}</p>
        </li>
      ))}
    </ul>
  );
}

// A named result: a title, what to read off it, the figure or table, and how it was made.
export function Figure({
  id,
  title,
  lede,
  note,
  children,
}: {
  id?: string;
  title: string;
  lede?: React.ReactNode;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className={anchor}>
      <h3 className="display text-2xl leading-snug">{title}</h3>
      {lede && <p className={`mt-2 ${measure} ${body}`}>{lede}</p>}
      <div className="mt-6">{children}</div>
      {note && <Note>{note}</Note>}
    </div>
  );
}

// Labelled rows instead of bullets: the label hangs in the margin, so a reader can scan the labels and read
// only the row they want.
export const Rows = ({ children }: { children: React.ReactNode }) => <dl className="divide-y divide-rule">{children}</dl>;

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-x-8 gap-y-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[11rem_minmax(0,1fr)]">
      <dt className="font-medium leading-7">{label}</dt>
      <dd className={`${measure} ${body}`}>{children}</dd>
    </div>
  );
}

// Detail that most readers skip. The button on the right is there so it reads as something that opens.
export function More({
  id,
  title,
  summary,
  open,
  model,
  children,
}: {
  id?: string;
  title: string;
  summary?: string;
  open?: boolean;
  // Lets a figure above open the table for the condition picked there.
  model?: string;
  children: React.ReactNode;
}) {
  return (
    <details id={id} open={open} data-model={model} className={`group min-w-0 rounded-2xl border border-rule ${anchor}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-2xl px-5 py-4 transition-colors hover:bg-bench focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="display block text-xl leading-snug">{title}</span>
          {summary && <span className="mt-1 block text-sm leading-6 text-ink-soft">{summary}</span>}
        </span>
        <span className="shrink-0 rounded-full border border-ink/25 px-4 py-1.5 text-sm font-medium">
          <span className="group-open:hidden">Show</span>
          <span className="hidden group-open:inline">Hide</span>
        </span>
      </summary>
      <div className="space-y-10 border-t border-rule px-5 py-6 sm:px-6">{children}</div>
    </details>
  );
}

// A plain table: a header row, then rows whose first cell names the row. `right` lists the columns of numbers.
export function Table({
  label,
  head,
  rows,
  min = "36rem",
  right = [],
}: {
  label: string;
  head: string[];
  rows: React.ReactNode[][];
  min?: string;
  right?: number[];
}) {
  const align = (i: number) => (right.includes(i) ? "text-right" : "text-left");
  return (
    <Scroll label={label}>
      <table className="w-full text-sm leading-6 tabular-nums" style={{ minWidth: min }}>
        <thead>
          <tr className="align-bottom">
            {head.map((h, i) => (
              <th key={i} scope="col" className={`${th.replace("text-left", "")} ${align(i)}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, k) => (
            <tr key={k} className="border-t border-rule align-top">
              {r.map((c, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="py-3 pr-4 text-left font-medium">
                    {c}
                  </th>
                ) : (
                  <td key={i} className={`py-3 pr-4 text-ink-soft ${align(i)}`}>
                    {c}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Scroll>
  );
}
