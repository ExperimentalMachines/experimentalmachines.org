import { ggufRecommended, ggufRows } from "@/lib/gguf";

// Two panels on one axis of formats: generation (128 tokens) and prompt
// processing (2,048 tokens), tokens per second on one A100. Formats run from
// smallest file to largest, BF16 last. The dashed line in each panel is BF16,
// so every bar reads against the unquantized model. Whiskers are one standard
// deviation over the repetitions. Hover a row to lift it.
const W = 760;
const LABEL = 118;
const GAP = 44;
const R = 20;
const TOP = 58;
const ROW = 27;
const PANEL = (W - LABEL - GAP - R) / 2;
const H = TOP + ggufRows.length * ROW + 36;
const INK = "#121614";
const BLUE = "#1e4fd8";
const SOFT = "#4a524c";
const RULE = "#d6dad4";

const panels = [
  { key: "tg" as const, sd: "tgSd" as const, title: "Generation, 128 tokens", max: 400, ticks: [0, 100, 200, 300, 400], x0: LABEL },
  { key: "pp" as const, sd: "ppSd" as const, title: "Prompt, 2,048 tokens", max: 26000, ticks: [0, 10000, 20000], x0: LABEL + PANEL + GAP },
];

const rows = [...ggufRows].sort((a, b) => (a.format === "BF16" ? 1 : b.format === "BF16" ? -1 : a.bytes - b.bytes));
const bf16 = ggufRows.find((r) => r.format === "BF16")!;
const fmt = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 1 });

export default function ThroughputFigure() {
  return (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Throughput chart, scrolls sideways on small screens">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Tokens per second for each GGUF format on one A100. BF16 generates ${fmt(bf16.tg)} and processes ${fmt(bf16.pp)} prompt tokens per second; the quantized formats generate ${fmt(Math.min(...rows.filter((r) => r !== bf16).map((r) => r.tg)))} to ${fmt(Math.max(...rows.filter((r) => r !== bf16).map((r) => r.tg)))} and process ${fmt(Math.min(...rows.filter((r) => r !== bf16).map((r) => r.pp)))} to ${fmt(Math.max(...rows.filter((r) => r !== bf16).map((r) => r.pp)))}.`}
        className="w-full min-w-[42rem]"
      >
        {panels.map((p) => {
          const xs = (v: number) => p.x0 + (v / p.max) * PANEL;
          return (
            <g key={p.key}>
              <text x={p.x0} y={20} fontSize={13} fontWeight={600} fill={INK}>
                {p.title}
              </text>
              <text x={p.x0} y={38} fontSize={12} fill={SOFT}>
                tokens per second
              </text>
              {p.ticks.map((t) => (
                <g key={t} fontSize={12}>
                  <line x1={xs(t)} x2={xs(t)} y1={TOP - 8} y2={TOP + rows.length * ROW} stroke={RULE} />
                  <text x={xs(t)} y={TOP + rows.length * ROW + 18} textAnchor="middle" fill={SOFT}>
                    {t.toLocaleString("en-US")}
                  </text>
                </g>
              ))}
              <line x1={xs(bf16[p.key])} x2={xs(bf16[p.key])} y1={TOP - 8} y2={TOP + rows.length * ROW} stroke={INK} strokeDasharray="4 4" />
              {rows.map((r, i) => {
                const y = TOP + i * ROW;
                const isBase = r.format === "BF16";
                const v = r[p.key];
                const sd = r[p.sd];
                return (
                  <g key={r.format} className="group" fontSize={12}>
                    <rect x={p.x0} y={y + 5} width={xs(v) - p.x0} height={ROW - 10} fill={isBase ? INK : BLUE} className="opacity-85 group-hover:opacity-100" />
                    <line x1={xs(Math.max(0, v - sd))} x2={xs(v + sd)} y1={y + ROW / 2} y2={y + ROW / 2} stroke={isBase ? SOFT : INK} strokeWidth={1.5} />
                    <text x={xs(v + sd) + 6} y={y + ROW / 2 + 4} fill={INK} className="tabular-nums group-hover:font-semibold">
                      {fmt(v)}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
        {rows.map((r, i) => (
          <text key={r.format} x={0} y={TOP + i * ROW + ROW / 2 + 4} fontSize={12.5} fill={INK} fontWeight={r.format === ggufRecommended || r.format === "BF16" ? 600 : 400}>
            {r.format}
            <tspan fill={SOFT} fontWeight={400}>
              {` ${r.gib.toFixed(2)} GiB`}
            </tspan>
          </text>
        ))}
      </svg>
    </div>
  );
}
