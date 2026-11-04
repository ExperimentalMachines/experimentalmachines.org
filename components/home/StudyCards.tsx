import Go from "@/components/home/Go";
import { cardLink } from "@/components/home/ui";
import type { Study, Viz } from "@/lib/studies";

// A post's cover: its finding over its own numbers. The colour names the project, so a run of covers
// reads as a body of work rather than one card repeated, and the accent marks the bar or cell the
// finding is about.
const palette: Record<Study["project"], { bg: string; accent: string; mark: string }> = {
  OpenWeights: { bg: "#052B42", accent: "#E0FF4F", mark: "rgba(255,255,255,0.2)" },
  GGUF: { bg: "#0e1638", accent: "#ffb59e", mark: "rgba(255,255,255,0.2)" },
  ASICs: { bg: "var(--color-blue)", accent: "#ffffff", mark: "rgba(255,255,255,0.28)" },
  Hardware: { bg: "#0a3b3f", accent: "#ffd166", mark: "rgba(255,255,255,0.22)" },
};

// Every chart fills the same box, so a 5 by 5 grid fits as a 3 by 3 does and no row is clipped.
function Chart({ viz, accent, mark, compact }: { viz: Viz; accent: string; mark: string; compact?: boolean }) {
  if (viz.kind === "grid") {
    return (
      <div className="grid h-full w-full gap-1" style={{ gridTemplateColumns: `repeat(${viz.cols}, minmax(0, 1fr))`, gridAutoRows: "1fr" }}>
        {viz.cells.map((c, i) => (
          <span
            key={i}
            className="rounded-[3px]"
            style={{ backgroundColor: c.on ? accent : `color-mix(in srgb, white ${Math.round(8 + 22 * c.level)}%, transparent)` }}
          />
        ))}
      </div>
    );
  }
  if (viz.kind === "bars" && compact) {
    const top = Math.max(...viz.rows.map((r) => r.value));
    return (
      <ul className="flex h-full w-full flex-col justify-end gap-2 text-xs">
        {viz.rows.map((r) => (
          <li key={r.label}>
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate text-white/75">{r.label}</span>
              <span className={`shrink-0 tabular-nums ${r.on ? "font-medium text-white" : "text-white/75"}`}>{r.shown}</span>
            </span>
            <span className="mt-1 block h-1.5 rounded-full" style={{ width: `${Math.max((r.value / top) * 100, 2)}%`, backgroundColor: r.on ? accent : mark }} />
          </li>
        ))}
      </ul>
    );
  }
  if (viz.kind === "bars") {
    const top = Math.max(...viz.rows.map((r) => r.value));
    return (
      <ul className="flex h-full w-full flex-col justify-end gap-1.5 text-xs">
        {viz.rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[6.5rem_1fr] items-center gap-2">
            <span className="truncate text-white/75">{r.label}</span>
            <span className="flex items-center gap-2">
              <span className="h-2 rounded-full" style={{ width: `${(r.value / top) * 62}%`, backgroundColor: r.on ? accent : mark }} />
              <span className={`shrink-0 tabular-nums ${r.on ? "font-medium text-white" : "text-white/75"}`}>{r.shown}</span>
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if (viz.kind === "chips") {
    return (
      <ul className="flex h-full w-full flex-wrap content-end gap-1.5 text-xs">
        {viz.items.map((item) => (
          <li key={item} className="rounded-full px-2.5 py-1 text-white" style={{ backgroundColor: mark }}>
            {item}
          </li>
        ))}
      </ul>
    );
  }
  const top = Math.max(...viz.groups.flat().map((c) => c.value));
  return (
    <div className="flex h-full w-full items-end gap-1.5">
      {viz.groups.map((g, i) => (
        <span key={i} className="flex h-full flex-1 items-end gap-px">
          {g.map((c, j) => (
            <span
              key={j}
              className="flex-1 rounded-t-[2px]"
              style={{ height: `${(c.value / top) * 100}%`, backgroundColor: c.on ? accent : mark }}
            />
          ))}
        </span>
      ))}
    </div>
  );
}

// The cover's text repeats nothing a screen reader needs twice: the hook is real text, the chart is decoration.
// A card in a row has a fixed height from sm up so the titles under the covers line up; alone in a column, on
// a phone or beside its text, a cover takes the height of what is in it, so nothing sits above an empty gap.
function Cover({ s, large, fit }: { s: Study; large?: boolean; fit?: boolean }) {
  const p = palette[s.project];
  const size = large ? "h-full min-h-72 gap-6 p-7 sm:p-9" : fit ? "h-full gap-4 p-5 sm:p-6" : `gap-5 p-5 sm:gap-6 sm:p-6 ${s.eyebrow ? "sm:h-[17rem]" : "sm:h-64"}`;
  return (
    <div className={`flex flex-col justify-between text-white transition-transform motion-safe:group-hover:scale-[1.01] ${size}`} style={{ backgroundColor: p.bg }}>
      <div>
        {s.eyebrow && <p className="mb-2 text-sm font-medium text-white/85">{s.eyebrow}</p>}
        <p className={`display font-medium leading-none tracking-[-0.03em] ${large ? "text-6xl sm:text-7xl" : s.eyebrow ? "text-4xl" : "text-4xl sm:text-5xl"}`}>{s.hook}</p>
        <p className={`mt-2 max-w-sm leading-snug text-white/85 ${large ? "text-base" : "text-sm"}`}>{s.hookLabel}</p>
      </div>
      <div aria-hidden className={large ? "h-28 max-w-md" : s.eyebrow ? "h-[3.75rem]" : "h-16"}>
        <Chart viz={s.viz} accent={p.accent} mark={p.mark} compact={!!s.eyebrow} />
      </div>
    </div>
  );
}

// The same picture at the top of the post it opens, so the page a reader lands on is the one they clicked.
export function Banner({ s }: { s: Study }) {
  const p = palette[s.project];
  return (
    <div className="grid items-end gap-8 rounded-[1.75rem] p-7 text-white sm:p-10 md:grid-cols-[1.15fr_1fr] md:gap-12" style={{ backgroundColor: p.bg }}>
      <div>
        {s.eyebrow && <p className="mb-4 text-base font-medium text-white/85">{s.eyebrow}</p>}
        <p className="display text-6xl font-medium leading-none tracking-[-0.03em] sm:text-7xl">{s.hook}</p>
        <p className="mt-3 max-w-md text-base leading-snug text-white/85 sm:text-lg">{s.hookLabel}</p>
      </div>
      <div aria-hidden className="h-24 sm:h-32">
        <Chart viz={s.viz} accent={p.accent} mark={p.mark} compact={!!s.eyebrow} />
      </div>
    </div>
  );
}

const Meta = ({ s }: { s: Study }) => (
  <p className="text-sm text-ink-soft">{s.meta ?? `${s.project}, ${s.date}`}</p>
);

// The whole card clicks: the title's link is stretched over it, so a screen reader hears only the title.
export function StudyCard({ s }: { s: Study }) {
  return (
    <li className="group relative flex flex-col overflow-hidden rounded-[1.25rem] border border-rule bg-white transition-colors hover:border-ink">
      <div className="overflow-hidden">
        <Cover s={s} />
      </div>
      <div className="p-5 sm:p-6">
        <Meta s={s} />
        <p className="display mt-2 text-xl leading-snug">
          <Go href={s.href} className={`${cardLink} underline-offset-4 after:rounded-[1.25rem]`}>
            {s.title}
          </Go>
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-soft">{s.line}</p>
        {s.speakers && <p className="mt-3 text-sm font-medium leading-6">{s.speakers.join(" and ")}</p>}
      </div>
    </li>
  );
}

// A talk has few words to set beside its cover, so the two share a row: a wide card stays short, and four of
// them fit in two rows instead of four thin columns.
function TalkCard({ s }: { s: Study }) {
  return (
    <li className="group relative grid overflow-hidden rounded-[1.25rem] border border-rule bg-white transition-colors hover:border-ink sm:grid-cols-2">
      <div className="overflow-hidden">
        <Cover s={s} fit />
      </div>
      <div className="flex flex-col p-5 sm:p-6">
        <Meta s={s} />
        <p className="display mt-2 text-xl leading-snug">
          <Go href={s.href} className={`${cardLink} underline-offset-4 after:rounded-[1.25rem]`}>
            {s.title}
          </Go>
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-soft">{s.line}</p>
        {s.speakers && <p className="mt-auto pt-3 text-sm font-medium leading-6">{s.speakers.join(" and ")}</p>}
      </div>
    </li>
  );
}

export function TalkGrid({ items }: { items: Study[] }) {
  return (
    <ul className="grid gap-5 xl:grid-cols-2">
      {items.map((s) => (
        <TalkCard key={s.href} s={s} />
      ))}
    </ul>
  );
}

export function StudyFeature({ s, label }: { s: Study; label?: string }) {
  return (
    <article className="group relative grid overflow-hidden rounded-[1.75rem] border border-rule bg-white transition-colors hover:border-ink lg:grid-cols-[1.1fr_1fr]">
      <div className="overflow-hidden">
        <Cover s={s} large />
      </div>
      <div className="flex flex-col justify-center p-7 sm:p-10">
        <p className="text-sm text-ink-soft">{label ?? `Newest: ${s.date}`}</p>
        <h3 className="display mt-3 text-3xl leading-tight tracking-[-0.02em] sm:text-4xl">
          <Go href={s.href} className={`${cardLink} decoration-2 underline-offset-[6px] after:rounded-[1.75rem]`}>
            {s.title}
          </Go>
        </h3>
        <p className="mt-4 max-w-xl leading-7 text-ink-soft">{s.line}</p>
        <span aria-hidden className="mt-6 inline-flex self-start rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white group-hover:bg-blue-deep">
          Read the study
        </span>
      </div>
    </article>
  );
}

export function StudyGrid({ items, children }: { items: Study[]; children?: React.ReactNode }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s) => (
        <StudyCard key={s.href} s={s} />
      ))}
      {children}
    </ul>
  );
}
