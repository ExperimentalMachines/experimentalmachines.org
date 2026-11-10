"use client";

import { useRef, useState } from "react";
import { fmt, kvBytesPerToken, precisions, weightsGB } from "@/lib/blog/arith";
import type { Device, ModelPreset } from "@/lib/blog/formulas-data";
import { h100 } from "@/lib/blog/formulas-shared";
import { Assumptions, BLUE, Card, Chips, ORANGE, Readout, Slider, TEAL, useClock, usePlaying } from "@/components/blog/formulas/Widgets";

// Where the spec sheet's numbers come from: bandwidth from the memory bus, compute from the matrix units, and a
// picture of why a hybrid model's cache grows more slowly than a full-attention one's.

// Each preset is a real part whose printed bandwidth or compute the formula reproduces exactly.
const busPresets = [
  {
    id: "phone",
    label: "Phone, LPDDR5X-10667",
    rate: 10667,
    channels: 4,
    width: 16,
    note: "MediaTek lists LPDDR5X 10667 for the Dimensity 9500. Read as MT/s on four 16-bit channels, the usual phone bus; MediaTek prints neither, so this one is an estimate",
  },
  { id: "rtx4090", label: "RTX 4090, GDDR6X", rate: 21000, channels: 12, width: 32, note: "NVIDIA prints 21 Gbps a pin, 384 bits, 1,008 GB/s" },
  { id: "rtx5090", label: "RTX 5090, GDDR7", rate: 28000, channels: 16, width: 32, note: "NVIDIA prints 28 Gbps a pin, 512 bits, 1,792 GB/s" },
  { id: "mi300x", label: "MI300X, HBM3", rate: 5200, channels: 128, width: 64, note: "AMD prints 5.2 Gbps a pin, 8,192 bits, 5.3 TB/s" },
] as const;

const computePresets = [
  { id: "fp32", label: "RTX 4090, FP32 cores", units: 16384, fma: 1, ghz: 2.52, note: "NVIDIA prints 82.6 TFLOP/s" },
  { id: "tensor", label: "RTX 4090, BF16 tensor cores", units: 512, fma: 64, ghz: 2.52, note: "NVIDIA prints 165.2 TFLOP/s, dense" },
] as const;

export function BandwidthLab() {
  const [bus, setBus] = useState<string>("phone");
  const [rate, setRate] = useState(10667);
  const [channels, setChannels] = useState(4);
  const [width, setWidth] = useState(16);
  const busBits = channels * width;
  const gbs = (rate * busBits) / 8 / 1000;
  const bp = busPresets.find((p) => p.id === bus);
  return (
    <Card>
      <p className="text-sm font-medium">Bandwidth, from the memory bus</p>
      <div className="mt-3">
        <Chips
          label="Start from"
          options={[...busPresets.map((p) => ({ id: p.id, label: p.label })), ...(bus === "custom" ? [{ id: "custom", label: "Your own" }] : [])]}
          value={bus}
          onChange={(id) => {
            const p = busPresets.find((x) => x.id === id);
            if (!p) return;
            setBus(id);
            setRate(p.rate);
            setChannels(p.channels);
            setWidth(p.width);
          }}
        />
      </div>
      <p className="mt-5 rounded-xl bg-white p-3.5 text-sm leading-6 tabular-nums">
        {fmt(rate, 5)} MT/s × ({channels} × {width} bits) ÷ 8 ÷ 1,000 = <span className="text-lg font-medium">{gbs >= 1000 ? `${fmt(gbs / 1000)} TB/s` : `${fmt(gbs)} GB/s`}</span>
      </p>
      <p className="mt-2 text-xs leading-5 text-ink-soft">{bp ? bp.note : `A ${fmt(busBits)}-bit bus.`}</p>
      <Assumptions>
        <Slider
          label="Data rate per pin, MT/s (millions of transfers a second)"
          value={rate}
          min={1000}
          max={40000}
          log
          step={1}
          shown={fmt(rate, 5)}
          onChange={(v) => (setBus("custom"), setRate(v))}
        />
        <Slider label="Channels (or memory chips)" value={channels} min={1} max={128} log step={1} shown={String(channels)} onChange={(v) => (setBus("custom"), setChannels(v))} />
        <Chips
          label="Bits per channel: one data pin each"
          options={[16, 32, 64].map((x) => ({ id: String(x), label: String(x) }))}
          value={String(width)}
          onChange={(v) => (setBus("custom"), setWidth(Number(v)))}
        />
      </Assumptions>
    </Card>
  );
}

export function ComputeLab() {
  const [comp, setComp] = useState<string>("fp32");
  const [units, setUnits] = useState(16384);
  const [fma, setFma] = useState(1);
  const [ghz, setGhz] = useState(2.52);
  const tflops = (units * fma * 2 * ghz) / 1000;
  const cp = computePresets.find((p) => p.id === comp);
  return (
    <Card>
      <p className="text-sm font-medium">Compute, from the arithmetic units</p>
      <div className="mt-3">
        <Chips
          label="Start from"
          options={[...computePresets.map((p) => ({ id: p.id, label: p.label })), ...(comp === "custom" ? [{ id: "custom", label: "Your own" }] : [])]}
          value={comp}
          onChange={(id) => {
            const p = computePresets.find((x) => x.id === id);
            if (!p) return;
            setComp(id);
            setUnits(p.units);
            setFma(p.fma);
            setGhz(p.ghz);
          }}
        />
      </div>
      <p className="mt-5 rounded-xl bg-white p-3.5 text-sm leading-6 tabular-nums">
        {fmt(units, 5)} × {fma} × 2 × {ghz.toFixed(2)} GHz ÷ 1,000 = <span className="text-lg font-medium">{fmt(tflops)} TFLOP/s</span>
      </p>
      <p className="mt-2 text-xs leading-5 text-ink-soft">{cp ? cp.note : "The 2 is a multiply and an add, counted as two operations."}</p>
      <Assumptions>
        <Slider
          label="Units (cores, tensor cores or NPU multipliers)"
          value={units}
          min={1}
          max={100000}
          log
          step={1}
          shown={fmt(units, 5)}
          onChange={(v) => (setComp("custom"), setUnits(v))}
        />
        <Slider label="Multiply-adds each unit does per clock" value={fma} min={1} max={1024} log step={1} shown={String(fma)} onChange={(v) => (setComp("custom"), setFma(v))} />
        <Slider label="Clock, GHz" value={ghz} min={0.5} max={4} step={0.01} shown={ghz.toFixed(2)} onChange={(v) => (setComp("custom"), setGhz(v))} />
      </Assumptions>
    </Card>
  );
}

// A full-attention stack against a hybrid, layer by layer, as the conversation grows. Attention layers keep a
// cache that grows with every token; recurrent layers keep a state whose size is fixed by the design.
const SHOWN = 8;
const LLAMA_LIKE = { layers: 32, kvHeads: 8, headDim: 128 };

function Stack({ hybrid, every, perLayer, maxPerLayer }: { hybrid: boolean; every: number; perLayer: number; maxPerLayer: number }) {
  return (
    <ol className="space-y-1.5">
      {Array.from({ length: SHOWN }, (_, i) => {
        const attn = !hybrid || (i + 1) % every === 0;
        return (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 text-ink-soft">
              L{i + 1} {attn ? "attention" : "recurrent"}
            </span>
            <span className="relative h-4 flex-1 overflow-hidden rounded-[4px] bg-white">
              <span
                className="absolute inset-y-0 left-0 rounded-r-[4px]"
                style={{ width: attn ? `${Math.max(1.5, (perLayer / maxPerLayer) * 100)}%` : "3%", backgroundColor: attn ? ORANGE : TEAL }}
              />
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function HybridLab() {
  const [every, setEvery] = useState<string>("4");
  const [ctx, setCtx] = useState(32768);
  const [auto, setAuto] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const playing = usePlaying(ref);
  const t = useClock(playing && auto, 9000);
  // While nobody has touched the slider, the context grows from 1k to 128k tokens and starts again.
  const shownCtx = auto && playing ? Math.round(1024 * Math.pow(128, t % 1)) : ctx;
  const n = Number(every);
  const perLayer = kvBytesPerToken(1, LLAMA_LIKE.kvHeads, LLAMA_LIKE.headDim, 2) * shownCtx;
  const attnLayers = LLAMA_LIKE.layers / n;
  const full = (perLayer * LLAMA_LIKE.layers) / 1e9;
  const hybrid = (perLayer * attnLayers) / 1e9;
  const maxPerLayer = kvBytesPerToken(1, LLAMA_LIKE.kvHeads, LLAMA_LIKE.headDim, 2) * 131072;
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Chips label="In the hybrid, one attention layer in every" options={["2", "4", "8"].map((x) => ({ id: x, label: `${x} layers` }))} value={every} onChange={setEvery} />
        <Slider
          label="Conversation so far, tokens"
          value={shownCtx}
          min={1024}
          max={131072}
          log
          step={1024}
          shown={fmt(shownCtx)}
          onChange={(v) => {
            setAuto(false);
            setCtx(v);
          }}
        />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Readout label="Full attention, 32 layers" value={`${fmt(full)} GB`} note={`32 × 2 × 8 KV heads × 128 × 2 bytes × ${fmt(shownCtx)} tokens`} />
        <Readout label={`Hybrid: its ${attnLayers} attention layers' KV cache`} value={`${fmt(hybrid)} GB`} note={`plus the recurrent layers' states, which do not grow`} />
      </div>
      <div
        ref={ref}
        className="mt-6 grid gap-6 md:grid-cols-2"
        role="img"
        aria-label={`At ${fmt(shownCtx)} tokens, a 32-layer full-attention model keeps ${fmt(full)} GB of KV cache; the hybrid's attention layers keep ${fmt(hybrid)} GB, plus recurrent states that do not grow.`}
      >
        <div>
          <p className="text-sm font-medium">Full attention</p>
          <p className="mt-0.5 text-xs text-ink-soft">Every layer keeps every token&apos;s keys and values</p>
          <div className="mt-3">
            <Stack hybrid={false} every={n} perLayer={perLayer} maxPerLayer={maxPerLayer} />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">Hybrid, 1 attention layer in {n}</p>
          <p className="mt-0.5 text-xs text-ink-soft">Recurrent layers fold the past into a state of fixed size</p>
          <div className="mt-3">
            <Stack hybrid every={n} perLayer={perLayer} maxPerLayer={maxPerLayer} />
          </div>
        </div>
      </div>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ORANGE }} />
          KV cache, grows with every token
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: TEAL }} />
          Recurrent state, fixed size
        </span>
        <span>The first 8 of 32 layers shown</span>
      </p>
    </Card>
  );
}

// The path the weights travel, as three stations: storage, main memory, the chip. The one arrow that matters, main
// memory into the chip, is drawn heavy and orange; what happens inside the chip is folded away. Sizes are an H100's.
function Station({ name, line, size }: { name: string; line: string; size: string }) {
  return (
    <div className="min-w-0 flex-1 rounded-xl bg-white p-4">
      <p className="text-lg font-medium">{name}</p>
      <p className="mt-0.5 text-sm text-ink-soft">{line}</p>
      <p className="mt-2 text-sm font-medium tabular-nums">{size}</p>
    </div>
  );
}

function Arrow({ label, sub, hot }: { label: string; sub?: string; hot?: boolean }) {
  return (
    <div className={`flex shrink-0 items-center gap-3 py-1 md:w-36 md:flex-col md:justify-center md:gap-1 md:py-0 md:text-center ${hot ? "text-[#c92a2a]" : "text-ink-soft"}`}>
      <span aria-hidden className={`leading-none ${hot ? "text-3xl font-semibold" : "text-xl"}`}>
        <span className="md:hidden">↓</span>
        <span className="hidden md:inline">→</span>
      </span>
      <span>
        <span className={`block text-sm leading-5 ${hot ? "font-medium" : ""}`}>{label}</span>
        {sub && <span className="block text-xs leading-5 tabular-nums">{sub}</span>}
      </span>
    </div>
  );
}

export function Hierarchy() {
  return (
    <Card>
      <div
        className="flex flex-col gap-1 md:flex-row md:items-stretch"
        role="img"
        aria-label={`The weights load from storage into main memory once. Then, writing a reply, they are usually read again into the chip for each token, at up to the memory bandwidth: ${fmt(h100.bandwidthGBs / 1000)} TB/s on an H100.`}
      >
        <Station name="Storage" line="The model file" size="Until the model loads" />
        <Arrow label="Loads once" />
        <Station name="Main memory" line="Where the weights live" size={`${h100.memoryGB} GB on an H100`} />
        <Arrow label="Usually read again for each reply token" sub={`up to ${fmt(h100.bandwidthGBs / 1000)} TB/s on an H100`} hot />
        <Station name="The chip" line="Calculates the next token" size={`${fmt(h100.tflops!)} TFLOP/s on an H100`} />
      </div>
      <p className="mt-3 text-xs text-ink-soft">A simplified picture of one conversation with a dense model.</p>
      <details className="group mt-4 rounded-xl bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
          Look inside the chip
          <span aria-hidden className="text-base leading-none transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <ol className="grid gap-3 border-t border-rule px-4 py-4 text-sm sm:grid-cols-3">
          <li>
            <p className="font-medium">Caches</p>
            <p className="text-ink-soft">On-chip memory (SRAM) that keeps recent data close. 50 MB on an H100.</p>
          </li>
          <li>
            <p className="font-medium">Registers</p>
            <p className="text-ink-soft">Kilobytes of storage the units work from directly.</p>
          </li>
          <li>
            <p className="font-medium">Arithmetic units</p>
            <p className="text-ink-soft">Where the multiply-adds happen.</p>
          </li>
        </ol>
      </details>
    </Card>
  );
}

// The four kinds of memory, one card each: where it is used and what it trades.
export function MemoryKinds({ examples }: { examples: Record<"LPDDR" | "GDDR" | "HBM" | "SRAM", string> }) {
  const kinds = [
    { name: "LPDDR", where: "Phones, laptops, edge boxes", trade: "Low power, but a narrow bus", tone: TEAL },
    { name: "GDDR", where: "Graphics cards", trade: "Very fast pins on a wide bus", tone: BLUE },
    { name: "HBM", where: "Many server GPUs and AI chips", trade: "Stacked beside the chip: a very wide bus", tone: ORANGE },
    { name: "SRAM", where: "Groq, Cerebras", trade: "On the chip itself: huge bandwidth, little room", tone: "#6741d9" },
  ] as const;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {kinds.map((k) => (
        <div key={k.name} className="rounded-2xl bg-bench p-4" style={{ boxShadow: `inset 3px 0 0 ${k.tone}` }}>
          <p className="text-lg font-medium">{k.name}</p>
          <p className="text-sm text-ink-soft">{k.where}</p>
          <p className="mt-2 text-sm">{k.trade}</p>
          <p className="mt-1 text-sm font-medium tabular-nums">{examples[k.name]}</p>
        </div>
      ))}
    </div>
  );
}

// Attention against a recurrent mixer, side by side, three rows each.
export function MixerCards() {
  const cards = [
    { name: "Full attention", keeps: "Every earlier token's key and value", grows: "Its cache grows with every token", trade: "Can look straight back at any token", tone: ORANGE },
    { name: "Recurrent", keeps: "One state of fixed size", grows: "Stays the same size", trade: "Cheap, but details from far back can fade", tone: TEAL },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((c) => (
        <dl key={c.name} className="rounded-2xl bg-bench p-4 text-sm" style={{ boxShadow: `inset 3px 0 0 ${c.tone}` }}>
          <p className="text-lg font-medium">{c.name}</p>
          <dt className="mt-2 text-xs text-ink-soft">Keeps</dt>
          <dd>{c.keeps}</dd>
          <dt className="mt-2 text-xs text-ink-soft">As the chat grows</dt>
          <dd>{c.grows}</dd>
          <dt className="mt-2 text-xs text-ink-soft">The trade</dt>
          <dd>{c.trade}</dd>
        </dl>
      ))}
    </div>
  );
}

// One model at each precision: a bar per precision, against three devices' memory.
export function PrecisionLab({ models, marks }: { models: ModelPreset[]; marks: Device[] }) {
  const [modelId, setModel] = useState(models[1].id);
  const m = models.find((x) => x.id === modelId)!;
  const rows = precisions.map((p) => ({ name: p.name, gb: weightsGB(m.paramsB, p.bytes) }));
  const scale = Math.max(rows[0].gb, ...marks.map((d) => d.memoryGB)) * 1.05;
  return (
    <Card>
      <Chips label="Model" options={models.map((x) => ({ id: x.id, label: x.short }))} value={modelId} onChange={setModel} />
      <div className="relative mt-10 space-y-2.5" role="img" aria-label={`${m.short}'s weights: ${rows.map((r) => `${r.name} ${fmt(r.gb)} GB`).join(", ")}.`}>
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-[6.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm tabular-nums">
            <span className="text-ink-soft">{r.name}</span>
            <span className="relative h-6 rounded-md bg-white">
              <span className="absolute inset-y-0 left-0 rounded-md" style={{ width: `${(r.gb / scale) * 100}%`, backgroundColor: BLUE }} />
            </span>
            <span className="text-right font-medium">{fmt(r.gb)} GB</span>
          </div>
        ))}
        <div className="pointer-events-none absolute inset-y-0 left-[7.25rem] right-[5.25rem]">
          {marks.map((d) => (
            <span key={d.id} className="absolute inset-y-[-6px] w-px bg-ink/50" style={{ left: `${(d.memoryGB / scale) * 100}%` }}>
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-ink-soft tabular-nums">{fmt(d.memoryGB)} GB</span>
            </span>
          ))}
        </div>
      </div>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-px bg-ink/50" />
          Memory on {marks.map((d) => `${d.short} (${fmt(d.memoryGB)} GB)`).join(", ")}. Weights only, at ideal sizes: the KV cache and the runtime need more.
        </span>
      </p>
    </Card>
  );
}

// Two or three devices side by side: memory, bandwidth and compute, the reader picking which.
export function DeviceCompare({ devices, initial }: { devices: Device[]; initial: string[] }) {
  const [picked, setPicked] = useState<string[]>(initial);
  const chosen = picked.map((id) => devices.find((d) => d.id === id)!).filter(Boolean);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? (p.length > 1 ? p.filter((x) => x !== id) : p) : p.length >= 3 ? [...p.slice(1), id] : [...p, id]));
  const bwText = (gbs: number) => (gbs >= 1e6 ? `${fmt(gbs / 1e6)} PB/s` : gbs >= 1000 ? `${fmt(gbs / 1000)} TB/s` : `${fmt(gbs)} GB/s`);
  return (
    <Card>
      <p className="text-xs text-ink-soft">Pick up to three; a fourth replaces the oldest</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {devices.map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={picked.includes(d.id)}
            onClick={() => toggle(d.id)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${picked.includes(d.id) ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-ink"}`}
          >
            {d.short}
          </button>
        ))}
      </div>
      <div className={`mt-5 grid gap-3 ${chosen.length === 3 ? "sm:grid-cols-3" : chosen.length === 2 ? "sm:grid-cols-2" : ""}`}>
        {chosen.map((d) => (
          <div key={d.id} className="rounded-xl bg-white p-4">
            <p className="text-base font-medium">{d.short}</p>
            <p className="text-xs text-ink-soft">{d.memoryType}</p>
            {d.badge && <p className="mt-1.5 inline-block rounded-full bg-bench px-2 py-0.5 text-xs text-ink-soft">{d.badge}</p>}
            <dl className="mt-3 space-y-2.5 text-sm tabular-nums">
              <div>
                <dt className="text-xs text-ink-soft">Memory</dt>
                <dd className="text-lg font-medium">{d.memoryGB < 1 ? `${fmt(d.memoryGB * 1000)} MB` : `${fmt(d.memoryGB)} GB`}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">Bandwidth</dt>
                <dd className="text-lg font-medium">{bwText(d.bandwidthGBs)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">Compute, 16-bit</dt>
                <dd className="text-lg font-medium">{d.tflops ? `${fmt(d.tflops)} TFLOP/s` : "not published"}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-soft">Each figure links to its source in the list under this section.</p>
    </Card>
  );
}

// The ridge point as a scale: operations per byte on a log axis, the chip's ridge marked, and two jobs placed on it.
export function RidgeScale({ ridgeAt, jobs }: { ridgeAt: number; jobs: { label: string; at: number; tone: string }[] }) {
  const lo = 0.3;
  const hi = 30000;
  const x = (v: number) => (Math.log(v / lo) / Math.log(hi / lo)) * 100;
  return (
    <Card>
      <div
        className="relative mx-2 mt-8 mb-20"
        role="img"
        aria-label={`The ridge at ${fmt(ridgeAt)} operations per byte; ${jobs.map((j) => `${j.label} at about ${fmt(j.at)}`).join(", ")}.`}
      >
        <div className="flex h-3 overflow-hidden rounded-full">
          <span style={{ width: `${x(ridgeAt)}%`, backgroundColor: "color-mix(in srgb, #d9480f 30%, white)" }} />
          <span className="flex-1" style={{ backgroundColor: "color-mix(in srgb, #2b44e6 30%, white)" }} />
        </div>
        <span className="absolute -top-6 -translate-x-1/2 whitespace-nowrap text-xs font-medium" style={{ left: `${x(ridgeAt)}%` }}>
          Ridge, {fmt(ridgeAt)}
        </span>
        <span className="absolute -top-1 h-5 w-0.5 -translate-x-1/2 bg-ink" style={{ left: `${x(ridgeAt)}%` }} />
        {jobs.map((j) => (
          <span key={j.label} className="absolute top-5 -translate-x-1/2 text-center text-xs" style={{ left: `${Math.min(92, Math.max(8, x(j.at)))}%` }}>
            <span className="mx-auto block h-3 w-3 rounded-full" style={{ backgroundColor: j.tone }} />
            <span className="mt-1 block whitespace-nowrap">{j.label}</span>
            <span className="block whitespace-nowrap text-ink-soft tabular-nums">about {fmt(j.at)}</span>
          </span>
        ))}
      </div>
      <p className="flex justify-between gap-4 border-t border-rule pt-3 text-xs font-medium">
        <span>← Waits on memory</span>
        <span>Waits on compute →</span>
      </p>
      <p className="mt-1 text-center text-xs text-ink-soft">Operations per byte read, on a log scale</p>
    </Card>
  );
}

// Training's memory per parameter, 16 bytes in five parts, as one bar.
export function StateBar() {
  const parts = [
    { name: "Weights, 16-bit", bytes: 2, tone: BLUE },
    { name: "Gradients, 16-bit", bytes: 2, tone: ORANGE },
    { name: "32-bit copy of the weights", bytes: 4, tone: TEAL },
    { name: "Adam's average of the gradients", bytes: 4, tone: "#6741d9" },
    { name: "Adam's average of their squares", bytes: 4, tone: "#868e96" },
  ];
  return (
    <Card>
      <div className="flex h-9 gap-[3px] overflow-hidden rounded-lg" role="img" aria-label={`16 bytes a parameter: ${parts.map((p) => `${p.name} ${p.bytes}`).join(", ")}.`}>
        {parts.map((p) => (
          <span
            key={p.name}
            className="flex items-center justify-center text-sm font-medium text-white tabular-nums"
            style={{ flexGrow: p.bytes, flexBasis: 0, backgroundColor: p.tone }}
          >
            {p.bytes}
          </span>
        ))}
      </div>
      <ul className="mt-3 grid gap-x-5 gap-y-1 text-sm sm:grid-cols-2">
        {parts.map((p) => (
          <li key={p.name} className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: p.tone }} />
            {p.name}: {p.bytes} bytes
          </li>
        ))}
      </ul>
    </Card>
  );
}
