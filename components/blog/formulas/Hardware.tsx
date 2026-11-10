"use client";

import { useRef, useState } from "react";
import { fmt, kvBytesPerToken } from "@/lib/blog/arith";
import { h100 } from "@/lib/blog/formulas-shared";
import { BLUE, Card, Chips, ORANGE, Readout, Slider, TEAL, useClock, usePlaying } from "@/components/blog/formulas/Widgets";

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

export function SpecLab() {
  const [bus, setBus] = useState<string>("phone");
  const [rate, setRate] = useState(10667);
  const [channels, setChannels] = useState(4);
  const [width, setWidth] = useState(16);
  const [comp, setComp] = useState<string>("fp32");
  const [units, setUnits] = useState(16384);
  const [fma, setFma] = useState(1);
  const [ghz, setGhz] = useState(2.52);
  const busBits = channels * width;
  const gbs = (rate * busBits) / 8 / 1000;
  const tflops = (units * fma * 2 * ghz) / 1000;
  const bp = busPresets.find((p) => p.id === bus);
  const cp = computePresets.find((p) => p.id === comp);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
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
        <div className="mt-4 space-y-4">
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
          <Slider
            label="Channels (or memory chips)"
            value={channels}
            min={1}
            max={128}
            log
            step={1}
            shown={String(channels)}
            onChange={(v) => (setBus("custom"), setChannels(v))}
          />
          <Chips
            label="Bits per channel: one data pin each"
            options={[16, 32, 64].map((x) => ({ id: String(x), label: String(x) }))}
            value={String(width)}
            onChange={(v) => (setBus("custom"), setWidth(Number(v)))}
          />
        </div>
        <p className="mt-5 rounded-xl bg-white p-3.5 text-sm leading-6 tabular-nums">
          {fmt(rate, 5)} MT/s × ({channels} × {width} bits) ÷ 8 ÷ 1,000 ={" "}
          <span className="text-lg font-medium">{gbs >= 1000 ? `${fmt(gbs / 1000)} TB/s` : `${fmt(gbs)} GB/s`}</span>
        </p>
        <p className="mt-2 text-xs leading-5 text-ink-soft">{bp ? bp.note : `A ${fmt(busBits)}-bit bus.`}</p>
      </Card>
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
        <div className="mt-4 space-y-4">
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
        </div>
        <p className="mt-5 rounded-xl bg-white p-3.5 text-sm leading-6 tabular-nums">
          {fmt(units, 5)} × {fma} × 2 × {ghz.toFixed(2)} GHz ÷ 1,000 = <span className="text-lg font-medium">{fmt(tflops)} TFLOP/s</span>
        </p>
        <p className="mt-2 text-xs leading-5 text-ink-soft">{cp ? cp.note : "The 2 is a multiply and an add, counted as two operations."}</p>
      </Card>
    </div>
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
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Readout label="Full attention, 32 layers" value={`${fmt(full)} GB`} note={`32 × 2 × 8 KV heads × 128 × 2 bytes × ${fmt(shownCtx)} tokens`} />
        <Readout label={`Hybrid: its ${attnLayers} attention layers' KV cache`} value={`${fmt(hybrid)} GB`} note={`plus the recurrent layers' states, which do not grow`} />
      </div>
    </Card>
  );
}

// The path the weights travel, left to right: from storage into main memory once, then across the one link the spec
// sheet's bandwidth describes, into the chip's caches and registers, to the units that do the arithmetic. The chip is
// one dashed boundary, so the link that crosses it reads as the bottleneck. Sizes are an H100's; a phone's main
// memory is LPDDR, its bandwidth about a fortieth.
type Stop = { name: string; what: string; size: string; tone: string };

function StopCard({ s }: { s: Stop }) {
  return (
    <div className="min-w-0 flex-1 rounded-xl bg-white p-3.5" style={{ boxShadow: `inset 3px 0 0 ${s.tone}` }}>
      <p className="text-sm font-medium">{s.name}</p>
      <p className="mt-0.5 text-xs leading-5 text-ink-soft">{s.what}</p>
      <p className="mt-1.5 text-xs font-medium tabular-nums">{s.size}</p>
    </div>
  );
}

function Hop({ label, hot, across }: { label: string; hot?: boolean; across?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center gap-2 px-1 py-0.5 ${across ? "sm:w-20 sm:flex-col sm:justify-center sm:gap-1 sm:text-center" : ""} ${hot ? "text-[#c92a2a]" : "text-ink-soft"}`}
    >
      <span aria-hidden className={`text-lg leading-none ${hot ? "font-semibold" : ""}`}>
        {across ? (
          <>
            <span className="sm:hidden">↓</span>
            <span className="hidden sm:inline">→</span>
          </>
        ) : (
          "↓"
        )}
      </span>
      <span className={`text-xs leading-4 ${hot ? "font-medium" : ""}`}>{label}</span>
    </div>
  );
}

export function Hierarchy() {
  const storage: Stop = { name: "Storage", what: "Flash. The model file sits here until it loads.", size: "Hundreds of GB", tone: "#868e96" };
  const dram: Stop = { name: "Main memory", what: "DRAM: LPDDR, GDDR or HBM. The weights live here.", size: `${h100.memoryGB} GB on an H100`, tone: ORANGE };
  const onChip: Stop[] = [
    { name: "Caches", what: "SRAM, on the chip itself.", size: "50 MB of L2 on an H100", tone: BLUE },
    { name: "Registers", what: "Small, fast storage the processing units work from.", size: "Kilobytes", tone: BLUE },
    { name: "Arithmetic units", what: "Where the multiply-adds happen.", size: `up to ${fmt(h100.tflops!)} trillion 16-bit operations a second on an H100`, tone: BLUE },
  ];
  return (
    <Card>
      <div
        className="mx-auto flex max-w-3xl flex-col gap-1.5"
        role="img"
        aria-label="The weights travel from storage into main memory once, when the model loads; then, writing a reply for one conversation with a dense model, about once per token across the memory bus into the chip's caches and registers to the arithmetic units. The memory bandwidth on a spec sheet is the speed of that one link."
      >
        <StopCard s={storage} />
        <Hop label="once, when the model loads" />
        <StopCard s={dram} />
        <Hop
          label={`memory bandwidth, the spec-sheet number (${fmt(h100.bandwidthGBs / 1000)} TB/s on an H100): for one conversation with a dense model, the weights cross here about once per token`}
          hot
        />
        <div className="rounded-2xl border-2 border-dashed border-ink/25 p-2">
          <p className="px-1 pb-1.5 text-xs text-ink-soft">The chip</p>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-stretch">
            <StopCard s={onChip[0]} />
            <Hop label="faster" across />
            <StopCard s={onChip[1]} />
            <Hop label="faster" across />
            <StopCard s={onChip[2]} />
          </div>
        </div>
      </div>
      <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-ink-soft">
        Everything past the red arrow is fast. Writing a reply for one conversation, the arrow is usually the speed limit; batches, caches and the arithmetic itself can change
        that.
      </p>
    </Card>
  );
}
