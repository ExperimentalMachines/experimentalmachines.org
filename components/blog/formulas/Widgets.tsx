"use client";

import { useEffect, useRef, useState } from "react";
import {
  decodeCeiling,
  decodeComputeCeiling,
  fmt,
  fmtTime,
  kvBytesPerToken,
  kvGB,
  precisions,
  prefillSeconds,
  ridge,
  sci,
  weightsReadGB,
  trainDays,
  trainFLOPs,
  trainStateGB,
  weightsGB,
} from "@/lib/blog/arith";
import type { Device, ModelPreset } from "@/lib/blog/formulas-data";

// The post's interactive pieces. Each is a card in the site's chart style: controls on top, readouts and a
// picture under them, every number computed by lib/blog/arith.ts from the sliders and the sourced data.

export const BLUE = "#2b44e6";
export const ORANGE = "#d9480f";
export const TEAL = "#008f7a";
export const VIOLET = "#6741d9";
const GREY = "#868e96";
const INKSOFT = "#545b73";

export const Card = ({ children }: { children: React.ReactNode }) => <div className="rounded-[1.5rem] bg-bench p-5 sm:p-6">{children}</div>;

export function Chips<T extends string>({ label, options, value, onChange }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="text-xs text-ink-soft">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${value === o.id ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-ink"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// A slider over a log scale when `log` is set, so 1 and 1,000 are both reachable without a fiddly thumb.
export function Slider({
  label,
  value,
  min,
  max,
  log,
  step,
  shown,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  log?: boolean;
  step?: number;
  shown: string;
  onChange: (v: number) => void;
}) {
  const toPos = (v: number) => (log ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min));
  const fromPos = (p: number) => (log ? min * Math.pow(max / min, p) : min + p * (max - min));
  const id = `s-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-xs text-ink-soft">
          {label}
        </label>
        <span className="text-sm font-medium tabular-nums">{shown}</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={1000}
        step={1}
        value={Math.round(toPos(value) * 1000)}
        onChange={(e) => {
          const raw = fromPos(Number(e.target.value) / 1000);
          onChange(step ? Math.max(min, Math.min(max, Math.round(raw / step) * step)) : raw);
        }}
        className="mt-1.5 w-full accent-[#2b44e6]"
      />
    </div>
  );
}

export const Readout = ({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "good" | "bad" }) => (
  <div className="rounded-xl bg-white p-3.5">
    <p className="text-xs text-ink-soft">{label}</p>
    <p className={`mt-0.5 text-xl font-medium tabular-nums ${tone === "bad" ? "text-[#c92a2a]" : ""}`}>{value}</p>
    {note && <p className="mt-0.5 text-xs leading-5 text-ink-soft">{note}</p>}
  </div>
);

// The panel's one primary result: a big number and what it is.
export const Big = ({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "bad" }) => (
  <div>
    <p className="text-sm text-ink-soft">{label}</p>
    <p className={`display mt-0.5 text-4xl font-medium tracking-[-0.02em] tabular-nums ${tone === "bad" ? "text-[#c92a2a]" : "text-ink"}`}>{value}</p>
    {note && <p className="mt-1 text-sm leading-6 text-ink-soft">{note}</p>}
  </div>
);

// The controls a reader rarely needs, folded so the panel has one obvious thing to change.
export function Assumptions({ children }: { children: React.ReactNode }) {
  return (
    <details className="group mt-5 rounded-xl bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
        Change assumptions
        <span aria-hidden className="text-base leading-none transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="grid gap-4 border-t border-rule px-4 py-4 md:grid-cols-2">{children}</div>
    </details>
  );
}

// Plays only while on screen and when the reader has not asked for less motion.
export function usePlaying(ref: React.RefObject<HTMLElement | null>) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting && !still.matches), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return on;
}

export function useClock(playing: boolean, periodMs: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      setT((x) => (x + (now - last) / periodMs) % 1e9);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, periodMs]);
  return t;
}

export const deviceOptions = (devices: Device[]) => devices.map((d) => ({ id: d.id, label: d.short }));

// 1. How fast can it write? Weights against capacity, and decode's two ceilings, with a sweep per token.
export function DecodeLab({ models, devices }: { models: ModelPreset[]; devices: Device[] }) {
  const [modelId, setModel] = useState(models[1].id);
  const [prec, setPrec] = useState<string>("4-bit");
  const [devId, setDev] = useState(devices.find((d) => d.kind === "consumer")?.id ?? devices[0].id);
  const m = models.find((x) => x.id === modelId)!;
  const d = devices.find((x) => x.id === devId)!;
  const bytes = precisions.find((p) => p.name === prec)!.bytes;
  const stored = weightsGB(m.paramsB, bytes);
  const readPerToken = weightsGB(m.activeB ?? m.paramsB, bytes);
  const fits = stored <= d.memoryGB;
  const bw = decodeCeiling(d.bandwidthGBs, readPerToken);
  const comp = d.tflops ? decodeComputeCeiling(d.tflops, m.activeB ?? m.paramsB) : null;
  const tokS = comp === null ? bw : Math.min(bw, comp);
  const ref = useRef<HTMLDivElement>(null);
  const playing = usePlaying(ref);
  // One sweep of the weights per token, shown slowed to between 0.4 and 3 seconds so it can be seen.
  const shownPeriod = Math.max(400, Math.min(3000, 30000 / Math.max(tokS, 1)));
  const t = useClock(playing && fits, shownPeriod);
  const phase = t % 1;
  const tokens = Math.floor(t) % 12;
  const blocks = 24;
  return (
    <Card>
      <Chips label="Device" options={deviceOptions(devices)} value={devId} onChange={setDev} />
      <div ref={ref} className="mt-6">
        <Big
          label={`Fastest it could write ${m.short}, ${prec}`}
          value={fits ? `${fmt(tokS)} tokens/s` : "does not fit"}
          note={
            !fits
              ? `${fmt(stored)} GB of weights, more than ${fmt(d.memoryGB)} GB`
              : comp !== null && comp < bw
                ? `An ideal ceiling, not a measured speed. Here compute is the lower one: ${fmt(comp)} against ${fmt(bw)} from bandwidth`
                : `An ideal ceiling, not a measured speed: ${fmt(d.bandwidthGBs)} GB/s ÷ ${fmt(readPerToken)} GB a token`
          }
          tone={fits ? undefined : "bad"}
        />
      </div>
      <div className="mt-6" aria-hidden>
        <p className="text-xs text-ink-soft">Each token reads every layer&apos;s weights once (slowed down to watch)</p>
        <div className="mt-2 flex gap-[3px]">
          {Array.from({ length: blocks }, (_, i) => {
            const lit = fits && phase * blocks >= i && phase * blocks < i + 1.5;
            return (
              <span key={i} className="h-8 flex-1 rounded-[3px] transition-colors duration-75" style={{ backgroundColor: lit ? BLUE : "color-mix(in srgb, #2b44e6 14%, white)" }} />
            );
          })}
        </div>
        <div className="mt-3 flex min-h-7 flex-wrap gap-1.5">
          {Array.from({ length: fits ? tokens : 0 }, (_, i) => (
            <span key={i} className="rounded-md bg-white px-2 py-1 text-xs tabular-nums shadow-sm">
              token {i + 1}
            </span>
          ))}
        </div>
      </div>
      <Assumptions>
        <Chips label="Model" options={models.map((x) => ({ id: x.id, label: x.short }))} value={modelId} onChange={setModel} />
        <Chips label="Precision" options={precisions.map((p) => ({ id: p.name, label: p.name }))} value={prec} onChange={setPrec} />
      </Assumptions>
    </Card>
  );
}

// 2. The KV cache: per token from the architecture, then times context and batch, against the device's memory.
export function KvLab({ models, devices }: { models: ModelPreset[]; devices: Device[] }) {
  const [modelId, setModel] = useState(models[1].id);
  const [ctx, setCtx] = useState(8192);
  const [batch, setBatch] = useState(1);
  const [kvPrec, setKvPrec] = useState<"BF16 / FP16" | "FP8 / INT8">("BF16 / FP16");
  const [devId, setDev] = useState(devices.find((d) => d.kind === "consumer")?.id ?? devices[0].id);
  const m = models.find((x) => x.id === modelId)!;
  const d = devices.find((x) => x.id === devId)!;
  const kvB = kvPrec === "BF16 / FP16" ? 2 : 1;
  const perTok = kvBytesPerToken(m.layers, m.kvHeads, m.headDim, kvB);
  const kv = kvGB(perTok, ctx, batch);
  const w = weightsGB(m.paramsB, 2);
  const total = w + kv;
  const scale = Math.max(total, d.memoryGB);
  const mha = kvBytesPerToken(m.layers, m.heads, m.headDim, kvB);
  return (
    <Card>
      <Slider label="Conversation length, tokens" value={ctx} min={512} max={131072} log step={512} shown={fmt(ctx)} onChange={setCtx} />
      <div className="mt-6 grid gap-5 sm:grid-cols-[1.3fr_1fr]">
        <Big
          label={`KV cache, ${m.short}${batch > 1 ? `, ${batch} conversations` : ""}`}
          value={`${fmt(kv)} GB`}
          note={`${fmt(perTok / 1024)} KiB a token × ${fmt(ctx)} tokens${batch > 1 ? ` × ${batch}` : ""}`}
        />
        <Readout label="Without grouped-query attention" value={`${fmt(mha / perTok)}× as much`} note={`a KV head per query head (${m.heads}), not ${m.kvHeads}`} />
      </div>
      <div className="mt-6" aria-label={`Weights ${fmt(w)} GB and KV cache ${fmt(kv)} GB against ${fmt(d.memoryGB)} GB`} role="img">
        <div className="relative h-7 overflow-hidden rounded-md bg-white">
          <span className="absolute inset-y-0 left-0" style={{ width: `${(w / scale) * 100}%`, backgroundColor: BLUE }} />
          <span className="absolute inset-y-0" style={{ left: `${(w / scale) * 100}%`, width: `${(kv / scale) * 100}%`, backgroundColor: ORANGE }} />
          <span className="absolute inset-y-0 w-[2px] bg-ink" style={{ left: `calc(${(d.memoryGB / scale) * 100}% - 1px)` }} />
        </div>
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BLUE }} />
            Weights at BF16, {fmt(w)} GB
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ORANGE }} />
            KV cache, {fmt(kv)} GB
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-[2px] bg-ink" />
            {d.short}&apos;s memory, {fmt(d.memoryGB)} GB {total > d.memoryGB ? "(does not fit)" : ""}
          </span>
        </p>
      </div>
      <Assumptions>
        <Chips label="Model" options={models.map((x) => ({ id: x.id, label: x.short }))} value={modelId} onChange={setModel} />
        <Chips label="Device" options={deviceOptions(devices)} value={devId} onChange={setDev} />
        <Chips
          label="Cache precision"
          options={[
            { id: "BF16 / FP16" as const, label: "BF16" },
            { id: "FP8 / INT8" as const, label: "FP8" },
          ]}
          value={kvPrec}
          onChange={setKvPrec}
        />
        <Slider label="Conversations at once (batch)" value={batch} min={1} max={128} log step={1} shown={String(batch)} onChange={setBatch} />
      </Assumptions>
    </Card>
  );
}

// 3. The roofline: attainable compute against operations per byte, with decode and prefill placed on it.
export function RooflineLab({ models, devices }: { models: ModelPreset[]; devices: Device[] }) {
  const usable = devices.filter((d) => d.tflops);
  const [devId, setDev] = useState(usable.find((d) => d.kind === "server")?.id ?? usable[0].id);
  const [modelId, setModel] = useState(models[1].id);
  const [batch, setBatch] = useState(1);
  const [prompt, setPrompt] = useState(2048);
  const d = usable.find((x) => x.id === devId)!;
  const m = models.find((x) => x.id === modelId)!;
  const bytes = 2;
  const peak = d.tflops!;
  const r = ridge(peak, d.bandwidthGBs);
  const att = (i: number) => Math.min(peak, (d.bandwidthGBs * 1e9 * i) / 1e12);
  const act = (m.activeB ?? m.paramsB) * 1e9;
  // Decode: each step reads the weights the batch touches plus every conversation's KV cache at this context.
  const kvSeq = kvGB(kvBytesPerToken(m.layers, m.kvHeads, m.headDim, bytes), prompt, 1);
  const stepGB = weightsReadGB(m, batch, bytes) + batch * kvSeq;
  const dec = (2 * act * batch) / (stepGB * 1e9);
  const tokS = Math.min((batch * d.bandwidthGBs) / stepGB, (peak * 1e12) / (2 * act));
  const needGB = weightsGB(m.paramsB, bytes) + batch * kvSeq;
  const fits = needGB <= d.memoryGB;
  // Prefill: the whole prompt in one pass, so one read of the weights it touches; the slower of the two limits wins.
  const preGB = weightsReadGB(m, prompt, bytes);
  const pre = (2 * act * prompt) / (preGB * 1e9);
  const preCompute = prefillSeconds(act / 1e9, prompt, peak, 0.5);
  const preMemory = preGB / d.bandwidthGBs;
  const preSeconds = Math.max(preCompute, preMemory);
  // One prompt has to fit on its own: all the weights and that prompt's KV cache.
  const preFits = weightsGB(m.paramsB, bytes) + kvSeq <= d.memoryGB;
  const [W, H, L, R, T, B] = [640, 300, 56, 24, 20, 44];
  const xmin = 0.5;
  const xmax = 1e5;
  const ymin = Math.max(0.1, (d.bandwidthGBs * 1e9 * xmin) / 1e12 / 2);
  const ymax = peak * 2;
  const xp = (x: number) => L + (Math.log(x / xmin) / Math.log(xmax / xmin)) * (W - L - R);
  const yp = (y: number) => H - B - (Math.log(y / ymin) / Math.log(ymax / ymin)) * (H - T - B);
  const pts = Array.from({ length: 60 }, (_, k) => xmin * Math.pow(xmax / xmin, k / 59));
  const path = pts.map((x, k) => `${k ? "L" : "M"}${xp(x).toFixed(1)} ${yp(att(x)).toFixed(1)}`).join(" ");
  const xticks = [1, 10, 100, 1000, 10000, 100000].filter((x) => x >= xmin && x <= xmax);
  return (
    <Card>
      <Slider label="Conversations sharing one read of the weights (the batch)" value={batch} min={1} max={1024} log step={1} shown={String(batch)} onChange={setBatch} />
      <div className="mt-6">
        <Big
          label={`Tokens a second, all ${batch > 1 ? `${batch} conversations` : "of one conversation"}, ${m.short} on an ${d.short}`}
          value={fits ? `${fmt(tokS)}` : "does not fit"}
          note={
            fits
              ? `${fmt(tokS / batch)} for each one. ${dec < r ? "Below the ridge: waiting on memory." : "Past the ridge: waiting on compute."}`
              : `Weights + ${batch} KV caches: ${fmt(needGB)} GB, over ${fmt(d.memoryGB)} GB`
          }
          tone={fits ? undefined : "bad"}
        />
      </div>
      <div className="mt-5 overflow-x-auto" role="region" aria-label="Roofline chart, scrolls sideways on small screens" tabIndex={0}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto w-full min-w-[30rem] max-w-3xl"
          role="img"
          aria-label={`Roofline for the ${d.name}: decode at batch ${batch} sits at ${fmt(dec)} operations per byte, prefill of ${prompt} tokens at ${fmt(pre)}; the ridge is at ${fmt(r)}.`}
        >
          {xticks.map((x) => (
            <g key={x}>
              <line x1={xp(x)} x2={xp(x)} y1={T} y2={H - B} stroke="var(--color-rule)" />
              <text x={xp(x)} y={H - B + 16} textAnchor="middle" fontSize={11} fill="var(--color-ink-soft)">
                {x >= 1000 ? `${x / 1000}k` : x}
              </text>
            </g>
          ))}
          <text x={L} y={H - 8} fontSize={11} fill="var(--color-ink-soft)">
            Operations per byte read (log)
          </text>
          <text x={L - 6} y={T + 4} textAnchor="end" fontSize={11} fill="var(--color-ink-soft)">
            {fmt(peak)}
          </text>
          <text x={L - 6} y={T + 16} textAnchor="end" fontSize={11} fill="var(--color-ink-soft)">
            TFLOP/s
          </text>
          <path d={path} fill="none" stroke="var(--color-ink)" strokeWidth={2} />
          <line x1={xp(r)} x2={xp(r)} y1={T} y2={H - B} stroke="var(--color-ink-soft)" strokeDasharray="4 4" />
          <text x={xp(r) + 6} y={H - B - 8} fontSize={11} fill="var(--color-ink)" style={{ paintOrder: "stroke", stroke: "var(--color-bench)", strokeWidth: 4 }}>
            ridge, {fmt(r)}
          </text>
          {[
            { x: dec, label: `decode, batch ${batch}`, color: ORANGE },
            { x: pre, label: `prefill, ${fmt(prompt)} tokens`, color: BLUE },
          ].map((p, k) => (
            <g key={p.label} className="transition-transform">
              <circle cx={xp(Math.min(Math.max(p.x, xmin), xmax))} cy={yp(att(p.x))} r={7} fill={p.color} stroke="var(--color-bench)" strokeWidth={2} />
              <text
                x={xp(Math.min(Math.max(p.x, xmin), xmax)) + (p.x > r ? -10 : 10)}
                y={yp(att(p.x)) + (k ? -12 : 20)}
                textAnchor={p.x > r ? "end" : "start"}
                fontSize={12}
                fill="var(--color-ink)"
                style={{ paintOrder: "stroke", stroke: "var(--color-bench)", strokeWidth: 4 }}
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <Assumptions>
        <Chips label="Device" options={deviceOptions(usable)} value={devId} onChange={setDev} />
        <Chips label="Model (BF16)" options={models.map((x) => ({ id: x.id, label: x.short }))} value={modelId} onChange={setModel} />
        <Slider
          label="Prompt length, then the context each reply is written at"
          value={prompt}
          min={16}
          max={32768}
          log
          step={16}
          shown={`${fmt(prompt)} tokens`}
          onChange={setPrompt}
        />
        <Readout
          label="Reading that prompt, estimated"
          value={preFits ? fmtTime(preSeconds) : "does not fit"}
          note={preFits ? (preMemory > preCompute ? "reading the weights is the slower part" : "the arithmetic, at 50% of peak, is the slower part") : `over ${fmt(d.memoryGB)} GB`}
          tone={preFits ? undefined : "bad"}
        />
      </Assumptions>
    </Card>
  );
}

// 4. One training step, four buttons: the reader picks a stage, or plays them in order at a pace that leaves time to
// read. The picture is the same five layers each time, with what that stage does to them; the costs are the usual
// estimates, not timings.
const STAGES = [
  { id: "Forward", color: BLUE, work: "About 2 × N operations per token", what: "The text runs through every layer and comes out as a guess at each next token." },
  { id: "Loss", color: GREY, work: "Small next to the rest", what: "Each guess is scored against the token that really came next." },
  { id: "Backward", color: ORANGE, work: "About 4 × N operations per token", what: "The error runs back through the layers, working out how each weight should change." },
  { id: "Update", color: TEAL, work: "Once per step, however many tokens", what: "The optimiser moves every weight a little, and the next step begins." },
] as const;

function StagePicture({ stage }: { stage: number }) {
  const layers = [0, 1, 2, 3, 4];
  const forward = stage === 0;
  const backward = stage === 2;
  return (
    <svg viewBox="0 0 520 120" className="w-full" role="img" aria-label={`${STAGES[stage].id}: ${STAGES[stage].what}`}>
      {layers.map((k) => (
        <g key={k}>
          <rect x={30 + k * 92} y={28} width={58} height={64} rx={8} fill={BLUE} fillOpacity={stage === 3 ? 0.25 : 0.14} />
          {stage === 3 && <path d={`M${44 + k * 92} 60H${74 + k * 92}`} stroke={TEAL} strokeWidth={5} strokeLinecap="round" />}
        </g>
      ))}
      {(forward || backward) &&
        layers
          .slice(0, 4)
          .map((k) => (
            <path
              key={k}
              d={forward ? `M${92 + k * 92} 60H${118 + k * 92}m-8 -7l8 7l-8 7` : `M${118 + k * 92} 60H${92 + k * 92}m8 -7l-8 7l8 7`}
              fill="none"
              stroke={forward ? BLUE : ORANGE}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
      {stage === 1 && (
        <g>
          <circle cx={498} cy={44} r={9} fill={BLUE} />
          <circle cx={498} cy={78} r={9} fill="none" stroke={INKSOFT} strokeWidth={3} />
          <path d="M498 55v12" stroke={ORANGE} strokeWidth={3} strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

export function TrainStepLab() {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    // 4.5 s a stage: long enough to read the one sentence that goes with it.
    const id = setInterval(() => setStage((x) => (x + 1) % STAGES.length), 4500);
    return () => clearInterval(id);
  }, [playing]);
  const s = STAGES[stage];
  const btn = "rounded-full border border-rule bg-white px-3 py-1.5 text-sm hover:border-ink";
  return (
    <Card>
      <div role="group" aria-label="The four stages of a training step" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAGES.map((x, i) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={stage === i}
            onClick={() => {
              setStage(i);
              setPlaying(false);
            }}
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${stage === i ? "bg-ink text-white" : "bg-white hover:bg-white/70"}`}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: x.color }} />
            {i + 1}. {x.id}
          </button>
        ))}
      </div>
      <div aria-live="polite" className="mt-4 rounded-xl bg-white p-4 sm:p-5">
        <StagePicture stage={stage} />
        <p className="mt-3 text-lg leading-7">{s.what}</p>
        <p className="mt-1 text-sm text-ink-soft tabular-nums">{s.work}</p>
      </div>
      <p className="mt-3 text-sm text-ink-soft">Forward and backward together: about 6 × N operations per token, where N is the number of parameters.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className={btn} onClick={() => (setPlaying(false), setStage((x) => (x + STAGES.length - 1) % STAGES.length))}>
          Previous
        </button>
        <button type="button" className={btn} onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
          {playing ? "Pause" : "Play"}
        </button>
        <button type="button" className={btn} onClick={() => (setPlaying(false), setStage((x) => (x + 1) % STAGES.length))}>
          Next
        </button>
      </div>
    </Card>
  );
}

// 5. A training budget: 6ND on a cluster, and how many chips it takes just to hold the training state.
export function TrainLab({ models, devices }: { models: ModelPreset[]; devices: Device[] }) {
  const usable = devices.filter((d) => d.tflops && (d.kind === "server" || d.kind === "asic" || d.kind === "consumer"));
  const [devId, setDev] = useState(usable.find((d) => d.kind === "server")?.id ?? usable[0].id);
  const [modelId, setModel] = useState(models[1].id);
  const [tokensB, setTokens] = useState(1000);
  const [chips, setChips] = useState(256);
  const [mfu, setMfu] = useState(0.4);
  const d = usable.find((x) => x.id === devId)!;
  const m = models.find((x) => x.id === modelId)!;
  const flops = trainFLOPs(m.activeB ?? m.paramsB, tokensB);
  const days = trainDays(m.activeB ?? m.paramsB, tokensB, chips, d.tflops!, mfu);
  const state = trainStateGB(m.paramsB);
  const minChips = Math.ceil(state / d.memoryGB);
  return (
    <Card>
      <Chips label="Model" options={models.map((x) => ({ id: x.id, label: x.short }))} value={modelId} onChange={setModel} />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Slider label="Training tokens" value={tokensB} min={10} max={36000} log step={10} shown={`${fmt(tokensB)}B`} onChange={setTokens} />
        <Slider label={`${d.short} chips`} value={chips} min={1} max={16384} log step={1} shown={fmt(chips)} onChange={setChips} />
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-[1.3fr_1fr]">
        <Big
          label="Time to train, estimated"
          value={minChips > chips ? "not enough memory" : fmtTime(days * 86400)}
          note={
            minChips > chips ? `${fmt(chips)} chip${chips === 1 ? "" : "s"} cannot hold the training state` : `${sci(flops, 3)} operations at ${Math.round(mfu * 100)}% of peak`
          }
          tone={minChips > chips ? "bad" : undefined}
        />
        <Readout
          label="Chips just to hold the state"
          value={String(minChips)}
          note={`${fmt(state)} GB at 16 bytes a parameter, before activations`}
          tone={minChips > chips ? "bad" : undefined}
        />
      </div>
      <Assumptions>
        <Chips label="Chip" options={deviceOptions(usable)} value={devId} onChange={setDev} />
        <Slider label="Utilisation (MFU)" value={mfu} min={0.15} max={0.65} step={0.01} shown={`${Math.round(mfu * 100)}%`} onChange={setMfu} />
      </Assumptions>
    </Card>
  );
}
