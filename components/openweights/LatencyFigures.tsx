"use client";

import { useRef, useState } from "react";
import { latencyChips as chips, latencyModels as models, type LatencyPoint } from "@/lib/openweights-latency";

// The latency study's two figures, both following the model picked above them.
// Left, the latency map: time to first token against time per output token on
// log axes, one line per chip joining its llama.cpp point (a disc) to its
// ExecuTorch point (a ring), each chip named beside its disc. Right, every
// model on every chip as a dumbbell grid, the picked model banded. The runtime
// is the colour, as on the homepage: cobalt for ExecuTorch, grey for llama.cpp.
// Hover a point for its numbers, and on the map for its chip's pair alone; the
// table below the figures has every number.

const ET = "var(--color-blue)";
const LLAMA = "var(--color-ink-soft)";
const INK = "var(--color-ink)";
const SOFT = "var(--color-ink-soft)";
const RULE = "var(--color-rule)";

const ttft = (p: LatencyPoint) => `${p.ttft.toFixed(2)} s (${p.prefill} tok/s)`;
const tpot = (p: LatencyPoint) => `${p.tpot} ms (${(1000 / p.tpot).toFixed(1)} tok/s)`;
const log = Math.log10;

type Tip = { x: number; y: number; lines: string[]; chip?: number } | null;
type Show = (e: React.PointerEvent, lines: string[], chip?: number) => void;

// ---------- latency map ----------
const W = 640;
const H = 440;
const M = { l: 64, r: 20, t: 14, b: 46 };
const X0 = 0.25;
const X1 = 20;
const Y0 = 15;
const Y1 = 300;
const lx = (v: number) => M.l + ((log(v) - log(X0)) / (log(X1) - log(X0))) * (W - M.l - M.r);
const ly = (v: number) => H - M.b - ((log(v) - log(Y0)) / (log(Y1) - log(Y0))) * (H - M.t - M.b);
const XT = [0.3, 0.5, 1, 2, 5, 10, 20];
const YT = [20, 30, 50, 100, 200, 300];

type Pt = [number, number];

// Chip labels: candidate spots on two rings around each llama.cpp disc, scored
// against every point, every connector, the labels already placed and the
// chart's edge; the cheapest wins. A spot on the outer ring gets a leader line.
function placeLabels(llama: LatencyPoint[], et: LatencyPoint[]) {
  const pts: Pt[] = [];
  const segs: [Pt, Pt][] = [];
  chips.forEach((_, i) => {
    const A: Pt = [lx(llama[i].ttft), ly(llama[i].tpot)];
    const B: Pt = [lx(et[i].ttft), ly(et[i].tpot)];
    pts.push(A, B);
    segs.push([A, B]);
  });
  const segDist = (px: number, py: number, [[x1, y1], [x2, y2]]: [Pt, Pt]) => {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const l2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / l2));
    return Math.hypot(px - (x1 + t * vx), py - (y1 + t * vy));
  };
  const dirs = Array.from({ length: 16 }, (_, k) => [Math.cos((k * Math.PI) / 8), -Math.sin((k * Math.PI) / 8)]);
  const boxes: { x: number; y: number; w: number; h: number }[] = [];
  return chips.map((c, i) => {
    const ax = lx(llama[i].ttft);
    const ay = ly(llama[i].tpot);
    const w = c.short.length * 6.6;
    const h = 11;
    let best = { cost: Infinity, x0: 0, y0: 0, rad: 15 };
    for (const rad of [15, 30]) {
      dirs.forEach(([ux, uy], k) => {
        const cx = ax + ux * rad;
        const cy = ay + uy * rad;
        const x0 = ux > 0.3 ? cx : ux < -0.3 ? cx - w : cx - w / 2;
        const y0 = uy > 0.3 ? cy : uy < -0.3 ? cy - h : cy - h / 2;
        let cost = (rad > 15 ? 6 : 0) + Math.min(k, 16 - k) * 0.25;
        if (x0 < M.l + 2 || x0 + w > W - M.r - 2 || y0 < M.t || y0 + h > H - M.b - 2) cost += 1000;
        for (let q = 0; q <= 4; q++) {
          for (const [sx, sy] of [
            [x0 + (w * q) / 4, y0],
            [x0 + (w * q) / 4, y0 + h],
            [x0 + (w * q) / 4, y0 + h / 2],
          ]) {
            for (const P of pts) {
              const dd = Math.hypot(sx - P[0], sy - P[1]);
              if (dd < 13) cost += (13 - dd) * 8;
            }
            for (const S of segs) {
              const dd = segDist(sx, sy, S);
              if (dd < 6) cost += (6 - dd) * 6;
            }
          }
        }
        for (const B of boxes) {
          const ox = Math.min(x0 + w, B.x + B.w + 4) - Math.max(x0, B.x - 4);
          const oy = Math.min(y0 + h, B.y + B.h + 3) - Math.max(y0, B.y - 3);
          if (ox > 0 && oy > 0) cost += ox * oy * 3;
        }
        if (cost < best.cost) best = { cost, x0, y0, rad };
      });
    }
    boxes.push({ x: best.x0, y: best.y0, w, h });
    segs.push([
      [best.x0, best.y0 + h / 2],
      [best.x0 + w, best.y0 + h / 2],
    ]);
    const leader =
      best.rad > 15
        ? { x1: ax, y1: ay, x2: Math.max(best.x0, Math.min(ax, best.x0 + w)), y2: Math.max(best.y0, Math.min(ay, best.y0 + h)) }
        : null;
    return { text: c.short, x: best.x0, y: best.y0 + h - 1, leader };
  });
}

function LatencyMap({ m, active, show, hide }: { m: number; active?: number; show: Show; hide: () => void }) {
  const { name, llama, et } = models[m];
  const labels = placeLabels(llama, et);
  const dim = (i: number) => (active === undefined || active === i ? 1 : 0.2);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${name}: time to first token against time per output token on five phone chips, in llama.cpp and in ExecuTorch. The table below lists every value.`}
      className="w-full min-w-[34rem]"
    >
      {XT.map((t) => (
        <g key={t}>
          <line x1={lx(t)} x2={lx(t)} y1={M.t} y2={H - M.b} stroke={RULE} />
          <text x={lx(t)} y={H - M.b + 18} textAnchor="middle" fontSize={11.5} fill={SOFT} className="tabular-nums">
            {t < 1 ? t.toFixed(1) : t}
          </text>
        </g>
      ))}
      {YT.map((t) => (
        <g key={t}>
          <line x1={M.l} x2={W - M.r} y1={ly(t)} y2={ly(t)} stroke={RULE} />
          <text x={M.l - 8} y={ly(t) + 4} textAnchor="end" fontSize={11.5} fill={SOFT} className="tabular-nums">
            {t}
          </text>
        </g>
      ))}
      <text x={(M.l + W - M.r) / 2} y={H - 8} textAnchor="middle" fontSize={12} fill={SOFT}>
        Time to first token, seconds (lower and left is faster)
      </text>
      <text transform={`translate(16 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={12} fill={SOFT}>
        Time per output token, ms
      </text>
      {chips.map((c, i) => (
        <line
          key={c.name}
          x1={lx(llama[i].ttft)}
          y1={ly(llama[i].tpot)}
          x2={lx(et[i].ttft)}
          y2={ly(et[i].tpot)}
          stroke={INK}
          strokeOpacity={0.5 * dim(i)}
          strokeWidth={1.5}
        />
      ))}
      {labels.map((l, i) =>
        l.leader ? <line key={l.text} {...l.leader} stroke={INK} strokeOpacity={0.35 * dim(i)} strokeWidth={1} /> : null,
      )}
      {chips.map((c, i) => {
        const a = llama[i];
        const b = et[i];
        // Two points this close share one readout.
        const near = Math.hypot(lx(a.ttft) - lx(b.ttft), ly(a.tpot) - ly(b.tpot)) < 4;
        const both = [`${c.name}, both runtimes`, `llama.cpp: TTFT ${ttft(a)}, TPOT ${tpot(a)}`, `ExecuTorch: TTFT ${ttft(b)}, TPOT ${tpot(b)}`];
        const tipA = near ? both : [`${c.name}, llama.cpp`, `TTFT ${ttft(a)}`, `TPOT ${tpot(a)}`];
        const tipB = near ? both : [`${c.name}, ExecuTorch`, `TTFT ${ttft(b)}`, `TPOT ${tpot(b)}`];
        return (
          <g key={c.name} opacity={dim(i)}>
            <circle
              cx={lx(b.ttft)}
              cy={ly(b.tpot)}
              r={9}
              fill="none"
              stroke={ET}
              strokeWidth={2.4}
              pointerEvents="all"
              onPointerMove={(e) => show(e, tipB, i)}
              onPointerLeave={hide}
            />
            <circle
              cx={lx(a.ttft)}
              cy={ly(a.tpot)}
              r={6}
              fill={LLAMA}
              stroke="#ffffff"
              strokeWidth={1.5}
              onPointerMove={(e) => show(e, tipA, i)}
              onPointerLeave={hide}
            />
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text
          key={l.text}
          opacity={dim(i)}
          x={l.x}
          y={l.y}
          fontSize={11.5}
          fontWeight={600}
          fill={INK}
          stroke="#ffffff"
          strokeWidth={3}
          paintOrder="stroke"
          strokeLinejoin="round"
          className="pointer-events-none"
        >
          {l.text}
        </text>
      ))}
    </svg>
  );
}

// ---------- dumbbell grid ----------
const DW = 600;
const DH = 700;
const ROW = 19;
const GROUP_GAP = 16;
const G_TOP = 40;
const LEFT = 112;
const COL_GAP = 28;
const COL_W = (DW - LEFT - 16 - COL_GAP) / 2;
const SCALE_T: [number, number] = [0.25, 20];
const SCALE_P: [number, number] = [15, 300];
const sx = (v: number, c0: number, s: [number, number]) => c0 + ((log(v) - log(s[0])) / (log(s[1]) - log(s[0]))) * COL_W;

// Where each model's group and each chip's row sit, top to bottom.
const groups = (() => {
  let y = G_TOP + 8;
  return models.map((model, mi) => {
    const top = y;
    y += ROW - 2;
    const rows = chips.map((c, i) => {
      const row = { c, i, y };
      y += ROW;
      return row;
    });
    y += GROUP_GAP;
    return { model, mi, top, rows, divider: mi < models.length - 1 ? y - GROUP_GAP / 2 - 2 : null };
  });
})();

function Dumbbells({ m, show, hide }: { m: number; show: Show; hide: () => void }) {
  const c0 = LEFT;
  const c1 = LEFT + COL_W + COL_GAP;
  const cols = [
    { x0: c0, scale: SCALE_T, ticks: [0.3, 1, 3, 10], label: "TTFT, s", key: "ttft" as const, f: ttft },
    { x0: c1, scale: SCALE_P, ticks: [20, 50, 100, 200], label: "TPOT, ms", key: "tpot" as const, f: tpot },
  ];
  return (
    <svg
      viewBox={`0 0 ${DW} ${DH}`}
      role="img"
      aria-label={`Time to first token and time per output token for all five models on all five chips, in both runtimes, ${models[m].name} highlighted. The table below lists every value.`}
      className="w-full min-w-[32rem]"
    >
      {cols.map((col) => (
        <g key={col.key}>
          <text x={col.x0} y={11} fontSize={11.5} fontWeight={600} fill={SOFT}>
            {col.label}
          </text>
          {col.ticks.map((t) => {
            const x = sx(t, col.x0, col.scale);
            return (
              <g key={t}>
                <line x1={x} x2={x} y1={G_TOP - 6} y2={DH - 22} stroke={RULE} />
                <text x={x} y={G_TOP - 9} textAnchor="middle" fontSize={10.5} fill={SOFT} className="tabular-nums">
                  {t}
                </text>
              </g>
            );
          })}
        </g>
      ))}
      {groups.map((g) => {
        const on = g.mi === m;
        const h = ROW - 2 + chips.length * ROW + 6;
        return (
          <g key={g.model.name}>
            {on && (
              <>
                <rect x={4} y={g.top - 12} width={DW - 20} height={h} rx={6} fill="var(--color-bench)" />
                <rect x={4} y={g.top - 12} width={3} height={h} fill={ET} />
              </>
            )}
            <text x={14} y={g.top + 6} fontSize={12.5} fontWeight={on ? 700 : 600} fill={INK}>
              {g.model.name}
            </text>
            {g.rows.map(({ c, i, y: ry }) => {
              const a = g.model.llama[i];
              const b = g.model.et[i];
              return (
                <g key={c.name}>
                  <text x={LEFT - 10} y={ry + 4} textAnchor="end" fontSize={11} fill={SOFT}>
                    {c.short}
                  </text>
                  {cols.map((col) => {
                    const xa = sx(a[col.key], col.x0, col.scale);
                    const xb = sx(b[col.key], col.x0, col.scale);
                    const near = Math.abs(xa - xb) < 3;
                    const head = `${g.model.name}, ${c.name}`;
                    const both = [head, `llama.cpp ${col.f(a)}`, `ExecuTorch ${col.f(b)}`];
                    return (
                      <g key={col.key}>
                        <line x1={xa} x2={xb} y1={ry} y2={ry} stroke={INK} strokeOpacity={0.3} strokeWidth={1.5} />
                        <circle
                          cx={xb}
                          cy={ry}
                          r={6}
                          fill="none"
                          stroke={ET}
                          strokeWidth={1.8}
                          pointerEvents="all"
                          onPointerMove={(e) => show(e, near ? both : [head, `ExecuTorch ${col.f(b)}`])}
                          onPointerLeave={hide}
                        />
                        <circle
                          cx={xa}
                          cy={ry}
                          r={3.8}
                          fill={LLAMA}
                          onPointerMove={(e) => show(e, near ? both : [head, `llama.cpp ${col.f(a)}`])}
                          onPointerLeave={hide}
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}
            {g.divider !== null && <line x1={10} x2={DW - 16} y1={g.divider} y2={g.divider} stroke={RULE} />}
          </g>
        );
      })}
    </svg>
  );
}

const Key = () => (
  <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
    <span className="inline-flex items-center gap-2">
      <svg aria-hidden width={14} height={14} viewBox="0 0 14 14">
        <circle cx={7} cy={7} r={5} fill={LLAMA} />
      </svg>
      llama.cpp, GGUF
    </span>
    <span className="inline-flex items-center gap-2">
      <svg aria-hidden width={16} height={16} viewBox="0 0 16 16">
        <circle cx={8} cy={8} r={6} fill="none" stroke={ET} strokeWidth={2.2} />
      </svg>
      ExecuTorch
    </span>
  </p>
);

const Scroll = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div
    role="region"
    aria-label={`${label}, scrolls sideways on small screens`}
    tabIndex={0}
    className="mt-4 overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
  >
    {children}
  </div>
);

export default function LatencyFigures() {
  const [m, setM] = useState(models.findIndex((x) => x.name === "Qwen3 1.7B"));
  const [tip, setTip] = useState<Tip>(null);
  const box = useRef<HTMLDivElement>(null);
  const show: Show = (e, lines, chip) => {
    const r = box.current!.getBoundingClientRect();
    setTip({ x: Math.max(110, Math.min(e.clientX - r.left, r.width - 110)), y: e.clientY - r.top, lines, chip });
  };
  const hide = () => setTip(null);
  return (
    <div ref={box} className="relative">
      <div role="group" aria-label="Model" className="flex flex-wrap gap-2">
        {models.map((x, i) => (
          <button
            key={x.name}
            type="button"
            aria-pressed={i === m}
            onClick={() => setM(i)}
            className={`rounded-full border px-4 py-2 text-sm ${i === m ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-ink"}`}
          >
            {x.name}
          </button>
        ))}
      </div>
      <div className="mt-8 grid items-start gap-6 xl:grid-cols-2">
        <figure className="min-w-0 rounded-[1.5rem] bg-white p-5 sm:p-6">
          <h3 className="display text-xl">Latency map</h3>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            Each line joins one chip&apos;s two runtimes. Lower and left is faster. Both axes are logarithmic.
          </p>
          <div className="mt-3">
            <Key />
          </div>
          <Scroll label="Latency map">
            <LatencyMap m={m} active={tip?.chip} show={show} hide={hide} />
          </Scroll>
        </figure>
        <figure className="min-w-0 rounded-[1.5rem] bg-white p-5 sm:p-6">
          <h3 className="display text-xl">All models, all chips</h3>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            The same numbers as a grid, both columns on logarithmic scales. The model picked above is banded.
          </p>
          <div className="mt-3">
            <Key />
          </div>
          <Scroll label="All models, all chips">
            <Dumbbells m={m} show={show} hide={hide} />
          </Scroll>
        </figure>
      </div>
      {tip && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-rule bg-white px-3 py-2 text-xs leading-5 shadow-sm"
          style={{ left: tip.x, top: tip.y - 12 }}
        >
          {tip.lines.map((l, i) => (
            <span key={l} className={`block tabular-nums ${i === 0 ? "font-medium text-ink" : "text-ink-soft"}`}>
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
