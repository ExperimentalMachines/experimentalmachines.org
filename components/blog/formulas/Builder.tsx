"use client";

import { useRef, useState } from "react";
import { decodeCeiling, fmt, kvBytesPerToken, kvGB, paramCount, precisions, sci, trainFLOPs, weightsGB, type Shape } from "@/lib/blog/arith";
import type { Device, ModelPreset } from "@/lib/blog/formulas-data";
import { Assumptions, Big, BLUE, Card, Chips, deviceOptions, ORANGE, Readout, Slider, TEAL, useClock, usePlaying } from "@/components/blog/formulas/Widgets";

// The model-building part of the post: a model's shape on sliders, every consequence computed from it, and two
// smaller pictures (prefill against decode, and the spec sheets side by side).

const pow2 = (lo: number, hi: number) => {
  const out: number[] = [];
  for (let x = lo; x <= hi; x *= 2) out.push(x);
  return out;
};

const toShape = (m: ModelPreset): Shape => ({
  layers: m.layers,
  dModel: m.dModel,
  heads: m.heads,
  kvHeads: m.kvHeads,
  headDim: m.headDim,
  ffn: m.ffn,
  vocab: m.vocab,
  tied: m.tied,
  experts: m.experts ?? 1,
  activeExperts: m.activeExperts ?? 1,
});

// Build a model: change its shape and watch the parameter count, memory, KV cache, decode ceiling and training
// budget follow. Picking a preset reproduces that model's published parameter count.
export function ModelBuilder({ models, devices }: { models: ModelPreset[]; devices: Device[] }) {
  const [preset, setPreset] = useState<string>(models[1].id);
  const [s, setS] = useState<Shape>(toShape(models[1]));
  const [prec, setPrec] = useState<string>("4-bit");
  const [devId, setDev] = useState(devices.find((d) => d.kind === "edge")?.id ?? devices[0].id);
  const [ctx, setCtx] = useState(8192);
  const d = devices.find((x) => x.id === devId)!;
  const bytes = precisions.find((p) => p.name === prec)!.bytes;
  const set = (patch: Partial<Shape>) => {
    setPreset("custom");
    setS((x) => {
      const n = { ...x, ...patch };
      n.kvHeads = Math.min(n.kvHeads, n.heads);
      n.activeExperts = Math.min(n.activeExperts ?? 1, n.experts ?? 1);
      return n;
    });
  };
  const c = paramCount(s);
  const moe = (s.experts ?? 1) > 1;
  const stored = weightsGB(c.total / 1e9, bytes);
  const read = weightsGB(c.active / 1e9, bytes);
  const perTok = kvBytesPerToken(s.layers, s.kvHeads, s.headDim, 2);
  const kv = kvGB(perTok, ctx, 1);
  const fits = stored + kv <= d.memoryGB;
  const tokS = decodeCeiling(d.bandwidthGBs, read, kv);
  // Chinchilla's compute-optimal budget, about 20 training tokens per parameter.
  const tokensB = (20 * c.total) / 1e9;
  const train = trainFLOPs(c.active / 1e9, tokensB);
  const parts = [
    { name: "Embeddings", value: c.embeddings, color: TEAL },
    { name: "Attention", value: c.attention, color: BLUE },
    { name: moe ? "Feed-forward experts" : "Feed-forward", value: c.mlp, color: ORANGE },
  ];
  return (
    <Card>
      <Chips
        label="Start from a real model"
        options={[...models.map((m) => ({ id: m.id, label: m.short })), ...(preset === "custom" ? [{ id: "custom", label: "Your model" }] : [])]}
        value={preset}
        onChange={(id) => {
          const m = models.find((x) => x.id === id);
          if (!m) return;
          setPreset(id);
          setS(toShape(m));
        }}
      />
      <div className="mt-6 grid gap-5 sm:grid-cols-[1.2fr_1fr]">
        <Big label="Parameters" value={`${fmt(c.total / 1e9)} billion`} note={moe ? `${fmt(c.active / 1e9)} billion used per token` : "all used for every token"} />
        <Readout
          label={`Memory on the ${d.short}, ${prec}`}
          value={`${fmt(stored + kv)} GB`}
          note={fits ? `weights ${fmt(stored)} + KV cache ${fmt(kv)}, of ${fmt(d.memoryGB)} GB` : `more than its ${fmt(d.memoryGB)} GB`}
          tone={fits ? undefined : "bad"}
        />
        <Readout
          label="Bandwidth ceiling for a reply"
          value={fits ? `${fmt(tokS)} tokens/s` : "does not fit"}
          note={fits ? `${fmt(d.bandwidthGBs)} GB/s ÷ ${fmt(read + kv)} GB a token` : undefined}
          tone={fits ? undefined : "bad"}
        />
        <Readout
          label="Training it on 20 tokens a parameter"
          value={`${sci(train)} operations`}
          note={moe ? "Chinchilla's 20 was found for dense models" : `6 × ${fmt(c.active / 1e9)}B × ${fmt(tokensB)}B tokens`}
        />
      </div>
      <div className="mt-6" role="img" aria-label={parts.map((p) => `${p.name} ${fmt(p.value / 1e9)} billion`).join(", ")}>
        <p className="text-xs text-ink-soft">Where the {fmt(c.total / 1e9)} billion parameters sit</p>
        <div className="mt-2 flex h-7 gap-[2px] overflow-hidden rounded-md">
          {parts.map((p) => (
            <span key={p.name} style={{ width: `${(p.value / c.total) * 100}%`, backgroundColor: p.color }} />
          ))}
        </div>
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
          {parts.map((p) => (
            <span key={p.name} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
              {p.name}, {fmt(p.value / 1e9)}B ({Math.round((p.value / c.total) * 100)}%)
            </span>
          ))}
        </p>
      </div>

      <details className="group mt-5 rounded-xl bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
          Change the shape
          <span aria-hidden className="text-base leading-none transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="border-t border-rule px-4 pb-4">
          <div className="mt-4 grid gap-x-6 gap-y-4 md:grid-cols-2">
            <Slider label="Layers" value={s.layers} min={2} max={128} step={1} shown={String(s.layers)} onChange={(v) => set({ layers: v })} />
            <Slider label="Width (model dimension)" value={s.dModel} min={512} max={16384} log step={128} shown={fmt(s.dModel)} onChange={(v) => set({ dModel: v })} />
            <Slider
              label={moe ? "Feed-forward width, each expert" : "Feed-forward width"}
              value={s.ffn}
              min={256}
              max={65536}
              log
              step={128}
              shown={fmt(s.ffn)}
              onChange={(v) => set({ ffn: v })}
            />
            <Slider label="Vocabulary" value={s.vocab} min={16000} max={262144} log step={64} shown={fmt(s.vocab)} onChange={(v) => set({ vocab: v })} />
          </div>
          <div className="mt-4 grid gap-x-6 gap-y-4 md:grid-cols-2">
            <Chips
              label="Query heads (128 wide each)"
              options={pow2(8, 128).map((x) => ({ id: String(x), label: String(x) }))}
              value={String(s.heads)}
              onChange={(v) => set({ heads: Number(v) })}
            />
            <Chips
              label="KV heads: fewer means a smaller KV cache"
              options={pow2(1, s.heads).map((x) => ({ id: String(x), label: String(x) }))}
              value={String(s.kvHeads)}
              onChange={(v) => set({ kvHeads: Number(v) })}
            />
            <Slider
              label="Experts (1 = a dense model)"
              value={s.experts ?? 1}
              min={1}
              max={256}
              log
              step={1}
              shown={String(s.experts ?? 1)}
              onChange={(v) => set({ experts: v })}
            />
            {moe ? (
              <Slider
                label="Experts each token uses"
                value={s.activeExperts ?? 1}
                min={1}
                max={Math.min(16, s.experts ?? 1)}
                step={1}
                shown={String(s.activeExperts ?? 1)}
                onChange={(v) => set({ activeExperts: v })}
              />
            ) : (
              <Chips
                label="Output layer"
                options={[
                  { id: "own", label: "Its own weights" },
                  { id: "tied", label: "Reuses the input table" },
                ]}
                value={s.tied ? "tied" : "own"}
                onChange={(v) => set({ tied: v === "tied" })}
              />
            )}
          </div>
        </div>
      </details>
      <Assumptions>
        <Chips label="Run it at" options={precisions.map((p) => ({ id: p.name, label: p.name }))} value={prec} onChange={setPrec} />
        <Chips label="On" options={deviceOptions(devices)} value={devId} onChange={setDev} />
        <Slider label="Context, tokens" value={ctx} min={512} max={131072} log step={512} shown={fmt(ctx)} onChange={setCtx} />
      </Assumptions>
    </Card>
  );
}

const SWEEP_BLOCKS = 16;

function Sweep({ active, p }: { active: boolean; p: number }) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: SWEEP_BLOCKS }, (_, i) => {
        const lit = active && p * SWEEP_BLOCKS >= i && p * SWEEP_BLOCKS < i + 1.5;
        return <span key={i} className="h-6 flex-1 rounded-[3px]" style={{ backgroundColor: lit ? BLUE : "color-mix(in srgb, #2b44e6 14%, white)" }} />;
      })}
    </div>
  );
}

const Tok = ({ on, label }: { on: boolean; label: string }) => (
  <span className={`rounded-md px-2 py-1 text-xs tabular-nums transition-colors duration-200 ${on ? "bg-ink text-white" : "bg-white text-ink-soft"}`}>{label}</span>
);

// Prefill and decode do the same work per token; what differs is how many tokens share one read of the weights.
export function PassesLab() {
  const ref = useRef<HTMLDivElement>(null);
  const playing = usePlaying(ref);
  const n = 8;
  const t = useClock(playing, 1100);
  // One cycle: n sweeps of the weights, then a pause of two sweeps before it starts again.
  const cycle = playing ? t % (n + 2) : n + 1;
  const sweep = Math.min(Math.floor(cycle), n);
  const phase = cycle < n ? cycle % 1 : 1;
  const prefillDone = cycle >= 1;
  const decoded = Math.min(Math.floor(cycle), n);
  return (
    <Card>
      <div
        ref={ref}
        className="grid gap-6 md:grid-cols-2"
        role="img"
        aria-label="Prefill reads the weights once for all eight prompt tokens; decode reads them once for each of eight reply tokens."
      >
        <div>
          <p className="text-sm font-medium">Reading the prompt (prefill)</p>
          <p className="mt-0.5 text-xs text-ink-soft">All {n} prompt tokens go through together</p>
          <div className="mt-3">
            <Sweep active={!prefillDone} p={phase} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Array.from({ length: n }, (_, i) => (
              <Tok key={i} on={prefillDone} label={`p${i + 1}`} />
            ))}
          </div>
          <p className="mt-3 text-sm tabular-nums">
            Weight reads: <span className="font-medium">{prefillDone ? 1 : 0}</span> for {prefillDone ? n : 0} tokens
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Writing the reply (decode)</p>
          <p className="mt-0.5 text-xs text-ink-soft">Each token needs the one before it, so one at a time</p>
          <div className="mt-3">
            <Sweep active={sweep < n} p={phase} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Array.from({ length: n }, (_, i) => (
              <Tok key={i} on={i < decoded} label={`r${i + 1}`} />
            ))}
          </div>
          <p className="mt-3 text-sm tabular-nums">
            Weight reads: <span className="font-medium">{decoded}</span> for {decoded} tokens
          </p>
        </div>
      </div>
    </Card>
  );
}

const kindName: Record<Device["kind"], string> = { edge: "Edge", consumer: "Consumer GPU", server: "Server GPU", asic: "ASIC" };
const kindColor: Record<Device["kind"], string> = { edge: TEAL, consumer: BLUE, server: ORANGE, asic: "#6741d9" };

// The spec sheets side by side: capacity and bandwidth as bars on log scales, and the decode ceiling they imply
// for the model and precision chosen above the table.
export function SpecBars({ models, devices }: { models: ModelPreset[]; devices: Device[] }) {
  const [modelId, setModel] = useState(models[1].id);
  const [prec, setPrec] = useState<string>("4-bit");
  const m = models.find((x) => x.id === modelId)!;
  const bytes = precisions.find((p) => p.name === prec)!.bytes;
  const stored = weightsGB(m.paramsB, bytes);
  const read = weightsGB(m.activeB ?? m.paramsB, bytes);
  const span = (vals: number[]) => [Math.min(...vals) / 2, Math.max(...vals) * 1.2];
  const [cLo, cHi] = span(devices.map((d) => d.memoryGB));
  const [bLo, bHi] = span(devices.map((d) => d.bandwidthGBs));
  const pos = (v: number, lo: number, hi: number) => Math.max(2, (Math.log(v / lo) / Math.log(hi / lo)) * 100);
  const kinds = (["edge", "consumer", "server", "asic"] as const).filter((k) => devices.some((d) => d.kind === k));
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Chips label="Model" options={models.map((x) => ({ id: x.id, label: x.short }))} value={modelId} onChange={setModel} />
        <Chips label="Precision" options={precisions.map((p) => ({ id: p.name, label: p.name }))} value={prec} onChange={setPrec} />
      </div>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
        {kinds.map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: kindColor[k] }} />
            {kindName[k]}
          </span>
        ))}
      </p>
      <div className="mt-3 overflow-x-auto" role="region" aria-label="Spec sheets compared, scrolls sideways on small screens" tabIndex={0}>
        <table className="w-full min-w-[40rem] text-sm tabular-nums">
          <caption className="sr-only">
            Memory capacity, memory bandwidth and the fastest {m.short} could be written at {prec} on each device
          </caption>
          <thead>
            <tr className="text-xs text-ink-soft">
              <th scope="col" className="py-2 pr-3 text-left font-normal">
                Device
              </th>
              <th scope="col" className="w-[28%] px-3 py-2 text-left font-normal">
                Memory capacity (log scale)
              </th>
              <th scope="col" className="w-[28%] px-3 py-2 text-left font-normal">
                Memory bandwidth (log scale)
              </th>
              <th scope="col" className="py-2 pl-3 text-right font-normal">
                {m.short}, {prec}: bandwidth ÷ weights
              </th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => {
              const fits = stored <= d.memoryGB;
              // On-chip SRAM moves so many bytes that a bandwidth-only ceiling runs into the millions of tokens a second,
              // which predicts nothing: compute, the latency from layer to layer and the links between chips limit it instead.
              const sram = d.memoryType === "On-chip SRAM";
              return (
                <tr key={d.id} className="border-t border-rule">
                  <th scope="row" className="py-2.5 pr-3 text-left font-medium">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: kindColor[d.kind] }} aria-hidden />
                      {d.short}
                    </span>
                  </th>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-3 rounded-r-[4px]" style={{ width: `${pos(d.memoryGB, cLo, cHi)}%`, backgroundColor: kindColor[d.kind] }} />
                      <span className="whitespace-nowrap text-xs">{d.memoryGB < 1 ? `${fmt(d.memoryGB * 1000)} MB` : `${fmt(d.memoryGB)} GB`}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-3 rounded-r-[4px]" style={{ width: `${pos(d.bandwidthGBs, bLo, bHi)}%`, backgroundColor: kindColor[d.kind] }} />
                      <span className="whitespace-nowrap text-xs">
                        {d.bandwidthGBs >= 1e6
                          ? `${fmt(d.bandwidthGBs / 1e6)} PB/s`
                          : d.bandwidthGBs >= 1000
                            ? `${fmt(d.bandwidthGBs / 1000)} TB/s`
                            : `${fmt(d.bandwidthGBs)} GB/s`}
                      </span>
                    </div>
                  </td>
                  <td className={`py-2.5 pl-3 text-right ${fits && !sram ? "" : "text-ink-soft"}`}>
                    {!fits ? "does not fit on one chip" : sram ? "not a useful estimate" : `${fmt(decodeCeiling(d.bandwidthGBs, read))} tokens/s`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
