// Every research post, newest first, for /research and the homepage. Each cover shows the post's own
// finding over a small chart of its own numbers, because a passive reader decides from the picture and a
// title alone reads as plain text. The hooks and charts are computed from each study's data module, so a
// cover cannot drift from the page it opens.

import { ggufRecommended, ggufRows } from "@/lib/gguf";
import { copilotCells, gpuKv, laptopGemma, phoneMatmul } from "@/lib/hardware-studies";
import { serving } from "@/lib/neuron";
import { latencyModels } from "@/lib/openweights-latency";
import { rerunsCaps } from "@/lib/openweights-reruns";
import { windowCells } from "@/lib/openweights-window";
import { pdModels, ranked } from "@/lib/prefill-decode";

export type Viz =
  | { kind: "grid"; cols: number; cells: { level: number; on?: boolean }[] }
  | { kind: "bars"; rows: { label: string; value: number; shown: string; on?: boolean }[] }
  | { kind: "columns"; groups: { value: number; on?: boolean }[][] }
  // What a talk covers, for one whose abstract names its workloads and publishes no number.
  | { kind: "chips"; items: string[] };

export type Study = {
  href: string;
  title: string;
  date: string;
  project: "OpenWeights" | "ASICs" | "GGUF" | "Hardware";
  line: string;
  hook: string;
  hookLabel: string;
  viz: Viz;
  // The rest are for a conference talk: the conference, the line a card shows in place of project and
  // date, who gives it, and the title as the conference lists it when that is too long for a card.
  eyebrow?: string;
  meta?: string;
  speakers?: string[];
  fullTitle?: string;
};

// Prefill and decode: which pairing won, one model's nine cells drawn as its matrix.
const qwen = pdModels.find((m) => m.name === "Qwen3 1.7B" && m.quant === "Q8_0")!;
const qwenRank = ranked(qwen);
const [fastest, slowest] = [qwenRank[0].cell.seconds, qwenRank.at(-1)!.cell.seconds];
const npuWins = pdModels.filter((m) => ranked(m)[0].prefill === "NPU").length;

// Latency: every model and chip pair, lit where ExecuTorch reached the first token sooner.
const firstToken = latencyModels.flatMap((m) => m.et.map((p, i) => p.ttft < m.llama[i].ttft));

// Reruns: each cell's GSM8K grade at the old and the new reply cap.
const grade = (s: string) => parseInt(s, 10);
const shortCap = rerunsCaps.map((r) => grade(r.gsm8k_640));
const longCap = rerunsCaps.map((r) => grade(r.gsm8k_2048));

// Window: resident memory after load on the Dimensitys, the phone that ran both windows of both.
const resident = (model: string, window: string) => {
  const cell = windowCells.find((c) => c.model === model && c.window === window && c.phone.startsWith("D9500s") && c.rss_load !== "-")!;
  return parseInt(cell.rss_load, 10);
};
const gb = (mb: number) => `${(mb / 1024).toFixed(1)} GB`;
const memory = [
  { label: "LFM2.5 1.2B, 32k", value: resident("LFM2.5-1.2B-Instruct-8da4w", "32k") },
  { label: "Qwen3 1.7B, 2k", value: resident("Qwen3-1.7B-8da4w", "2k") },
  { label: "Qwen3 1.7B, 32k", value: resident("Qwen3-1.7B-8da4w", "32k"), on: true },
];

// A100: every format's file size, smallest first, with the one that passes the quality gate lit.
const bySize = [...ggufRows].sort((a, b) => a.bytes - b.bytes);

// Trainium and Inferentia: Inferentia2's time per token as the streams rise, against its throughput growing.
const flat = serving.inf2Tpot;
const streams = (i: number) => `${serving.concurrency[i]} stream${i ? "s" : ""}`;
const growth = serving.inf2[flat.length - 1]! / serving.inf2[0]!;

// Local Copilot: tasks finished, out of the same 24, for the configurations the study compares first.
const copilotCell = (name: string) => copilotCells.find((c) => c.name === name)!;
const finished = (name: string) => Math.round((copilotCell(name).passed / 24) * 100);
const copilotBars = [
  { label: "Pro+, Auto", name: "Copilot Pro+, Auto" },
  { label: "Gemma 4, 4090", name: "Gemma 4 on the RTX 4090" },
  { label: "Qwen3.6, 4090", name: "Qwen3.6 on the RTX 4090", on: true },
];

const thousands = (x: number) => Math.round(x).toLocaleString("en-US");

export const studies: Study[] = [
  {
    href: "/research/prefill-decode/",
    title: "Prefill and decode on CPU, GPU and NPU",
    date: "2 to 4 November 2026",
    project: "OpenWeights",
    line: "Which processor should prefill and which should decode: nine models, every pairing, on a Snapdragon 8 Elite Gen 5.",
    hook: `${npuWins} of ${pdModels.length}`,
    hookLabel: "models were fastest with NPU prefill",
    viz: {
      kind: "grid",
      cols: 3,
      cells: qwen.cells.flat().map((c) => ({ level: (slowest - c.seconds) / (slowest - fastest), on: c.seconds === fastest })),
    },
  },
  {
    href: "/research/local-copilot/",
    title: "When is local Copilot worth it?",
    date: "October 2026",
    project: "GGUF",
    line: "The same Copilot CLI agent on the same real tasks: open-weight GGUF models on an RTX 4090 and a MacBook Air M5, against hosted Copilot.",
    hook: `${finished("Qwen3.6 on the RTX 4090")}%`,
    hookLabel: `of 24 real tasks with Qwen3.6 on an RTX 4090, against ${finished("Copilot Pro+, Auto")}% on Copilot Pro+ Auto`,
    viz: {
      kind: "bars",
      rows: copilotBars.map((b) => ({ label: b.label, value: finished(b.name), shown: `${finished(b.name)}%`, on: b.on })),
    },
  },
  {
    href: "/research/a100-quantization/",
    title: "A 2B model in ten GGUF formats on one A100",
    date: "12 September 2026",
    project: "GGUF",
    line: "Size, speed and how many of its decisions each format keeps, and the same weights behind vLLM.",
    hook: ggufRecommended,
    hookLabel: "is the smallest of ten formats to pass the quality gate",
    viz: { kind: "columns", groups: bySize.map((r) => [{ value: r.gib, on: r.format === ggufRecommended }]) },
  },
  {
    href: "/research/window/",
    title: "Does the exported window matter?",
    date: "7 September 2026",
    project: "OpenWeights",
    line: "Whether the context window fixed at export, from 2k to 32k, changes anything but memory.",
    hook: "Over 6 GB",
    hookLabel: "for Qwen3 at 32k, before the first prompt",
    viz: { kind: "bars", rows: memory.map((m) => ({ ...m, shown: gb(m.value) })) },
  },
  {
    href: "/research/reruns/",
    title: "What the reruns changed",
    date: "7 September 2026",
    project: "OpenWeights",
    line: "Every cell of the window matrix checked, and three things rerun the same day.",
    hook: `${Math.min(...longCap)} to ${Math.max(...longCap)}`,
    hookLabel: `of 30 on GSM8K with a longer reply cap, up from ${Math.min(...shortCap)} to ${Math.max(...shortCap)}`,
    viz: { kind: "columns", groups: rerunsCaps.map((r) => [{ value: grade(r.gsm8k_640) }, { value: grade(r.gsm8k_2048), on: true }]) },
  },
  {
    href: "/research/latency/",
    title: "Five chips, two runtimes",
    date: "3 and 4 September 2026",
    project: "OpenWeights",
    line: "How fast five small models answer on five phone chips, in llama.cpp and in ExecuTorch.",
    hook: `${firstToken.filter(Boolean).length} of ${firstToken.length}`,
    hookLabel: "model and chip pairs reached the first token sooner on ExecuTorch",
    viz: { kind: "grid", cols: latencyModels[0].et.length, cells: firstToken.map((on) => ({ level: on ? 1 : 0, on })) },
  },
  {
    href: "/research/trainium-inferentia/",
    title: "Llama 3.1 8B on AWS Trainium and Inferentia",
    date: "July and August 2026",
    project: "ASICs",
    line: "A fine-tune on Trainium, served on Inferentia2, measured beside an MI300X and an H200.",
    hook: `${Math.round(Math.min(...flat))} to ${Math.round(Math.max(...flat))} ms`,
    hookLabel: `per token on Inferentia2 from ${serving.concurrency[0]} to ${serving.concurrency[flat.length - 1]} streams, while throughput grows ${Math.round(growth)}×`,
    viz: {
      kind: "bars",
      rows: [0, 2, 4].map((i) => ({ label: streams(i), value: flat[i], shown: `${Math.round(flat[i])} ms`, on: i === 4 })),
    },
  },
  {
    href: "/research/mi300x-h200/",
    title: "MI300X against H200",
    date: "July 2026",
    project: "Hardware",
    line: "One AMD Instinct MI300X against one NVIDIA H200, inference and training, on the same vLLM and PyTorch versions.",
    hook: `${gpuKv.advantage}×`,
    hookLabel: `the H200's KV cache on an MI300X with 70 GB of weights loaded, from ${gpuKv.memory}× the memory`,
    viz: {
      kind: "bars",
      rows: [
        { label: "MI300X", value: gpuKv.mi300x.gib, shown: `${gpuKv.mi300x.gib} GiB`, on: true },
        { label: "H200", value: gpuKv.h200.gib, shown: `${gpuKv.h200.gib.toFixed(2)} GiB` },
      ],
    },
  },
  {
    href: "/research/m5-x2-elite/",
    title: "Apple M5 against Snapdragon X2 Elite",
    date: "27 July 2026",
    project: "Hardware",
    line: "Two Arm laptops on AI work: CPU, GPU and NPU, inference and training, with the same llama.cpp release and byte-identical weights.",
    hook: `${(laptopGemma.m5Gpu / laptopGemma.x2Gpu).toFixed(1)}×`,
    hookLabel: `the X2 Elite's GPU prefill on the M5, Gemma 3 1B Q4_0. On the CPU, the X2 Elite leads by ${(laptopGemma.x2Cpu / laptopGemma.m5Cpu).toFixed(1)}×`,
    viz: {
      kind: "bars",
      rows: [
        { label: "M5 GPU", value: laptopGemma.m5Gpu, shown: `${thousands(laptopGemma.m5Gpu)} tok/s`, on: true },
        { label: "X2 Elite GPU", value: laptopGemma.x2Gpu, shown: `${thousands(laptopGemma.x2Gpu)} tok/s` },
      ],
    },
  },
  {
    href: "/research/8-elite-dimensity/",
    title: "Snapdragon 8 Elite against Dimensity 9500s",
    date: "13 and 27 July 2026",
    project: "Hardware",
    line: "What unprivileged code can do for AI on two flagship phone chips: NPU, CPU, GPU and on-device training.",
    hook: `About ${Math.round(phoneMatmul.elite / phoneMatmul.dimensity)}×`,
    hookLabel: "the GPU matmul of a Dimensity 9500s on a Snapdragon 8 Elite",
    viz: {
      kind: "bars",
      rows: [
        { label: "8 Elite", value: phoneMatmul.elite, shown: `${phoneMatmul.elite} GFLOP/s`, on: true },
        { label: "Dimensity 9500s", value: phoneMatmul.dimensity, shown: `${phoneMatmul.dimensity} GFLOP/s` },
      ],
    },
  },
];
