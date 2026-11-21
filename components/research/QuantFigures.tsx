// Figures for the 4-bit rounding post: simple bars, one panel per model with the file a figure is about in blue; tiles
// for numbers that did not move; and the explainer's drawings of what each method does to a weight. The visual
// language (colours, pills, chart card) is the KV-cache post's (KvFigures.tsx).

import { ChartCard } from "@/components/research/Compare";
import { from, to, worse } from "@/components/research/KvFigures";

// ---------------------------------------------------------------------------------------------------------------
// Simple figures. One panel per model; one bar per file, its value at the bar's end; the file the figure is about
// in blue, the rest grey ("emphasis": highlight one, grey the rest). No intervals or second lines: those live in
// the tables under Every number.

const grey = "#c3c8d0";

// flag: an orange tag after the value, for a count the bar does not show (the tool-call figure's added calls).
export type MBRow = { label: string; value: number; shown: string; on?: boolean; pill?: string; flag?: string };
export type MBGroup = { label: string; rows: MBRow[]; max?: number; reference?: { value: number; label: string } };

// reserve: room kept after each bar for its value (and flag), so the longest bar's text stays inside its panel.
export function ModelBars({ groups, max, cap, legend, reserve = 3.75 }: { groups: MBGroup[]; max?: number; cap?: number; legend?: string; reserve?: number }) {
  return (
    <ChartCard>
      {legend && <p className="mb-4 text-sm text-ink-soft">{legend}</p>}
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => {
          const top = g.max ?? max ?? Math.max(...g.rows.map((r) => r.value), g.reference?.value ?? 0);
          const scale = cap ? Math.min(top, cap) : top;
          // Where a value sits on the bar track: after the 6.25rem label column, across the track less the reserve.
          const at = (v: number) => `calc(6.25rem + (100% - ${6.25 + reserve}rem) * ${Math.min(v, scale) / scale})`;
          return (
            <div key={g.label} className="min-w-0">
              <p className="text-sm font-medium leading-5">{g.label}</p>
              <div className="relative mt-3">
                {g.reference && (
                  <>
                    <span className="absolute -top-3 bottom-0 w-0 border-l border-dashed border-ink-soft" style={{ left: at(g.reference.value) }} aria-hidden />
                    <span className="absolute -top-7 -translate-x-1/2 whitespace-nowrap text-[11px] leading-4 text-ink-soft" style={{ left: at(g.reference.value) }}>
                      {g.reference.label}
                    </span>
                  </>
                )}
                <ul className={`space-y-2 ${g.reference ? "pt-2" : ""}`}>
                  {g.rows.map((r) => {
                    const over = r.value > scale;
                    return (
                      <li key={r.label} className="grid grid-cols-[5.75rem_minmax(0,1fr)] items-center gap-x-2">
                        <span className={`text-xs leading-5 ${r.on ? "font-semibold text-ink" : "text-ink-soft"}`}>{r.label}</span>
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="relative h-3.5 shrink-0 rounded-r-[4px]"
                            style={{ width: `calc((100% - ${reserve}rem) * ${Math.min(r.value, scale) / scale})`, minWidth: "3px", backgroundColor: r.on ? to : grey }}
                            aria-hidden
                          >
                            {over && <span className="absolute inset-y-[-3px] right-2 w-1.5 -skew-x-[25deg] border-x-2 border-bench" style={{ backgroundColor: r.on ? to : grey }} />}
                          </span>
                          {/* On the card's own background, so a reference line passes behind the figure, not through it. */}
                          <span className={`relative z-10 whitespace-nowrap rounded-sm bg-bench px-0.5 text-xs tabular-nums ${r.on ? "font-semibold text-ink" : "text-ink-soft"}`}>{r.shown}</span>
                          {r.flag && (
                            <span className="whitespace-nowrap rounded px-1 text-[11px] font-medium leading-4 tabular-nums" style={{ color: "#9a3412", backgroundColor: "color-mix(in srgb, #c2410c 13%, white)" }}>
                              {r.flag}
                            </span>
                          )}
                        </div>
                        {r.pill && (
                          <span className="col-start-2 mt-1 w-fit rounded-md px-1.5 py-0.5 text-xs font-medium leading-4" style={{ color: "#1c2ea8", backgroundColor: "color-mix(in srgb, #2b44e6 12%, white)" }}>
                            {r.pill}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// The explainer: each method as a short story with a picture, on numbers small enough to check in one's head.
// A layer multiplies its inputs by its weights and adds the results up; rounding the weights moves that answer.
// Here a weight may only be a whole number. GPTQ is shown as carrying each rounding error into the next weight, and
// AWQ as moving a factor from the input to the weight (input × weight drawn as the area of a box).

const blueTint = "color-mix(in srgb, #2b44e6 12%, white)";
const orangeTint = "color-mix(in srgb, #c2410c 13%, white)";

// RTN and GPTQ as the same chain of three weights, rounded left to right (top to bottom on a phone). Each weight
// shows its own rounding and, under it, the rounded total so far against the real total so far. The links between
// weights say what is carried forward: nothing for RTN, the gap for GPTQ. RTN's gap grows to 1.2; GPTQ's stays small.
type SlotSpec = { pre?: string; value: string; rounded: number; real: number };

function Slot({ nth, s }: { nth: string; s: SlotSpec }) {
  const gap = Math.round((s.rounded - s.real) * 10) / 10;
  return (
    <li className="flex min-w-0 flex-1 flex-col items-center rounded-lg border border-rule px-3 py-3 text-center">
      <span className="text-[11px] leading-4 text-ink-soft">{nth} weight</span>
      <span className="mt-1 text-[11px] leading-4 tabular-nums text-ink-soft">{s.pre ?? " "}</span>
      <span className="text-lg leading-7 tabular-nums">{s.value}</span>
      <span className="mt-2 w-full border-t border-rule pt-2 text-[11px] leading-4 tabular-nums text-ink-soft">
        rounded so far {s.rounded}, real {s.real}
      </span>
      <span className="mt-1 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums" style={gap < 0 ? { color: "#9a3412", backgroundColor: orangeTint } : { color: "#1c2ea8", backgroundColor: blueTint }}>
        {gap === 0 ? "on track" : gap < 0 ? `${-gap} behind` : `${gap} ahead`}
      </span>
    </li>
  );
}

function Link({ label, carried }: { label: string; carried: boolean }) {
  return (
    <li className="flex shrink-0 items-center justify-center gap-1.5 text-center md:w-[5.5rem] md:flex-col md:gap-0.5" aria-hidden={!carried}>
      <span className="text-[11px] font-medium leading-4 tabular-nums" style={{ color: carried ? worse : "var(--color-ink-soft)" }}>
        {label}
      </span>
      <span className="text-lg leading-6 text-ink-soft">
        <span className="md:hidden">↓</span>
        <span className="hidden md:inline">→</span>
      </span>
    </li>
  );
}

function Chain({ slots, links }: { slots: SlotSpec[]; links: { label: string; carried: boolean }[] }) {
  const nth = ["1st", "2nd", "3rd"];
  return (
    <ol className="flex flex-col gap-2 md:flex-row md:items-stretch md:gap-0">
      {slots.flatMap((s, k) => [
        <Slot key={`s${k}`} nth={nth[k]} s={s} />,
        ...(k < links.length ? [<Link key={`l${k}`} {...links[k]} />] : []),
      ])}
    </ol>
  );
}

function RtnStory() {
  return (
    <Chain
      slots={[
        { value: "0.4 → 0", rounded: 0, real: 0.4 },
        { value: "0.4 → 0", rounded: 0, real: 0.8 },
        { value: "0.4 → 0", rounded: 0, real: 1.2 },
      ]}
      links={[
        { label: "nothing carried", carried: false },
        { label: "nothing carried", carried: false },
      ]}
    />
  );
}

function GptqStory() {
  return (
    <Chain
      slots={[
        { value: "0.4 → 0", rounded: 0, real: 0.4 },
        { pre: "0.4 + 0.4 = 0.8", value: "0.8 → 1", rounded: 1, real: 0.8 },
        { pre: "0.4 − 0.2 = 0.2", value: "0.2 → 0", rounded: 1, real: 1.2 },
      ]}
      links={[
        { label: "+0.4 carried", carried: true },
        { label: "−0.2 carried", carried: true },
      ]}
    />
  );
}

// input × weight drawn as a box's area: width is the input (8px a unit), height the weight (28px a unit). When the
// weight is rounded, the strip between the real and the rounded height is the error: orange where area is lost,
// blue where it is added.
function Box({ input, weight, rounded }: { input: number; weight: number; rounded?: number }) {
  const base = 96;
  const w = input * 8;
  const h = (v: number) => v * 28;
  const x = (90 - w) / 2;
  const r = rounded ?? weight;
  const lo = Math.min(weight, r);
  const hi = Math.max(weight, r);
  return (
    <svg viewBox="0 0 90 100" className="h-[6.25rem] w-auto" aria-hidden>
      <rect x={x} y={base - h(lo)} width={w} height={h(lo)} fill="#e6e9ee" />
      {hi > lo && (
        <rect x={x} y={base - h(hi)} width={w} height={h(hi) - h(lo)} fill={r < weight ? orangeTint : blueTint} stroke={r < weight ? worse : to} strokeDasharray={r < weight ? "3 2" : undefined} />
      )}
      <rect x={x} y={base - h(weight)} width={w} height={h(weight)} fill="none" stroke="#868e96" strokeWidth="1.25" />
    </svg>
  );
}

// One state in a chain: a picture, the arithmetic, and how it compares with the right answer.
function State({ art, sum, tag }: { art: React.ReactNode; sum: string; tag?: { text: string; tone: "lost" | "kept" | "same" } }) {
  const tones = { lost: { color: "#9a3412", backgroundColor: orangeTint }, kept: { color: "#1c2ea8", backgroundColor: blueTint }, same: { color: "var(--color-ink-soft)", backgroundColor: "#eef0f3" } };
  return (
    <div className="flex min-w-0 flex-col items-center justify-end rounded-lg border border-rule px-3 py-3 text-center">
      {art}
      <span className="mt-1 text-sm tabular-nums">{sum}</span>
      <span className="mt-1 min-h-[1.375rem]">
        {tag && (
          <span className="rounded px-1.5 py-0.5 text-xs font-medium tabular-nums" style={tones[tag.tone]}>
            {tag.text}
          </span>
        )}
      </span>
    </div>
  );
}

function Arrow({ label, tone = "plain" }: { label: string; tone?: "plain" | "awq" }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1 text-center md:h-full md:flex-col md:gap-0.5 md:py-0">
      <span className="text-[11px] font-medium leading-4" style={{ color: tone === "awq" ? "#1c2ea8" : "var(--color-ink-soft)" }}>
        {label}
      </span>
      <span className="text-lg leading-6 text-ink-soft" aria-hidden>
        <span className="md:hidden">↓</span>
        <span className="hidden md:inline">→</span>
      </span>
    </div>
  );
}

function AwqStory() {
  const start = <State art={<Box input={10} weight={1.4} />} sum="10 × 1.4 = 14" tag={{ text: "the right answer", tone: "same" }} />;
  const grid = "grid gap-1 md:grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,1fr)_6.5rem_minmax(0,1fr)] md:items-stretch";
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-soft">Rounded as it is</p>
        <div className={grid}>
          {start}
          <div className="md:col-span-3 md:h-full">
            <Arrow label="round the weight: 1.4 → 1" />
          </div>
          <State art={<Box input={10} weight={1.4} rounded={1} />} sum="10 × 1 = 10" tag={{ text: "4 short", tone: "lost" }} />
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium" style={{ color: "#1c2ea8" }}>
          With AWQ
        </p>
        <div className={grid}>
          {start}
          <Arrow label="input ÷2, weight ×2" tone="awq" />
          <State art={<Box input={5} weight={2.8} />} sum="5 × 2.8 = 14" tag={{ text: "still 14", tone: "same" }} />
          <Arrow label="round: 2.8 → 3" />
          <State art={<Box input={5} weight={2.8} rounded={3} />} sum="5 × 3 = 15" tag={{ text: "1 over", tone: "kept" }} />
        </div>
      </div>
    </div>
  );
}

function BothStory() {
  return (
    <div className="grid gap-1 md:grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,1fr)] md:items-stretch">
      <div className="flex flex-col items-center rounded-lg border border-rule px-3 py-3 text-center">
        <span className="text-sm font-medium">1. AWQ reshapes</span>
        <span className="mt-2 flex items-end gap-2">
          <Box input={10} weight={1.4} />
          <span className="pb-8 text-ink-soft" aria-hidden>
            →
          </span>
          <Box input={5} weight={2.8} />
        </span>
        <span className="mt-1 text-xs leading-4 text-ink-soft">so the weights that meet big inputs cost less to round</span>
      </div>
      <Arrow label="then" />
      <div className="flex flex-col items-center rounded-lg border border-rule px-3 py-3 text-center">
        <span className="text-sm font-medium">2. GPTQ rounds</span>
        <span className="mt-2 flex h-[6.25rem] items-center gap-1 text-xs tabular-nums" aria-hidden>
          {["0", "1", "0"].map((v, k) => (
            <span key={k} className="flex items-center gap-1">
              {k > 0 && (
                <span className="text-[10px]" style={{ color: worse }}>
                  {k === 1 ? "+0.4→" : "−0.2→"}
                </span>
              )}
              <span className="flex h-8 w-8 items-center justify-center rounded border bg-white" style={{ borderColor: to, color: "#1c2ea8" }}>
                {v}
              </span>
            </span>
          ))}
        </span>
        <span className="mt-1 text-xs leading-4 text-ink-soft">one weight at a time, carrying each error to the next</span>
      </div>
    </div>
  );
}

export function MethodCards() {
  const cards = [
    { name: "RTN: round each weight on its own", art: <RtnStory />, line: "Each 0.4 is nearer 0 than 1, so every weight rounds down and the gap grows: the total ends 1.2 short." },
    { name: "GPTQ: carry each error into the next weight", art: <GptqStory />, line: "Each weight makes up the gap the ones before it left, so the total ends only 0.2 short." },
    { name: "AWQ: give the weights that matter more room", art: <AwqStory />, line: "A weight's rounding error gets multiplied by its input, so a weight that meets a big input matters most. AWQ moves part of that input into the weight (the layer before absorbs the ÷2), so rounding it costs less." },
    { name: "AWQ + GPTQ: both", art: <BothStory />, line: "Both fixes in turn: AWQ protects the weights that matter most, then GPTQ keeps the totals on track." },
  ];
  return (
    <ChartCard>
      <ul className="grid gap-3">
        {cards.map((c) => (
          <li key={c.name} className="rounded-xl border border-rule bg-white px-4 py-4 sm:px-5">
            <p className="text-base font-medium leading-6">{c.name}</p>
            <div className="mt-3">{c.art}</div>
            <p className="mt-3 text-sm leading-5 text-ink-soft">{c.line}</p>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

// What "closer to the original" means: at one position, both models' chances for the next word, side by side.
export function Closeness() {
  const words = [
    { w: "the", a: 0.46, b: 0.37 },
    { w: "a", a: 0.27, b: 0.34 },
    { w: "his", a: 0.17, b: 0.18 },
    { w: "her", a: 0.1, b: 0.11 },
  ];
  return (
    <ChartCard>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
        <div>
          <p className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: from }} /> Original model
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: to }} /> 4-bit file
            </span>
          </p>
          <p className="mt-3 text-sm">&ldquo;She opened &hellip;&rdquo; what comes next?</p>
          <ul className="mt-2 space-y-2">
            {words.map((x) => (
              <li key={x.w} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-2">
                <span className="text-sm">{x.w}</span>
                <div className="space-y-0.5">
                  {[
                    [x.a, from],
                    [x.b, to],
                  ].map(([v, c]) => (
                    <div key={c as string} className="flex items-center gap-2">
                      <span className="h-2.5 rounded-r-[3px]" style={{ width: `calc((100% - 2.5rem) * ${(v as number) / 0.5})`, backgroundColor: c as string }} />
                      <span className="text-[11px] tabular-nums text-ink-soft">{Math.round((v as number) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3 text-sm leading-6">
          <p>At every word of a text, both models give their chances for the next word.</p>
          <p>
            <span className="font-medium">Divergence</span> is how different those chances are: 0 when they match. A file with lower divergence stays{" "}
            <span className="font-medium">closer to the original</span>.
          </p>
          <p className="text-ink-soft">We average it over 768 positions in three books.</p>
        </div>
      </div>
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// What the files were measured on, and how words were chosen: four cards of big numbers and short labels, with the
// fuller description left to the method section.
function DataCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col rounded-xl border border-rule bg-white px-4 py-4">
      <p className="text-base font-medium leading-6">{title}</p>
      <div className="mt-2 space-y-3">{children}</div>
    </li>
  );
}

// A number large, what it counts under it.
function Facts({ items }: { items: { n: string; what: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map((f) => (
        <div key={f.what}>
          <p className="display text-2xl tabular-nums leading-7">{f.n}</p>
          <p className="text-xs leading-4 text-ink-soft">{f.what}</p>
        </div>
      ))}
    </div>
  );
}

const Tag = ({ children }: { children: React.ReactNode }) => <span className="rounded bg-[#eef0f3] px-1.5 py-0.5 text-xs text-ink-soft">{children}</span>;

export function DataCards({
  books,
  positions,
  needles,
  questions,
  examples,
  replies,
  calibration,
}: {
  books: { title: string; year: string }[];
  positions: number;
  needles: number;
  questions: number;
  examples: string[];
  replies: number;
  calibration: number;
}) {
  return (
    <ChartCard>
      <ul className="grid gap-3 md:grid-cols-3">
        <DataCard title="Three old books">
          <ul className="space-y-0.5 text-sm leading-5">
            {books.map((b) => (
              <li key={b.title}>
                <i>{b.title}</i> <span className="text-xs text-ink-soft">{b.year}</span>
              </li>
            ))}
          </ul>
          <Facts
            items={[
              { n: "7,900", what: "tokens read of each" },
              { n: String(positions), what: "next words predicted, at two depths" },
              { n: String(needles), what: "hidden facts to recall" },
            ]}
          />
        </DataCard>
        <DataCard title="The app's own questions">
          <ul className="space-y-0.5 text-sm leading-5">
            {examples.map((q) => (
              <li key={q}>&ldquo;{q}&rdquo;</li>
            ))}
          </ul>
          <Facts
            items={[
              { n: String(questions), what: "questions, with the app's prompt and search tool" },
              { n: String(replies), what: "full replies to compare" },
            ]}
          />
        </DataCard>
        <DataCard title="What GPTQ and AWQ learned from">
          <Facts items={[{ n: String(calibration), what: "short prompts, none from the tests" }]} />
          <div className="flex flex-wrap gap-1.5">
            <Tag>in each model&apos;s chat format</Tag>
            <Tag>half with the app&apos;s prompt</Tag>
            <Tag>the original&apos;s own replies</Tag>
          </div>
        </DataCard>
      </ul>
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Teacher forcing against free writing: the same three steps run both ways. The file guesses "dog" where the text
// says "cat". Teacher-forced, the real word goes in next anyway, so the miss stays one miss; writing freely, its own
// guess goes back in and the rest drifts.
type Turn = { input: string; inputNote?: string; guess: string; ok?: boolean };

function Steps({ turns, carry }: { turns: Turn[]; carry: "real" | "own" }) {
  return (
    <ol className="flex flex-col gap-1 sm:flex-row sm:items-stretch sm:gap-0">
      {/* On a phone each step is one line, under one caption; from sm up, a column per step with its own. */}
      <li className="pl-2 text-[10px] leading-3 text-ink-soft sm:hidden">goes in → the file guesses</li>
      {turns.flatMap((t, k) => [
        <li key={`t${k}`} className="flex min-w-0 flex-1 flex-row items-center gap-2 rounded-lg border border-rule bg-white px-2 py-1.5 sm:flex-col sm:gap-1 sm:py-2 sm:text-center">
          <span className="hidden text-[10px] leading-3 text-ink-soft sm:inline">goes in</span>
          <span className="rounded border border-rule px-1.5 py-0.5 text-sm" style={t.inputNote === "real" ? { backgroundColor: "#eef0f3" } : t.inputNote === "own" ? { borderColor: worse, color: "#9a3412" } : undefined}>
            {t.input}
          </span>
          <span className="text-ink-soft" aria-hidden>
            <span className="sm:hidden">→</span>
            <span className="hidden sm:inline">↓</span>
          </span>
          <span className="hidden text-[10px] leading-3 text-ink-soft sm:inline">the file guesses</span>
          <span
            className="rounded px-1.5 py-0.5 text-sm"
            style={t.ok === false ? { backgroundColor: orangeTint, color: "#9a3412" } : t.ok ? { backgroundColor: blueTint, color: "#1c2ea8" } : { boxShadow: `inset 0 0 0 1px ${worse}`, color: "#9a3412" }}
          >
            {t.guess}
            {t.ok === true ? " ✓" : t.ok === false ? " ✗" : ""}
          </span>
        </li>,
        ...(k < turns.length - 1
          ? [
              <li key={`a${k}`} className="flex items-center gap-1 pl-2 text-[10px] leading-3 sm:w-[4.5rem] sm:flex-col sm:justify-center sm:gap-0 sm:pl-0 sm:text-center" style={{ color: carry === "own" ? "#9a3412" : "var(--color-ink-soft)" }}>
                <span>{carry === "own" ? "its guess goes in" : "the real word goes in"}</span>
                <span className="text-base text-ink-soft" aria-hidden>
                  <span className="sm:hidden"> ↓</span>
                  <span className="hidden sm:inline">→</span>
                </span>
              </li>,
            ]
          : []),
      ])}
    </ol>
  );
}

export function TeacherForcing({ forcedUse, freeUse }: { forcedUse: string; freeUse: string }) {
  return (
    <ChartCard>
      <p className="mb-3 text-sm">
        The real text: <span className="rounded bg-[#eef0f3] px-1.5 py-0.5">The cat sat on</span>
      </p>
      <ul className="grid gap-3 lg:grid-cols-2">
        <li className="rounded-xl border border-rule bg-white px-4 py-4">
          <p className="text-base font-medium leading-6">Teacher forcing</p>
          <p className="mb-3 text-sm leading-5 text-ink-soft">The real word goes in at every step, whatever the file guessed.</p>
          <Steps
            carry="real"
            turns={[
              { input: "The", guess: "dog", ok: false },
              { input: "cat", inputNote: "real", guess: "sat", ok: true },
              { input: "sat", inputNote: "real", guess: "on", ok: true },
            ]}
          />
          <p className="mt-3 text-sm leading-5 text-ink-soft">
            The miss stays one miss, so every guess is scored on its own. <span className="text-ink">Used for {forcedUse}.</span>
          </p>
        </li>
        <li className="rounded-xl border border-rule bg-white px-4 py-4">
          <p className="text-base font-medium leading-6">Writing freely</p>
          <p className="mb-3 text-sm leading-5 text-ink-soft">The file&apos;s own guess goes back in, as when it writes a reply.</p>
          <Steps
            carry="own"
            turns={[
              { input: "The", guess: "dog" },
              { input: "dog", inputNote: "own", guess: "barked" },
              { input: "barked", inputNote: "own", guess: "loudly" },
            ]}
          />
          <p className="mt-3 text-sm leading-5 text-ink-soft">
            One different word changes everything after it. <span className="text-ink">Used for {freeUse}.</span>
          </p>
        </li>
      </ul>
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Recall, file by file: per model, the original's score and then each file's, as chips; blue where a file matches
// the original, orange where it recalls fewer.
export function RecallRows({ groups, of }: { groups: { label: string; original: number; files: { label: string; found: number }[] }[]; of: number }) {
  return (
    <ChartCard>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="text-sm font-medium leading-5">{g.label}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              <li className="flex flex-col items-center rounded-lg border border-dashed border-ink-soft/50 bg-white px-2.5 py-1.5">
                <span className="text-[11px] leading-4 text-ink-soft">Original</span>
                <span className="text-sm tabular-nums">
                  {g.original} <span className="text-xs text-ink-soft">of {of}</span>
                </span>
              </li>
              {g.files.map((f) => {
                const short = f.found < g.original;
                return (
                  <li
                    key={f.label}
                    className="flex flex-col items-center rounded-lg px-2.5 py-1.5"
                    style={{ backgroundColor: short ? "color-mix(in srgb, #c2410c 13%, white)" : "color-mix(in srgb, #2b44e6 12%, white)" }}
                  >
                    <span className="text-[11px] leading-4" style={{ color: short ? "#9a3412" : "#1c2ea8" }}>
                      {f.label}
                    </span>
                    <span className="text-sm tabular-nums" style={{ color: short ? "#9a3412" : "#1c2ea8" }}>
                      {f.found}
                    </span>
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
