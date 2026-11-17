import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import { DEVICE, DuoLabel } from "@/components/openweights/duo";
import DuoViews from "@/components/openweights/DuoViews";
import Switches from "@/components/openweights/Switches";
import { Scroll, grouped, slower, th, thNum } from "@/components/openweights/pd-parts";
import Post, { Figure, Findings, More, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import { PhoneSpecs } from "@/components/research/ThreadFigures";
import {
  mtkHot,
  mtkLinks,
  mtkMemory,
  mtkModels,
  mtkRun,
  mtkSessions,
  mtkSpec,
  name,
  rateRatio,
  ranked,
  sdModels,
  sdSpec,
  sdShared,
  sdTwins,
  type MtkModel,
  type MtkProbe,
} from "@/lib/prefill-decode-mtk";

const href = "/research/dimensity-9300-snapdragon-8-gen-3/";

export const metadata = postMetadata(
  href,
  "A Galaxy Tab S10+ (Dimensity 9300+) and a Galaxy S24 Ultra (Snapdragon 8 Gen 3), compared on matching turns: which processor should read the prompt and which should write the reply, and what heat does to each.",
);

const range = (xs: number[], d = 1) =>
  Math.min(...xs).toFixed(d) === Math.max(...xs).toFixed(d) ? Math.min(...xs).toFixed(d) : `${Math.min(...xs).toFixed(d)} to ${Math.max(...xs).toFixed(d)}`;
const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const short = (m: { name: string; quant: string }) => `${m.name}${m.quant.startsWith("Q8_0") ? " Q8_0" : ""}`;
const tok = (x: number) => (x >= 100 ? grouped(x) : x.toFixed(1));
const known = (xs: (number | null)[]) => xs.filter((x): x is number => x !== null);
const pct = (x: number) => `${Math.round(x)}%`;

// The two devices, named the same way everywhere on the page.
const MTK = DEVICE.mtk;
const SD = DEVICE.sd;

// Short lists under a figure or in a method row: one point a line, instead of a paragraph.
const Bullets = ({ items, small = true }: { items: React.ReactNode[]; small?: boolean }) => (
  <ul className={`list-disc space-y-1.5 pl-5 marker:text-ink/30 ${small ? "mt-5 max-w-3xl text-sm leading-6 text-ink-soft" : ""}`}>
    {items
      .filter((x) => x !== null && x !== false && x !== "")
      .map((x, i) => (
        <li key={i}>{x}</li>
      ))}
  </ul>
);

// The comparison. For each model both devices ran: t is the tablet's run on the S24's turns, s the S24's
// run on the pairings the tablet ran (so pooled rates cover the same work), full the S24's whole run.
const both = sdModels.flatMap((full, i) => {
  const t = sdTwins[i];
  const s = sdShared[i];
  return t && s ? [{ s, t, full }] : [];
});
const ratioOf = (m: MtkModel, phase: "prefill" | "decode", a: number, b: number) => rateRatio(m[phase], a, b);
const over = (pick: (x: (typeof both)[number]) => MtkModel, phase: "prefill" | "decode", a: number, b: number) => known(both.map((x) => ratioOf(pick(x), phase, a, b)));
const sdNpuPre = over((x) => x.s, "prefill", 2, 0);
const mtkNpuPre = over((x) => x.t, "prefill", 2, 0);
const sdNpuDec = over((x) => x.s, "decode", 2, 0);
const mtkNpuDec = over((x) => x.t, "decode", 2, 0);
const sdGpuPre = over((x) => x.s, "prefill", 1, 0);
const mtkGpuPre = over((x) => x.t, "prefill", 1, 0);
const npuBoth = sdNpuPre.length > 0 && mtkNpuPre.length > 0;
const noNpuOnMtk = both.filter(({ t }) => rateRatio(t.prefill, 2, 0) === null).map(({ s }) => short(s));
const fastest = (m: MtkModel) => ranked(m)[0];
// Each holds only for a non-empty list, so a headline never rests on no models.
const below = (xs: number[]) => xs.length > 0 && xs.every((x) => x < 1);
const close = (xs: number[]) => xs.length > 0 && xs.every((x) => x > 0.8 && x < 1.25);
const mostlyBelow = (xs: number[]) => xs.length > 0 && 2 * xs.filter((x) => x < 1).length > xs.length;

// The fastest pairing is each device's own best over the same turns, among the pairings it ran there.
const pickOf = (d: "mtk" | "sd") => both.map((x) => name(fastest(d === "sd" ? x.full : x.t)));
const commonest = (xs: string[]) => {
  const n = new Map<string, number>();
  for (const x of xs) n.set(x, (n.get(x) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
};
const [sdPick, sdPickN] = commonest(pickOf("sd"));
const [mtkPick, mtkPickN] = commonest(pickOf("mtk"));
// Per model: which device's fastest pairing finished the same turns first, and by how much less time.
const leads = both.map(({ full, t }) => {
  const a = fastest(t).cell.seconds;
  const b = fastest(full).cell.seconds;
  return { model: short(full), mtk: a < b, sd: b < a, pct: 100 * (1 - Math.min(a, b) / Math.max(a, b)) };
});
const mtkWins = leads.filter((x) => x.mtk);
const sdWins = leads.filter((x) => x.sd);
// A fastest pairing whose every reply began with an end-of-generation token (a chat would have stopped).
const forced = both.flatMap(({ full, t }) => [
  ...(fastest(t).cell.eogFirst === t.turns ? [{ m: t, d: "mtk" as const }] : []),
  ...(fastest(full).cell.eogFirst === full.turns ? [{ m: full, d: "sd" as const }] : []),
]);
// "Kept up": at least 0.9 of its CPU's prefill rate on every model; "did not": a fifth or less.
const gpuApart = sdGpuPre.length > 0 && mtkGpuPre.length > 0 && Math.min(...sdGpuPre) >= 0.9 && Math.max(...mtkGpuPre) <= 0.2;

// The NPU or the GPU (k) against the CPU at one phase, one row per model and one column per device: the
// processor's rate over the CPU's, with a short bar on a log scale (2x either way is the same length),
// blue where the processor was faster, orange where the CPU was. A table, so 18 bars do not stack.
const CPU_FASTER = "#d9480f";
function RatioCell({ r }: { r: number }) {
  const span = Math.log2(16);
  const w = Math.min(1, Math.abs(Math.log2(r)) / span);
  const color = r >= 1 ? "var(--color-blue)" : CPU_FASTER;
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <span className="font-medium" style={{ color: r >= 1 ? "var(--color-blue-deep)" : CPU_FASTER }}>
        {r >= 10 ? r.toFixed(0) : r >= 1 ? r.toFixed(1) : r.toFixed(2)}×
      </span>
      <span aria-hidden className="relative hidden h-2 w-16 rounded-full bg-ink/5 sm:inline-block">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${100 * w}%`, backgroundColor: color }} />
      </span>
    </span>
  );
}
function RatioTable({ k, phase }: { k: 1 | 2; phase: "prefill" | "decode" }) {
  const proc = k === 2 ? "NPU" : "GPU";
  const cell = (m: MtkModel, d: "mtk" | "sd") => {
    const r = ratioOf(m, phase, k, 0);
    if (r === null) return <span className="text-xs text-ink-soft">{d === "sd" ? "not compared" : m.fits === 4 ? "refused by memory guard" : "did not run"}</span>;
    return <RatioCell r={r} />;
  };
  return (
    <div>
      <Scroll label={`${proc} against CPU, ${phase}`}>
        <table className="w-full text-sm tabular-nums sm:min-w-[32rem]">
          <thead>
            <tr className="align-bottom">
              <th className={th}>Model</th>
              <th className={thNum}>{MTK}</th>
              <th className={`${thNum} pr-0`}>{SD}</th>
            </tr>
          </thead>
          <tbody>
            {both.map(({ s, t }) => (
              <tr key={short(s)} className="border-t border-rule">
                <th scope="row" className="py-2.5 pr-4 text-left font-medium">
                  <DuoLabel m={s} />
                </th>
                <td className="py-2.5 pr-4 text-right">{cell(t, "mtk")}</td>
                <td className="py-2.5 text-right">{cell(s, "sd")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Scroll>
      <p className="mt-3 text-sm text-ink-soft">
        {proc} rate ÷ CPU rate. <span style={{ color: "var(--color-blue-deep)" }}>Blue</span>: the {proc} was faster; <span style={{ color: CPU_FASTER }}>orange</span>: the CPU
        was.<span className="hidden sm:inline"> Bars on a log scale, 2× either way the same length.</span>
      </p>
    </div>
  );
}

// Each processor's pooled rate at one phase, on each device: the figures the ratios are made from.
function RatesTable({ phase }: { phase: "prefill" | "decode" }) {
  const procs = ["CPU", "GPU", "NPU"] as const;
  const v = (m: MtkModel, k: number) => {
    const r = m[phase][k];
    return r ? tok(r.tokS) : "not run";
  };
  return (
    <Scroll label={`Tokens per second, ${phase}`}>
      <table className="w-full min-w-[40rem] text-sm tabular-nums">
        <thead>
          <tr>
            <th rowSpan={2} className={`${th} align-bottom`}>
              Model
            </th>
            {[MTK, SD].map((d) => (
              <th key={d} colSpan={3} scope="colgroup" className="pb-1 pl-6 text-left text-xs font-medium">
                {d}
              </th>
            ))}
          </tr>
          <tr className="align-bottom">
            {[MTK, SD].flatMap((d) =>
              procs.map((p, j) => (
                <th key={`${d}${p}`} scope="col" className={`${thNum} ${j === 0 ? "pl-6" : ""}`}>
                  {p}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {both.map(({ s, t }) => (
            <tr key={short(s)} className="border-t border-rule">
              <th scope="row" className="py-2.5 pr-4 text-left font-medium">
                <DuoLabel m={s} />
              </th>
              {[t, s].flatMap((m, di) =>
                procs.map((_, k) => (
                  <td key={`${di}${k}`} className={`py-2.5 pr-4 text-right ${k === 0 ? "pl-6" : ""}`}>
                    {v(m, k)}
                  </td>
                )),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Scroll>
  );
}

// Heat while the matrices ran, from each device's own logger over each model's timed turns.
const STATUS = ["none", "light", "moderate", "severe", "critical", "emergency", "shutdown"];
const heatOf = (m: MtkModel) => m.heat!;
const severeShare = (m: MtkModel) => {
  const c = heatOf(m).statusCounts;
  const all = Object.values(c).reduce((a, b) => a + b, 0);
  return (100 * Object.entries(c).reduce((a, [k, n]) => a + (Number(k) >= 3 ? n : 0), 0)) / Math.max(1, all);
};
const gateOut = (pick: (x: (typeof both)[number]) => MtkModel) => {
  const cs = both.flatMap((x) =>
    pick(x)
      .cells.flat()
      .filter((c) => c !== null),
  );
  return { out: cs.filter((c) => c!.gate !== "passed").length, of: cs.length };
};
const sdGate = gateOut((x) => x.s);
const mtkGate = gateOut((x) => x.t);
const slowSum = (pick: (x: (typeof both)[number]) => MtkModel) => both.reduce((a, x) => a + heatOf(pick(x)).slowSteps, 0);
const allOnlineInMatrix = both.every(({ s, t }) => heatOf(s).allOnline && heatOf(t).allOnline);

// The heat probes: the same three Gemma 3 1B turns on the CPU, cool, then right after busy loops. The
// 20-minute probes followed a matrix; of the longer hard-throttle attempts, only each device's longest
// finished one is shown (the shorter attempts it superseded are left out).
const hot20 = mtkHot.filter((u) => !u.long);
const hotLongest = (["mtk", "sd"] as const).flatMap((d) => {
  const us = mtkHot.filter((u) => u.long && u.device === d && u.heatMinutes !== null);
  return us.length ? [us.reduce((a, b) => (b.heatMinutes! > a.heatMinutes! ? b : a))] : [];
});
const probes = [...hot20, ...hotLongest];
const lossOf = (u: (typeof mtkHot)[number], t: "6" | "2") => {
  const h = u.probes[`hot${t}`];
  const c = u.probes[`cool${t}`];
  return h && c ? 100 * (1 - h.decodeTokS / c.decodeTokS) : null;
};
// CPU decode lost on the 20-minute units that reached critical status (4), both thread counts.
const critLoss = (d: "mtk" | "sd") =>
  hot20.filter((u) => u.device === d).flatMap((u) => (["6", "2"] as const).flatMap((t) => ((u.probes[`hot${t}`]?.status ?? 0) >= 4 ? known([lossOf(u, t)]) : [])));
const sdLoss = critLoss("sd");
const mtkLoss = critLoss("mtk");
const coolStatus = (d: "mtk" | "sd") => hot20.filter((u) => u.device === d).flatMap((u) => (["cool6", "cool2"] as const).flatMap((k) => (u.probes[k] ? [u.probes[k].status] : [])));
// Every probe kept all eight cores online and lowered some clock limit: all a shell sees of a soft throttle.
const softOnly =
  probes.length > 0 &&
  probes.every(
    (u) =>
      u.minOnline === 8 &&
      (["6", "2"] as const).every((t) => {
        const h = u.probes[`hot${t}`];
        const c = u.probes[`cool${t}`];
        return !h || !c || h.ceilingsGhz.some((g, i) => g < c.ceilingsGhz[i]);
      }),
  );
const fell = sdLoss.length > 0 && mtkLoss.length > 0 && [...sdLoss, ...mtkLoss].every((x) => x > 0);
const noStall = probes.length > 0 && probes.every((u) => Object.values(u.probes).every((p) => p.slowSteps === 0));
const longestHeat = Math.round(Math.max(...known(probes.map((u) => u.heatMinutes))));
// A device whose shown runs split by unit: some units never reached critical, others did. The Firebase lab
// hands out whichever unit is free, so a calm unit's long run must not read as the chip's behaviour.
const unitSplit = (["mtk", "sd"] as const).flatMap((d) => {
  const runsOf = (n: string) => probes.filter((u) => u.device === d && u.unit === n);
  const units = [...new Set(probes.filter((u) => u.device === d).map((u) => u.unit))];
  const calm = units.filter((n) => runsOf(n).every((u) => u.maxStatus < 4));
  const hot = units.filter((n) => !calm.includes(n));
  const mins = (ns: string[]) => andList(ns.flatMap(runsOf).flatMap((u) => (u.heatMinutes === null ? [] : [String(Math.round(u.heatMinutes))])));
  const peak = Math.max(...calm.flatMap(runsOf).map((u) => u.maxStatus));
  return calm.length && hot.length
    ? [
        `${DEVICE[d]} ${calm.length > 1 ? "units" : "unit"} ${andList(calm)} peaked at ${STATUS[peak]} after ${mins(calm)} minutes of heating; ${hot.length > 1 ? "units" : "unit"} ${andList(hot)} reached critical after ${mins(hot)}.`,
      ]
    : [];
});
// Long runs left out of the table on a unit no shown run used: another unit's result, named in one line so
// the table keeps one long run per device without hiding what that unit did.
const leftOut = mtkHot.filter((u) => u.long && u.heatMinutes !== null && !probes.includes(u) && !probes.some((p) => p.device === u.device && p.unit === u.unit));
// Each CPU policy's core type, in the order the loggers read the policies (lowest core first).
// Named by core type and core numbers, since two groups can share a type (two X4 groups on the tablet).
const groupsOf = (d: "mtk" | "sd") =>
  (d === "sd" ? sdSpec : mtkSpec).clusters.map((c) => `${c.type.replace("Cortex-", "")} (${c.cores.length > 2 ? `${c.cores[0]} to ${c.cores.at(-1)}` : c.cores.join(", ")})`);
// Whether a probe began with every core group's limit at its top clock (all cool probes did so far).
const atTop = (p: MtkProbe, d: "mtk" | "sd") => p.ceilingsGhz.every((g, i) => Math.abs(g - ((d === "sd" ? sdSpec : mtkSpec).clusters[i]?.ghz ?? 0)) < 0.01);
// One probe pair, cool → heated, in one of four readings. Rates carry a short bar on one scale per view:
// the fill is the heated rate, the tick the cool one, so a gain reads longer than no change.
type ProbeView = "decode" | "prefill" | "limits" | "step";
const rateOf = (p: MtkProbe, view: ProbeView) => (view === "decode" ? p.decodeTokS : p.prefillTokS);
const probeScale = (view: ProbeView) =>
  Math.max(
    1,
    ...probes.flatMap((u) =>
      (["6", "2"] as const).flatMap((t) => (u.probes[`cool${t}`] && u.probes[`hot${t}`] ? [rateOf(u.probes[`hot${t}`], view) / rateOf(u.probes[`cool${t}`], view)] : [])),
    ),
  );
function ProbeCell({ c, h, view, d }: { c?: MtkProbe; h?: MtkProbe; view: ProbeView; d: "mtk" | "sd" }) {
  if (!c || !h) return <span className="text-ink-soft">not run</span>;
  if (view === "limits")
    return (
      <span className="block min-w-[16rem]">
        <span className="block whitespace-nowrap">
          status {c.status} → {h.status} {STATUS[h.status]}, AP {c.apC.toFixed(0)} → {h.apC.toFixed(0)} °C
        </span>
        <span className="block text-xs leading-5 text-ink-soft">
          {h.ceilingsGhz.map((g, i, all) => (
            <span key={i} className="mr-2 inline-block whitespace-nowrap">
              {groupsOf(d)[i] ?? `group ${i + 1}`} {atTop(c, d) ? "" : `${c.ceilingsGhz[i].toFixed(2)} → `}
              {g.toFixed(2)}
              {i === all.length - 1 ? " GHz" : ""}
            </span>
          ))}
        </span>
      </span>
    );
  if (view === "step")
    return (
      <span className="whitespace-nowrap">
        {grouped(c.longestStepMs)} → {grouped(h.longestStepMs)} ms
      </span>
    );
  const a = rateOf(c, view);
  const b = rateOf(h, view);
  const f = b / a;
  const scale = probeScale(view);
  const change = Math.round(100 * (f - 1));
  const show = (x: number) => (view === "decode" ? x.toFixed(1) : grouped(Math.round(x)));
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span>
        {show(a)} → {show(b)}{" "}
        <span className="text-ink-soft">
          ({change < 0 ? "−" : "+"}
          {Math.abs(change)}%)
        </span>
      </span>
      <span aria-hidden className="relative inline-block h-2 w-14 rounded-full bg-ink/5">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(100 * f) / scale}%`, backgroundColor: f < 1 ? CPU_FASTER : "var(--color-blue)" }} />
        <span className="absolute -inset-y-0.5 w-px bg-ink" style={{ left: `${100 / scale}%` }} />
      </span>
    </span>
  );
}

const probeLegend: Record<ProbeView, string[]> = {
  decode: ["Numbers: tokens per second over the three turns. Bar: heated ÷ cool; the tick marks 1×."],
  prefill: ["Numbers: tokens per second over the three turns. Bar: heated ÷ cool; the tick marks 1×."],
  limits: [
    "Heat status and AP temperature as the first turn began, cool → heated; then each core group's CPU limit, heated.",
    ...(probes.every((u) => (["cool6", "cool2"] as const).every((k) => !u.probes[k] || atTop(u.probes[k], u.device)))
      ? ["Every cool run began with every limit at its top clock."]
      : []),
  ],
  step: ["The longest single decode step in the three turns."],
};

// Under each fastest pairing: how much longer CPU only took on that device, the study's baseline.
function CpuOnly({ m }: { m: MtkModel }) {
  const r = fastest(m);
  const cpu = m.cells[0][0];
  if (r.prefill === "CPU" && r.decode === "CPU") return null;
  return <span className="block text-xs text-ink-soft">{cpu ? `CPU only: ${slower(cpu.seconds, r.cell.seconds)}` : "CPU only: not run"}</span>;
}

// Marks a fastest pairing whose every reply began with a stop token.
function StopMark({ m }: { m: MtkModel }) {
  return fastest(m).cell.eogFirst === m.turns ? <span className="block text-xs font-medium text-[#d9480f]">Stop token first</span> : null;
}

// The fastest table as one card per model below md, so a phone shows both devices without scrolling.
function FastestCards() {
  return (
    <ul className="space-y-3 md:hidden">
      {both.map(({ full, t }, i) => {
        const l = leads[i];
        return (
          <li key={short(full)} className="rounded-2xl border border-rule p-4 text-sm tabular-nums">
            <p className="font-medium">
              <DuoLabel m={full} />
            </p>
            <dl className="mt-2 space-y-2">
              {(
                [
                  ["mtk", t],
                  ["sd", full],
                ] as const
              ).map(([d, m]) => (
                <div key={d}>
                  <dt className="text-xs text-ink-soft">{DEVICE[d]}</dt>
                  <dd className={(d === "mtk" ? l.mtk : l.sd) ? "font-medium text-blue-deep" : ""}>
                    {name(fastest(m))} · {grouped(fastest(m).cell.seconds)} s
                    <CpuOnly m={m} />
                    <StopMark m={m} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-ink-soft">Finished first: {l.mtk ? `${MTK}, ${pct(l.pct)} less time` : l.sd ? `${SD}, ${pct(l.pct)} less time` : "tie"}</p>
          </li>
        );
      })}
    </ul>
  );
}

// The first-token check, one row per model, both devices side by side.
function TokenTable() {
  const rows = byModel.filter((x) => x.sides.some(({ h }) => h.npuFirstToken));
  const cols = ["Same as CPU only", "Distinct first tokens", "Stop token first"];
  return (
    <Scroll label="The first reply token after an NPU prefill">
      <table className="w-full min-w-[44rem] text-sm tabular-nums">
        <thead>
          <tr>
            <th rowSpan={2} className={`${th} align-bottom`}>
              Model
            </th>
            {(["mtk", "sd"] as const).map((d) => (
              <th key={d} colSpan={3} scope="colgroup" className="pb-1 pl-6 text-left text-xs font-medium">
                {DEVICE[d]}
              </th>
            ))}
          </tr>
          <tr className="align-bottom">
            {(["mtk", "sd"] as const).flatMap((d) =>
              cols.map((c, j) => (
                <th key={`${d}${c}`} scope="col" className={`${thNum} ${j === 0 ? "pl-6" : ""}`}>
                  {c}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.key} className="border-t border-rule">
              <th scope="row" className="py-2.5 pr-4 text-left font-medium">
                <DuoLabel m={x.sides[0].m} />
              </th>
              {(["mtk", "sd"] as const).flatMap((d) => {
                const m = x.sides.find((y) => y.d === d)?.h;
                if (!m?.npuFirstToken)
                  return [
                    <td key={d} colSpan={3} className="py-2.5 pl-6 pr-4 text-left text-xs text-ink-soft">
                      {d === "mtk" && m?.fits === 4 ? "refused by memory guard" : "not run"}
                    </td>,
                  ];
                const npuRow = m.cells[2].filter((c) => c !== null);
                const of = npuRow.length * m.turns;
                return [`${m.npuFirstToken.same} of ${m.npuFirstToken.of}`, String(m.npuFirstToken.tokens), `${npuRow.reduce((a, c) => a + c!.eogFirst, 0)} of ${of}`].map(
                  (v, k) => (
                    <td key={`${d}${k}`} className={`py-2.5 pr-4 text-right ${k === 0 ? "pl-6" : ""}`}>
                      {v}
                    </td>
                  ),
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Scroll>
  );
}

// One option per model for the switchable detail; m is each device's whole run, h the run its heat and
// pooled figures are read over (the pairings both devices ran).
type ByModel = { key: string; sides: { d: "mtk" | "sd"; m: MtkModel; h: MtkModel }[] };
const byModel: ByModel[] = [
  ...[...both]
    .sort((a, b) => mtkModels.findIndex((m) => m.name === a.s.name && m.quant === a.s.quant) - mtkModels.findIndex((m) => m.name === b.s.name && m.quant === b.s.quant))
    .map(({ s, t, full }) => ({
      key: `${s.name} ${s.quant}`,
      sides: [
        { d: "mtk" as const, m: t, h: t },
        { d: "sd" as const, m: full, h: s },
      ],
    })),
  ...mtkModels
    .filter((m) => !both.some(({ s }) => s.name === m.name && s.quant === m.quant))
    .map((m) => ({ key: `${m.name} ${m.quant}`, sides: [{ d: "mtk" as const, m, h: m }] })),
];
const modelOptions: [string, string][] = byModel.map((x) => [x.key, short(x.sides[0].m)]);

// The per-pairing detail: three short views, a few columns each, each with its own legend.
const P3 = ["CPU", "GPU", "NPU"] as const;
const views = {
  handoff: ["Decoding", "Handoff"],
  steps: ["Slow steps", "Longest step", "End token"],
  heat: ["Start", "Gate", "Waited", "Capped, severe"],
} as const;
const legendOf: Record<keyof typeof views, React.ReactNode[]> = {
  handoff: ["Decoding: the share of the pairing's time spent writing the reply.", "Handoff: the time to copy the model's memory of the conversation between processors."],
  steps: [
    `Slow steps: CPU decode steps over half a second; ${slowSum((x) => x.s)} on the ${SD} and ${slowSum((x) => x.t)} on the ${MTK}, all models.`,
    "Longest step: the longest single decode step.",
    "End token: turns where a stop token appeared, and how many began with one. The bench kept writing either way.",
  ],
  heat: [
    "Start: the median AP temperature as the turns began; AP is the main chip's sensor.",
    `Gate: whether the cooling gate passed within ${mtkRun.gate.maxS / 60} minutes. Waited: how long it waited.`,
    "Capped, severe: turns that began with a CPU limit below its top, and with heat status 3 or more.",
  ],
};
function PairTable({ x, view }: { x: ByModel; view: keyof typeof views }) {
  const cols = views[view];
  return (
    <div>
      <p className="text-sm text-ink-soft">
        Work per pairing: {grouped(x.sides[0].m.newTokens)} prompt and {grouped(x.sides[0].m.replyTokens)} reply tokens over {x.sides[0].m.turns} turns
        {x.sides.length > 1 ? ", the same on both." : `. Not run on the ${SD}.`}
      </p>
      <p className="mb-3 text-sm text-ink-soft">Units: {x.sides.map(({ d, m }) => `${DEVICE[d]} ${m.unit}`).join("; ")}.</p>
      <Scroll label={`${x.key}: every pairing`}>
        <table className="w-full text-sm tabular-nums [&_td]:whitespace-nowrap" style={{ minWidth: `${9 + 6 * cols.length * x.sides.length}rem` }}>
          <thead>
            <tr>
              <th rowSpan={2} className={`${th} align-bottom`}>
                Pairing
              </th>
              {x.sides.map(({ d }) => (
                <th key={d} colSpan={cols.length} scope="colgroup" className="pb-1 pl-6 text-left text-xs font-medium">
                  {DEVICE[d]}
                </th>
              ))}
            </tr>
            <tr className="align-bottom">
              {x.sides.flatMap(({ d }) =>
                cols.map((c, j) => (
                  <th key={`${d}${c}`} scope="col" className={`${thNum} ${j === 0 ? "pl-6" : ""}`}>
                    {c}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {P3.flatMap((pf, i) =>
              P3.map((dc, j) => (
                <tr key={`${pf}${dc}`} className="border-t border-rule">
                  <th scope="row" className="whitespace-nowrap py-2.5 pr-4 text-left font-medium">
                    {pf} → {dc}
                  </th>
                  {x.sides.flatMap(({ d, m }) => {
                    const c = m.cells[i][j];
                    if (!c)
                      return [
                        <td key={`${d}x`} colSpan={cols.length} className="py-2.5 pl-6 pr-4 text-left text-xs text-ink-soft">
                          {d === "sd" ? "not run, to match the tablet" : m.fits === 4 ? "refused by memory guard" : "did not fit in memory"}
                        </td>,
                      ];
                    const val: Record<string, string> = {
                      Decoding: pct(100 * c.decodeShare),
                      Handoff: c.handoffSeconds > 0 ? `${c.handoffSeconds.toFixed(2)} s` : "none",
                      "Slow steps": dc === "CPU" ? String(c.stalls) : "n/a",
                      "Longest step": `${grouped(1000 * c.longestStepS)} ms`,
                      "End token": c.eogFirst > 0 ? `${c.eogTurns}, ${c.eogFirst} first` : String(c.eogTurns),
                      Start: `${c.startApC.toFixed(1)} °C`,
                      Gate: c.gate === "passed" ? "passed" : "ran out",
                      Waited: c.gateWaitS === null ? "unread" : `${c.gateWaitS} s`,
                      "Capped, severe": `${c.cappedTurns}, ${c.hotTurns} of ${m.turns}`,
                    };
                    return cols.map((col, k) => (
                      <td key={`${d}${col}`} className={`py-2.5 pr-4 text-right ${k === 0 ? "pl-6" : ""}`}>
                        {val[col]}
                      </td>
                    ));
                  })}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </Scroll>
      <Bullets items={legendOf[view]} />
    </div>
  );
}

// One model's heat on each device, side by side: five readings each.
function HeatCards({ x }: { x: ByModel }) {
  return (
    <div className={`grid gap-4 ${x.sides.length > 1 ? "md:grid-cols-2" : "md:max-w-[30rem]"}`}>
      {x.sides.map(({ d, h: m }) => {
        const h = heatOf(m);
        // The core group whose limit fell furthest below its top, not the lowest number in GHz.
        const cut = h.lowestGhz.map((g, i) => g / h.topGhz[i]);
        const low = cut.indexOf(Math.min(...cut));
        const all = Object.values(h.statusCounts).reduce((a, b) => a + b, 0);
        return (
          <div key={d} className="rounded-[1.5rem] bg-bench p-5 text-sm sm:p-6">
            <p className="font-medium">{DEVICE[d]}</p>
            <p className="mt-1 text-xs text-ink-soft">
              {h.timedMinutes} timed minutes, {grouped(h.samples)} clock samples, {grouped(all)} status readings
            </p>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 tabular-nums">
              <dt className="text-ink-soft">Every CPU limit at its top</dt>
              <dd>{pct(h.topShare)} of samples</dd>
              <dt className="text-ink-soft">Deepest CPU limit cut</dt>
              <dd>
                {h.lowestGhz[low].toFixed(2)} of {h.topGhz[low].toFixed(2)} GHz <span className="text-ink-soft">({groupsOf(d)[low] ?? `group ${low + 1}`})</span>
              </dd>
              <dt className="text-ink-soft">Severe or worse</dt>
              <dd>
                {pct(severeShare(m))} of readings <span className="text-ink-soft">(critical {pct(h.criticalShare)})</span>
              </dd>
              <dt className="text-ink-soft">Hottest</dt>
              <dd>
                AP {h.maxApC === null ? "unread" : `${h.maxApC.toFixed(1)} °C`}, SKIN {h.maxSkinC === null ? "unread" : `${h.maxSkinC.toFixed(1)} °C`}
              </dd>
              <dt className="text-ink-soft">CPU decode steps over 0.5 s</dt>
              <dd>
                {h.slowSteps} of {grouped(h.cpuSteps)}
                {h.longestStepMs !== null && <span className="text-ink-soft">, longest {grouped(h.longestStepMs)} ms</span>}
              </dd>
            </dl>
          </div>
        );
      })}
      {x.sides.length === 1 && <p className="text-sm text-ink-soft md:col-span-2">Not run on the {SD}.</p>}
    </div>
  );
}

export default function DimensitySnapdragon() {
  const stallPost = (
    <Go href="/research/decode-stall/" className={link}>
      the decode-stall post
    </Go>
  );
  return (
    <Post
      href={href}
      sources={[
        { label: "The tablet's run notes", href: mtkLinks.notes },
        { label: "The tablet's raw results", href: mtkLinks.results },
        { label: "The tablet's benchmark", href: mtkLinks.bench },
        { label: "The S24's run notes", href: mtkLinks.sdNotes },
        { label: "The S24's raw results", href: mtkLinks.sdResults },
        { label: "The S24's benchmark", href: mtkLinks.sdBench },
      ]}
      sourcesNote="Every table and chart is generated from the raw results in the OpenWeights repository, both devices' through the same script and the same checks."
      related={["/research/prefill-decode/", "/research/decode-stall/", "/research/8-elite-dimensity/"]}
    >
      <Section id="findings" title="What we found">
        <Findings
          items={
            both.length === 0
              ? [{ headline: "No model has finished on both devices yet", line: <>The comparison appears here once one has.</> }]
              : [
                  ...(npuBoth
                    ? [
                        {
                          headline:
                            Math.min(...sdNpuPre) >= 2 && mostlyBelow(mtkNpuPre)
                              ? "Prefill: Snapdragon's NPU is several times its CPU; MediaTek's mostly trails it"
                              : "Prefill: the NPU against the CPU",
                          line: (
                            <>
                              NPU against CPU: {range(sdNpuPre, 1)}× on the {SD}, {range(mtkNpuPre, 2)}× on the {MTK}.
                            </>
                          ),
                        },
                        {
                          headline:
                            below(sdNpuDec) && below(mtkNpuDec)
                              ? "Decode: both NPUs trail their CPUs"
                              : below(mtkNpuDec) && close(sdNpuDec)
                                ? "Decode: Snapdragon's NPU matches its CPU; MediaTek's trails it"
                                : "Decode: the NPU against the CPU",
                          line: (
                            <>
                              NPU against CPU: {range(sdNpuDec, 2)}× on the {SD}, {range(mtkNpuDec, 2)}× on the {MTK}.
                            </>
                          ),
                        },
                      ]
                    : []),
                  {
                    headline: sdPick !== mtkPick ? `Fastest pairing: ${sdPick} on Snapdragon, ${mtkPick} on MediaTek` : `Fastest pairing: ${sdPick} on both`,
                    line: (
                      <>
                        {sdPick} on {sdPickN} of {both.length} model rows on the {SD}; {mtkPick} on {mtkPickN} of {both.length} on the {MTK}.
                      </>
                    ),
                  },
                  {
                    headline: gpuApart ? "GPU prefill: Snapdragon's keeps up with its CPU; MediaTek's does not" : "GPU prefill against the CPU",
                    hide: sdGpuPre.length === 0 || mtkGpuPre.length === 0,
                    line: (
                      <>
                        GPU against CPU: {range(sdGpuPre, 2)}× on the {SD}, {range(mtkGpuPre, 2)}× on the {MTK}.
                      </>
                    ),
                  },
                  {
                    headline:
                      mtkWins.length === leads.length
                        ? `The ${MTK} finished every model first`
                        : sdWins.length === leads.length
                          ? `The ${SD} finished every model first`
                          : 2 * mtkWins.length > leads.length
                            ? `The ${MTK} finished most models first`
                            : 2 * sdWins.length > leads.length
                              ? `The ${SD} finished most models first`
                              : "Finishes were split between the devices",
                    line: (
                      <>
                        {MTK}: {mtkWins.length} of {leads.length} model rows, by up to {pct(Math.max(0, ...mtkWins.map((x) => x.pct)))}.
                        {sdWins.length > 0 && ` ${SD}: ${andList(sdWins.map((x) => `${x.model}, by ${pct(x.pct)}`))}.`}
                        {leads.length > mtkWins.length + sdWins.length && ` Ties: ${leads.length - mtkWins.length - sdWins.length}.`}
                      </>
                    ),
                  },
                  {
                    headline: fell && softOnly && noStall ? "Heat: clock limits fell; no probe step took over half a second" : "Heat on the two devices",
                    line: (
                      <>
                        {fell && `Heated to critical after a matrix, CPU decode fell ${range(sdLoss, 0)}% on the ${SD}, ${range(mtkLoss, 0)}% on the ${MTK}. `}
                        {softOnly && noStall && `In every probe, up to ${longestHeat} minutes, all cores read online and no decode step passed half a second.`}
                      </>
                    ),
                  },
                ].filter((x) => !("hide" in x && x.hide))
          }
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="devices"
          centerNote
          title="Two devices of one generation"
          lede="Both use Cortex-X4 and Cortex-A720 cores; the Snapdragon adds two Cortex-A520. Each vendor has its own GPU and NPU."
          note="Core types and top clocks from the devices' CPU registers and clock limits."
        >
          <PhoneSpecs phones={[mtkSpec, sdSpec]} throttle={false} />
        </Figure>

        <Figure
          id="fastest"
          title="The fastest pairing for each model"
          lede="A pairing is the processor that reads the prompt, then the one that writes the reply. Each device's fastest, over the same turns."
        >
          <FastestCards />
          <div className="hidden md:block">
            <Scroll label="The fastest pairing for each model">
              <table className="w-full min-w-[40rem] text-sm tabular-nums">
                <thead>
                  <tr className="align-bottom">
                    <th className={th}>Model</th>
                    <th className={th}>{MTK}</th>
                    <th className={th}>{SD}</th>
                    <th className={`${thNum} pr-0`}>Finished first</th>
                  </tr>
                </thead>
                <tbody>
                  {both.map(({ full, t }, i) => {
                    const a = fastest(t);
                    const b = fastest(full);
                    const l = leads[i];
                    return (
                      <tr key={short(full)} className="border-t border-rule">
                        <th scope="row" className="py-3 pr-4 text-left font-medium">
                          <DuoLabel m={full} />
                        </th>
                        <td className="whitespace-nowrap py-3 pr-4">
                          <span className={l.mtk ? "font-medium text-blue-deep" : ""}>
                            {name(a)} · {grouped(a.cell.seconds)} s
                          </span>
                          <CpuOnly m={t} />
                          <StopMark m={t} />
                        </td>
                        <td className="whitespace-nowrap py-3 pr-4">
                          <span className={l.sd ? "font-medium text-blue-deep" : ""}>
                            {name(b)} · {grouped(b.cell.seconds)} s
                          </span>
                          <CpuOnly m={full} />
                          <StopMark m={full} />
                        </td>
                        <td className="whitespace-nowrap py-3 text-right">{l.mtk ? `${MTK} (${pct(l.pct)} less time)` : l.sd ? `${SD} (${pct(l.pct)} less time)` : "tie"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Scroll>
          </div>
          <Bullets
            items={[
              "NPU → CPU: the NPU reads the prompt, the CPU writes the reply. Times are totals for the model's turns.",
              "Under each: how much longer CPU only took, unless CPU only was the fastest.",
              sdModels.some((m) => m.fits < 9) && `${andList(sdModels.filter((m) => m.fits < 9).map(short))}: the ${SD} ran only the pairings the tablet ran.`,
              forced.length > 0 && "Stop token first: every reply began with a stop token, so a chat would have ended there. The bench kept writing.",
              "One timed run per pairing; gaps of a few percent may come from run order or the unit.",
              "Core mix, runtimes, heat and memory all differ, so this cannot say why one device was faster.",
            ]}
          />
        </Figure>

        <Figure id="matrices" title="Every pairing, model by model">
          <div id="processors" className="scroll-mt-28 lg:scroll-mt-16">
            <DuoViews />
          </div>
        </Figure>

        <Figure id="npu" title="The NPU and the GPU against the CPU" lede="Each processor's rate as a multiple of the CPU's, on the same turns, model by model.">
          <Switches
            axes={[
              {
                title: "Show",
                options: [
                  ["2", "NPU against CPU"],
                  ["1", "GPU against CPU"],
                  ["rates", "Tokens per second"],
                ],
              },
              {
                title: "Phase",
                options: [
                  ["prefill", "Reading the prompt"],
                  ["decode", "Writing the reply"],
                ],
              },
            ]}
            views={Object.fromEntries(
              (["prefill", "decode"] as const).flatMap((ph) => [
                ...([2, 1] as const).map((k) => [`${k}:${ph}`, <RatioTable key={`${k}${ph}`} k={k} phase={ph} />]),
                [`rates:${ph}`, <RatesTable key={`r${ph}`} phase={ph} />],
              ]),
            )}
          />
          <Bullets
            items={[
              "A token is a word or part of one; rates are tokens per second.",
              "Each rate pools the pairings that used that processor, the same pairings on both devices.",
              noNpuOnMtk.length > 0 && `${andList(noNpuOnMtk)}: our memory guard refused the ${MTK}'s NPU copy, so its NPU is not compared.`,
            ]}
          />
        </Figure>

        <Figure
          id="pairings"
          title="Every pairing: handoff, steps and the heat it started in"
          lede="What the matrices do not show, pairing by pairing, with both devices side by side over the same turns."
        >
          <Switches
            axes={[
              { title: "Model", options: modelOptions },
              {
                title: "Show",
                options: [
                  ["handoff", "Decode share and handoff"],
                  ["steps", "Steps and end tokens"],
                  ["heat", "Starting heat"],
                ],
              },
            ]}
            views={Object.fromEntries(
              byModel.flatMap((x) => (["handoff", "steps", "heat"] as const).map((v) => [`${x.key}:${v}`, <PairTable key={`${x.key}${v}`} x={x} view={v} />])),
            )}
          />
        </Figure>

        <Figure id="heat" title="Heat while each model ran" lede="Each device's own logger, read only while that model's turns were being timed.">
          <Switches axes={[{ title: "Model", options: modelOptions }]} views={Object.fromEntries(byModel.map((x) => [x.key, <HeatCards key={x.key} x={x} />]))} />
          <Bullets
            items={[
              `Clock limits every ${range(
                mtkSessions.map((x) => x.everyS),
                0,
              )} seconds; Android's heat status (0 none to 6 shutdown, 4 critical) every ${range(
                mtkSessions.map((x) => x.statusEveryS),
                0,
              )}.`,
              "AP is the main chip's temperature sensor; SKIN is the casing's.",
              allOnlineInMatrix && "All eight cores read online in every sample, on both devices.",
              `Before each pairing, the cooling gate passed on ${mtkGate.of - mtkGate.out} of ${mtkGate.of} ${MTK} pairings and ${sdGate.of - sdGate.out} of ${sdGate.of} ${SD} pairings; the rest started warm.`,
            ]}
          />
        </Figure>

        <Figure
          id="throttle"
          title="Heated on purpose"
          lede="The same three Gemma 3 1B turns on the CPU, cool, then right after heating the device with busy loops. Each cell is cool → heated."
        >
          <Switches
            axes={[
              {
                title: "Show",
                options: [
                  ["decode", "Decode rate"],
                  ["prefill", "Prefill rate"],
                  ["limits", "Heat and clock limits"],
                  ["step", "Longest decode step"],
                ],
              },
            ]}
            views={Object.fromEntries(
              (["decode", "prefill", "limits", "step"] as const).map((v) => [
                v,
                <div key={v}>
                  <Table
                    key={v}
                    label={`Heated on purpose: ${v}`}
                    head={["Device", "Initial heating", "Peak status", "6 threads", "2 threads"]}
                    min={v === "limits" ? "52rem" : "40rem"}
                    rows={probes.map((u) => [
                      <span key="d" className="block whitespace-nowrap">
                        {DEVICE[u.device]}
                        <span className="block text-xs text-ink-soft">unit {u.unit}</span>
                      </span>,
                      <span key="h" className="block whitespace-nowrap">
                        {u.heatMinutes === null ? "?" : Math.round(u.heatMinutes)} min
                        {u.long && <span className="block text-xs text-ink-soft">no matrix before</span>}
                      </span>,
                      <span key="p" className="whitespace-nowrap">
                        {u.maxStatus} {STATUS[u.maxStatus]}
                      </span>,
                      <ProbeCell key="6" c={u.probes.cool6} h={u.probes.hot6} view={v} d={u.device} />,
                      <ProbeCell key="2" c={u.probes.cool2} h={u.probes.hot2} view={v} d={u.device} />,
                    ])}
                  />
                  <Bullets items={probeLegend[v]} />
                </div>,
              ]),
            )}
          />
          <Bullets
            items={[
              `The 2-thread probe came after the 6-thread one and another ${range(known(probes.map((u) => u.heat2Minutes)), 0)} minutes of heating.`,
              ...unitSplit,
              ...leftOut.map(
                (u) =>
                  `A ${Math.round(u.heatMinutes!)}-minute ${DEVICE[u.device]} run on unit ${u.unit}, no matrix before, reached ${STATUS[u.maxStatus]}; the table keeps each device's longest run.`,
              ),
              softOnly && "Every run lowered its CPU clock limits, and all eight cores read online.",
              noStall && "No decode step took over half a second.",
              coolStatus("sd").length > 0 &&
                coolStatus("mtk").length > 0 &&
                Math.min(...coolStatus("sd")) > Math.max(...coolStatus("mtk")) &&
                `After a matrix, the ${SD} started its cool runs warmer: status ${range(coolStatus("sd"), 0)} against ${range(coolStatus("mtk"), 0)}.`,
              "Units and starting heat differ, so these runs do not show which chip throttles more.",
              "A shell sees whether cores are online, not the pause switches themselves.",
              <>On the Snapdragon 8 Elite Gen 5, the hard throttle paused six cores: {stallPost}.</>,
            ]}
          />
        </Figure>

        <Figure
          id="token"
          title="The first reply token after an NPU prefill"
          lede="How often the reply's first token, after the NPU read the prompt, was the one CPU only chose on the same turn."
        >
          <TokenTable />
          <Bullets
            items={[
              "Same and stop-token counts: one per turn and per pairing that read the prompt on the NPU, the same pairings on both.",
              "Distinct first tokens: how many different first tokens those replies began with.",
              `The ${MTK}'s NPU reads its own export, not the GGUF, so its first token can differ.`,
              <>
                Every Qwen3 reply after the {MTK}&apos;s NPU read the prompt began with <code>&lt;|file_sep|&gt;</code>, an end-of-text token, where CPU only began with{" "}
                <code>&lt;think&gt;</code>. The cause is untested.
              </>,
              "Agreement with CPU only is not a measure of answer quality.",
            ]}
          />
        </Figure>

        <Figure id="memory" title="Memory each NPU copy took" lede="How much free memory each device lost loading the model for its NPU, the median over its loads.">
          <Table
            label="Memory each NPU copy took"
            head={["Model", MTK, SD]}
            min="32rem"
            rows={both.map(({ full, t }) => [
              <DuoLabel key="m" m={full} />,
              ...[t, full].map((m, k) => (
                <span key={k} className="block">
                  {m.npuMemoryMb === null ? (k === 1 ? "not run, to match the tablet" : m.fits === 4 ? "refused by memory guard" : "n/a") : `${grouped(m.npuMemoryMb)} MiB`}
                  <span className="block text-xs text-ink-soft">
                    {m.fits} of 9 pairings, {m.processes} {m.processes === 1 ? "process" : "processes"}
                  </span>
                </span>
              )),
            ])}
          />
          <Bullets
            items={[
              `${MTK}: beside the NPU copy of Qwen3 1.7B, ${(mtkMemory.leftMb / 1024).toFixed(1)} GiB was free.`,
              `A CPU or GPU copy of Qwen3 1.7B Q4_0 needed ${(mtkMemory.neededMb / 1024).toFixed(1)} GiB, our margin included.`,
              `So ${andList([...new Set(mtkModels.filter((m) => m.fits === 5).map(short))])} ran 5 pairings: none passing between the NPU and another processor.`,
              `${andList(mtkModels.filter((m) => m.fits === 4).map(short))}: our memory guard refused the ${MTK}'s NPU copy before loading.`,
              `${SD}: one GGUF for every processor, but a copy per processor, so some models needed more than one process.`,
            ]}
          />
        </Figure>

        <More id="numbers" title="What each logger read" summary="The files and services both devices' loggers read">
          <Table
            label="What each device's logger read"
            head={["Reading", "Source, on both devices"]}
            min="30rem"
            rows={[
              ["CPU clock limits", "scaling_max_freq of each CPU policy"],
              ["Cores online", "/sys/devices/system/cpu/online"],
              ["Heat status, AP, SKIN", "dumpsys thermalservice"],
            ]}
          />
        </More>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="Devices">
            <Bullets
              small={false}
              items={[
                `Galaxy Tab S10+ (${MTK}) and Galaxy S24 Ultra (${SD}): 12 GB, Android 16.`,
                `Firebase Device Streaming, shell only, ${mtkRun.dates}.`,
                "One unit per model on each device, after a warm-up.",
              ]}
            />
          </Row>
          <Row label="Runtimes">
            <Bullets
              small={false}
              items={[
                `CPU and GPU: llama.cpp ${mtkRun.llamacpp}, 6 threads, the same revision and CPU target on both.`,
                `GPU API: Vulkan on the ${MTK}, OpenCL on the ${SD}.`,
                `NPU on the ${MTK}: MediaTek's LlamaRuntime (ExecuTorch ${mtkRun.executorch}), on its own export (8-bit weights up to 1.2B, 4-bit above).`,
                `NPU on the ${SD}: llama.cpp's Hexagon backend, on the same GGUF.`,
                `Qwen3 1.7B Q4_0 and Q8_0 share one NPU export on the ${MTK}.`,
              ]}
            />
          </Row>
          <Row label="Models and turns">
            <Bullets
              small={false}
              items={[
                `${new Set(mtkModels.map((m) => m.name)).size} models in ${mtkModels.length} rows: Qwen3 1.7B at both Q4_0 and Q8_0.`,
                "The same GGUF files on both. Q4_0 and Q8_0 store weights at 4 and 8 bits.",
                "Hybrid: a model that mixes attention with other kinds of layers.",
                `The same turns on both, within the tablet NPU's ${grouped(mtkRun.windowTokens)}-token window.`,
                ...both.filter(({ s }) => s.convs < 9).map(({ s }) => `${short(s)}: ${s.convs} of the 9 conversations, on both.`),
              ]}
            />
          </Row>
          <Row label="Fixed work">
            <Bullets
              small={false}
              items={["Each reply runs to the dataset's reply length, even past a stop token.", "Each next turn starts from the dataset's history, not the model's reply."]}
            />
          </Row>
          <Row label="Order and gate">
            <Bullets
              small={false}
              items={[
                "Each model's pairings in a seeded order.",
                `Before each pairing, up to ${mtkRun.gate.maxS / 60} minutes for ${mtkRun.gate.limitC} °C or less, top clock limits and heat status 0.`,
                "The same logger on both devices.",
                "After each turn, outside the timing, the S24 also read Android's heat status; the tablet read its clocks.",
              ]}
            />
          </Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="Two devices">
            <Bullets small={false} items={["Different NPU software and files.", "Different form factors and cooling.", "So this compares devices as shipped, not chips alone."]} />
          </Row>
          <Row label="Processes">
            <Bullets
              small={false}
              items={[
                "Memory split some models into several processes on one unit; the memory table counts them.",
                "A split changes the run order and which copies load together.",
                "Qwen3 4B on the Snapdragon: its memory guard's margin was lowered to 768 MiB so two copies fit.",
              ]}
            />
          </Row>
          <Row label="Runs">
            <Bullets
              small={false}
              items={[
                "One timed run per pairing.",
                2 * sdGate.out > sdGate.of && 2 * mtkGate.out < mtkGate.of && `Starting heat differed: most ${SD} pairings started warm, few ${MTK} pairings did.`,
                `${MTK} Llama 3.2 1B: its NPU runtime ignored the model's position scaling; times stand, replies may differ.`,
              ]}
            />
          </Row>
          <Row label="Other chips">
            <Bullets
              small={false}
              items={[
                "The Firebase catalog open to us offered no Dimensity 9400 or 9500; the Tab S10+ was its only MediaTek flagship.",
                "Exynos 2400, Tensor G5 and Tensor G6: the shell was refused every NPU device node, so they are not compared.",
              ]}
            />
          </Row>
          <Row label="Not measured">
            <Bullets
              small={false}
              items={["Answer quality, beyond the first-token check.", "Energy.", "A device in a hand.", `Contexts past ${grouped(mtkRun.windowTokens)} tokens.`]}
            />
          </Row>
        </Rows>
      </Section>
    </Post>
  );
}
