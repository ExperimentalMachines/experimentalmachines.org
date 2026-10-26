"use client";

import { useRef, useState } from "react";
import { ChipKey, Mark, chip, chips } from "@/components/openweights/chips";
import {
  windowCells,
  windowConditions,
  windowControl,
  windowIdent,
  windowProbe,
  windowRatio,
  type WindowCell,
} from "@/lib/openweights-window";

// The window study's four charts, all following the condition picked above
// them: resident memory after load, the paired speed probe, grades by window
// and replies identical to the largest window. The geometry and scales are the
// original page's. Each phone keeps its colour and marker shape (chips.tsx);
// hollow markers are a second run of the same file. Hover or focus a point for
// its numbers; "Every number" below the charts has them all.

const INK = "var(--color-ink)";
const SOFT = "var(--color-ink-soft)";
const RULE = "var(--color-rule)";
// The charts sit on the bench tint, so halos and hollow markers are filled with it.
const PANEL = "var(--color-bench)";
const WARN = "#b4452b";
const BAND = `color-mix(in srgb, ${WARN} 7%, transparent)`;

const SHORT: Record<string, string> = Object.fromEntries(windowConditions.map((c) => [c.model, c.label]));
const MODELS = windowConditions.map((c) => c.model);
const baseOf = (m: string) => m.split(" (")[0];
const BASES = [...new Set(MODELS.map(baseOf))];
const WINDOWS = [2, 4, 8, 16, 32];
const win = (s: string) => parseInt(s);
const cellsOf = (m: string) => windowCells.filter((c) => c.model === m);
const complete = (c: WindowCell) => !c.gsm8k.startsWith("INCOMPLETE");
const frac = (s: string) => {
  const m = /(\d+)\/(\d+)/.exec(s);
  return m ? [+m[1], +m[2]] : null;
};
const ratioOf = (s: string) => {
  const m = /([\d.]+) \(([\d.]+) to ([\d.]+)\)/.exec(s);
  return m ? [+m[1], +m[2], +m[3]] : null;
};
const winsOf = (m: string) => [...new Set(cellsOf(m).map((c) => win(c.window)))].sort((a, b) => a - b);
const adjacent = (a: number, b: number) => WINDOWS.indexOf(b) - WINDOWS.indexOf(a) === 1;
const shortName = (m: string) => SHORT[m].split(",")[0];
// x is the window on a log2 scale, 2k to 32k.
const xw = (w: number, l: number, r: number) => l + ((Math.log2(w) - 1) / (5 - 1)) * (r - l);

type Tip = { x: number; y: number; lines: string[] } | null;
// The props that make an SVG mark a focusable point with a readout.
type PointProps = {
  tabIndex: number;
  role: string;
  "aria-label": string;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerLeave: () => void;
  onFocus: (e: React.FocusEvent) => void;
  onBlur: () => void;
};
type Pt = (text: string) => PointProps;
type ChartProps = { model: string; pt: Pt };

// An × where a run ended early or compared too few prompts.
const Cross = ({ x, y, color, ...rest }: { x: number; y: number; color: string } & PointProps) => (
  <g pointerEvents="all" {...rest}>
    <line x1={x - 4} x2={x + 4} y1={y - 4} y2={y + 4} stroke={color} strokeWidth={2} />
    <line x1={x - 4} x2={x + 4} y1={y + 4} y2={y - 4} stroke={color} strokeWidth={2} />
  </g>
);

function WindowAxis({ l, r, t, b, H, label }: { l: number; r: number; t: number; b: number; H: number; label: string }) {
  return (
    <>
      {WINDOWS.map((w) => (
        <g key={w}>
          <line x1={xw(w, l, r)} x2={xw(w, l, r)} y1={t} y2={b} stroke={RULE} />
          <text x={xw(w, l, r)} y={b + 18} textAnchor="middle" fontSize={11.5} fill={SOFT} className="tabular-nums">
            {w}k
          </text>
        </g>
      ))}
      <text x={(l + r) / 2} y={H - 6} textAnchor="middle" fontSize={12} fill={SOFT}>
        {label}
      </text>
    </>
  );
}

// ---------- memory ----------
function MemoryChart({ model, pt }: ChartProps) {
  const W = 640;
  const H = 360;
  const M = { l: 58, r: 20, t: 16, b: 44 };
  const YMAX = 9000;
  const y = (mb: number) => H - M.b - (mb / YMAX) * (H - M.t - M.b);
  const x = (w: number) => xw(w, M.l, W - M.r);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label={`Resident memory after load against exported window, ${SHORT[model]} highlighted`}
      className="w-full min-w-[34rem]"
    >
      {[0, 2, 4, 6, 8].map((gb) => (
        <g key={gb}>
          <line x1={M.l} x2={W - M.r} y1={y(gb * 1000)} y2={y(gb * 1000)} stroke={RULE} />
          <text x={M.l - 8} y={y(gb * 1000) + 4} textAnchor="end" fontSize={11.5} fill={SOFT} className="tabular-nums">
            {gb} GB
          </text>
        </g>
      ))}
      <WindowAxis l={M.l} r={W - M.r} t={M.t} b={H - M.b} H={H} label="Exported context window, tokens" />
      <line x1={M.l} x2={W - M.r} y1={y(6000)} y2={y(6000)} stroke={SOFT} strokeDasharray="4 4" />
      <text x={M.l + 6} y={y(6000) - 6} fontSize={11.5} fill={SOFT}>
        Samsung Heimdall threshold seen in the S25 Ultra and S24+ logs, 6 GB
      </text>
      {BASES.map((m) => {
        const pts = windowProbe
          .filter((p) => p.file.startsWith(m + "-"))
          .map((p) => [win(p.file.slice(m.length + 1)), p.rss] as const)
          .sort((a, b) => a[0] - b[0]);
        const on = m === baseOf(model);
        const col = on ? INK : SOFT;
        const last = pts[pts.length - 1];
        return (
          <g key={m}>
            <path
              d={pts.map((p, i) => `${i ? "L" : "M"}${x(p[0])},${y(p[1])}`).join(" ")}
              fill="none"
              stroke={col}
              strokeWidth={on ? 2.2 : 1.2}
              strokeDasharray={on ? undefined : "2 3"}
              opacity={on ? 1 : 0.7}
            />
            {pts.map((p) => {
              const cell = cellsOf(m).find((c) => win(c.window) === p[0]);
              const t =
                `${shortName(m)} at ${p[0]}k\nResident after load ${(p[1] / 1000).toFixed(2)} GB\nFile ${cell ? cell.file : "-"}` +
                (pts.length > 1
                  ? `\nResident-process delta against ${pts[0][0]}k: ${((p[1] - pts[0][1]) / 1000).toFixed(2)} GB (whole process, not a KV-only measurement)`
                  : "");
              return <circle key={p[0]} cx={x(p[0])} cy={y(p[1])} r={on ? 5.5 : 4} fill={on ? INK : PANEL} stroke={col} strokeWidth={1.6} {...pt(t)} />;
            })}
            <text
              x={x(last[0]) - 9}
              y={y(last[1]) - 9}
              textAnchor="end"
              fontSize={11.5}
              fontWeight={on ? 700 : 500}
              fill={col}
              stroke={PANEL}
              strokeWidth={3}
              paintOrder="stroke"
              className="pointer-events-none"
            >
              {shortName(m)} {(last[1] / 1000).toFixed(1)} GB
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------- speed ----------
function SpeedChart({ model, pt }: ChartProps) {
  const W = 640;
  const H = 360;
  const M = { l: 58, r: 20, t: 16, b: 44 };
  const Y0 = 0.75;
  const Y1 = 1.25;
  const y = (v: number) => H - M.b - ((v - Y0) / (Y1 - Y0)) * (H - M.t - M.b);
  const base = baseOf(model);
  const rows = windowRatio.filter((r) => r.file.startsWith(base + "-"));
  const first = rows[0] && win(rows[0].file.slice(base.length + 1));
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label={`${SHORT[model]}: prefill and decode throughput ratio against its smallest window`}
      className="w-full min-w-[34rem]"
    >
      {[0.8, 0.9, 1, 1.1, 1.2].map((v) => (
        <g key={v}>
          <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke={v === 1 ? SOFT : RULE} strokeDasharray={v === 1 ? "4 4" : undefined} />
          <text x={M.l - 8} y={y(v) + 4} textAnchor="end" fontSize={11.5} fill={SOFT} className="tabular-nums">
            {v.toFixed(2)}
          </text>
        </g>
      ))}
      <WindowAxis l={M.l} r={W - M.r} t={M.t} b={H - M.b} H={H} label="Exported context window, tokens" />
      <text transform={`translate(14 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={12} fill={SOFT}>
        Throughput vs smallest window
      </text>
      {rows.map((r) => {
        const w = win(r.file.slice(base.length + 1));
        const x = xw(w, M.l, W - M.r);
        const pr = windowProbe.find((q) => q.file === r.file);
        const marks: [number[] | null, number, boolean][] = [
          [ratioOf(r.prefill), x - 7 + (w === 2 ? 8 : 0), true],
          [ratioOf(r.decode), x + 7 + (w === 2 ? 8 : 0), false],
        ];
        return (
          <g key={r.file}>
            {marks.map(([v, xx, solid]) => {
              if (!v) return null;
              const vv = v.map((k) => Math.max(Y0, Math.min(Y1, k)));
              const t = `${shortName(base)} at ${w}k, ${solid ? "prefill" : "decode"}\n${(v[0] * 100).toFixed(1)}% of the ${first}k rate (range ${(v[1] * 100).toFixed(0)} to ${(v[2] * 100).toFixed(0)}%)\n${
                pr ? (solid ? `Median ${pr.prefill.split(" ")[0]} tok/s prefill, ${pr.prefill_ms} ms for 929 tokens` : `Median ${pr.decode.split(" ")[0]} tok/s decode`) : ""
              }`;
              return (
                <g key={solid ? "prefill" : "decode"}>
                  <line x1={xx} x2={xx} y1={y(vv[1])} y2={y(vv[2])} stroke={INK} strokeWidth={1.4} opacity={0.55} />
                  {solid ? (
                    <circle cx={xx} cy={y(vv[0])} r={5.5} fill={INK} {...pt(t)} />
                  ) : (
                    <circle cx={xx} cy={y(vv[0])} r={6.5} fill={PANEL} stroke={INK} strokeWidth={2} {...pt(t)} />
                  )}
                  {(v[2] > Y1 || v[1] < Y0) && (
                    <text x={xx} y={v[2] > Y1 ? M.t + 10 : H - M.b - 4} textAnchor="middle" fontSize={10} fill={SOFT}>
                      {v[2] > Y1 ? `↑ ${v[2].toFixed(2)}` : `↓ ${v[1].toFixed(2)}`}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      <text x={M.l + 8} y={M.t + 10} fontSize={11} fill={SOFT}>
        above the dashed line is faster than the smallest window; bars are the min to max of six paired turns
      </text>
    </svg>
  );
}

// ---------- grades ----------
function GradesChart({ model, pt }: ChartProps) {
  const W = 640;
  const H = 380;
  const M = { l: 40, r: 12, t: 30, b: 44 };
  const gap = 26;
  const cw = (W - M.l - M.r - 2 * gap) / 3;
  const y = (v: number) => H - M.b - (v / 30) * (H - M.t - M.b);
  const cells = cellsOf(model);
  const cens = model.includes("2.6B") && !model.includes("cap");
  const sets = [
    ["gsm8k", "GSM8K"],
    ["ifeval", "IFEval"],
    ["bfcl", "BFCL"],
  ] as const;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label={`${SHORT[model]}: prompts passed per set against exported window, per chip`}
      className="w-full min-w-[34rem]"
    >
      {sets.map(([k, label], i) => {
        const l = M.l + i * (cw + gap);
        const r = l + cw;
        const x = (w: number) => xw(w, l + 6, r - 6);
        return (
          <g key={k}>
            {cens && k !== "bfcl" && <rect x={l - 8} y={M.t - 6} width={cw + 16} height={H - M.b - M.t + 6} fill={BAND} rx={4} />}
            <text x={l} y={M.t - 12} fontSize={12} fontWeight={600} fill={INK}>
              {label}
              {cens && k !== "bfcl" && (
                <tspan fontWeight={500} fill={WARN}>
                  {" "}
                  cap-censored
                </tspan>
              )}
            </text>
            {[0, 10, 20, 30].map((v) => (
              <g key={v}>
                <line x1={l} x2={r} y1={y(v)} y2={y(v)} stroke={RULE} />
                {i === 0 && (
                  <text x={M.l - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill={SOFT} className="tabular-nums">
                    {v}
                  </text>
                )}
              </g>
            ))}
            {WINDOWS.map((w) => (
              <text key={w} x={x(w)} y={H - M.b + 16} textAnchor="middle" fontSize={10.5} fill={SOFT} className="tabular-nums">
                {w}k
              </text>
            ))}
            {chips.map((c) => {
              const mine = cells.filter((cell) => cell.phone === c.id && complete(cell) && frac(cell[k])).sort((a, b) => win(a.window) - win(b.window));
              return (
                <g key={c.id}>
                  {mine.slice(1).map((b, j) => {
                    const a = mine[j];
                    if (!adjacent(win(a.window), win(b.window))) return null;
                    return (
                      <line
                        key={b.window}
                        x1={x(win(a.window))}
                        y1={y(frac(a[k])![0])}
                        x2={x(win(b.window))}
                        y2={y(frac(b[k])![0])}
                        stroke={c.color}
                        strokeWidth={1.4}
                        opacity={0.6}
                      />
                    );
                  })}
                  {mine.map((cell) => (
                    <Mark
                      key={cell.window}
                      shape={c.shape}
                      x={x(win(cell.window))}
                      y={y(frac(cell[k])![0])}
                      r={5}
                      fill={c.color}
                      stroke={PANEL}
                      strokeWidth={1.2}
                      {...pt(`${SHORT[model]} at ${cell.window} on the ${c.name}\n${label} ${cell[k]} passed\nCapped replies ${cell.capped}`)}
                    />
                  ))}
                  {cells
                    .filter((cell) => cell.phone === c.id + " repeat" && frac(cell[k]))
                    .map((cell) => (
                      <Mark
                        key={`${cell.window} repeat`}
                        shape={c.shape}
                        x={x(win(cell.window))}
                        y={y(frac(cell[k])![0])}
                        r={7}
                        fill="none"
                        stroke={c.color}
                        strokeWidth={2}
                        pointerEvents="all"
                        {...pt(`${SHORT[model]} at ${cell.window} on the ${c.name}, second run of the same file\n${label} ${cell[k]} passed`)}
                      />
                    ))}
                  {cells
                    .filter((cell) => cell.phone === c.id && !complete(cell))
                    .map((cell) => {
                      const n = /after (\d+)\/(\d+)/.exec(cell.gsm8k);
                      return (
                        <Cross
                          key={`${cell.window} incomplete`}
                          x={x(win(cell.window))}
                          y={y(0)}
                          color={c.color}
                          {...pt(
                            `${SHORT[model]} at ${cell.window} on the ${c.name}\nIncomplete: the process ended after ${n ? n[1] : "?"} of 90 prompts\nResident after load ${cell.rss_load} MB`,
                          )}
                        />
                      );
                    })}
                </g>
              );
            })}
          </g>
        );
      })}
      {model.includes("cap") && (
        <>
          <text x={M.l + 2 * (cw + gap)} y={(M.t + H - M.b) / 2} fontSize={11.5} fill={SOFT}>
            BFCL was not rerun: the
          </text>
          <text x={M.l + 2 * (cw + gap)} y={(M.t + H - M.b) / 2 + 15} fontSize={11.5} fill={SOFT}>
            640-cap calls were already usable
          </text>
        </>
      )}
      {cells.some((c) => !complete(c)) && (
        <text x={W - M.r} y={H - M.b + 32} textAnchor="end" fontSize={11} fill={SOFT}>
          × the run ended before the set did: no grade
        </text>
      )}
    </svg>
  );
}

// ---------- identity ----------
type Identity = { raw: number[]; calls: number[]; content: number[] };
const parseIdentity = (s: string): Identity | null => {
  const m = /raw (\d+)\/(\d+), calls (\d+)\/(\d+), content (\d+)\/(\d+)/.exec(s);
  return m ? { raw: [+m[1], +m[2]], calls: [+m[3], +m[4]], content: [+m[5], +m[6]] } : null;
};

function IdentChart({ model, pt }: ChartProps) {
  const W = 640;
  const H = 392;
  const M = { l: 40, r: 12, t: 30, b: 56 };
  const gap = 26;
  const cw = (W - M.l - M.r - 2 * gap) / 3;
  const y = (v: number) => H - M.b - v * (H - M.t - M.b);
  const wins = winsOf(model);
  const largest = wins[wins.length - 1];
  const others = wins.slice(0, -1);
  const rows = windowIdent.filter((r) => r.model === model);
  const ctrl = windowControl.filter((r) => r.model === model);
  const kinds = [
    ["raw", "Raw token stream"],
    ["calls", "Parsed tool calls"],
    ["content", "Shown text"],
  ] as const;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label={`${SHORT[model]}: share of replies identical to the largest window, per phone and window`}
      className="w-full min-w-[34rem]"
    >
      {kinds.map(([k, label], i) => {
        const l = M.l + i * (cw + gap);
        const r = l + cw;
        const xs = others.map((w, j) => (others.length > 1 ? l + 10 + (j * (cw - 20)) / (others.length - 1) : (l + r) / 2));
        return (
          <g key={k}>
            <text x={l} y={M.t - 12} fontSize={12} fontWeight={600} fill={INK}>
              {label}
            </text>
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <g key={v}>
                <line x1={l} x2={r} y1={y(v)} y2={y(v)} stroke={RULE} />
                {i === 0 && (
                  <text x={M.l - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill={SOFT} className="tabular-nums">
                    {Math.round(v * 100)}%
                  </text>
                )}
              </g>
            ))}
            {others.map((w, j) => (
              <text key={w} x={xs[j]} y={H - M.b + 22} textAnchor="middle" fontSize={10.5} fill={SOFT} className="tabular-nums">
                {w}k
              </text>
            ))}
            {i === 1 && (
              <text x={(l + r) / 2} y={H - 4} textAnchor="middle" fontSize={11.5} fill={SOFT}>
                Window compared with the {largest}k export
              </text>
            )}
            {ctrl.map((c) => {
              const p = parseIdentity(c.identity);
              if (!p || !p[k][1]) return null;
              const v = p[k][0] / p[k][1];
              const ch = chip(c.phone);
              return (
                <line
                  key={`${c.window} ${c.phone}`}
                  x1={l}
                  x2={r}
                  y1={y(v)}
                  y2={y(v)}
                  stroke={ch ? ch.color : SOFT}
                  strokeDasharray="4 4"
                  strokeWidth={1.4}
                  pointerEvents="stroke"
                  {...pt(`${SHORT[model]} ${c.window}, same file twice on the ${ch ? ch.name : c.phone}\n${label}: ${p[k][0]} of ${p[k][1]} identical`)}
                />
              );
            })}
            {rows.map((rw) => {
              const rep = rw.phone.endsWith(" repeat");
              const ch = chip(rw.phone.replace(" repeat", ""));
              if (!ch) return null;
              return (
                <g key={rw.phone}>
                  {rw.values.map((val, j) => {
                    const p = parseIdentity(val);
                    if (!p || !p[k][1]) return null;
                    const v = p[k][0] / p[k][1];
                    const t = `${SHORT[model]}, ${others[j]}k against ${largest}k on the ${ch.name}${rep ? " (second run of the " + others[j] + "k)" : ""}\n${label}: ${p[k][0]} of ${p[k][1]} identical`;
                    const full = p[k][1] >= (k === "calls" ? 30 : model.includes("cap") ? 60 : 90);
                    if (!full) {
                      return (
                        <Cross
                          key={j}
                          x={xs[j] + (chips.indexOf(ch) - 1.5) * 9}
                          y={y(v)}
                          color={ch.color}
                          {...pt(`${t}\nOnly ${p[k][1]} prompts were completed by both runs: not a full comparison`)}
                        />
                      );
                    }
                    return rep ? (
                      <Mark key={j} shape={ch.shape} x={xs[j]} y={y(v)} r={7} fill="none" stroke={ch.color} strokeWidth={2} pointerEvents="all" {...pt(t)} />
                    ) : (
                      <Mark key={j} shape={ch.shape} x={xs[j]} y={y(v)} r={5} fill={ch.color} stroke={PANEL} strokeWidth={1.2} {...pt(t)} />
                    );
                  })}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ---------- the picker, captions and legends ----------
const Ring = () => (
  <svg aria-hidden width={14} height={14} viewBox="0 0 14 14">
    <circle cx={7} cy={7} r={5.5} fill="none" stroke={INK} strokeWidth={2} />
  </svg>
);
const Disc = () => (
  <svg aria-hidden width={12} height={12} viewBox="0 0 12 12">
    <circle cx={6} cy={6} r={4.5} fill={INK} />
  </svg>
);
const Dash = () => (
  <svg aria-hidden width={18} height={4} viewBox="0 0 18 4">
    <line x1={0} x2={18} y1={2} y2={2} stroke={SOFT} strokeWidth={2} strokeDasharray="4 3" />
  </svg>
);
const Key = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-soft">{children}</p>
);
const Entry = ({ children }: { children: React.ReactNode }) => <span className="inline-flex items-center gap-2">{children}</span>;

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

function Panel({ title, caption, children }: { title: string; caption: string; children: React.ReactNode }) {
  return (
    <figure className="min-w-0 rounded-[1.5rem] bg-bench p-5 sm:p-6">
      <h3 className="display text-xl">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-ink-soft">{caption}</p>
      {children}
    </figure>
  );
}

export default function WindowFigures() {
  const [model, setModel] = useState(MODELS[0]);
  const [tip, setTip] = useState<Tip>(null);
  const box = useRef<HTMLDivElement>(null);
  const show = (at: { clientX: number; clientY: number }, lines: string[]) => {
    const r = box.current!.getBoundingClientRect();
    setTip({ x: Math.max(160, Math.min(at.clientX - r.left, r.width - 160)), y: at.clientY - r.top, lines });
  };
  const hide = () => setTip(null);
  const pt: Pt = (text) => {
    const lines = text.split("\n");
    return {
      tabIndex: 0,
      role: "img",
      "aria-label": lines.join(". "),
      onPointerMove: (e) => show(e, lines),
      onPointerDown: (e) => show(e, lines),
      onPointerLeave: hide,
      onFocus: (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        show({ clientX: r.left + r.width / 2, clientY: r.top }, lines);
      },
      onBlur: hide,
    };
  };

  const hasRep = cellsOf(model).some((c) => c.phone.endsWith(" repeat"));
  const gradesCap =
    "Prompts passed out of 30 on each set, per chip. Points are joined only where neighbouring windows were both measured; the cloud phones have endpoint measurements only and cannot exclude an effect at 8k or 16k. " +
    (hasRep
      ? "Hollow markers are one same-file repeat on the same phone, an observed run-to-run reference rather than a noise bound."
      : "No same-file repeat was run for this condition.");
  const identCap =
    "How many prompts came back byte-identical to the largest window's reply: the raw token stream, the parsed tool calls (BFCL prompts only) and the shown text. " +
    (hasRep
      ? "Dashed lines are same-file repeats on the phone of that colour, a reference for observed run-to-run agreement."
      : "No same-file repeat was run for this condition.");
  const identRows = windowIdent.filter((r) => r.model === model);
  const early = identRows.some((rw) =>
    rw.values.some((v) => {
      const p = parseIdentity(v);
      return p && p.raw[1] && p.raw[1] < 90;
    }),
  );
  const identFoot = model.includes("cap")
    ? "No BFCL in the capped rerun; long reasoning replies never match byte for byte"
    : model.includes("2.6B")
      ? "Raw identity is cap-censored: long reasoning replies rarely match byte for byte"
      : early
        ? "× a run that ended early: only the 6 to 12 prompts both runs completed are compared"
        : "";

  return (
    <div ref={box} className="relative">
      <div role="group" aria-label="Model" className="flex flex-wrap gap-2">
        {windowConditions.map((c) => (
          <button
            key={c.model}
            type="button"
            aria-pressed={c.model === model}
            onClick={() => {
              setModel(c.model);
              hide();
              // Open the picked condition's table under "Every number", as the original did.
              document.querySelectorAll<HTMLDetailsElement>("details[data-model]").forEach((d) => {
                if (d.dataset.model === c.model) d.open = true;
              });
            }}
            className={`rounded-full border px-4 py-2 text-sm ${c.model === model ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-ink"}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-8 grid items-start gap-6 xl:grid-cols-2">
        <Panel
          title="Memory after load"
          caption="Resident memory of the test process right after each export loaded, Dimensity 9400, from the fixed-prompt probe. The picked model is drawn solid."
        >
          <Scroll label="Memory after load">
            <MemoryChart model={model} pt={pt} />
          </Scroll>
        </Panel>
        <Panel
          title="Speed, paired probe"
          caption="Each window's throughput as a ratio of the model's smallest window, same 929-token prompt, same turn against same turn, six pairs per file. Dot is the median, bar the range. Dimensity 9400 only."
        >
          <Scroll label="Speed, paired probe">
            <SpeedChart model={model} pt={pt} />
          </Scroll>
          <Key>
            <Entry>
              <Disc />
              Prefill
            </Entry>
            <Entry>
              <Ring />
              Decode
            </Entry>
            <Entry>1.00 means no difference</Entry>
          </Key>
        </Panel>
        <Panel title="Grades by window" caption={gradesCap}>
          <Scroll label="Grades by window">
            <GradesChart model={model} pt={pt} />
          </Scroll>
          <Key>
            {chips.map((c) => (
              <ChipKey key={c.id} id={c.id} />
            ))}
            {hasRep && (
              <Entry>
                <Ring />
                Second run, same file
              </Entry>
            )}
          </Key>
        </Panel>
        <Panel title="Identical replies" caption={identCap}>
          <Scroll label="Identical replies">
            <IdentChart model={model} pt={pt} />
          </Scroll>
          {identFoot && <p className="mt-2 text-xs leading-5 text-ink-soft">{identFoot}</p>}
          <Key>
            {chips.map((c) => (
              <ChipKey key={c.id} id={c.id} />
            ))}
            {hasRep && (
              <Entry>
                <Dash />
                Same file run twice
              </Entry>
            )}
            <Entry>× fewer prompts than the full set</Entry>
          </Key>
        </Panel>
      </div>
      {tip && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 w-max max-w-xs -translate-x-1/2 -translate-y-full rounded-lg border border-rule bg-white px-3 py-2 text-xs leading-5 shadow-sm"
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
