// Charts for a post that sets two machines against each other. Color follows the machine: the first named is
// always cobalt and the second orange, a pair checked for colorblind separation. Text stays in ink, and every bar
// carries its machine's name beside its value, so no reading depends on color alone. These are plain HTML rather
// than a scaled SVG, so the type stays readable at phone width. The Every number table on each post has the rest.

const seriesA = "#2b44e6";
const seriesB = "#d9480f";

export const ChartCard = ({ children }: { children: React.ReactNode }) => <div className="rounded-[1.5rem] bg-bench p-5 sm:p-6">{children}</div>;

export const Swatch = ({ color }: { color: string }) => <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />;

function Key({ a, b }: { a: string; b: string }) {
  return (
    <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
      <span className="inline-flex items-center gap-2">
        <Swatch color={seriesA} />
        {a}
      </span>
      <span className="inline-flex items-center gap-2">
        <Swatch color={seriesB} />
        {b}
      </span>
    </p>
  );
}

export type DuelRow = {
  label: string;
  // Who leads; a tie draws no bar.
  who: "a" | "b" | "tie";
  ratio?: number;
  shown: string;
  detail?: string;
  // The other machine could not run it at all, so the bar is full length and striped, not measured.
  blocked?: boolean;
};

// Who leads each test and by how much. A bar grows away from the center toward the machine that won. Lengths are on
// a log scale, so 2× one way is as long as 2× the other.
export function Duel({ a, b, groups, max }: { a: string; b: string; groups: { title?: string; rows: DuelRow[] }[]; max: number }) {
  const room = "4.5rem";
  const length = (r: DuelRow) => (r.blocked ? 1 : Math.log(r.ratio ?? 1) / Math.log(max));
  return (
    <ChartCard>
      <div className="grid grid-cols-2 border-b border-rule pb-3 text-sm font-medium md:ml-[17rem]">
        <span className="flex items-center justify-end gap-2 pr-3">
          {a} leads
          <Swatch color={seriesA} />
        </span>
        <span className="flex items-center gap-2 pl-3">
          <Swatch color={seriesB} />
          {b} leads
        </span>
      </div>
      {groups.map((g, i) => (
        <div key={g.title ?? i} className="mt-4">
          {g.title && <p className="mb-1 text-sm font-medium">{g.title}</p>}
          <ul>
            {g.rows.map((r) => {
              const bar = {
                width: `calc((100% - ${room}) * ${length(r)})`,
                backgroundColor: r.who === "a" ? seriesA : seriesB,
              };
              const stripes = r.blocked ? { backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,.45) 0 3px, transparent 3px 7px)" } : {};
              return (
                <li key={r.label} className="grid items-center gap-x-4 rounded py-1.5 transition-colors hover:bg-white md:grid-cols-[16rem_minmax(0,1fr)]">
                  <div>
                    <p className="text-sm leading-5">{r.label}</p>
                    {r.detail && <p className="text-xs leading-5 text-ink-soft">{r.detail}</p>}
                  </div>
                  <div className="mt-1 grid grid-cols-2 md:mt-0">
                    <div className="flex h-5 items-center justify-end gap-1.5 border-r border-ink/25 pr-px text-xs tabular-nums">
                      {r.who === "a" && (
                        <>
                          <span className="whitespace-nowrap font-medium">{r.shown}</span>
                          <span className="h-2.5 rounded-l" style={{ ...bar, ...stripes }} />
                        </>
                      )}
                      {r.who === "tie" && <span className="whitespace-nowrap pr-1 text-ink-soft">{r.shown}</span>}
                    </div>
                    <div className="flex h-5 items-center gap-1.5 pl-px text-xs tabular-nums">
                      {r.who === "b" && (
                        <>
                          <span className="h-2.5 rounded-r" style={{ ...bar, ...stripes }} />
                          <span className="whitespace-nowrap font-medium">{r.shown}</span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </ChartCard>
  );
}

export type Reading = { value: number; low?: number; shown: string } | null;
export type PairRow = { label: string; detail?: string; a: Reading; b: Reading; missing?: string; lead?: string };

// Two machines on the same test. Each row has its own scale where the units differ between rows; `shared` puts them
// on one scale where they do not. Where a result is a range, the bar is solid to the low end and faint up to the high end.
export function PairBars({ a, b, shortA, shortB, rows, shared }: { a: string; b: string; shortA: string; shortB: string; rows: PairRow[]; shared?: boolean }) {
  const all = Math.max(...rows.flatMap((r) => [r.a?.value ?? 0, r.b?.value ?? 0]));
  return (
    <ChartCard>
      <Key a={a} b={b} />
      <ul className="mt-4 divide-y divide-rule">
        {rows.map((r) => {
          const top = shared ? all : Math.max(r.a?.value ?? 0, r.b?.value ?? 0);
          return (
            <li key={r.label} className="grid gap-x-4 gap-y-1.5 py-3 first:pt-0 last:pb-0 md:grid-cols-[16rem_minmax(0,1fr)]">
              <div>
                <p className="text-sm leading-5">{r.label}</p>
                {r.detail && <p className="text-xs leading-5 text-ink-soft">{r.detail}</p>}
                {r.lead && <p className="mt-0.5 text-xs font-medium leading-5">{r.lead}</p>}
              </div>
              <div className="space-y-1">
                <Bar reading={r.a} top={top} color={seriesA} name={shortA} missing={r.missing} />
                <Bar reading={r.b} top={top} color={seriesB} name={shortB} missing={r.missing} />
              </div>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}

function Bar({ reading, top, color, name, missing }: { reading: Reading; top: number; color: string; name: string; missing?: string }) {
  if (!reading) {
    return (
      <p className="flex h-5 items-center gap-1.5 text-xs text-ink-soft">
        {name}: {missing ?? "not measured"}
      </p>
    );
  }
  const room = "11rem";
  const full = reading.value / top;
  const solid = (reading.low ?? reading.value) / reading.value;
  return (
    <div className="flex h-5 items-center gap-1.5 text-xs tabular-nums">
      <span
        className="relative h-2.5 rounded-r"
        style={{ width: `calc((100% - ${room}) * ${full})`, minWidth: "2px", backgroundColor: `color-mix(in srgb, ${color} 35%, transparent)` }}
      >
        <span className="absolute inset-y-0 left-0 rounded-r" style={{ width: `${solid * 100}%`, backgroundColor: color }} />
      </span>
      <span className="whitespace-nowrap">
        <span className="font-medium">{name}</span> {reading.shown}
      </span>
    </div>
  );
}

// The hover box for the line charts: a dot in each line's colour, its name, and its value right-aligned, sized to its
// longest line (Inter at 12 units runs under 6.6 units a character), beside the hovered column rather than over it,
// and kept inside the chart.
const charW = 6.6;
function Tip({ x, mid, W, top, header, rows }: { x: number; mid: number; W: number; top: number; header?: string; rows: { name: string; value: string; color: string }[] }) {
  const nameW = Math.max(...rows.map((r) => r.name.length)) * charW;
  const valueW = Math.max(...rows.map((r) => r.value.length)) * charW;
  const w = Math.ceil(Math.max(header ? header.length * charW : 0, 14 + nameW + 18 + valueW) + 24);
  const first = header ? 42 : 22;
  const h = first + (rows.length - 1) * 18 + 12;
  const bx = Math.max(4, Math.min(x > mid ? x - w - 12 : x + 12, W - w - 4));
  return (
    <g className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100" fontSize={12}>
      <rect x={bx} y={top} width={w} height={h} rx={6} fill="#ffffff" stroke="var(--color-rule)" />
      {header && (
        <text x={bx + 12} y={top + 20} fill="var(--color-ink-soft)">
          {header}
        </text>
      )}
      {rows.map((r, j) => (
        <g key={r.name}>
          <circle cx={bx + 16} cy={top + first + j * 18 - 4} r={4} fill={r.color} />
          <text x={bx + 26} y={top + first + j * 18} fill="var(--color-ink)">
            {r.name}
          </text>
          <text x={bx + w - 12} y={top + first + j * 18} textAnchor="end" fontWeight={500} fill="var(--color-ink)">
            {r.value}
          </text>
        </g>
      ))}
    </g>
  );
}

// One measure as the load rises, on a log scale of load. Hover a column for its numbers. Colors keep their order
// from chart to chart, so a line stays one color across a post. End labels are pushed apart where lines converge.
const lineColors = [seriesA, seriesB, "#008f7a", "#6741d9", "#d6336c"];

export function Lines({
  series,
  x,
  step,
  unit,
  xLabel,
  summary,
  digits = 0,
}: {
  series: { name: string; ys: number[]; color?: number }[];
  x: number[];
  step: number;
  unit: string;
  xLabel: string;
  summary: string;
  digits?: number;
}) {
  const [W, H, L, R, T, B] = [720, 330, 62, 128, 30, 46];
  const all = series.flatMap((s) => s.ys);
  const top = Math.ceil(Math.max(...all) / step) * step;
  const xp = (i: number) => L + ((Math.log2(x[i]) - Math.log2(x[0])) / (Math.log2(x.at(-1)!) - Math.log2(x[0]))) * (W - L - R);
  const yp = (v: number) => H - B - (v / top) * (H - T - B);
  const path = (ys: number[]) => ys.map((v, i) => `${i ? "L" : "M"}${xp(i).toFixed(1)} ${yp(v).toFixed(1)}`).join(" ");
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const n = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: digits });
  const colorOf = (s: { color?: number }, i: number) => lineColors[s.color ?? i];
  // Walk the end labels from the top of the chart down, keeping each 16 units below the one before.
  const ends = series.map((s, i) => ({ name: s.name, y: yp(s.ys.at(-1)!), i })).sort((a, b) => a.y - b.y);
  ends.forEach((e, k) => {
    if (k && e.y - ends[k - 1].y < 16) e.y = ends[k - 1].y + 16;
  });
  return (
    <ChartCard>
      <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {series.map((s, i) => (
          <span key={s.name} className="inline-flex items-center gap-2">
            <Swatch color={colorOf(s, i)} />
            {s.name}
          </span>
        ))}
      </p>
      <div role="region" aria-label={`${summary}, scrolls sideways on small screens`} tabIndex={0} className="mt-3 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="mx-auto w-full min-w-[34rem] max-w-3xl">
          {ticks.map((v) => (
            <g key={v} fontSize={12}>
              <line x1={L} x2={W - R} y1={yp(v)} y2={yp(v)} stroke="var(--color-rule)" />
              <text x={L - 8} y={yp(v) + 4} textAnchor="end" fill="var(--color-ink-soft)">
                {n(v)}
              </text>
            </g>
          ))}
          <text x={L - 8} y={T - 14} textAnchor="end" fontSize={12} fill="var(--color-ink-soft)">
            {unit}
          </text>
          {series.map((s, i) => (
            <path key={s.name} d={path(s.ys)} fill="none" stroke={colorOf(s, i)} strokeWidth={2} strokeLinejoin="round" />
          ))}
          {ends.map((e) => (
            <text key={e.name} x={W - R + 8} y={e.y + 4} fontSize={13} fontWeight={500} fill="var(--color-ink)">
              {e.name}
            </text>
          ))}
          {x.map((c, i) => {
            const before = i ? xp(i - 1) : xp(i);
            const after = i < x.length - 1 ? xp(i + 1) : xp(i);
            return (
              // Focusable so a tap on a phone shows the same values a mouse does.
              <g key={c} className="group outline-none" fontSize={12} tabIndex={-1}>
                <rect x={(before + xp(i)) / 2} y={T} width={(after - before) / 2} height={H - T - B} fill="transparent" />
                <line
                  x1={xp(i)}
                  x2={xp(i)}
                  y1={T}
                  y2={H - B}
                  stroke="var(--color-ink-soft)"
                  strokeDasharray="3 4"
                  className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100"
                />
                {series.map((s, j) => (
                  <circle key={s.name} cx={xp(i)} cy={yp(s.ys[i])} r={4} fill={colorOf(s, j)} stroke="var(--color-bench)" strokeWidth={2} />
                ))}
                <text x={xp(i)} y={H - B + 18} textAnchor="middle" fill="var(--color-ink-soft)">
                  {c}
                </text>
                <Tip x={xp(i)} mid={(L + W - R) / 2} W={W} top={T + 4} rows={series.map((s, j) => ({ name: s.name, value: n(s.ys[i]), color: colorOf(s, j) }))} />
              </g>
            );
          })}
          <text x={L} y={H - 6} fontSize={12} fill="var(--color-ink-soft)">
            {xLabel}
          </text>
        </svg>
      </div>
    </ChartCard>
  );
}

// A measure over time for a few runs, on one linear time axis, drawn like Lines. A shaded band marks a stretch of
// time (a pause), a dashed rule marks a level (a trip point), and a ringed dot marks one event on one line. Every
// label sits on a halo of the card's colour, so a line passing under it never makes it unreadable, and end labels are
// pushed apart where lines end close together. Hover a column for every line's value there.
export function TimeLines({
  series,
  xMin = 0,
  xMax,
  xStep,
  yMin = 0,
  yMax,
  yStep,
  unit,
  xLabel,
  summary,
  band,
  spans,
  rule,
  marker,
  stops,
  digits = 0,
  hover,
  hoverUnit,
}: {
  series: { name: string; points: [number, number][]; color?: number }[];
  // Where the x axis starts, for a chart whose data begins well after zero.
  xMin?: number;
  xMax: number;
  xStep: number;
  yMin?: number;
  yMax: number;
  yStep: number;
  unit: string;
  xLabel: string;
  summary: string;
  band?: { from: number; to: number; label: string };
  // Several short stretches shaded like the band, such as each time a throttle was on, named in the legend.
  spans?: { at: { from: number; to: number }[]; label: string };
  rule?: { y: number; label: string };
  marker?: { series: string; x: number; label: string };
  // The x positions a reader can hover for every line's value.
  stops: number[];
  digits?: number;
  // The hover box's first line, with {x} for the column's position, such as "{x} s into the pause".
  hover?: string;
  // Written after each value in the hover box, such as "tokens".
  hoverUnit?: string;
}) {
  const [W, H, L, R, T, B] = [720, 330, 62, 128, 30, 46];
  const xp = (v: number) => L + ((v - xMin) / (xMax - xMin)) * (W - L - R);
  const yp = (v: number) => H - B - ((v - yMin) / (yMax - yMin)) * (H - T - B);
  const n = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: digits });
  const colorOf = (s: { color?: number }, i: number) => lineColors[s.color ?? i];
  const inside = (pts: [number, number][]) => pts.filter(([x]) => x >= xMin && x <= xMax);
  const near = (pts: [number, number][], x: number) => inside(pts).reduce((a, p) => (Math.abs(p[0] - x) < Math.abs(a[0] - x) ? p : a));
  const path = (pts: [number, number][]) =>
    inside(pts)
      .map(([x, y], i) => `${i ? "L" : "M"}${xp(x).toFixed(1)} ${yp(y).toFixed(1)}`)
      .join(" ");
  const yTicks = Array.from({ length: Math.floor((yMax - yMin) / yStep) + 1 }, (_, i) => yMin + i * yStep);
  const xTicks = Array.from({ length: Math.floor((xMax - xMin) / xStep) + 1 }, (_, i) => xMin + i * xStep);
  // End labels sit just past each line's own last point, pushed apart where they would overlap and kept inside the
  // plot: walked down 16 units apart, then, if the lowest runs off the bottom, walked back up from it.
  const ends = series
    .map((s, i) => {
      const last = inside(s.points).at(-1)!;
      return { name: s.name, x: xp(last[0]) + 8, y: yp(last[1]), i };
    })
    .sort((a, b) => a.y - b.y);
  ends.forEach((e, k) => {
    if (k && e.y - ends[k - 1].y < 16) e.y = ends[k - 1].y + 16;
  });
  for (let k = ends.length - 1; k >= 0; k--) {
    const floor = k === ends.length - 1 ? H - B - 6 : ends[k + 1].y - 16;
    if (ends[k].y > floor) ends[k].y = floor;
  }
  const lastX = (s: { points: [number, number][] }) => inside(s.points).at(-1)![0];
  const halo = { paintOrder: "stroke" as const, stroke: "var(--color-bench)", strokeWidth: 4, strokeLinejoin: "round" as const };
  // The event's label goes above its dot, or below it where that would land on the band's or the rule's label.
  const mark =
    marker &&
    (() => {
      const s = series.find((v) => v.name === marker.series)!;
      const p = near(s.points, marker.x);
      const x = xp(p[0]);
      const y = yp(p[1]);
      const clash = (ly: number, lx: number) => Math.abs(y - 9 - ly) < 16 && Math.abs(x + 9 - lx) < 160;
      const below = (band && clash(T + 16, xp(band.from) + 8)) || (rule && clash(yp(rule.y) - 7, L + 8));
      return { x, y, labelY: below ? y + 20 : y - 9, color: colorOf(s, series.indexOf(s)) };
    })();
  return (
    <ChartCard>
      <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {series.map((s, i) => (
          <span key={s.name} className="inline-flex items-center gap-2">
            <Swatch color={colorOf(s, i)} />
            {s.name}
          </span>
        ))}
        {spans && (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block h-3 w-2 rounded-[2px]" style={{ backgroundColor: "color-mix(in srgb, #d9480f 22%, transparent)" }} />
            {spans.label}
          </span>
        )}
      </p>
      <div role="region" aria-label={`${summary}, scrolls sideways on small screens`} tabIndex={0} className="mt-3 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="mx-auto w-full min-w-[34rem] max-w-3xl">
          {band && <rect x={xp(band.from)} y={T} width={xp(band.to) - xp(band.from)} height={H - T - B} fill="color-mix(in srgb, #d9480f 9%, transparent)" />}
          {spans?.at.map((sp) => (
            <rect key={sp.from} x={xp(sp.from)} y={T} width={Math.max(xp(sp.to) - xp(sp.from), 2)} height={H - T - B} fill="color-mix(in srgb, #d9480f 22%, transparent)" />
          ))}
          {yTicks.map((v) => (
            <g key={v} fontSize={12}>
              <line x1={L} x2={W - R} y1={yp(v)} y2={yp(v)} stroke="var(--color-rule)" />
              <text x={L - 8} y={yp(v) + 4} textAnchor="end" fill="var(--color-ink-soft)">
                {n(v)}
              </text>
            </g>
          ))}
          <text x={L - 8} y={T - 14} textAnchor="end" fontSize={12} fill="var(--color-ink-soft)">
            {unit}
          </text>
          {xTicks.map((v) => (
            <text key={v} x={xp(v)} y={H - B + 18} textAnchor="middle" fontSize={12} fill="var(--color-ink-soft)">
              {v}
            </text>
          ))}
          {rule && (
            <g fontSize={12}>
              <line x1={L} x2={W - R} y1={yp(rule.y)} y2={yp(rule.y)} stroke="var(--color-ink)" strokeDasharray="5 4" />
              <text x={L + 8} y={yp(rule.y) - 7} fill="var(--color-ink)" {...halo}>
                {rule.label}
              </text>
            </g>
          )}
          {series.map((s, i) => (
            <path key={s.name} d={path(s.points)} fill="none" stroke={colorOf(s, i)} strokeWidth={2} strokeLinejoin="round" />
          ))}
          {band && (
            <text x={xp(band.from) + 8} y={T + 16} fontSize={12} fill="var(--color-ink)" {...halo}>
              {band.label}
            </text>
          )}
          {mark && (
            <g fontSize={12}>
              <circle cx={mark.x} cy={mark.y} r={5} fill={mark.color} stroke="var(--color-bench)" strokeWidth={2} />
              <text x={mark.x + 9} y={mark.labelY} fill="var(--color-ink)" {...halo}>
                {marker!.label}
              </text>
            </g>
          )}
          {ends.map((e) => (
            <text key={e.name} x={e.x} y={e.y + 4} fontSize={13} fontWeight={500} fill="var(--color-ink)" {...halo}>
              {e.name}
            </text>
          ))}
          {stops.map((x, k) => {
            const before = k ? xp(stops[k - 1]) : L;
            const after = k < stops.length - 1 ? xp(stops[k + 1]) : W - R;
            return (
              // Focusable so a tap on a phone shows the same values a mouse does.
              <g key={x} className="group outline-none" fontSize={12} tabIndex={-1}>
                <rect x={(before + xp(x)) / 2} y={T} width={(after - before) / 2} height={H - T - B} fill="transparent" />
                <line
                  x1={xp(x)}
                  x2={xp(x)}
                  y1={T}
                  y2={H - B}
                  stroke="var(--color-ink-soft)"
                  strokeDasharray="3 4"
                  className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100"
                />
                <g className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100">
                  {series.map((s, j) => {
                    if (x > lastX(s) + 1e-9) return null;
                    const p = near(s.points, x);
                    return <circle key={s.name} cx={xp(p[0])} cy={yp(p[1])} r={4} fill={colorOf(s, j)} stroke="var(--color-bench)" strokeWidth={2} />;
                  })}
                </g>
                <Tip
                  x={xp(x)}
                  mid={(L + W - R) / 2}
                  W={W}
                  top={T + 4}
                  header={hover ? hover.replace("{x}", n(x)) : `${xLabel.split(",")[0]}: ${n(x)}`}
                  rows={series.map((s, j) => ({
                    name: s.name,
                    value: x > lastX(s) + 1e-9 ? "ended" : `${n(near(s.points, x)[1])}${hoverUnit ? ` ${hoverUnit}` : ""}`,
                    color: colorOf(s, j),
                  }))}
                />
              </g>
            );
          })}
          <text x={L} y={H - 6} fontSize={12} fill="var(--color-ink-soft)">
            {xLabel}
          </text>
        </svg>
      </div>
    </ChartCard>
  );
}

// A count of whole things, drawn as that many squares, because "how many fit" is the point.
export function Seats({ rows, caption }: { rows: { name: string; count: number; shown: string; first?: boolean }[]; caption: string }) {
  return (
    <ChartCard>
      <p className="text-sm">{caption}</p>
      <ul className="mt-4 space-y-4">
        {rows.map((r) => (
          <li key={r.name}>
            <p className="text-sm">
              <span className="font-medium">{r.name}</span> <span className="tabular-nums">{r.shown}</span>
            </p>
            <div aria-hidden className="mt-1.5 flex flex-wrap gap-1">
              {Array.from({ length: Math.ceil(r.count) }, (_, i) => {
                const part = Math.min(r.count - i, 1);
                return (
                  <span key={i} className="relative h-5 w-5 overflow-hidden rounded-[3px] bg-ink/10">
                    <span className="absolute inset-y-0 left-0" style={{ width: `${part * 100}%`, backgroundColor: r.first ? seriesA : seriesB }} />
                  </span>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

// Two machines' shares on one percent scale, as dots, because a bar cut off above zero would overstate the gap.
export function Dots({ a, b, rows, from, to }: { a: string; b: string; rows: { label: string; a: number; b: number }[]; from: number; to: number }) {
  const at = (v: number) => `${((v - from) / (to - from)) * 100}%`;
  const ticks = Array.from({ length: (to - from) / 5 + 1 }, (_, i) => from + i * 5);
  return (
    <ChartCard>
      <Key a={a} b={b} />
      <div className="mt-4 grid gap-x-4 md:grid-cols-[16rem_minmax(0,1fr)]">
        <div />
        <div className="relative h-5 text-xs text-ink-soft">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2 tabular-nums" style={{ left: at(t) }}>
              {t}%
            </span>
          ))}
        </div>
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.label} className="grid items-center gap-x-4 py-2 md:grid-cols-[16rem_minmax(0,1fr)]">
            <div>
              <p className="text-sm leading-5">{r.label}</p>
              <p className="text-xs leading-5 tabular-nums text-ink-soft">
                {a} {r.a}%, {b} {r.b}%
              </p>
            </div>
            <div className="relative mt-1 h-5 md:mt-0">
              <span className="absolute inset-x-0 top-1/2 h-px bg-rule" />
              <span
                className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-ink/25"
                style={{ left: at(Math.min(r.a, r.b)), width: `${(Math.abs(r.a - r.b) / (to - from)) * 100}%` }}
              />
              {[
                [r.a, seriesA],
                [r.b, seriesB],
              ].map(([v, c]) => (
                <span
                  key={String(c)}
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bench"
                  style={{ left: at(v as number), backgroundColor: c as string }}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

// Which processor does each job best on each machine. The pick is solid and the other is faint.
export function Picks({
  machines,
}: {
  machines: { name: string; first?: boolean; jobs: { job: string; options: { name: string; value: number; shown: string; pick?: boolean }[] }[] }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {machines.map((m) => {
        const color = m.first ? seriesA : seriesB;
        return (
          <ChartCard key={m.name}>
            <p className="inline-flex items-center gap-2 text-sm font-medium">
              <Swatch color={color} />
              {m.name}
            </p>
            {m.jobs.map((j) => {
              const top = Math.max(...j.options.map((o) => o.value));
              return (
                <div key={j.job} className="mt-4">
                  <p className="text-sm">{j.job}</p>
                  <ul className="mt-1 space-y-1">
                    {j.options.map((o) => (
                      <li key={o.name} className="flex h-5 items-center gap-1.5 text-xs tabular-nums">
                        <span className="w-20 shrink-0 text-ink-soft">{o.name}</span>
                        <span
                          className="h-2.5 rounded-r"
                          style={{
                            width: `calc((100% - 13rem) * ${o.value / top})`,
                            minWidth: "2px",
                            backgroundColor: o.pick ? color : `color-mix(in srgb, ${color} 30%, transparent)`,
                          }}
                        />
                        <span className={`whitespace-nowrap ${o.pick ? "font-medium" : ""}`}>
                          {o.shown}
                          {o.pick ? ", the pick" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </ChartCard>
        );
      })}
    </div>
  );
}

// One row per setup, with what it finished, how long it took and what it cost, on aligned scales down each column.
export function Scorecard({
  a,
  b,
  rows,
}: {
  a: string;
  b: string;
  rows: { name: string; first?: boolean; passed: number; of: number; wall: number; cost: number | null; costShown: string }[];
}) {
  const topWall = Math.max(...rows.map((r) => r.wall));
  const topCost = Math.max(...rows.map((r) => r.cost ?? 0));
  const cell = (f: number, shown: string, color: string, strong?: boolean) => (
    <span className="flex h-5 items-center gap-1.5 text-xs tabular-nums">
      <span className="h-2.5 rounded-r" style={{ width: `calc((100% - 4.25rem) * ${f})`, minWidth: "2px", backgroundColor: color }} />
      <span className={`whitespace-nowrap ${strong ? "font-medium" : ""}`}>{shown}</span>
    </span>
  );
  const heads = "text-xs text-ink-soft";
  return (
    <ChartCard>
      <Key a={a} b={b} />
      <div className="mt-4 hidden grid-cols-[15rem_repeat(3,minmax(0,1fr))] gap-x-4 border-b border-rule pb-2 md:grid">
        <span />
        <span className={heads}>Tasks finished, of 24</span>
        <span className={heads}>Median run</span>
        <span className={heads}>Cost per finished task</span>
      </div>
      <ul>
        {rows.map((r) => {
          const color = r.first ? seriesA : seriesB;
          return (
            <li key={r.name} className="grid gap-x-4 border-b border-rule/70 py-2.5 last:border-0 md:grid-cols-[15rem_repeat(3,minmax(0,1fr))] md:items-center md:py-1.5">
              <p className="text-sm leading-5">{r.name}</p>
              <div className="mt-1 grid grid-cols-[6rem_minmax(0,1fr)] items-center md:mt-0 md:block">
                <span className={`${heads} md:hidden`}>Finished</span>
                {cell(r.passed / r.of, `${r.passed} of ${r.of}`, color, true)}
              </div>
              <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center md:block">
                <span className={`${heads} md:hidden`}>Median run</span>
                {cell(r.wall / topWall, `${r.wall.toFixed(0)} s`, color)}
              </div>
              <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center md:block">
                <span className={`${heads} md:hidden`}>Per task</span>
                {r.cost === null ? <span className="flex h-5 items-center text-xs text-ink-soft">{r.costShown}</span> : cell(r.cost / topCost, r.costShown, color)}
              </div>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}

// A gap with its 95% interval, against a baseline at zero. The dot is the estimate and the line is the interval.
export function Interval({
  a,
  b,
  rows,
  from,
  to,
  band,
}: {
  a: string;
  b: string;
  rows: { label: string; first?: boolean; gap: number; low: number; high: number; verdict: string }[];
  from: number;
  to: number;
  band: number;
}) {
  const at = (v: number) => `${((v - from) / (to - from)) * 100}%`;
  const ticks: number[] = [];
  for (let v = from; v <= to; v += 20) ticks.push(v);
  const signed = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : "0");
  return (
    <ChartCard>
      <Key a={a} b={b} />
      <div className="mt-4 grid gap-x-4 md:grid-cols-[15rem_minmax(0,1fr)_11rem]">
        <span />
        <div className="relative h-5 text-xs text-ink-soft">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2 tabular-nums" style={{ left: at(t) }}>
              {signed(t)}
            </span>
          ))}
        </div>
      </div>
      <ul>
        {rows.map((r) => {
          const color = r.first ? seriesA : seriesB;
          return (
            <li key={r.label} className="grid items-center gap-x-4 py-1.5 md:grid-cols-[15rem_minmax(0,1fr)_11rem]">
              <p className="text-sm leading-5">{r.label}</p>
              <div className="relative mt-1 h-6 md:mt-0">
                <span className="absolute inset-y-0 bg-ink/5" style={{ left: at(-band), width: `${(2 * band * 100) / (to - from)}%` }} />
                <span className="absolute inset-y-0 w-px bg-ink/30" style={{ left: at(0) }} />
                <span
                  className="absolute top-1/2 h-0.5 -translate-y-1/2"
                  style={{ left: at(r.low), width: `${((r.high - r.low) * 100) / (to - from)}%`, backgroundColor: color }}
                />
                <span
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bench"
                  style={{ left: at(r.gap), backgroundColor: color }}
                />
              </div>
              <p className="text-xs leading-5 tabular-nums">
                <span className="font-medium">{signed(r.gap)}</span> <span className="text-ink-soft">{r.verdict}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}

// Where a run's time goes, each setup filling the same width.
const stackColors = ["#6741d9", "#008f7a", "#e0a100", "#d6336c"];

// `colors` lets a post match the parts to a figure beside them; by default they take the stack palette in order.
export function Stack({
  parts,
  rows,
  unsplit,
  colors = stackColors,
}: {
  parts: string[];
  rows: { label: string; shares: (number | null)[]; unsplit?: number }[];
  unsplit: string;
  colors?: string[];
}) {
  const lower = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);
  // Each row's pieces in drawing order, with where each one's middle falls along the bar, in percent.
  const segments = (r: { shares: (number | null)[]; unsplit?: number }) => {
    const total = r.shares.reduce<number>((sum, x) => sum + (x ?? 0), r.unsplit ?? 0);
    const pieces = [
      ...(r.unsplit ? [{ name: unsplit, value: r.unsplit, color: "#868e96" }] : []),
      ...parts.flatMap((p, i) => (r.shares[i] === null ? [] : [{ name: p, value: r.shares[i] as number, color: colors[i] }])),
    ];
    let start = 0;
    return pieces.map((g) => {
      const mid = ((start + g.value / 2) / total) * 100;
      start += g.value;
      return { ...g, mid };
    });
  };
  return (
    <ChartCard>
      <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {parts.map((p, i) => (
          <span key={p} className="inline-flex items-center gap-2">
            <Swatch color={colors[i]} />
            {p}
          </span>
        ))}
        <span className="inline-flex items-center gap-2">
          <Swatch color="#868e96" />
          {unsplit}
        </span>
      </p>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => {
          const total = r.shares.reduce<number>((sum, x) => sum + (x ?? 0), r.unsplit ?? 0);
          const words = [...(r.unsplit ? [`${lower(unsplit)} ${r.unsplit}%`] : []), ...parts.flatMap((p, i) => (r.shares[i] === null ? [] : [`${lower(p)} ${r.shares[i]}%`]))];
          return (
            <li key={r.label} className="grid gap-x-4 gap-y-1 md:grid-cols-[15rem_minmax(0,1fr)] md:items-center">
              <p className="text-sm leading-5">{r.label}</p>
              <div>
                <div className="flex h-3 gap-0.5">
                  {segments(r).map((g, k, all) => (
                    // Focusable so a tap on a phone shows the same box a mouse does. The box is anchored to the bar's
                    // end nearest the segment, so a sliver at either edge does not push it out of the card. Only the
                    // inner bar grows on hover: a transform on the outer span would stretch the box's text with it.
                    <span key={g.name} tabIndex={-1} className="group relative h-full outline-none" style={{ width: `${(g.value / total) * 100}%` }}>
                      <span
                        aria-hidden
                        className={`absolute inset-0 origin-center transition-transform group-hover:scale-y-150 group-focus:scale-y-150 ${k === 0 ? "rounded-l" : ""} ${k === all.length - 1 ? "rounded-r" : ""}`}
                        style={{ backgroundColor: g.color }}
                      />
                      <span
                        role="tooltip"
                        className={`pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-md border border-rule bg-white px-2.5 py-1 text-xs text-ink opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus:opacity-100 ${
                          g.mid < 25 ? "left-0" : g.mid > 75 ? "right-0" : "left-1/2 -translate-x-1/2"
                        }`}
                      >
                        {g.name} <span className="font-medium tabular-nums">{g.value}%</span>
                      </span>
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-xs leading-5 tabular-nums text-ink-soft">{words.join(", ")}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}

// Rows on one scale, solid to a typical value and faint to a worse one, with one row picked out. Grouped by load.
export function Ranges({
  groups,
  solid,
  faint,
}: {
  groups: { title: string; rows: { label: string; low: number; high: number; shown: string; on?: boolean; note?: string }[] }[];
  solid: string;
  faint: string;
}) {
  const top = Math.max(...groups.flatMap((g) => g.rows.map((r) => r.high)));
  const other = "#868e96";
  return (
    <ChartCard>
      <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-2">
          <Swatch color={seriesA} />
          The setup we recommend
        </span>
        <span className="inline-flex items-center gap-2">
          <Swatch color={other} />
          The others
        </span>
        <span className="text-ink-soft">
          Solid to {solid}, faint to {faint}
        </span>
      </p>
      {groups.map((g) => (
        <div key={g.title} className="mt-5">
          <p className="text-sm font-medium">{g.title}</p>
          <ul className="mt-1.5 space-y-1">
            {g.rows.map((r) => {
              const color = r.on ? seriesA : other;
              return (
                <li key={r.label} className="grid items-center gap-x-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
                  <span className={`text-xs leading-5 ${r.on ? "font-medium" : ""}`}>{r.label}</span>
                  <span className="flex h-5 items-center gap-1.5 text-xs tabular-nums">
                    <span
                      className="relative h-2.5 rounded-r"
                      style={{ width: `calc((100% - 12rem) * ${r.high / top})`, minWidth: "3px", backgroundColor: `color-mix(in srgb, ${color} 35%, transparent)` }}
                    >
                      <span className="absolute inset-y-0 left-0 rounded-r" style={{ width: `${(r.low / r.high) * 100}%`, backgroundColor: color }} />
                    </span>
                    <span className={`whitespace-nowrap ${r.on ? "font-medium" : ""}`}>
                      {r.shown}
                      {r.note ? <span className="font-normal text-ink-soft"> {r.note}</span> : null}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </ChartCard>
  );
}

export type AlignedCell = { value: number; low?: number; shown: string } | null;

// One row per setting with several measures beside it, each column on its own scale.
export function Aligned({
  head,
  rows,
  label,
  missing = "not run",
}: {
  head: string[];
  label: string;
  rows: { label: string; on?: boolean; cells: AlignedCell[] }[];
  missing?: string;
}) {
  const tops = head.map((_, c) => Math.max(...rows.map((r) => r.cells[c]?.value ?? 0)));
  const cols = { gridTemplateColumns: `minmax(8rem, 11rem) repeat(${head.length}, minmax(0, 1fr))` };
  return (
    <ChartCard>
      <div className="mb-2 hidden gap-x-4 border-b border-rule pb-2 text-xs text-ink-soft md:grid" style={cols}>
        <span>{label}</span>
        {head.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.label} className="border-b border-rule/70 py-2 last:border-0 md:py-1">
            <div className="md:grid md:items-center md:gap-x-4" style={cols}>
              <p className={`text-sm leading-5 ${r.on ? "font-medium" : ""}`}>{r.label}</p>
              {r.cells.map((cell, c) => (
                <div key={head[c]} className="mt-1 grid grid-cols-[6.5rem_minmax(0,1fr)] items-center md:mt-0 md:block">
                  <span className="text-xs text-ink-soft md:hidden">{head[c]}</span>
                  {cell ? (
                    <span className="flex h-5 items-center gap-1.5 text-xs tabular-nums">
                      <span
                        className="relative h-2.5 rounded-r"
                        style={{
                          width: `calc((100% - 5.5rem) * ${cell.value / tops[c]})`,
                          minWidth: "3px",
                          backgroundColor: `color-mix(in srgb, ${seriesA} ${cell.low === undefined ? 100 : 35}%, transparent)`,
                        }}
                      >
                        {cell.low !== undefined && (
                          <span className="absolute inset-y-0 left-0 rounded-r" style={{ width: `${(cell.low / cell.value) * 100}%`, backgroundColor: seriesA }} />
                        )}
                      </span>
                      <span className="whitespace-nowrap">{cell.shown}</span>
                    </span>
                  ) : (
                    <span className="flex h-5 items-center text-xs text-ink-soft">{missing}</span>
                  )}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
