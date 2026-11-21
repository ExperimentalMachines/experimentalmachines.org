// The KV-cache study: what each figure on /research/kv-cache/ reads, derived from lib/kv-cache-data.ts (generated from
// the phones' raw results by the study's export_site.py). Nothing here is typed in by hand except the links.

import { kv } from "@/lib/kv-cache-data";

export { kv };

const et = "https://github.com/pytorch/executorch/blob/v1.5.1";
export const kvLinks = {
  int8Cache: `${et}/examples/models/llama/source_transformation/custom_kv_cache.py`,
  sdpa: `${et}/backends/vulkan/runtime/graph/ops/impl/SDPA.cpp`,
  softmax: `${et}/backends/vulkan/runtime/graph/ops/glsl/sdpa_attn_weights_softmax.glsl`,
  hub: "https://huggingface.co/experimentalmachines/Llama-3.2-1B-Instruct-ExecuTorch/tree/main/vulkan",
  pg19: "https://huggingface.co/datasets/deepmind/pg19",
  ruler: "https://github.com/NVIDIA/RULER",
};

export const MODELS = ["Llama 3.2 1B", "LFM2.5 1.2B", "Qwen3 1.7B", "Gemma 3 1B"] as const;
export const DEPTHS = [1900, 7900, 32500] as const;

// "1.9k tokens in", from a checkpoint's depth.
export const depthLabel = (d: number) => `${(Math.floor(d / 100) / 10).toString()}k`;

// MiB as the harness logged them, in GB as the site prints memory.
export const gb = (mib: number) => (mib * 1.048576) / 1000;
export const gbShown = (mib: number) => `${gb(mib).toFixed(1)} GB`;
// A difference between two shown values, taken from the shown (rounded) values so the page's arithmetic adds up.
export const gbLess = (a: number, b: number) => (Number(gb(a).toFixed(1)) - Number(gb(b).toFixed(1))).toFixed(1);

// Two decimals below 1.5×, where the second one matters, one above.
export const times = (x: number) => `${x.toFixed(x < 1.5 ? 2 : 1)}×`;
export const pct = (x: number, d = 0) => `${(100 * x).toFixed(d)}%`;

// ---------- CPU: 32-bit against 8-bit cache ----------

// Writing speed by depth, from each model's 32k file: the only file that reaches all three depths.
export const cpuSpeed = MODELS.map((model) => {
  const r = kv.cpu.speed.find((s) => s.model === model && s.window === "32k")!;
  return { model, cells: DEPTHS.map((d) => r.decode.find((x) => x.depth === d)!) };
});

// The speed-up at 7.9k tokens across every file that reaches it (8k and 32k windows), and at 32.5k.
const ratios = (d: number) => kv.cpu.speed.flatMap((r) => r.decode.filter((x) => x.depth === d).map((x) => ({ model: r.model, window: r.window, x: x.b / x.a })));
export const cpuAt7900 = ratios(7900);
export const cpuAt32500 = ratios(32500);
const span = (xs: number[]) => [Math.min(...xs), Math.max(...xs)] as const;
export const cpu7900Span = span(cpuAt7900.map((r) => r.x));
// Qwen3 at 32.5k is reported on its own: its 32-bit file had nearly filled the phone's memory.
export const cpu32500Span = span(cpuAt32500.filter((r) => r.model !== "Qwen3 1.7B").map((r) => r.x));
export const qwenAt32500 = cpuAt32500.find((r) => r.model === "Qwen3 1.7B")!;
export const qwenSpeed32500 = cpuSpeed.find((r) => r.model === "Qwen3 1.7B")!.cells[2];

// The cover: each model's speed-up 7.9k tokens in, through its 32k file.
export const coverBars = cpuSpeed.map((r) => ({ model: r.model, x: r.cells[1].b / r.cells[1].a }));
export const coverTop = coverBars.reduce((a, b) => (b.x > a.x ? b : a));

// Peak resident memory of the benchmark process, per model at each window.
export const cpuMemory = (window: string) => MODELS.map((model) => kv.cpu.memory.find((m) => m.model === model && m.window === window)!);
export const cpuMemorySaved = Math.max(...kv.cpu.memory.map((m) => m.peakA - m.peakB));

// Divergence from the original model: one row per distinct checkpoint (the files' outputs are identical across
// windows at the same depth), 1.9k and 7.9k through the 8k file and 32.5k through the 32k file.
export const cpuQuality = MODELS.flatMap((model) =>
  DEPTHS.map((d) => kv.cpu.quality.find((q) => q.model === model && q.depth === d && q.window === (d === 32500 ? "32k" : "8k"))!),
);
export const cpuChangeSpan = span(cpuQuality.map((q) => q.change));

// How often the two files' likeliest next tokens differ, and their direct divergence (second phone, 8k files).
export const cpuDirect = MODELS.map((model) => ({
  model,
  cells: [1900, 7900].map((d) => ({
    top: kv.rerun.topDiffers.find((t) => t.model === model && t.window === "8k" && t.depth === d)!,
    q: kv.rerun.quality.find((q) => q.model === model && q.window === "8k" && q.depth === d)!,
  })),
}));
const directAll = kv.rerun.quality.map((q) => q.direct!);
export const cpuDirectSpan = span(directAll);
export const cpuDirectWorst = Math.max(...kv.rerun.quality.map((q) => q.directMax!));

// Decode speed on the second phone against the first, same file and depth, both caches: how much the phones differed.
export const crossPhone = kv.rerun.speed.flatMap((r) => {
  const f = kv.cpu.speed.find((x) => x.model === r.model && x.window === r.window)!;
  return r.decode.flatMap((d) => {
    const g = f.decode.find((x) => x.depth === d.depth)!;
    return [
      { model: r.model, window: r.window, change: d.a / g.a - 1 },
      { model: r.model, window: r.window, change: d.b / g.b - 1 },
    ];
  });
});
export const crossPhoneWorst = crossPhone.reduce((a, b) => (Math.abs(b.change) > Math.abs(a.change) ? b : a));
export const cpuTopSpan = span(kv.rerun.topDiffers.map((t) => t.differ / t.of));

// Needles: paired outcomes, first phone, LFM2.5 left out (rewinding its cache does not restore its state), and
// LFM2.5 from the second phone, answered from a fresh model.
export const cpuNeedles = MODELS.map((model) => {
  const rows = model === "LFM2.5 1.2B" ? kv.rerun.needles.filter((n) => n.model === model) : kv.cpu.needles.filter((n) => n.model === model);
  const sum = (k: "of" | "both" | "onlyA" | "onlyB" | "neither" | "hf") => rows.reduce((s, r) => s + r[k], 0);
  return { model, fresh: model === "LFM2.5 1.2B", of: sum("of"), both: sum("both"), onlyA: sum("onlyA"), onlyB: sum("onlyB"), neither: sum("neither"), hf: sum("hf") };
});
const firstPhone = cpuNeedles.filter((n) => !n.fresh);
export const needleTotals = {
  of: firstPhone.reduce((s, n) => s + n.of, 0),
  onlyA: firstPhone.reduce((s, n) => s + n.onlyA, 0),
  onlyB: firstPhone.reduce((s, n) => s + n.onlyB, 0),
};

// ---------- GPU: 32-bit against 16-bit ----------

// Every GPU file, in model then window order, with the phone it ran on.
export const gpuFiles = kv.gpu.speed.map((s) => ({
  ...s,
  label: `${s.model}, ${s.window} window`,
  at1900: s.decode.find((d) => d.depth === 1900)!,
  memory: kv.gpu.memory.find((m) => m.model === s.model && m.window === s.window)!,
}));
export const gpuSpeedSpan = span(gpuFiles.map((f) => f.at1900.b / f.at1900.a));
export const gpuSavedSpan = span(gpuFiles.map((f) => f.memory.gpuA! - f.memory.gpuB!));
export const gpuDirectSpan = span(kv.gpu.quality.filter((q) => q.depth <= 7900).map((q) => q.direct!));

// Llama 3.2 1B on one book through its 32k files, CPU and GPU: agreement with the original model's top token by depth.
export const depthSeries = [
  { name: "GPU, 32-bit", run: kv.depth.gpuA, color: 0 },
  { name: "GPU, 16-bit", run: kv.depth.gpuB, color: 1 },
  { name: "CPU, 32-bit", run: kv.depth.cpuA, color: 2 },
  { name: "CPU, 8-bit", run: kv.depth.cpuB, color: 3 },
].map((s) => {
  const at = s.run as Record<string, { kl: number; top1: number; tail: number | null }>;
  return { ...s, top1: DEPTHS.map((d) => at[String(d)].top1), kl: DEPTHS.map((d) => at[String(d)].kl) };
});

const g32 = kv.gpu.quality.find((q) => q.model === "Llama 3.2 1B" && q.window === "32k" && q.depth === 32500)!;
const n32 = kv.gpu.needles.find((n) => n.model === "Llama 3.2 1B" && n.window === "32k")!;
export const breakdown = { ...kv.breakdown, q: g32, needles: n32, tailA: kv.depth.gpuA["32500"].tail!, tailB: kv.depth.gpuB["32500"].tail! };

// The 32k pair, run twice: first fp32 then fp16, then the reverse with both started at 40 C or less.
// Prompt-reading speed over the whole book, tokens a second.
export const prefillRate = (r: { prefillS: number; prefillTokens: number }) => r.prefillTokens / r.prefillS;
export const repeatPairs = (["first", "repeat"] as const).map((run) => {
  const a = kv.repeat.find((r) => r.run === run && r.cache === "fp32")!;
  const b = kv.repeat.find((r) => r.run === run && r.cache === "fp16")!;
  return { run, a, b };
});
