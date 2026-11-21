// Figures for the KV-cache post. Each comparison is one row: a hollow dot for the 32-bit cache, an arrow to a solid
// dot for the smaller cache, and the change itself, large, at the right, so the answer is read before the chart is.
// The legend names the two dots once, so the rows carry no repeated labels. Plain HTML, so type stays readable at
// phone width; the numbers behind each dot sit under the change in small type.

import { ChartCard } from "@/components/research/Compare";

const from = "#868e96";
const to = "#2b44e6";
const worse = "#c2410c";

// The change is set on a tint of what it means: blue where the smaller cache helps, orange where it hurts, grey where it
// barely moves. The tint carries the reading at a glance; the sign and the word carry it without colour.
const tones = {
  good: { fg: "#1c2ea8", bg: "color-mix(in srgb, #2b44e6 12%, white)" },
  bad: { fg: "#9a3412", bg: "color-mix(in srgb, #c2410c 13%, white)" },
  neutral: { fg: "var(--color-ink-soft)", bg: "white" },
  // A fact to notice that is neither better nor worse: a highlighter.
  mark: { fg: "var(--color-ink)", bg: "#fff1b8" },
} as const;

function Change({ text, tone, small }: { text: string; tone: keyof typeof tones; small?: boolean }) {
  const t = tones[tone];
  return (
    <span
      className={`display inline-block whitespace-nowrap rounded-md px-1.5 py-0.5 leading-none tabular-nums ${small ? "text-lg" : "text-xl"}`}
      style={{ color: t.fg, backgroundColor: t.bg }}
    >
      {text}
    </span>
  );
}

export type ShiftRow = {
  label: string;
  detail?: string;
  a: number;
  b: number;
  // The change, as the reader should take it away: "1.21×", "−0.7 GB", "+3 answers".
  change: string;
  // The two values in words, under the change: "47 → 57 tok/s".
  values: string;
  // How to read the change: an improvement (the default), a regression, or a change too small to matter.
  tone?: "good" | "bad" | "neutral" | "mark";
};

export function Shift({
  a,
  b,
  rows,
  max,
  ticks,
  unit,
}: {
  a: string;
  b: string;
  rows: ShiftRow[];
  max: number;
  ticks: number[];
  unit: string;
}) {
  const at = (v: number) => `${(v / max) * 100}%`;
  const grid = "md:grid-cols-[11.5rem_minmax(0,1fr)_7.5rem]";
  return (
    <ChartCard>
      <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-full border-2 bg-white" style={{ borderColor: from }} />
          {a}
        </span>
        <span aria-hidden className="text-ink-soft">
          →
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-full" style={{ backgroundColor: to }} />
          {b}
        </span>
      </p>
      <div className={`mt-3 hidden gap-x-5 md:grid ${grid}`}>
        <span />
        <div className="relative h-4 text-xs text-ink-soft">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2 whitespace-nowrap tabular-nums" style={{ left: at(t) }}>
              {t}
              {t === ticks.at(-1) ? ` ${unit}` : ""}
            </span>
          ))}
        </div>
        <span />
      </div>
      <ul className="mt-1 divide-y divide-rule">
        {rows.map((r) => {
          const tone = r.tone ?? "good";
          const color = tone === "bad" ? worse : to;
          const lo = Math.min(r.a, r.b);
          const hi = Math.max(r.a, r.b);
          const up = r.b >= r.a;
          return (
            <li key={r.label} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-2.5 md:gap-x-5 ${grid}`}>
              {/* On a phone the label takes its own line; the arrow and the change share the next one, as on desktop. */}
              <div className="col-span-2 md:col-span-1">
                <p className="text-sm leading-5">{r.label}</p>
                {r.detail && <p className="text-xs leading-5 text-ink-soft">{r.detail}</p>}
              </div>
              <div className="relative h-5" aria-hidden>
                {ticks.map((t) => (
                  <span key={t} className="absolute inset-y-0 w-px bg-rule" style={{ left: at(t) }} />
                ))}
                <span className="absolute top-1/2 h-0.5 -translate-y-1/2" style={{ left: at(lo), width: `${((hi - lo) / max) * 100}%`, backgroundColor: color }} />
                {/* The arrowhead points from the 32-bit value to the other. */}
                {hi - lo > max * 0.015 && (
                  <span
                    className="absolute top-1/2 h-0 w-0 -translate-y-1/2 border-y-[5px] border-y-transparent"
                    style={
                      up
                        ? { left: `calc(${at(r.b)} - 13px)`, borderLeft: `7px solid ${color}` }
                        : { left: `calc(${at(r.b)} + 6px)`, borderRight: `7px solid ${color}` }
                    }
                  />
                )}
                <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white" style={{ left: at(r.a), borderColor: from }} />
                <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: at(r.b), backgroundColor: color }} />
              </div>
              <div className="min-w-[6.5rem] text-right md:min-w-0 md:text-left">
                <Change text={r.change} tone={tone} />
                <p className="mt-1 whitespace-nowrap text-sm tabular-nums text-ink-soft md:pl-1.5">{r.values}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}

export type Verdict = { kind: "closer" | "further" | "none"; value: number };

// Rows of models, columns of depths, each cell saying in words whether the 8-bit cache moved the model's predictions
// closer to the original's, further, or not clearly either way. The number under the word is the change.
export function VerdictGrid({ columns, rows }: { columns: string[]; rows: { label: string; cells: Verdict[] }[] }) {
  const style = {
    closer: { bg: "color-mix(in srgb, #2b44e6 12%, white)", fg: "#1c2ea8", word: "Closer" },
    further: { bg: "color-mix(in srgb, #c2410c 12%, white)", fg: "#9a3412", word: "Further" },
    none: { bg: "white", fg: "var(--color-ink-soft)", word: "No clear change" },
  } as const;
  const signed = (v: number) => (v > 0 ? `+${v.toFixed(1)}%` : `−${(-v).toFixed(1)}%`);
  // On a phone each model is a heading over its three cells, each cell naming its column; from sm up, one table.
  const grid = "grid grid-cols-3 gap-2 sm:grid-cols-[9rem_repeat(3,minmax(0,1fr))]";
  return (
    <ChartCard>
      <div className={`hidden text-xs text-ink-soft sm:grid ${grid}`}>
        <span />
        {columns.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <div className="mt-0 space-y-4 sm:mt-2 sm:space-y-2">
        {rows.map((r) => (
          <div key={r.label} className={grid}>
            <p className="col-span-3 self-center text-sm font-medium leading-5 sm:col-span-1 sm:font-normal">{r.label}</p>
            {r.cells.map((c, i) => {
              const s = style[c.kind];
              return (
                <div key={i} className="min-w-0 rounded-lg border border-rule px-2.5 py-2 sm:px-3" style={{ backgroundColor: s.bg }}>
                  <p className="text-[11px] leading-4 text-ink-soft sm:hidden">{columns[i].replace(" tokens in", "")}</p>
                  <p className="text-[13px] font-medium leading-5 sm:text-sm" style={{ color: s.fg }}>
                    {s.word}
                  </p>
                  <p className="text-xs tabular-nums text-ink-soft">{signed(c.value)}</p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// A small change in a count, one card per row, when a scale would be mostly empty: the change, highlighted, over the
// two counts it comes from.
export function Tally({ caption, items }: { caption: string; items: (Omit<ShiftRow, "a" | "b">)[] }) {
  return (
    <ChartCard>
      <p className="text-sm text-ink-soft">{caption}</p>
      <ul className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {items.map((r) => (
          <li key={r.label} className="rounded-xl border border-rule bg-white px-4 py-3">
            <p className="text-sm font-medium leading-5">{r.label}</p>
            {r.detail && <p className="text-xs leading-5 text-ink-soft">{r.detail}</p>}
            <p className="mt-2">
              <Change text={r.change} tone={r.tone ?? "good"} />
            </p>
            <p className="mt-1 pl-1.5 text-xs tabular-nums text-ink-soft">{r.values}</p>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}


export type BarRow = { label: string; value: number; shown: string; detail?: string; tone?: keyof typeof tones };

// Small multiples: one panel per group (a model), one bar per row (a point in the text), the value highlighted at the
// bar's end and what it comes from under it. Panels sit two across from md up and stack on a phone, so no panel is
// squeezed into a table column. All bars share one scale up to `max`; a value past it fills the bar and is broken at
// its end.
export function Bars({ caption, groups, max }: { caption?: string; groups: { label: string; detail?: string; rows: BarRow[] }[]; max: number }) {
  const fill = { good: to, bad: worse, neutral: from, mark: "#3d4460" } as const;
  return (
    <ChartCard>
      {caption && <p className="mb-4 text-sm text-ink-soft">{caption}</p>}
      <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g.label} className="min-w-0">
            <p className="text-sm font-medium leading-5">
              {g.label}
              {g.detail && <span className="font-normal text-ink-soft"> {g.detail}</span>}
            </p>
            <ul className="mt-2 space-y-2.5">
              {g.rows.map((r) => {
                const tone = r.tone ?? "good";
                const over = r.value > max;
                return (
                  <li key={r.label} className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-x-3">
                    <span className="text-xs leading-5 text-ink-soft">{r.label}</span>
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="relative h-2.5 shrink-0 rounded-full"
                        style={{ width: `calc((100% - 5.5rem) * ${Math.min(r.value, max) / max})`, minWidth: "3px", backgroundColor: fill[tone] }}
                        aria-hidden
                      >
                        {over && <span className="absolute inset-y-[-3px] right-3 w-2 -skew-x-[25deg] border-x-2 border-bench" style={{ backgroundColor: fill[tone] }} />}
                      </span>
                      <Change text={r.shown} tone={tone} small />
                    </div>
                    {r.detail && <p className="col-start-2 -mt-1 text-xs tabular-nums text-ink-soft">{r.detail}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// Which files load: per file, a bar for a size that may explain it and a badge saying what happened.
export function LoadRows({ rows, max, unit }: { rows: { label: string; detail: string; value: number; shown: string; loads: boolean; note?: string }[]; max: number; unit: string }) {
  return (
    <ChartCard>
      <ul className="divide-y divide-rule">
        {rows.map((r) => (
          <li key={`${r.label} ${r.detail}`} className="grid gap-x-5 gap-y-1.5 py-3 first:pt-0 last:pb-0 md:grid-cols-[15rem_minmax(0,1fr)_6.5rem] md:items-center">
            <div className="flex items-start justify-between gap-3 md:block">
              <div>
                <p className="text-sm leading-5">{r.label}</p>
                <p className="text-xs leading-5 text-ink-soft">{r.detail}</p>
              </div>
              <span className="md:hidden">
                <Change text={r.loads ? "Loads" : "Aborts"} tone={r.loads ? "good" : "bad"} small />
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 shrink-0 rounded-full"
                style={{ width: `calc((100% - 4.5rem) * ${r.value / max})`, minWidth: "3px", backgroundColor: r.loads ? to : worse }}
                aria-hidden
              />
              <span className="whitespace-nowrap text-xs tabular-nums">
                {r.shown} {unit}
              </span>
            </div>
            <span className="hidden md:block">
              <Change text={r.loads ? "Loads" : "Aborts"} tone={r.loads ? "good" : "bad"} small />
            </span>
            {r.note && <p className="text-xs leading-5 text-ink-soft md:col-span-3 md:col-start-2 md:-mt-1">{r.note}</p>}
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
