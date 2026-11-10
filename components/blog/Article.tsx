import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import { Byline, partLabel } from "@/components/blog/BlogCards";
import { seriesParts, type BlogPost } from "@/lib/blog";

// The parts a blog post is built from, for a reader who scans. Prose and findings sit in a 720 px column, figures in
// one of 880 px, and only the banner runs wider. A post is five or six findings, each a question answered by one big
// number, then a worked example, the formula, something to try and a one-line takeaway, with the fine print folded.

export const TEXT = "mx-auto max-w-[45rem]";
export const FIGURE = "mx-auto max-w-[55rem]";

export function ArticleHeader({ post }: { post: BlogPost }) {
  return (
    <header>
      <div className={TEXT}>
        <Go href="/blog/" className={`${link} text-sm`}>
          All posts
        </Go>
        <h1 className="display mt-8 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.03em] sm:text-5xl">{post.title}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Byline name={post.author} />
          <span className="text-sm text-ink-soft">{partLabel(post)}</span>
        </div>
      </div>
      {post.banner && (
        // A plain img: the site is a static export without the image optimiser.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.banner} alt="" width={2048} height={1024} className="mx-auto mt-10 block aspect-[2/1] w-full max-w-5xl rounded-[1.5rem] object-cover" />
      )}
      <p className={`${TEXT} mt-10 text-xl leading-8 text-ink-soft`}>{post.summary}</p>
    </header>
  );
}

export const Strong = ({ children }: { children: React.ReactNode }) => <strong className="font-medium text-ink">{children}</strong>;

export const P = ({ children }: { children: React.ReactNode }) => <p className={`${TEXT} text-lg leading-8 text-ink-soft`}>{children}</p>;

// At most three short bullets; each one claim.
export const Bullets = ({ items }: { items: React.ReactNode[] }) => (
  <ul className={`${TEXT} list-disc space-y-1.5 pl-6 text-lg leading-8 text-ink-soft marker:text-blue`}>
    {items.map((x, i) => (
      <li key={i}>{x}</li>
    ))}
  </ul>
);

// The fine print a scanning reader can skip: assumptions, caveats, longer explanations.
export function Details({ title = "Details and assumptions", children }: { title?: string; children: React.ReactNode }) {
  return (
    <details className={`${TEXT} group mt-6 rounded-2xl border border-rule bg-white`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 text-sm font-medium text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden className="text-lg leading-none transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="space-y-3 border-t border-rule px-5 py-4 text-base leading-7 text-ink-soft [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{children}</div>
    </details>
  );
}

export type FindingProps = {
  id: string;
  // The question, at most seven words, and its short label for the section rail.
  question: string;
  short: string;
  // The answer, as one big number or a short statement, and what it is.
  answer: React.ReactNode;
  label: React.ReactNode;
  // One line: the inputs and the result. Then the formula, set apart.
  example?: React.ReactNode;
  formula?: React.ReactNode;
  takeaway: React.ReactNode;
  children?: React.ReactNode;
  details?: React.ReactNode;
};

export function Finding({ id, question, answer, label, example, formula, takeaway, children, details }: FindingProps) {
  return (
    <section id={id} aria-labelledby={`${id}-q`} className="mt-28 scroll-mt-28 first:mt-16 lg:scroll-mt-20">
      <div className={TEXT}>
        <h2 id={`${id}-q`} className="display text-balance text-3xl font-normal leading-tight tracking-[-0.02em] sm:text-[2.1rem]">
          <a href={`#${id}`} className="hover:text-blue-deep">
            {question}
          </a>
        </h2>
        <p className="display mt-5 text-balance text-4xl font-medium leading-[1.1] tracking-[-0.02em] text-blue-deep tabular-nums sm:text-[2.6rem]">{answer}</p>
        <p className="mt-2 text-base leading-6 text-ink-soft">{label}</p>
        {(example || formula) && (
          <div className="mt-6 space-y-1.5 border-l-2 border-rule pl-4">
            {example && <p className="text-lg leading-7 tabular-nums">{example}</p>}
            {formula && (
              <p className="text-sm leading-6 text-ink-soft">
                <span className="mr-2">The formula</span>
                <span className="font-medium text-ink tabular-nums">{formula}</span>
              </p>
            )}
          </div>
        )}
      </div>
      {children && <div className={`${FIGURE} mt-8`}>{children}</div>}
      <p className={`${TEXT} mt-7 flex gap-3 text-lg font-medium leading-7`}>
        <span aria-hidden className="mt-1.5 h-4 w-1 shrink-0 rounded-full bg-blue" />
        <span>{takeaway}</span>
      </p>
      {details && <Details>{details}</Details>}
    </section>
  );
}

// The post's findings as a list at the top: each question with its answer, linked to its section.
export function InThisPost({ items }: { items: { id: string; question: string; answer: React.ReactNode }[] }) {
  return (
    <nav aria-label="In this post" className={`${TEXT} mt-12`}>
      <p className="text-sm text-ink-soft">In this post</p>
      <ol className="mt-3 divide-y divide-rule border-y border-rule">
        {items.map((f) => (
          <li key={f.id}>
            <a href={`#${f.id}`} className="group block py-3">
              <span className="block text-base font-medium group-hover:text-blue-deep">{f.question}</span>
              <span className="mt-0.5 block text-sm text-ink-soft tabular-nums">{f.answer}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Sources({ items }: { items: { label: string; href: string; note: string }[] }) {
  return (
    <ol className={`${TEXT} list-decimal space-y-2 pl-6 text-base leading-7 text-ink-soft`}>
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

// A closing section: the caveats or the sources, under a plain heading.
export function Closing({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-28 scroll-mt-28 lg:scroll-mt-20">
      <h2 className={`${TEXT} display text-2xl font-normal tracking-[-0.02em]`}>{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

// The parts of a series, each linked except the one being read, with the next part called out at the end.
export function SeriesNav({ post, end }: { post: BlogPost; end?: boolean }) {
  if (!post.part) return null;
  const parts = seriesParts(post.part.series);
  const next = parts.find((p) => p.part!.n === post.part!.n + 1);
  return (
    <nav aria-label="The parts of this series" className={`${TEXT} rounded-2xl border border-rule bg-white px-5 py-4 ${end ? "mt-24" : "mt-10"}`}>
      {end && next ? (
        <p className="text-lg leading-8">
          Next, part {next.part!.n}:{" "}
          <Go href={`/blog/${next.slug}/`} className={link}>
            {next.title}
          </Go>
        </p>
      ) : (
        <p className="text-sm text-ink-soft">
          Part {post.part.n} of {post.part.of}
        </p>
      )}
      <ol className={`${end && next ? "mt-3" : "mt-2"} space-y-1 text-base leading-7`}>
        {parts.map((p) => (
          <li key={p.slug} className="flex gap-3">
            <span className="w-12 shrink-0 text-ink-soft tabular-nums">Part {p.part!.n}</span>
            {p.slug === post.slug ? (
              <span className="font-medium">{p.title}</span>
            ) : (
              <Go href={`/blog/${p.slug}/`} className={link}>
                {p.title}
              </Go>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
