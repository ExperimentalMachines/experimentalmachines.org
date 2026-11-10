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
  trainStateBytesPerParam,
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
  const [prec, setPrec] = useState<string>("BF16 / FP16");
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
      <div className="grid gap-4 md:grid-cols-3">
        <Chips label="Model" options={models.map((x) => ({ id: x.id, label: x.short }))} value={modelId} onChange={setModel} />
        <Chips label="Precision" options={precisions.map((p) => ({ id: p.name, label: p.name }))} value={prec} onChange={setPrec} />
        <Chips label="Device" options={deviceOptions(devices)} value={devId} onChange={setDev} />
      </div>
      <div ref={ref} className="mt-6 grid gap-3 sm:grid-cols-3">
        <Readout
          label="Weights in memory"
          value={`${fmt(stored)} GB`}
          note={fits ? `of the ${d.short}'s ${fmt(d.memoryGB)} GB` : `more than the ${d.short}'s ${fmt(d.memoryGB)} GB: it does not fit`}
          tone={fits ? undefined : "bad"}
        />
        <Readout label="Read per token" value={`${fmt(readPerToken)} GB`} note={m.activeB ? `only the ${fmt(m.activeB)}B parameters each token uses` : "every weight, once"} />
        <Readout
          label="Bandwidth ceiling"
          value={fits ? `${fmt(tokS)} tokens/s` : "does not fit"}
          note={fits ? (comp !== null && comp < bw ? "compute is the limit" : `memory bandwidth is the limit: ${fmt(d.bandwidthGBs)} GB/s ÷ ${fmt(readPerToken)} GB`) : undefined}
          tone={fits ? "good" : "bad"}
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
      <div className="grid gap-4 md:grid-cols-3">
        <Chips label="Model" options={models.map((x) => ({ id: x.id, label: x.short }))} value={modelId} onChange={setModel} />
        <Chips
          label="Cache precision"
          options={[
            { id: "BF16 / FP16" as const, label: "BF16" },
            { id: "FP8 / INT8" as const, label: "FP8" },
          ]}
          value={kvPrec}
          onChange={setKvPrec}
        />
        <Chips label="Device" options={deviceOptions(devices)} value={devId} onChange={setDev} />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Slider label="Context, tokens" value={ctx} min={512} max={131072} log step={512} shown={fmt(ctx)} onChange={setCtx} />
        <Slider label="Conversations at once (batch)" value={batch} min={1} max={128} log step={1} shown={String(batch)} onChange={setBatch} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Readout label="KV cache per token" value={`${fmt(perTok / 1024)} KiB`} note={`2 × ${m.layers} layers × ${m.kvHeads} KV heads × ${m.headDim} × ${kvB} bytes`} />
        <Readout label="KV cache in all" value={`${fmt(kv)} GB`} note={`× ${fmt(ctx)} tokens × ${batch}`} />
        <Readout label="Without grouped-query attention" value={`${fmt(mha / perTok)}× as much`} note={`one KV head per query head (${m.heads}) instead of ${m.kvHeads}`} />
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
      <div className="grid gap-4 md:grid-cols-2">
        <Chips label="Device" options={deviceOptions(usable)} value={devId} onChange={setDev} />
        <Chips label="Model (BF16)" options={models.map((x) => ({ id: x.id, label: x.short }))} value={modelId} onChange={setModel} />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Slider label="Decode batch: conversations sharing one read of the weights" value={batch} min={1} max={1024} log step={1} shown={String(batch)} onChange={setBatch} />
        <Slider
          label="Prompt length: read in one pass, then the context each reply is written at"
          value={prompt}
          min={16}
          max={32768}
          log
          step={16}
          shown={`${fmt(prompt)} tokens`}
          onChange={setPrompt}
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
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Readout
          label="Decode, all conversations"
          value={fits ? `${fmt(tokS)} tokens/s` : "does not fit"}
          note={
            fits
              ? dec < r
                ? "below the ridge: waiting on memory"
                : "past the ridge: compute bound"
              : `weights + ${batch} KV caches: ${fmt(needGB)} GB, over ${fmt(d.memoryGB)} GB`
          }
          tone={fits ? undefined : "bad"}
        />
        <Readout
          label="Decode, each conversation"
          value={fits ? `${fmt(tokS / batch)} tokens/s` : "does not fit"}
          note="batching raises the total, not each reply's speed"
          tone={fits ? undefined : "bad"}
        />
        <Readout
          label="Prefill time, estimated"
          value={preFits ? fmtTime(preSeconds) : "does not fit"}
          note={
            preFits
              ? preMemory > preCompute
                ? "reading the weights takes longer than the arithmetic at 50% of peak"
                : "the arithmetic at 50% of peak takes longer than reading the weights"
              : `weights + this prompt's KV cache: over ${fmt(d.memoryGB)} GB`
          }
          tone={preFits ? undefined : "bad"}
        />
      </div>
    </Card>
  );
}

// 4. One training step, animated: forward, loss, backward and the update, sized by their share of the work.
export function TrainStepLab() {
  const ref = useRef<HTMLDivElement>(null);
  const playing = usePlaying(ref);
  const t = useClock(playing, 5200);
  const parts = [
    { id: "Forward", ops: "2N per token", share: 2, color: BLUE, note: "Multiply the inputs through every layer to get a prediction." },
    { id: "Loss", ops: "small", share: 0.15, color: GREY, note: "Score each prediction against the token that really came next (cross-entropy)." },
    {
      id: "Backward",
      ops: "4N per token",
      share: 4,
      color: ORANGE,
      note: "Work out every weight's gradient, which way and how far to move it: about twice the forward pass's work.",
    },
    { id: "Update", ops: "once per step", share: 0.6, color: TEAL, note: "The optimiser nudges each weight, once per step however many tokens it had." },
  ];
  const total = parts.reduce((a, p) => a + p.share, 0);
  const phase = (t % 1) * total;
  let acc = 0;
  const activeIdx = parts.findIndex((p) => {
    const inside = phase >= acc && phase < acc + p.share;
    acc += p.share;
    return inside;
  });
  return (
    <Card>
      <div ref={ref} role="img" aria-label="One training step: forward pass 2N operations per token, loss, backward pass 4N, then the parameter update.">
        <div className="flex h-10 gap-1">
          {parts.map((p, i) => (
            <span
              key={p.id}
              className="flex items-center justify-center rounded-md text-xs font-medium text-white transition-opacity duration-300"
              style={{ width: `${(p.share / total) * 100}%`, minWidth: "3.2rem", backgroundColor: p.color, opacity: activeIdx === -1 || activeIdx === i ? 1 : 0.35 }}
            >
              {p.id}
            </span>
          ))}
        </div>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {parts.map((p, i) => (
            <li key={p.id} className={`rounded-xl bg-white p-3.5 transition-shadow ${activeIdx === i ? "shadow-[0_0_0_2px_var(--color-ink)]" : ""}`}>
              <p className="flex items-center gap-2 text-sm font-medium">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
                {p.id}
              </p>
              <p className="mt-1 text-sm tabular-nums">{p.ops}</p>
              <p className="mt-1 text-xs leading-5 text-ink-soft">{p.note}</p>
            </li>
          ))}
        </ul>
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
      <div className="grid gap-4 md:grid-cols-2">
        <Chips label="Model" options={models.map((x) => ({ id: x.id, label: x.short }))} value={modelId} onChange={setModel} />
        <Chips label="Chip" options={deviceOptions(usable)} value={devId} onChange={setDev} />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Slider label="Training tokens" value={tokensB} min={10} max={36000} log step={10} shown={`${fmt(tokensB)}B`} onChange={setTokens} />
        <Slider label="Chips" value={chips} min={1} max={16384} log step={1} shown={fmt(chips)} onChange={setChips} />
        <Slider label="Utilisation (MFU)" value={mfu} min={0.15} max={0.65} step={0.01} shown={`${Math.round(mfu * 100)}%`} onChange={setMfu} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Readout label="Compute, 6 × N × D" value={`${sci(flops, 3)} FLOPs`} note={`${fmt(m.activeB ?? m.paramsB)}B × ${fmt(tokensB)}B tokens × 6`} />
        <Readout
          label="Time"
          value={minChips > chips ? "not enough memory" : fmtTime(days * 86400)}
          note={
            minChips > chips
              ? `${fmt(chips)} chip${chips === 1 ? "" : "s"} cannot hold the training state`
              : `${fmt(chips)} × ${fmt(d.tflops!)} TFLOP/s at ${Math.round(mfu * 100)}%`
          }
          tone={minChips > chips ? "bad" : undefined}
        />
        <Readout
          label="Chips just to hold the state"
          value={String(minChips)}
          note={`${fmt(state)} GB: ${trainStateBytesPerParam.weights} + ${trainStateBytesPerParam.gradients} + ${trainStateBytesPerParam.optimiser} bytes × ${fmt(m.paramsB)}B, before activations, over ${fmt(d.memoryGB)} GB each`}
          tone={minChips > chips ? "bad" : undefined}
        />
      </div>
    </Card>
  );
}
