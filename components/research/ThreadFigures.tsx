import { ChartCard } from "@/components/research/Compare";
import type { PhoneSpec } from "@/lib/prefill-decode";

// The figures of /research/decode-stall about cores and threads, drawn like the shared charts: a card on the
// bench colour, square swatches, small ink type. Cobalt is a thread doing work and orange a thread waiting
// while it holds its core, the pair the site's charts already use; a parked core is hatched grey. These are
// HTML rather than a scaled SVG, so the type stays readable at phone width.

const RUNS = "#2b44e6";
const WAITS = "#d9480f";
const OTHER = "#868e96";
const PARKED = "#c7cde0";

const hatch = (color: string) => ({
  background: `repeating-linear-gradient(135deg, ${color} 0 2px, #ffffff 2px 5px)`,
  boxShadow: `inset 0 0 0 1px ${color}`,
});

const Swatch = ({ color, hatched }: { color: string; hatched?: boolean }) => (
  <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={hatched ? hatch(color) : { backgroundColor: color }} />
);

const Key = ({ items }: { items: { color: string; label: string; hatched?: boolean }[] }) => (
  <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
    {items.map((i) => (
      <span key={i.label} className="inline-flex items-center gap-2">
        <Swatch color={i.color} hatched={i.hatched} />
        {i.label}
      </span>
    ))}
  </p>
);

type CoreState = "run" | "idle" | "parked";

// Eight cores in a row, grouped by cluster, each tile showing its number.
function Cores({ groups, state, label }: { groups: number[][]; state: (core: number) => CoreState; label: string }) {
  const style = (s: CoreState) =>
    s === "run"
      ? { backgroundColor: RUNS, color: "#ffffff" }
      : s === "parked"
        ? { ...hatch(PARKED), color: "#3d4460" }
        : { backgroundColor: "#ffffff", boxShadow: "inset 0 0 0 1px var(--color-rule)", color: "var(--color-ink-soft)" };
  return (
    <div role="img" aria-label={label} className="flex gap-2.5">
      {groups.map((g) => (
        <div key={g[0]} className="flex gap-1" style={{ flexGrow: g.length, flexBasis: 0 }}>
          {g.map((c) => (
            <span key={c} className="flex h-8 min-w-0 flex-1 items-center justify-center rounded-md text-xs font-medium tabular-nums" style={style(state(c))}>
              {c}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

const span = (cores: number[]) => (cores.length === 1 ? `Core ${cores[0]}` : cores.length === 2 ? `Cores ${cores[0]} and ${cores[1]}` : `Cores ${cores[0]} to ${cores.at(-1)}`);

// One card per kind of phone: its CPU as eight tiles by cluster, what the hard throttle parks where it was
// seen, and the rest of its specification.
// One card a phone: its CPU's clusters as text, then the rest of its specification. With a single phone the card spans the column and splits in two on wider screens (the CPU on
// the left, the rest of the specification on the right), so it does not sit alone in half a grid. `throttle`
// adds the row of cores the hard throttle takes out of use, where the phone has one recorded.
export function PhoneSpecs({ phones, throttle = true }: { phones: PhoneSpec[]; throttle?: boolean }) {
  const single = phones.length === 1;
  return (
    <div className={single ? "" : "grid gap-4 md:grid-cols-2"}>
      {phones.map((p) => {
        const groups = p.clusters.map((c) => c.cores);
        const parked = throttle ? (p.parked ?? []) : [];
        const rows = (
          <dl
            className={`grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm ${single ? "border-t border-rule pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0" : "mt-5 border-t border-rule pt-4"}`}
          >
            {p.rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-ink-soft">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        );
        const cpu = (
          <div>
            <p className="text-sm text-ink-soft">{p.used}</p>
            <p className="display mt-2 text-xl leading-snug">{p.name}</p>
            <p className="text-sm">{p.chip}</p>
            <p className="mt-5 text-sm font-medium">CPU, 8 cores</p>
            <ul className="mt-1 space-y-0.5 text-sm text-ink-soft">
              {p.clusters.map((c) => (
                <li key={c.cores[0]}>
                  {span(c.cores)}: {c.type}, up to {c.ghz.toFixed(2)} GHz
                </li>
              ))}
            </ul>
            {parked.length > 0 && (
              <>
                <p className="mt-5 text-sm font-medium">When it overheats</p>
                <div className="mt-2">
                  <Cores groups={groups} state={(c) => (parked.includes(c) ? "parked" : "run")} label={`When it overheats, ${span(parked).toLowerCase()} are out of use`} />
                </div>
                <p className="mt-2 text-sm text-ink-soft">{span(parked)} out of use. The two left are from the slower cluster.</p>
              </>
            )}
          </div>
        );
        return (
          <ChartCard key={p.name}>
            {single ? (
              <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-center">
                {cpu}
                {rows}
              </div>
            ) : (
              <>
                {cpu}
                {rows}
              </>
            )}
          </ChartCard>
        );
      })}
    </div>
  );
}

// How the app's threads work, in the style of "Who decides what": a white card a stage, its gist in a line
// a reader takes in at a glance, a small picture, and the exact detail under it in small type.
type Life = { when: string; gist: string; detail: string; picture: "made" | "ops" | "checkpoint" | "sleep" };

function LifePicture({ kind }: { kind: Life["picture"] }) {
  if (kind === "made" || kind === "sleep") {
    return (
      <span aria-hidden className="inline-flex gap-1">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="h-3 w-3 rounded-full" style={{ backgroundColor: kind === "made" ? RUNS : PARKED }} />
        ))}
      </span>
    );
  }
  if (kind === "ops") {
    return (
      <span aria-hidden className="flex items-end gap-[3px]">
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className="w-1.5 rounded-sm" style={{ height: `${8 + ((i * 7) % 10)}px`, backgroundColor: RUNS }} />
        ))}
        <span className="ml-1 whitespace-nowrap text-xs text-ink-soft">and on</span>
      </span>
    );
  }
  return (
    <span aria-hidden className="flex w-full max-w-[12rem] items-stretch gap-1">
      <span className="flex flex-1 flex-col gap-1">
        {[0.7, 1, 0.85].map((w, i) => (
          <span key={i} className="flex h-2.5 gap-px">
            <span className="rounded-sm" style={{ width: `${w * 100}%`, backgroundColor: RUNS }} />
            <span className="flex-1 rounded-sm" style={hatch(WAITS)} />
          </span>
        ))}
      </span>
      <span className="w-[3px] rounded-full bg-ink" />
    </span>
  );
}

export function ThreadLife({ steps, footnote }: { steps: Life[]; footnote: string }) {
  return (
    <ChartCard>
      <p className="text-sm font-medium">How the threads work</p>
      <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((st) => (
          <li key={st.when} className="flex flex-col rounded-xl bg-white p-4">
            <p className="text-xs text-ink-soft">{st.when}</p>
            <p className="mt-1 text-sm font-medium leading-6">{st.gist}</p>
            <div className="mt-3 flex min-h-5 items-center">
              <LifePicture kind={st.picture} />
            </div>
            <p className="mt-3 text-xs leading-5 text-ink-soft">{st.detail}</p>
          </li>
        ))}
      </ol>
      <p className="mt-5 border-t border-rule pt-4 text-sm leading-6">{footnote}</p>
    </ChartCard>
  );
}

// One state of threads and cores, drawn: the app's threads as dots on top, the phone's eight cores as tiles
// below (hatched when out of use), and a line from each thread to the core Android puts it on. A thread with
// no core free is a hollow orange dot on a dashed line to the core it waits for. Which core each lands on is
// an example; how many fit is the point.
type Placement = { title: string; caption: string; off: number[]; threads: { core: number; waiting?: boolean }[] };

function MapPanel({ p, id }: { p: Placement; id: string }) {
  const [W, tileW, gap, top, tileY, tileH] = [260, 26, 4, 22, 96, 26];
  const left = (W - (8 * tileW + 7 * gap)) / 2;
  const coreX = (c: number) => left + c * (tileW + gap) + tileW / 2;
  const n = p.threads.length;
  const dotX = (i: number) => W / 2 + (i - (n - 1) / 2) * 30;
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium">{p.title}</p>
      <svg viewBox={`0 0 ${W} 132`} role="img" aria-label={`${p.title}. ${p.caption}`} className="mt-2 w-full">
        <defs>
          <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" fill="#ffffff" />
            <rect width="2" height="5" fill={PARKED} />
          </pattern>
        </defs>
        {p.threads.map((t, i) => (
          <line
            key={`l${i}`}
            x1={dotX(i)}
            y1={top + 8}
            x2={coreX(t.core)}
            y2={tileY}
            stroke={t.waiting ? WAITS : "var(--color-ink-soft)"}
            strokeWidth={1.5}
            strokeDasharray={t.waiting ? "3 3" : undefined}
          />
        ))}
        {p.threads.map((t, i) => (
          <circle key={`d${i}`} cx={dotX(i)} cy={top} r={7} fill={t.waiting ? "#ffffff" : RUNS} stroke={t.waiting ? WAITS : RUNS} strokeWidth={2} />
        ))}
        {Array.from({ length: 8 }, (_, c) => {
          const off = p.off.includes(c);
          return (
            <g key={c}>
              <rect x={left + c * (tileW + gap)} y={tileY} width={tileW} height={tileH} rx={4} fill={off ? `url(#${id})` : RUNS} stroke={off ? PARKED : RUNS} />
              <text x={coreX(c)} y={tileY + 17} textAnchor="middle" fontSize={11} fontWeight={500} fill={off ? "#3d4460" : "#ffffff"}>
                {c}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-sm leading-6 text-ink-soft">{p.caption}</p>
    </div>
  );
}

// Who decides what, shown rather than told: three states side by side, then how the app picks its count and
// the two reasons behind its design.
export function ThreadChoice({ panels, rules, notes }: { panels: Placement[]; rules: { when: string; write: string; read: string }[]; notes: [string, string][] }) {
  return (
    <ChartCard>
      <p className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-full" style={{ backgroundColor: RUNS }} />
          <span>
            <span className="font-medium">The app</span> picks how many threads
          </span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-[2px] w-4 bg-ink-soft" />
          <span>
            <span className="font-medium">Android</span> puts each on a core
          </span>
        </span>
        <span className="inline-flex items-center gap-2">
          <Swatch color={RUNS} />
          <Swatch color={PARKED} hatched />
          <span>
            <span className="font-medium">The phone</span> decides which cores run
          </span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-full bg-white" style={{ boxShadow: `inset 0 0 0 2px ${WAITS}` }} />
          Waiting for a core
        </span>
      </p>
      <div className="mt-5 grid gap-8 md:grid-cols-3">
        {panels.map((p, i) => (
          <MapPanel key={p.title} p={p} id={`threadmap-hatch-${i}`} />
        ))}
      </div>
      <div className="mt-6 grid gap-6 border-t border-rule pt-5 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium">How many threads the app picks</p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft">
                <th className="pb-2 pr-3 font-normal" />
                <th className="pb-2 pr-3 font-normal">Writing the reply (decode)</th>
                <th className="pb-2 font-normal">Reading the prompt (prefill)</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.when} className="border-t border-rule/70 align-top">
                  <th scope="row" className="py-2 pr-3 text-left font-normal text-ink-soft">
                    {r.when}
                  </th>
                  <td className="py-2 pr-3">{r.write}</td>
                  <td className="py-2">{r.read}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 text-sm leading-6">
          {notes.map(([k, v]) => (
            <p key={k}>
              <span className="font-medium">{k}</span> <span className="text-ink-soft">{v}</span>
            </p>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

// Six threads' own colours, the site's validated categorical order; a thread is also named in every tooltip and
// in the list under each panel, since the amber falls under 3:1 against the card.
const THREAD = ["#2b44e6", "#d9480f", "#008f7a", "#6741d9", "#e0a100", "#d6336c"];

export type TraceSeg = { cpu: number; thread: number; from: number; to: number };

// A recording, not an illustration: the kernel's scheduler trace of the app's engine writing a reply, one lane per
// core over a short stretch of it. Each piece is a stretch when that core ran one of the engine's six threads
// (coloured and numbered) or any other task (grey); a blank is the core idle. Under it, each thread's share of a
// core over the whole 2 s trace and the cores it ran on.
export function SchedTrace({
  panels,
}: {
  panels: { title: string; caption: string; parked: number[]; windowMs: number; segs: TraceSeg[]; shares: { thread: number; share: number; cpus: number[] }[] }[];
}) {
  return (
    <ChartCard>
      <Key
        items={[...THREAD.map((c, i) => ({ color: c, label: `Thread ${i + 1}` })), { color: OTHER, label: "Another task" }, { color: PARKED, label: "Out of use", hatched: true }]}
      />
      <div className="mt-5 grid gap-8 lg:grid-cols-2">
        {panels.map((p) => (
          <div key={p.title}>
            <p className="text-sm font-medium">{p.title}</p>
            <p className="mt-0.5 text-xs leading-5 text-ink-soft">{p.caption}</p>
            <div className="mt-3 space-y-1" role="img" aria-label={`${p.title}: which thread each core ran over ${p.windowMs} ms of the recording`}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((cpu) => (
                <div key={cpu} className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-2 text-xs tabular-nums">
                  <span className="text-ink-soft">Core {cpu}</span>
                  <span className="relative block h-5 overflow-hidden rounded-[4px] bg-white" style={p.parked.includes(cpu) ? hatch(PARKED) : undefined}>
                    {!p.parked.includes(cpu) &&
                      p.segs
                        .filter((s) => s.cpu === cpu)
                        .map((s, k) => (
                          <span
                            key={k}
                            title={`${s.thread ? `Thread ${s.thread}` : "Another task"} on core ${cpu}, ${s.from.toFixed(1)} to ${s.to.toFixed(1)} ms`}
                            className="absolute inset-y-0"
                            style={{
                              left: `${(s.from / p.windowMs) * 100}%`,
                              width: `${((s.to - s.from) / p.windowMs) * 100}%`,
                              backgroundColor: s.thread ? THREAD[s.thread - 1] : OTHER,
                            }}
                          />
                        ))}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-2 text-[11px] tabular-nums text-ink-soft">
                <span />
                <span className="flex justify-between">
                  <span>0</span>
                  <span>{p.windowMs / 2} ms</span>
                  <span>{p.windowMs} ms</span>
                </span>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5" aria-label={`${p.title}, each thread's share of a core over the whole recording`}>
              {p.shares.map((t) => (
                <li key={t.thread} className="grid grid-cols-[4.25rem_5.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs tabular-nums">
                  <span className="inline-flex items-center gap-1.5 text-ink-soft">
                    <Swatch color={THREAD[t.thread - 1]} />
                    Thread {t.thread}
                  </span>
                  <span className="truncate">{t.cpus.length === 1 ? `core ${t.cpus[0]}` : `cores ${t.cpus.join(", ")}`}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-ink/10">
                    <span className="block h-full rounded-full" style={{ width: `${Math.min(1, t.share) * 100}%`, backgroundColor: THREAD[t.thread - 1] }} />
                  </span>
                  <span className="text-right font-medium">{Math.round(t.share * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
