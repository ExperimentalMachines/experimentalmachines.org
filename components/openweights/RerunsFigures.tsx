"use client";

import { useEffect, useRef, useState } from "react";
import { chip, ChipKey, chips, Mark } from "@/components/openweights/chips";
import {
  rerunsControls,
  rerunsCuts,
  rerunsKills,
  rerunsLengths,
  rerunsOrder,
  rerunsPhones,
  rerunsCaps,
  rerunsTiming,
  type RerunsPhoneId,
} from "@/lib/openweights-reruns";

// The reruns study's six charts, as the page first published them: the 2.6B's
// grades under two reply caps, how its long replies were cut, their lengths at
// 2k and 32k, the same-file controls, Qwen3 32k against the 6 GB kill rule, and
// every rerun's timing against the earlier run. Each phone keeps its colour and
// marker shape from chips.tsx. Every mark can be hovered, tapped or focused for
// its numbers; the tables below the charts have them all.

const INK = "var(--color-ink)";
const SOFT = "var(--color-ink-soft)";
const RULE = "var(--color-rule)";
// The charts sit on the bench tint, so marker outlines and labels on dark bars
// are drawn in it.
const PANEL = "var(--color-bench)";
const WARN = "#b4452b";
const OK = "#c9cfdd";

type Tip = { x: number; y: number; lines: string[] } | null;
type Show = (x: number, y: number, lines: string[]) => void;

const frac = (s: string) => {
  const m = /(\d+)\/(\d+)/.exec(s);
  return m ? [+m[1], +m[2]] : null;
};
const win = (s: string) => parseInt(s);
const phone = (id: string) => rerunsPhones.find((p) => p.id === id)!;
const rowsOf = <T extends { phone: RerunsPhoneId; window: string }>(arr: T[]) =>
  [...arr].sort((a, b) => rerunsOrder.indexOf(a.phone) - rerunsOrder.indexOf(b.phone) || win(a.window) - win(b.window));

// What makes a mark a point: focusable, named for screen readers, and wired to
// the readout by hover, touch and keyboard focus.
const point = (show: Show, hide: () => void, lines: string[]) => ({
  "data-pt": "",
  tabIndex: 0,
  role: "img",
  "aria-label": lines.join(". "),
  onPointerMove: (e: React.PointerEvent) => show(e.clientX, e.clientY, lines),
  onPointerDown: (e: React.PointerEvent) => show(e.clientX, e.clientY, lines),
  onPointerLeave: (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") hide();
  },
  onFocus: (e: React.FocusEvent<SVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    show(r.left + r.width / 2, r.top, lines);
  },
  onBlur: hide,
});

type Chart = { show: Show; hide: () => void };

// ---------- caps: dumbbells ----------
function Caps({ show, hide }: Chart) {
  const W = 640;
  const H = 380;
  const M = { l: 130, r: 16, t: 34, b: 30 };
  const gap = 30;
  const rows = rowsOf(rerunsCaps);
  const cw = (W - M.l - M.r - gap) / 2;
  const rowH = (H - M.t - M.b) / rows.length;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label="GSM8K and IFEval passed at a 640 and a 2048 token cap, per phone and window"
      className="w-full min-w-[34rem]"
    >
      {(
        [
          ["gsm8k", "GSM8K"],
          ["ifeval", "IFEval"],
        ] as const
      ).map(([k, label], i) => {
        const l = M.l + i * (cw + gap);
        const x = (v: number) => l + (v / 30) * cw;
        return (
          <g key={k}>
            <text x={l} y={M.t - 18} fontSize={12} fontWeight={600} fill={INK}>
              {label}
            </text>
            {[0, 10, 20, 30].map((v) => (
              <g key={v}>
                <line x1={x(v)} x2={x(v)} y1={M.t - 6} y2={H - M.b} stroke={RULE} />
                <text x={x(v)} y={H - M.b + 14} textAnchor="middle" fontSize={10.5} fill={SOFT} className="tabular-nums">
                  {v}
                </text>
              </g>
            ))}
            {rows.map((rw, j) => {
              const y = M.t + rowH * (j + 0.5);
              const p = phone(rw.phone);
              const c = chip(rw.phone)!;
              const a = frac(rw[`${k}_640`]);
              const b = frac(rw[`${k}_2048`]);
              if (!a || !b) return null;
              const ta = [`${p.name}, ${rw.window} window, ${label}`, `640-token cap: ${rw[`${k}_640`]} passed`];
              const tb = [`${p.name}, ${rw.window} window, ${label}`, `2048-token cap: ${rw[`${k}_2048`]} passed`];
              return (
                <g key={`${rw.phone}-${rw.window}`}>
                  {i === 0 && (
                    <text x={M.l - 10} y={y + 4} textAnchor="end" fontSize={11.5} fill={SOFT}>
                      {p.short} &middot; {rw.window}
                    </text>
                  )}
                  <line x1={x(a[0])} x2={x(b[0])} y1={y} y2={y} stroke={c.color} strokeWidth={2} opacity={0.55} />
                  <Mark
                    shape={c.shape}
                    x={x(a[0])}
                    y={y}
                    r={6}
                    fill="none"
                    stroke={c.color}
                    strokeWidth={2}
                    pointerEvents="all"
                    {...point(show, hide, ta)}
                  />
                  <Mark shape={c.shape} x={x(b[0])} y={y} r={5} fill={c.color} stroke={PANEL} strokeWidth={1.2} {...point(show, hide, tb)} />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ---------- cuts: stacked bars ----------
function Cuts({ show, hide }: Chart) {
  const W = 640;
  const H = 380;
  const M = { l: 130, r: 16, t: 34, b: 30 };
  const rows = rowsOf(rerunsCuts);
  const rowH = (H - M.t - M.b) / rows.length;
  const x = (v: number) => M.l + (v / 60) * (W - M.l - M.r);
  const parts = [
    ["finished", OK, "finished"],
    ["edge", WARN, "cut by the window: prompt plus reply reached the window size"],
    ["cap", SOFT, "cut by the 2048-token reply cap"],
  ] as const;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label="Finished, window-cut and cap-cut replies per phone and window"
      className="w-full min-w-[34rem]"
    >
      {[0, 15, 30, 45, 60].map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={M.t - 6} y2={H - M.b} stroke={RULE} />
          <text x={x(v)} y={H - M.b + 14} textAnchor="middle" fontSize={10.5} fill={SOFT} className="tabular-nums">
            {v}
          </text>
        </g>
      ))}
      <text x={M.l} y={M.t - 18} fontSize={12} fontWeight={600} fill={INK}>
        Replies out of 60
      </text>
      {rows.map((rw, j) => {
        const y = M.t + rowH * j + 4;
        const h = rowH - 8;
        const p = phone(rw.phone);
        // Where each part of the stack starts: the replies before it.
        const starts = parts.map((_, i) => parts.slice(0, i).reduce((sum, [k]) => sum + rw[k], 0));
        return (
          <g key={`${rw.phone}-${rw.window}`}>
            <text x={M.l - 10} y={y + h / 2 + 4} textAnchor="end" fontSize={11.5} fill={SOFT}>
              {p.short} &middot; {rw.window}
            </text>
            {parts.map(([k, col, what], i) => {
              const n = rw[k];
              if (!n) return null;
              const x0 = starts[i];
              return (
                <g key={k}>
                  <rect
                    x={x(x0)}
                    y={y}
                    width={x(x0 + n) - x(x0)}
                    height={h}
                    fill={col}
                    {...point(show, hide, [`${p.name}, ${rw.window} window`, `${n} of ${rw.n} replies ${what}`])}
                  />
                  {n >= 4 && (
                    <text
                      x={x(x0 + n / 2)}
                      y={y + h / 2 + 4}
                      textAnchor="middle"
                      fontSize={10.5}
                      fill={k === "finished" ? INK : PANEL}
                      className="pointer-events-none tabular-nums"
                    >
                      {n}
                      {k === "finished" ? "" : k === "edge" ? " window" : " cap"}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ---------- lengths: two histograms ----------
const BIN = 128;
const XMAX = 2304;
const windows = [
  ["2k", "2k window: 14 of 60 stopped at the window"],
  ["32k", "32k window: 10 of 60 stopped at the reply cap"],
] as const;
// Both panels share one count scale: the tallest bin of either.
const YMAX = Math.max(
  ...windows.map(([w]) => {
    const b: Record<number, number> = {};
    rerunsLengths[w].forEach(([g, p]) => {
      const k = Math.min(XMAX / BIN - 1, Math.floor((g + p) / BIN));
      b[k] = (b[k] || 0) + 1;
    });
    return Math.max(...Object.values(b));
  }),
);

function Lengths({ show, hide }: Chart) {
  const W = 640;
  const H = 380;
  const M = { l: 44, r: 16, t: 30, b: 46 };
  const gap = 28;
  const ph = (H - M.t - M.b - gap) / 2;
  const x = (v: number) => M.l + (v / XMAX) * (W - M.l - M.r);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label="Histogram of prompt plus reply length at the 2k and 32k windows"
      className="w-full min-w-[34rem]"
    >
      {windows.map(([w, label], i) => {
        const top = M.t + i * (ph + gap);
        // A reply is cut by the window at 2k when prompt plus reply reached it,
        // and cut by the cap when the reply alone reached 2048.
        const bins = new Array(XMAX / BIN).fill(0);
        const edge = new Array(XMAX / BIN).fill(0);
        rerunsLengths[w].forEach(([g, p]) => {
          const t = g + p;
          const b = Math.min(bins.length - 1, Math.floor(t / BIN));
          if (w === "2k" && t >= 2047) edge[b]++;
          else if (g >= 2047) edge[b]++;
          else bins[b]++;
        });
        const yy = (v: number) => top + ph - (v / YMAX) * ph;
        return (
          <g key={w}>
            <text x={M.l} y={top - 8} fontSize={12} fontWeight={600} fill={INK}>
              {label}
            </text>
            {[0, YMAX].map((v) => (
              <g key={v}>
                <line x1={M.l} x2={W - M.r} y1={yy(v)} y2={yy(v)} stroke={RULE} />
                <text x={M.l - 6} y={yy(v) + 4} textAnchor="end" fontSize={10.5} fill={SOFT} className="tabular-nums">
                  {v}
                </text>
              </g>
            ))}
            {bins.map((v, k) => {
              const x0 = x(k * BIN) + 1;
              const bw = x(BIN) - x(0) - 2;
              const lo = k * BIN;
              const hi = lo + BIN;
              const where = `${w} window, ${lo} to ${hi} tokens of prompt plus reply`;
              return (
                <g key={k}>
                  {v > 0 && (
                    <rect x={x0} y={yy(v)} width={bw} height={top + ph - yy(v)} fill={OK} {...point(show, hide, [where, `${v} replies finished`])} />
                  )}
                  {edge[k] > 0 && (
                    <rect
                      x={x0}
                      y={yy(v + edge[k])}
                      width={bw}
                      height={yy(v) - yy(v + edge[k])}
                      fill={w === "2k" ? WARN : SOFT}
                      {...point(show, hide, [where, `${edge[k]} replies ${w === "2k" ? "cut by the window" : "cut by the 2048 reply cap"}`])}
                    />
                  )}
                </g>
              );
            })}
            <line x1={x(2048)} x2={x(2048)} y1={top - 2} y2={top + ph} stroke={SOFT} strokeDasharray="4 4" />
            {i === 1 &&
              [0, 512, 1024, 1536, 2048].map((v) => (
                <text key={v} x={x(v)} y={H - M.b + 16} textAnchor="middle" fontSize={10.5} fill={SOFT} className="tabular-nums">
                  {v}
                </text>
              ))}
          </g>
        );
      })}
      <text x={(M.l + W - M.r) / 2} y={H - 4} textAnchor="middle" fontSize={12} fill={SOFT}>
        Prompt plus reply, tokens
      </text>
    </svg>
  );
}

// ---------- controls ----------
function Controls({ show, hide }: Chart) {
  const W = 640;
  const H = 380;
  const M = { l: 150, r: 16, t: 34, b: 34 };
  const rows = rerunsControls;
  const rowH = (H - M.t - M.b) / rows.length;
  const x = (v: number) => M.l + v * (W - M.l - M.r);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label="Identical replies between two runs of the same file, five controls"
      className="w-full min-w-[34rem]"
    >
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={M.t - 6} y2={H - M.b} stroke={RULE} />
          <text x={x(v)} y={H - M.b + 14} textAnchor="middle" fontSize={10.5} fill={SOFT} className="tabular-nums">
            {Math.round(v * 100)}%
          </text>
        </g>
      ))}
      <text x={M.l} y={M.t - 18} fontSize={12} fontWeight={600} fill={INK}>
        Replies identical between the two runs
      </text>
      {rows.map((rw, j) => {
        const y = M.t + rowH * (j + 0.5);
        const p = phone(rw.phone);
        const col = chip(rw.phone)!.color;
        const grades = `Grades: GSM8K ${rw.first.gsm8k} then ${rw.second.gsm8k}, IFEval ${rw.first.ifeval} then ${rw.second.ifeval}, BFCL ${rw.first.bfcl} then ${rw.second.bfcl}`;
        const head = `${rw.model} ${rw.window} on the ${p.name}`;
        return (
          <g key={`${rw.model}-${rw.window}-${rw.phone}`}>
            <text x={M.l - 10} y={y - 3} textAnchor="end" fontSize={11.5} fill={SOFT}>
              {rw.model} {rw.window}
            </text>
            <text x={M.l - 10} y={y + 12} textAnchor="end" fontSize={10.5} fill={SOFT}>
              {p.short}
            </text>
            <rect
              x={x(rw.calls / rw.nbfcl) - 4}
              y={y - 9}
              width={8}
              height={18}
              rx={1}
              fill={col}
              {...point(show, hide, [head, `Parsed tool calls identical: ${rw.calls} of ${rw.nbfcl} BFCL prompts`, grades])}
            />
            <Mark
              shape="circle"
              x={x(rw.content / rw.n)}
              y={y}
              r={6.5}
              fill="none"
              stroke={col}
              strokeWidth={2}
              pointerEvents="all"
              {...point(show, hide, [head, `Shown text identical: ${rw.content} of ${rw.n} prompts`, grades])}
            />
            <Mark
              shape="circle"
              x={x(rw.raw / rw.n)}
              y={y}
              r={5}
              fill={col}
              stroke={PANEL}
              strokeWidth={1.2}
              {...point(show, hide, [head, `Raw token stream identical: ${rw.raw} of ${rw.n} prompts`, grades])}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ---------- kills ----------
function Kills({ show, hide }: Chart) {
  const W = 960;
  const H = 250;
  const M = { l: 60, r: 16, t: 30, b: 40 };
  const rows = [...rerunsKills].sort((a, b) => rerunsOrder.indexOf(a.phone) - rerunsOrder.indexOf(b.phone));
  const cw = (W - M.l - M.r) / rows.length;
  const y = (gb: number) => H - M.b - (gb / 17) * (H - M.t - M.b);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label="Resident memory after load of Qwen3 32k on four phones against a 6 GB kill threshold"
      className="w-full min-w-[56.25rem]"
    >
      {[0, 4, 8, 12, 16].map((g) => (
        <g key={g}>
          <line x1={M.l} x2={W - M.r} y1={y(g)} y2={y(g)} stroke={RULE} />
          <text x={M.l - 8} y={y(g) + 4} textAnchor="end" fontSize={11} fill={SOFT} className="tabular-nums">
            {g} GB
          </text>
        </g>
      ))}
      {rows.map((rw, i) => {
        const p = phone(rw.phone);
        const col = chip(rw.phone)!.color;
        const x0 = M.l + cw * i + cw * 0.25;
        const bw = cw * 0.5;
        const killed = rw.prompts < 90;
        const gb = rw.rss / 1000;
        return (
          <g key={rw.phone}>
            <line x1={x0 - cw * 0.15} x2={x0 + bw + cw * 0.15} y1={y(rw.ram)} y2={y(rw.ram)} stroke={SOFT} strokeWidth={1.5} />
            <text x={x0 + bw / 2} y={y(rw.ram) - 5} textAnchor="middle" fontSize={10.5} fill={SOFT}>
              {rw.ram} GB RAM
            </text>
            <rect
              x={x0}
              y={y(gb)}
              width={bw}
              height={y(0) - y(gb)}
              fill={col}
              opacity={killed ? 0.9 : 0.6}
              {...point(show, hide, [
                `${p.name} (${rw.device}), ${rw.ram} GB RAM`,
                `Resident after load: ${gb.toFixed(2)} GB`,
                killed ? `Killed after ${rw.prompts} prompts: ${rw.cause}` : "Finished all 90 prompts",
              ])}
            />
            <text x={x0 + bw / 2} y={y(gb) - 6} textAnchor="middle" fontSize={11} fill={INK} className="tabular-nums">
              {gb.toFixed(1)} GB
            </text>
            <text x={x0 + bw / 2} y={H - M.b + 16} textAnchor="middle" fontSize={11.5} fill={SOFT}>
              {p.name}
            </text>
            <text x={x0 + bw / 2} y={H - M.b + 30} textAnchor="middle" fontSize={10.5} fill={killed ? WARN : SOFT}>
              {killed ? `killed after ${rw.prompts} prompts` : "finished 90 prompts"}
            </text>
          </g>
        );
      })}
      <line x1={M.l} x2={W - M.r} y1={y(6)} y2={y(6)} stroke={WARN} strokeDasharray="5 4" strokeWidth={1.5} />
    </svg>
  );
}

// ---------- timing ----------
function Timing({ show, hide }: Chart) {
  const W = 960;
  const H = 560;
  const M = { l: 210, r: 16, t: 34, b: 34 };
  const gap = 40;
  const rows = [...rerunsTiming].sort(
    (a, b) =>
      (a.kind > b.kind ? 1 : a.kind < b.kind ? -1 : 0) ||
      rerunsOrder.indexOf(a.phone) - rerunsOrder.indexOf(b.phone) ||
      win(a.window) - win(b.window),
  );
  const cw = (W - M.l - M.r - gap) / 2;
  const rowH = (H - M.t - M.b) / rows.length;
  const cols = [
    { k: "ttft", label: "TTFT, prefill ms", hi: 1200, ticks: [0, 300, 600, 900, 1200] },
    { k: "tpot", label: "TPOT, ms per token", hi: 120, ticks: [0, 30, 60, 90, 120] },
  ] as const;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label="Time to first token and time per output token for every rerun cell against its earlier run"
      className="w-full min-w-[34rem]"
    >
      {rows.map((rw, j) => {
        const y = M.t + rowH * (j + 0.5);
        const p = phone(rw.phone);
        const split = j > 0 && rows[j - 1].kind !== rw.kind;
        return (
          <g key={`${rw.kind}-${rw.label}-${rw.phone}-${rw.window}`}>
            {split && <line x1={M.l - 200} x2={W - M.r} y1={y - rowH / 2} y2={y - rowH / 2} stroke={RULE} />}
            <text x={M.l - 10} y={y - 3} textAnchor="end" fontSize={11.5} fill={SOFT}>
              {rw.label} {rw.window} &middot; {p.short}
            </text>
            <text x={M.l - 10} y={y + 11} textAnchor="end" fontSize={10.5} fill={SOFT}>
              {rw.kind === "cap" ? "640 cap then 2048 cap" : "first run then second run"}
            </text>
          </g>
        );
      })}
      {cols.map(({ k, label, hi, ticks }, i) => {
        const l = M.l + i * (cw + gap);
        const x = (v: number) => l + (v / hi) * cw;
        return (
          <g key={k}>
            <text x={l} y={M.t - 18} fontSize={12} fontWeight={600} fill={INK}>
              {label}
            </text>
            {ticks.map((v) => (
              <g key={v}>
                <line x1={x(v)} x2={x(v)} y1={M.t - 6} y2={H - M.b} stroke={RULE} />
                <text x={x(v)} y={H - M.b + 14} textAnchor="middle" fontSize={10.5} fill={SOFT} className="tabular-nums">
                  {v}
                </text>
              </g>
            ))}
            {rows.map((rw, j) => {
              const y = M.t + rowH * (j + 0.5);
              const p = phone(rw.phone);
              const c = chip(rw.phone)!;
              const t = (n: typeof rw.a) => [
                `${rw.label} ${rw.window} on the ${p.name}, ${n.name}`,
                `TTFT ${n.ttft} ms (${n.pre} tok/s prefill)`,
                `TPOT ${n.tpot} ms per token (${n.dec} tok/s decode)`,
                `RSS after load ${n.rss} MB, at end ${n.rss_end} MB`,
              ];
              const a = rw.a[k];
              const b = rw.b[k];
              return (
                <g key={`${rw.kind}-${rw.label}-${rw.phone}-${rw.window}`}>
                  <line x1={x(a)} x2={x(b)} y1={y} y2={y} stroke={c.color} strokeWidth={2} opacity={0.55} />
                  <Mark
                    shape={c.shape}
                    x={x(a)}
                    y={y}
                    r={6}
                    fill="none"
                    stroke={c.color}
                    strokeWidth={2}
                    pointerEvents="all"
                    {...point(show, hide, t(rw.a))}
                  />
                  <Mark shape={c.shape} x={x(b)} y={y} r={5} fill={c.color} stroke={PANEL} strokeWidth={1.2} {...point(show, hide, t(rw.b))} />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ---------- legends ----------
const Ring = () => (
  <svg aria-hidden width={15} height={15} viewBox="0 0 15 15">
    <circle cx={7.5} cy={7.5} r={5.5} fill="none" stroke={INK} strokeWidth={2} />
  </svg>
);
const Disc = () => (
  <svg aria-hidden width={11} height={11} viewBox="0 0 11 11">
    <circle cx={5.5} cy={5.5} r={4.5} fill={INK} />
  </svg>
);
const Swatch = ({ color, w = 14, h = 10, r = 2 }: { color: string; w?: number; h?: number; r?: number }) => (
  <svg aria-hidden width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
    <rect width={w} height={h} rx={r} fill={color} />
  </svg>
);
const Dash = ({ color = SOFT }: { color?: string }) => (
  <svg aria-hidden width={18} height={4} viewBox="0 0 18 4">
    <line x1={0} x2={18} y1={2} y2={2} stroke={color} strokeWidth={2} strokeDasharray="4 3" />
  </svg>
);
const K = ({ children }: { children: React.ReactNode }) => <span className="inline-flex items-center gap-2">{children}</span>;
const Legend = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">{children}</p>
);
const ChipKeys = () => (
  <>
    {chips.map((c) => (
      <ChipKey key={c.id} id={c.id} />
    ))}
  </>
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

function Panel({ title, wide, children }: { title: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <figure className={`min-w-0 rounded-[1.5rem] bg-bench p-5 sm:p-6 ${wide ? "xl:col-span-2" : ""}`}>
      <h3 className="display text-xl">{title}</h3>
      {children}
    </figure>
  );
}

const Caption = ({ children }: { children: React.ReactNode }) => <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">{children}</p>;
const Hint = () => <p className="mt-3 text-xs text-ink-soft sm:hidden">The chart scrolls sideways on a narrow screen.</p>;

export default function RerunsFigures() {
  const [tip, setTip] = useState<Tip>(null);
  const box = useRef<HTMLDivElement>(null);
  const show: Show = (cx, cy, lines) => {
    const r = box.current!.getBoundingClientRect();
    setTip({ x: Math.max(130, Math.min(cx - r.left, r.width - 130)), y: cy - r.top, lines });
  };
  const hide = () => setTip(null);
  // A tap or click away from every mark, or Escape, closes the readout.
  useEffect(() => {
    const away = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.("[data-pt]")) setTip(null);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTip(null);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, []);
  const chart = { show, hide };
  return (
    <div ref={box} className="relative">
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Panel title="The 2.6B under two reply caps">
          <Caption>
            Prompts passed out of 30, per phone and window. The hollow marker is the 640-token cap the suite uses, the solid one the 2048-token rerun. BFCL was
            not rerun; its 640-cap grades and calls stay in the original rows.
          </Caption>
          <Hint />
          <Scroll label="The 2.6B under two reply caps">
            <Caps {...chart} />
          </Scroll>
          <Legend>
            <ChipKeys />
            <K>
              <Ring />
              640 cap
            </K>
            <K>
              <Disc />
              2048 cap
            </K>
          </Legend>
        </Panel>
        <Panel title="Where the long replies were cut">
          <Caption>
            The 60 GSM8K and IFEval replies of each 2048-cap cell: finished, cut by the window (prompt plus reply reached the window size), or cut by the reply
            cap.
          </Caption>
          <Hint />
          <Scroll label="Where the long replies were cut">
            <Cuts {...chart} />
          </Scroll>
          <Legend>
            <K>
              <Swatch color={OK} />
              Finished
            </K>
            <K>
              <Swatch color={WARN} />
              Cut by the window
            </K>
            <K>
              <Swatch color={SOFT} />
              Cut by the 2048 cap
            </K>
          </Legend>
        </Panel>
        <Panel title="Reply length at 2k and at 32k">
          <Caption>
            Dimensity 9400, 2048 cap, 60 replies per window, both panels on one scale. Each bar is a 128-token bin of prompt plus reply. At 2k, 14 replies end at
            the window limit of 2048 tokens; at 32k, 10 of 60 reached the reply cap and the rest finished earlier.
          </Caption>
          <Hint />
          <Scroll label="Reply length at 2k and at 32k">
            <Lengths {...chart} />
          </Scroll>
          <Legend>
            <K>
              <Dash />
              2048 tokens, the 2k window
            </K>
          </Legend>
        </Panel>
        <Panel title="Same file, run twice">
          <Caption>
            Five controls: the same export, same prompts, same phone, a second time. How many replies came back byte-identical (raw stream and shown text over 90
            prompts, parsed tool calls over the 30 BFCL prompts), and how far each grade moved.
          </Caption>
          <Hint />
          <Scroll label="Same file, run twice">
            <Controls {...chart} />
          </Scroll>
          <Legend>
            <K>
              <Disc />
              Raw stream
            </K>
            <K>
              <Ring />
              Shown text
            </K>
            <K>
              <Swatch color={INK} w={8} h={14} r={1} />
              Tool calls
            </K>
          </Legend>
        </Panel>
        <Panel title="Qwen3-1.7B at 32k against the 6 GB rule" wide>
          <Caption>
            Resident memory (RSS) of the test process right after the 32k export loaded, on each phone, with the phone&apos;s RAM. The dashed line is the 6 GB
            threshold the killed runs&apos; logs reported; that threshold is measured in PSS at kill time, a different measure from the bars, so the bars show
            which phones were near it, not the moment they crossed it. Three of four processes were stopped within the first dozen prompts.
          </Caption>
          <Hint />
          <Scroll label="Qwen3-1.7B at 32k against the 6 GB rule">
            <Kills {...chart} />
          </Scroll>
          <Legend>
            <K>
              <Dash color={WARN} />
              6 GB, the PSS threshold Samsung Heimdall and MIUI reported when they stopped the process
            </K>
            <K>
              <Swatch color={SOFT} h={2} r={0} />
              The phone&apos;s RAM
            </K>
          </Legend>
        </Panel>
        <Panel title="Time to first token and time per output token" wide>
          <Caption>
            Every rerun recorded prefill and decode time per prompt. TTFT here is the runtime&apos;s prefill of the whole prompt, the engine&apos;s part of the
            wait before the first token; TPOT is decode time over generated tokens. Each row pairs a rerun with the earlier run of the same cell: the hollow
            marker is the earlier run, the solid one the rerun. Medians over the prompts each run completed, so they are per-cell figures, not a paired speed
            test.
          </Caption>
          <Caption>
            What to take from it: the capped rerun&apos;s lower TTFT is a prompt-mix effect, not a speed change. Its 60 GSM8K and IFEval prompts are shorter than
            the 30 BFCL prompts with their tool definitions, which the 640-cap rows include. TPOT, which does not depend on prompt length, agrees within 5% on
            the Dimensity 9400 and Exynos 2400, differs by 8 to 11% on the 8 Elite and on the Tensor G5 at 4k, and by 26% on the Tensor G5 at 32k (81 then 102
            ms), the size of the launch-to-launch swing seen on that phone before. Of the five repeats, three agree within 4% on both figures; the 1.2B repeats
            at 32k on the Dimensity and at 4k on the Exynos were 7 to 12% slower the second time.
          </Caption>
          <Hint />
          <Scroll label="Time to first token and time per output token">
            <Timing {...chart} />
          </Scroll>
          <Legend>
            <ChipKeys />
            <K>
              <Ring />
              Earlier run
            </K>
            <K>
              <Disc />
              Rerun
            </K>
          </Legend>
        </Panel>
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
