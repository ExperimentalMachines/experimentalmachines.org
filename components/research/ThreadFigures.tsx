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
export function PhoneSpecs({ phones }: { phones: PhoneSpec[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {phones.map((p) => {
        const groups = p.clusters.map((c) => c.cores);
        const parked = p.parked ?? [];
        return (
          <ChartCard key={p.name}>
            <p className="text-sm text-ink-soft">{p.used}</p>
            <p className="display mt-2 text-xl leading-snug">{p.name}</p>
            <p className="text-sm">{p.chip}</p>
            <p className="mt-5 text-sm font-medium">CPU, 8 cores</p>
            <div className="mt-2">
              <Cores groups={groups} state={() => "run"} label={`${p.name}: ${p.clusters.map((c) => `${c.cores.length} ${c.type} up to ${c.ghz} GHz`).join(", ")}`} />
            </div>
            <ul className="mt-2 space-y-0.5 text-sm text-ink-soft">
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
            <dl className="mt-5 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-t border-rule pt-4 text-sm">
              {p.rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-ink-soft">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </ChartCard>
        );
      })}
    </div>
  );
}

type Placed = { core: number; share: number };

// Where each of the six decode threads ran in one 2 s interval and how much of a core it got: one row a
// thread, with the core it last ran on and a bar to a whole core.
export function ThreadPlacement({ panels }: { panels: { title: string; caption: string; threads: Placed[]; parked: number[] }[] }) {
  return (
    <ChartCard>
      <Key
        items={[
          { color: RUNS, label: "A core a thread ran on" },
          { color: PARKED, label: "Out of use", hatched: true },
        ]}
      />
      <div className="mt-5 grid gap-8 md:grid-cols-2">
        {panels.map((p) => {
          const used = new Set(p.threads.map((t) => t.core));
          return (
            <div key={p.title}>
              <p className="text-sm font-medium">{p.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-ink-soft">{p.caption}</p>
              <div className="mt-3">
                <Cores
                  groups={[[0, 1, 2, 3, 4, 5, 6, 7]]}
                  state={(c) => (p.parked.includes(c) ? "parked" : used.has(c) ? "run" : "idle")}
                  label={`${p.title}: the six threads ran on core${used.size > 1 ? "s" : ""} ${[...used].join(", ")}`}
                />
              </div>
              <ul className="mt-4 space-y-1.5" aria-label={`${p.title}, each thread`}>
                {p.threads.map((t, i) => (
                  <li key={i} className="grid grid-cols-[4.25rem_3.25rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs tabular-nums">
                    <span className="text-ink-soft">Thread {i + 1}</span>
                    <span>core {t.core}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-ink/10">
                      <span className="block h-full rounded-full" style={{ width: `${t.share * 100}%`, backgroundColor: RUNS }} />
                    </span>
                    <span className="text-right font-medium">{Math.round(t.share * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

type Seg = { w: number; kind: "work" | "wait" | "other"; label?: string };

// An illustration of one token's work, drawn to the profile's shares: each lane is a core, and each piece is a
// thread working (cobalt, labelled) or waiting while it holds the core (hatched orange). The order of turns
// is invented; the split between working and waiting is the measured one.
export function WaitLanes({ panels, caption }: { panels: { title: string; note: string; lanes: { core: number; segs: Seg[] }[] }[]; caption: string }) {
  const style = (k: Seg["kind"]) => (k === "work" ? { backgroundColor: RUNS, color: "#ffffff" } : k === "wait" ? hatch(WAITS) : { backgroundColor: OTHER });
  return (
    <ChartCard>
      <Key
        items={[
          { color: RUNS, label: "A thread working" },
          { color: WAITS, label: "A thread in the wait function, still holding its core", hatched: true },
          { color: OTHER, label: "Other work" },
        ]}
      />
      <p className="mt-2 text-xs leading-5 text-ink-soft">{caption}</p>
      <div className="mt-5 grid gap-8 md:grid-cols-2">
        {panels.map((p) => (
          <div key={p.title}>
            <p className="text-sm font-medium">{p.title}</p>
            <div className="mt-3 space-y-1.5" role="img" aria-label={`${p.title}. ${p.note}`}>
              {p.lanes.map((l) => (
                <div key={l.core} className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-xs text-ink-soft">Core {l.core}</span>
                  <div className="flex h-7 min-w-0 flex-1 gap-[2px]">
                    {l.segs.map((s, i) => (
                      <span
                        key={i}
                        className="flex min-w-0 items-center justify-center overflow-hidden rounded-[4px] text-xs font-medium first:rounded-l-md last:rounded-r-md"
                        style={{ width: `${s.w}%`, ...style(s.kind) }}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-soft">{p.note}</p>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

const Dots = ({ n }: { n: number }) => (
  <span aria-hidden className="inline-flex gap-1">
    {Array.from({ length: n }, (_, i) => (
      <span key={i} className="h-3 w-3 rounded-full" style={{ backgroundColor: RUNS }} />
    ))}
  </span>
);

// How the app picks its thread count: a real sequence, so the steps are numbered, and each shows its count as
// dots, one a thread.
const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <li className="min-w-0">
    <p className="flex items-center gap-2 text-sm font-medium">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs text-white">{n}</span>
      {title}
    </p>
    <div className="mt-3 space-y-2 text-sm leading-6">{children}</div>
  </li>
);
const Row = ({ label, count, text }: { label: string; count?: number; text: string }) => (
  <p className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-2">
    <span className="text-ink-soft">{label}</span>
    <span className="flex flex-wrap items-center gap-2">
      {count ? <Dots n={count} /> : null}
      <span>{text}</span>
    </span>
  </p>
);

export function ThreadChoice({ normal, warm, hot, fallback, retrySeconds }: { normal: number; warm: number; hot: number; fallback: number; retrySeconds: number }) {
  const who: [string, string][] = [
    ["The app", "How many threads write the reply"],
    ["Android", "Which core runs each thread, moment to moment"],
    ["The phone", "Which cores can run work: normally all 8; in the Snapdragon's hard throttle, only cores 0 and 1"],
  ];
  return (
    <ChartCard>
      <p className="text-sm font-medium">Who decides what</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        {who.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white p-4">
            <dt className="text-sm font-medium">{k}</dt>
            <dd className="mt-1 text-sm leading-6 text-ink-soft">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8 text-sm font-medium">How the app picks its number of threads</p>
      <ol className="mt-4 grid gap-8 md:grid-cols-3">
        <Step n={1} title="Before each reply">
          <Row label="Normally" count={normal} text={`${normal} threads`} />
          <p className="text-ink-soft">Half the CPU&apos;s cores, never under 2 or over 6. These phones have 8.</p>
        </Step>
        <Step n={2} title="If Android says the phone is hot">
          <Row label="Warm" count={warm} text={`${warm} threads`} />
          <Row label="Hot" count={hot} text={`${hot} threads`} />
          <Row label="Very hot" text="Does not start the reply" />
        </Step>
        <Step n={3} title="If the reply stalls">
          <Row label="Two slow steps" count={fallback} text={`${fallback} threads`} />
          <p className="text-ink-soft">Every {retrySeconds} s it tries the count from steps 1 and 2 again, and keeps it if that step is close to the 2-thread pace.</p>
        </Step>
      </ol>
      <div className="mt-6 space-y-3 border-t border-rule pt-4 text-sm leading-6">
        <p>
          <span className="font-medium">Using only 2 cores</span> means running 2 threads: two threads run on at most two cores at once, so they fit on the two left.
        </p>
        <p>
          <span className="font-medium">Why step 3:</span> on the Snapdragon we checked, the list of cores an app may use still showed all eight while six were out of use, so the
          app cannot tell from it. The guard watches how long each step takes instead.
        </p>
        <p>
          <span className="font-medium">Why not tie threads to cores:</span> Linux allows it, but OpenWeights does not. It resets the cores it may use to those it had at startup,
          then lets Android place its threads.
        </p>
      </div>
    </ChartCard>
  );
}
