import { ggufBf16Conditions, ggufBf16Decisions, ggufBf16Mixed, ggufBf16QuantFlips } from "@/lib/gguf-bf16";

// Two panels, one story: the same weights on a serving engine, and what that
// engine change did to the model's decisions. Top panel is vLLM on an H200 at
// rising concurrency, with the llama.cpp BF16 GGUF on an A100 as a dashed
// reference at one stream. Bottom panel puts the engine swap on the same scale
// as the quantization rungs, both counted as decisions changed away from the
// llama.cpp BF16 GGUF. Engine, GPU and kernels differ between the two runs, so
// nothing here separates engine from hardware.
const W = 760;
const LABEL = 140;
const R = 30;
const ROW = 27;
const X0 = LABEL;
const XMAX = W - R;
const INK = "#121614";
const BLUE = "#1e4fd8";
const SOFT = "#4a524c";
const RULE = "#d6dad4";

const P1_TOP = 56;
const P2_TITLE = 296;
const P2_TOP = 332;

const serving = ggufBf16Mixed;
const servingMax = 9000;
const servingTicks = [0, 2000, 4000, 6000, 8000];
const reference = ggufBf16Conditions.llamacpp.tg;

const decisions = [
  ...ggufBf16QuantFlips.map((r) => ({ label: r.rung, flips: r.flips, engine: false })),
  { label: "vLLM vs llama.cpp", flips: ggufBf16Decisions.flips, engine: true },
].sort((a, b) => a.flips - b.flips);
const decidedMax = 620;
const decidedTicks = [0, 200, 400, 600];

const H = P2_TOP + decisions.length * ROW + 48;

const fmt = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 0 });

type Axis = { x0: number; max: number; top: number; rows: number };

const axis = ({ x0, max, top, rows }: Axis) => ({
  x: (v: number) => x0 + (v / max) * (XMAX - x0),
  bottom: top + rows * ROW,
});

const bars = (top: number) => ({ y: (i: number) => top + i * ROW });

export default function EngineComparisonFigure() {
  const a1 = axis({ x0: X0, max: servingMax, top: P1_TOP, rows: serving.length });
  const a2 = axis({ x0: X0, max: decidedMax, top: P2_TOP, rows: decisions.length });
  const b1 = bars(P1_TOP);
  const b2 = bars(P2_TOP);
  const peak = serving[serving.length - 1];
  const q6 = ggufBf16QuantFlips.find((r) => r.rung === "Q6_K");
  const q8 = ggufBf16QuantFlips.find((r) => r.rung === "Q8_0");

  return (
    <div
      className="overflow-x-auto"
      tabIndex={0}
      role="region"
      aria-label="Engine comparison chart, scrolls sideways on small screens"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Two panels. Top: vLLM on an H200 serving the same weights, output tokens per second on a mixed shape, rising from ${serving[0].outputTps} at one concurrent request to ${peak.outputTps} at ${peak.concurrency}. A dashed line marks ${reference} tokens per second, the llama.cpp BF16 GGUF on an A100 at one stream. Bottom: decisions changed out of ${ggufBf16Decisions.examples.toLocaleString("en-US")}, counted against the llama.cpp BF16 GGUF. The engine swap changed ${ggufBf16Decisions.flips}, between Q8_0 at ${q8?.flips} and Q6_K at ${q6?.flips}; the worst rung, Q2_K, changed ${ggufBf16QuantFlips[ggufBf16QuantFlips.length - 1].flips}.`}
        className="w-full min-w-[42rem]"
      >
        <g fontSize={13} fontWeight={600} fill={INK}>
          <text x={X0} y={20}>
            vLLM on {ggufBf16Conditions.vllm.gpu}, mixed shape
          </text>
          <text x={X0} y={38} fontSize={12} fontWeight={400} fill={SOFT}>
            output tokens per second, one request to {peak.concurrency} concurrent
          </text>
        </g>
        {servingTicks.map((t) => (
          <g key={t} fontSize={12}>
            <line x1={a1.x(t)} x2={a1.x(t)} y1={P1_TOP - 10} y2={a1.bottom} stroke={RULE} />
            <text x={a1.x(t)} y={a1.bottom + 20} textAnchor="middle" fill={SOFT}>
              {fmt(t)}
            </text>
          </g>
        ))}
        <line
          x1={a1.x(reference)}
          x2={a1.x(reference)}
          y1={P1_TOP - 10}
          y2={a1.bottom}
          stroke={INK}
          strokeDasharray="4 4"
        />
        <text x={a1.x(reference) + 6} y={P1_TOP - 4} fontSize={11} fill={SOFT}>
          llama.cpp, A100, one stream: {reference}
        </text>
        {serving.map((r, i) => (
          <g key={r.concurrency} className="group" fontSize={12}>
            <rect
              x={X0}
              y={b1.y(i) + 5}
              width={Math.max(1, a1.x(r.outputTps) - X0)}
              height={ROW - 11}
              fill={BLUE}
              className="opacity-85 group-hover:opacity-100"
            />
            <text x={a1.x(r.outputTps) + 6} y={b1.y(i) + ROW / 2 + 4} fill={INK} className="tabular-nums group-hover:font-semibold">
              {r.outputTps.toLocaleString("en-US", { maximumFractionDigits: 1 })}
            </text>
          </g>
        ))}
        {serving.map((r, i) => (
          <text key={r.concurrency} x={0} y={b1.y(i) + ROW / 2 + 4} fontSize={12.5} fill={INK}>
            {r.concurrency === 1 ? "1 request" : `${r.concurrency} concurrent`}
          </text>
        ))}

        <g fontSize={13} fontWeight={600} fill={INK}>
          <text x={X0} y={P2_TITLE}>
            Decisions changed, of {ggufBf16Decisions.examples.toLocaleString("en-US")}
          </text>
          <text x={X0} y={P2_TITLE + 18} fontSize={12} fontWeight={400} fill={SOFT}>
            against the llama.cpp BF16 GGUF reference
          </text>
        </g>
        {decidedTicks.map((t) => (
          <g key={t} fontSize={12}>
            <line x1={a2.x(t)} x2={a2.x(t)} y1={P2_TOP - 10} y2={a2.bottom} stroke={RULE} />
            <text x={a2.x(t)} y={a2.bottom + 20} textAnchor="middle" fill={SOFT}>
              {fmt(t)}
            </text>
          </g>
        ))}
        {decisions.map((d, i) => (
          <g key={d.label} className="group" fontSize={12}>
            <rect
              x={X0}
              y={b2.y(i) + 5}
              width={Math.max(1, a2.x(d.flips) - X0)}
              height={ROW - 11}
              fill={d.engine ? INK : BLUE}
              className="opacity-85 group-hover:opacity-100"
            />
            <text
              x={a2.x(d.flips) + 6}
              y={b2.y(i) + ROW / 2 + 4}
              fill={INK}
              fontWeight={d.engine ? 600 : 400}
              className="tabular-nums group-hover:font-semibold"
            >
              {d.flips}
            </text>
          </g>
        ))}
        {decisions.map((d, i) => (
          <text
            key={d.label}
            x={0}
            y={b2.y(i) + ROW / 2 + 4}
            fontSize={12.5}
            fill={INK}
            fontWeight={d.engine ? 600 : 400}
          >
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
