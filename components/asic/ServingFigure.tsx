import { cost, serving, servingConditions } from "@/lib/neuron";

// Left: output tok/s over concurrency on log-log axes, one Inferentia2
// against one MI300X and one H200. The band marks the concurrency both
// sides measured. Right: dollars per million output tokens at matched
// concurrency and at each side's best observed point. Hover a column or
// a bar for the numbers; the readouts are CSS only.
const W = 720;
const H = 380;
const L = 64;
const R = 24;
const TOP = 44;
const BOTTOM = 56;
const PW = W - L - R;
const PH = H - TOP - BOTTOM;
const INK = "var(--color-ink)";
const BLUE = "var(--color-blue)";
const SOFT = "var(--color-ink-soft)";
const RULE = "var(--color-rule)";

const xs = (c: number) => L + (Math.log2(c) / 8) * PW;
const ys = (v: number) => TOP + PH - ((Math.log10(v) - 1) / (Math.log10(20000) - 1)) * PH;
const path = (vals: (number | null)[]) =>
  vals
    .map((v, i) => (v === null ? null : `${xs(serving.concurrency[i]).toFixed(1)},${ys(v).toFixed(1)}`))
    .filter(Boolean)
    .map((p, i) => `${i ? "L" : "M"}${p}`)
    .join(" ");

const fmt = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 1 });

function Chart() {
  const step = xs(2) - xs(1);
  return (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Serving throughput chart, scrolls sideways on small screens">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Output tokens per second over concurrency 1 to 256, log axes. Inferentia2 reaches 415.5 at concurrency 32, its ceiling. MI300X reaches 8,085 and H200 11,337 at concurrency 256."
        className="w-full min-w-[40rem]"
      >
        <rect x={L} y={TOP} width={PW} height={PH} fill="#ffffff" />
        <rect x={xs(1)} y={TOP} width={xs(32) - xs(1)} height={PH} fill={BLUE} opacity={0.05} />
        <text x={xs(1) + 6} y={TOP + 16} fontSize={12} fill={SOFT}>
          measured on all three
        </text>
        {[10, 100, 1000, 10000].map((v) => (
          <g key={v} fontSize={12}>
            <line x1={L} x2={L + PW} y1={ys(v)} y2={ys(v)} stroke={RULE} strokeDasharray="3 4" />
            <text x={L - 8} y={ys(v) + 4} textAnchor="end" fill={SOFT}>
              {v.toLocaleString()}
            </text>
          </g>
        ))}
        <text x={L - 8} y={TOP - 10} textAnchor="end" fontSize={12} fill={SOFT}>
          tok/s
        </text>
        <g fontSize={13}>
          <line x1={L} x2={L + 22} y1={TOP - 14} y2={TOP - 14} stroke={INK} strokeWidth={2.5} />
          <text x={L + 28} y={TOP - 10} fill={INK}>
            H200
          </text>
          <line x1={L + 90} x2={L + 112} y1={TOP - 14} y2={TOP - 14} stroke={SOFT} strokeWidth={2.5} strokeDasharray="5 4" />
          <text x={L + 118} y={TOP - 10} fill={INK}>
            MI300X
          </text>
          <line x1={L + 196} x2={L + 218} y1={TOP - 14} y2={TOP - 14} stroke={BLUE} strokeWidth={2.5} />
          <text x={L + 224} y={TOP - 10} fill={INK}>
            Inferentia2
          </text>
        </g>
        <path d={path(serving.h200)} fill="none" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <path d={path(serving.mi300x)} fill="none" stroke={SOFT} strokeWidth={2.5} strokeDasharray="5 4" strokeLinejoin="round" />
        <path d={path(serving.inf2)} fill="none" stroke={BLUE} strokeWidth={2.5} strokeLinejoin="round" />
        {serving.concurrency.map((c, i) => {
          const right = i >= 5;
          const bx = right ? xs(c) - 10 - 196 : xs(c) + 10;
          const rows = [
            ["H200", serving.h200[i], INK],
            ["MI300X", serving.mi300x[i], SOFT],
            ["Inferentia2", serving.inf2[i], BLUE],
          ].filter((r) => r[1] !== null) as [string, number, string][];
          return (
            <g key={c} className="group" fontSize={13}>
              <rect x={xs(c) - step / 2} y={TOP} width={step} height={PH} fill="transparent" />
              <line x1={xs(c)} x2={xs(c)} y1={TOP} y2={TOP + PH} stroke={SOFT} strokeDasharray="3 4" className="pointer-events-none opacity-0 group-hover:opacity-100" />
              {serving.h200[i] !== null && <circle cx={xs(c)} cy={ys(serving.h200[i]!)} r={3.5} fill={INK} className="group-hover:[r:6px]" />}
              {serving.mi300x[i] !== null && <circle cx={xs(c)} cy={ys(serving.mi300x[i]!)} r={3.5} fill={SOFT} className="group-hover:[r:6px]" />}
              {serving.inf2[i] !== null && <circle cx={xs(c)} cy={ys(serving.inf2[i]!)} r={3.5} fill={BLUE} className="group-hover:[r:6px]" />}
              <text x={xs(c)} y={TOP + PH + 20} textAnchor="middle" fill={SOFT} className="group-hover:font-semibold">
                {c}
              </text>
              <g className="pointer-events-none opacity-0 group-hover:opacity-100">
                <rect x={bx} y={TOP + PH - 24 - rows.length * 19 - 34} width={196} height={rows.length * 19 + 30} fill="#ffffff" stroke={RULE} rx={8} />
                <text x={bx + 10} y={TOP + PH - 24 - rows.length * 19 - 14} fill={SOFT}>
                  {c} concurrent {c === 1 ? "stream" : "streams"}
                </text>
                {rows.map((r, j) => (
                  <text key={r[0]} x={bx + 10} y={TOP + PH - 24 - rows.length * 19 + 5 + j * 19} fill={r[2]} fontWeight={600}>
                    {r[0]} {fmt(r[1])} tok/s
                  </text>
                ))}
              </g>
            </g>
          );
        })}
        <text x={L} y={H - 10} fontSize={13} fill={SOFT}>
          Concurrent streams. Llama 3.1 8B Instruct, BF16, vLLM, 1k in / 1k out, output tok/s over all streams.
        </text>
      </svg>
    </div>
  );
}

const MAX = 0.68;

function CostBars() {
  return (
    <div className="text-sm">
      <div className="flex items-center gap-5 text-xs text-ink-soft">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-ink" aria-hidden /> at 32 streams
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm border border-ink bg-white" aria-hidden /> best observed
        </span>
      </div>
      <div className="mt-4 space-y-4">
        {cost.map((d) => (
          <div key={d.device}>
            <div className="leading-tight">{d.device}</div>
            {[
              { kind: "matched", value: d.matched, tok: d.matchedTok, at: 32, solid: true },
              { kind: "best", value: d.best, tok: d.bestTok, at: d.bestAt, solid: false },
            ].map((b) => (
              <div key={b.kind} className="group relative mt-1 h-5 bg-plate">
                <span
                  role="img"
                  aria-label={`${d.device}: $${b.value.toFixed(3)} per million output tokens at ${b.at} streams`}
                  className={`absolute left-0 top-0 h-full rounded-r ${b.solid ? "bg-ink" : "border border-ink bg-white"}`}
                  style={{ width: `${(b.value / MAX) * 100}%` }}
                />
                <span className="absolute top-1/2 -translate-y-1/2 px-2 text-xs font-semibold tabular-nums" style={{ left: `${(b.value / MAX) * 100}%` }}>
                  ${b.value.toFixed(3)}
                </span>
                <span className="pointer-events-none absolute right-0 top-1/2 z-10 -translate-y-1/2 whitespace-nowrap rounded-md border border-rule bg-white px-2 py-1 text-xs shadow-sm opacity-0 transition-opacity group-hover:opacity-100">
                  {b.tok.toLocaleString()} tok/s at {b.at} streams, ${d.rate}/hr
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-ink-soft">$ per 1M output tokens, hourly rate divided by tokens per hour. On-demand list prices.</p>
    </div>
  );
}

export default function ServingFigure() {
  return (
    <figure>
      <div className="grid gap-10 xl:grid-cols-[1fr_18rem] xl:gap-14">
        <Chart />
        <CostBars />
      </div>
      <figcaption className="mt-6 text-sm text-ink-soft">
        <p>
          Inferentia2 stops at 32 streams because 32 GB of device memory holds about 48 resident sequences at 2048 context, and the KV budget is spent. Its decode latency stays flat across the sweep, 63 to 71 ms per token, while aggregate throughput grows 26x. Compared at 32 streams, an Inferentia2 token cost 2.4x an MI300X token and 1.8x an H200 token. At each side&apos;s best point the gap was 5.7x and 4.6x. No GPU ran on AWS in either study, so the like-for-like rental (g6e.xlarge, one L40S, $1.86/hr) is the open comparison.
        </p>
        <table className="mt-4 w-full border-collapse text-xs">
          <thead className="text-left">
            <tr className="border-b border-rule">
              <th className="py-1.5 pr-4 font-normal">What differs</th>
              <th className="py-1.5 pr-4 font-normal">Neuron study</th>
              <th className="py-1.5 font-normal">GPU study</th>
            </tr>
          </thead>
          <tbody>
            {servingConditions.map((r) => (
              <tr key={r[0]} className="border-b border-rule align-top">
                <td className="py-1.5 pr-4 text-ink">{r[0]}</td>
                <td className="py-1.5 pr-4">{r[1]}</td>
                <td className="py-1.5">{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
