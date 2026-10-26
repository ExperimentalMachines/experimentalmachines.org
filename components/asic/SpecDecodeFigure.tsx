import { specDecode } from "@/lib/neuron";

// Tokens per second (ink, left axis) and draft agreement (blue, right axis)
// over the number of draft tokens per call, on one Trainium1.
const W = 720;
const H = 340;
const L = 56;
const R = 76;
const TOP = 40;
const BOTTOM = 52;
const PW = W - L - R;
const PH = H - TOP - BOTTOM;
const INK = "var(--color-ink)";
const BLUE = "var(--color-blue)";
const SOFT = "var(--color-ink-soft)";
const RULE = "var(--color-rule)";

const xs = (k: number) => L + (k / 10) * PW;
const yt = (v: number) => TOP + PH - (v / 90) * PH;
const ya = (v: number) => TOP + PH - ((v - 60) / 40) * PH;

export default function SpecDecodeFigure() {
  const tokPath = specDecode.map((d, i) => `${i ? "L" : "M"}${xs(d.k).toFixed(1)},${yt(d.tok).toFixed(1)}`).join(" ");
  const agr = specDecode.filter((d) => d.agreement !== null);
  const agrPath = agr.map((d, i) => `${i ? "L" : "M"}${xs(d.k).toFixed(1)},${ya(d.agreement!).toFixed(1)}`).join(" ");
  return (
    <figure>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Speculative decoding chart, scrolls sideways on small screens">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Tokens per second rises from 31.6 with no draft to 78.5 at ten draft tokens, 2.48x, while the share of accepted draft tokens falls from 96.6% to 70.9%."
          className="w-full min-w-[40rem]"
        >
          <rect x={L} y={TOP} width={PW} height={PH} fill="#ffffff" />
          {[0, 30, 60, 90].map((v) => (
            <g key={v} fontSize={12}>
              <line x1={L} x2={L + PW} y1={yt(v)} y2={yt(v)} stroke={RULE} strokeDasharray="3 4" />
              <text x={L - 8} y={yt(v) + 4} textAnchor="end" fill={INK}>
                {v}
              </text>
            </g>
          ))}
          {[60, 80, 100].map((v) => (
            <text key={v} x={L + PW + 8} y={ya(v) + 4} fontSize={12} fill={BLUE}>
              {v}%
            </text>
          ))}
          <text x={L - 8} y={TOP - 12} textAnchor="end" fontSize={12} fill={INK}>
            tok/s
          </text>
          <text x={L + PW + 8} y={TOP - 12} fontSize={12} fill={BLUE}>
            accepted
          </text>
          <path d={tokPath} fill="none" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <path d={agrPath} fill="none" stroke={BLUE} strokeWidth={2.5} strokeLinejoin="round" />
          {specDecode.map((d, i) => {
            const prev = i ? (specDecode[i - 1].k + d.k) / 2 : -0.5;
            const next = i < specDecode.length - 1 ? (specDecode[i + 1].k + d.k) / 2 : 10.5;
            const right = d.k >= 6;
            const bx = right ? xs(d.k) - 10 - 190 : xs(d.k) + 10;
            return (
              <g key={d.k} className="group" fontSize={13}>
                <rect x={xs(prev)} y={TOP} width={xs(next) - xs(prev)} height={PH} fill="transparent" />
                <line x1={xs(d.k)} x2={xs(d.k)} y1={TOP} y2={TOP + PH} stroke={SOFT} strokeDasharray="3 4" className="pointer-events-none opacity-0 group-hover:opacity-100" />
                <circle cx={xs(d.k)} cy={yt(d.tok)} r={3.5} fill={INK} className="group-hover:[r:6px]" />
                {d.agreement !== null && <circle cx={xs(d.k)} cy={ya(d.agreement)} r={3.5} fill={BLUE} className="group-hover:[r:6px]" />}
                <text x={xs(d.k)} y={TOP + PH + 20} textAnchor="middle" fill={SOFT} className="group-hover:font-semibold">
                  {d.k}
                </text>
                <g className="pointer-events-none opacity-0 group-hover:opacity-100">
                  <rect x={bx} y={TOP + 8} width={190} height={66} fill="#ffffff" stroke={RULE} rx={8} />
                  <text x={bx + 10} y={TOP + 27} fill={SOFT}>
                    {d.k === 0 ? "no draft" : `${d.k} draft tokens per call`}
                  </text>
                  <text x={bx + 10} y={TOP + 46} fill={INK} fontWeight={600}>
                    {d.tok} tok/s, {(d.tok / specDecode[0].tok).toFixed(2)}x
                  </text>
                  <text x={bx + 10} y={TOP + 65} fill={BLUE} fontWeight={600}>
                    {d.agreement === null ? "target only" : `${d.agreement}% of drafts accepted`}
                  </text>
                </g>
              </g>
            );
          })}
          <text x={L} y={H - 10} fontSize={13} fill={SOFT}>
            Draft tokens per call. Llama 3.1 8B target, Llama 3.2 1B draft, greedy, 39 prompts, 43k tokens.
          </text>
        </svg>
      </div>
      <figcaption className="mt-3 text-sm text-ink-soft">
        Single-stream decode on one Trainium1. The 1B draft proposes k tokens and the 8B target verifies them in one pass, so throughput rises until rejected drafts cost more than they save. Agreement is the share of drafted tokens the target kept, a speed statistic, not an accuracy score.
      </figcaption>
    </figure>
  );
}
