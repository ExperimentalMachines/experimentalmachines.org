// Every research post, newest first, for /research and the homepage. Each cover shows the post's own
// finding over a small chart of its own numbers, because a passive reader decides from the picture and a
// title alone reads as plain text. The hooks and charts are computed from each study's data module, so a
// cover cannot drift from the page it opens.

import { ggufRecommended, ggufRows } from "@/lib/gguf";
import { copilotCells, gpuKv, laptopGemma, phoneMatmul, rtxCapacity } from "@/lib/hardware-studies";
import { serving } from "@/lib/neuron";
import { latencyModels } from "@/lib/openweights-latency";
import { rerunsCaps } from "@/lib/openweights-reruns";
import { windowCells } from "@/lib/openweights-window";
import { pdFix, pdModels, pdStall, ranked } from "@/lib/prefill-decode";

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

// Decode stall: the app's engine in a hard throttle, by decode threads, with the count that keeps running lit.
const appThreads = pdFix.byThreads.find((r) => r.threads === pdStall.app.normal)!;

// Latency: every model and chip pair, lit where ExecuTorch reached the first token sooner.
const firstToken = latencyModels.flatMap((m) => m.et.map((p, i) => p.ttft < m.llama[i].ttft));

// Reruns: each cell's IFEval grade at the old and the new reply cap, and the median gain between them.
const grade = (s: string) => parseInt(s, 10);
const ifevalShort = rerunsCaps.map((r) => grade(r.ifeval_640));
const ifevalLong = rerunsCaps.map((r) => grade(r.ifeval_2048));
const gains = rerunsCaps.map((r) => grade(r.ifeval_2048) / grade(r.ifeval_640)).sort((a, b) => a - b);
const ifevalGain = (gains[Math.floor((gains.length - 1) / 2)] + gains[Math.ceil((gains.length - 1) / 2)]) / 2;

// Window: resident memory after load on the Dimensity 9500s, the phone that ran both windows of both.
const resident = (model: string, window: string) => {
  const cell = windowCells.find((c) => c.model === model && c.window === window && c.phone.startsWith("D9500s") && c.rss_load !== "-")!;
  return parseInt(cell.rss_load, 10);
};
const gb = (mb: number) => `${(mb / 1000).toFixed(1)} GB`;
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

// One RTX 4090: the wait per turn as agents are added, with the load the study calls comfortable lit.
const agentsOk = rtxCapacity.find((r) => r.agents === 8)!;

export const studies: Study[] = [
  {
    href: "/research/decode-stall/",
    title: "Why CPU decode stalls when a phone throttles",
    date: "3 to 10 November 2026",
    project: "OpenWeights",
    line: "When a Snapdragon 8 Elite Gen 5 phone overheats, it parks six of its eight cores, and llama.cpp, the engine that runs the model, nearly stops writing the reply if it uses more than two threads. Why, the fix OpenWeights now carries, and whether ordinary chat gets that hot.",
    hook: `${Math.round((100 * appThreads.paused) / appThreads.normal)}%`,
    hookLabel: `of its writing speed left: the app's engine at ${appThreads.threads} threads, with six cores parked by hand`,
    viz: {
      kind: "bars",
      rows: pdFix.byThreads.map((r) => ({ label: `${r.threads} threads`, value: r.paused, shown: `${r.paused} tok/s`, on: r.threads === 2 })),
    },
  },
  {
    href: "/research/prefill-decode/",
    title: "Prefill and decode on CPU, GPU and NPU",
    date: "2 to 10 November 2026",
    project: "OpenWeights",
    line: "A model reads the prompt (prefill), then writes the reply a token at a time (decode). Nine models on a Snapdragon 8 Elite Gen 5, with each job on the CPU, the GPU or the NPU, the chip built for AI.",
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
    line: "The same Copilot CLI agent on the same real coding tasks: downloadable models running locally on an RTX 4090 and a MacBook Air M5, against hosted Copilot.",
    hook: `${finished("Qwen3.6 on the RTX 4090")}%`,
    hookLabel: `of 24 real tasks with Qwen3.6 on an RTX 4090, against ${finished("Copilot Pro+, Auto")}% on Copilot Pro+ Auto`,
    viz: {
      kind: "bars",
      rows: copilotBars.map((b) => ({ label: b.label, value: finished(b.name), shown: `${finished(b.name)}%`, on: b.on })),
    },
  },
  {
    href: "/research/one-rtx-4090/",
    title: "How many coding agents can one RTX 4090 serve?",
    date: "23 and 24 September 2026",
    project: "Hardware",
    line: "Qwen3.8-27B on one rented RTX 4090, through five engine setups, rising load and real coding agents.",
    hook: `${agentsOk.agents} agents`,
    hookLabel: `in a simulated coding workload, at a ${agentsOk.p50} s wait per turn on vLLM with no errors. At 16, waits reach ${rtxCapacity.at(-1)!.p50} s`,
    viz: { kind: "columns", groups: rtxCapacity.map((r) => [{ value: r.p50, on: r === agentsOk }]) },
  },
  {
    href: "/research/a100-quantization/",
    title: "A 2B model in ten GGUF formats on one A100",
    date: "12 September 2026",
    project: "GGUF",
    line: "One 2B model saved in ten compressed formats: how big and fast each is, how many of the original's tool-use decisions it keeps, and the same model behind the vLLM server.",
    hook: ggufRecommended,
    hookLabel: "is the smallest of ten formats whose decisions stayed close enough to the original's to pass our test",
    viz: { kind: "columns", groups: bySize.map((r) => [{ value: r.gib, on: r.format === ggufRecommended }]) },
  },
  {
    href: "/research/window/",
    title: "Does the exported window matter?",
    date: "7 September 2026",
    project: "OpenWeights",
    line: "A compiled model fixes its context window, how much text it can hold at once, when it is exported. Does choosing 2k to 32k tokens change anything but memory?",
    hook: "Over 6 GB",
    hookLabel: "of memory for Qwen3 at a 32k window, before the first prompt",
    viz: { kind: "bars", rows: memory.map((m) => ({ ...m, shown: gb(m.value) })) },
  },
  {
    href: "/research/reruns/",
    title: "A 640-token reply cap was cutting off the LFM2.5 2.6B",
    date: "7 September 2026",
    project: "OpenWeights",
    line: "The model reasons before it answers, so a 640-token cap cut it off. Raising only the cap lifted its scores on every phone. The same day's reruns also tested repeats of one file and a run that had died.",
    hook: `About ${Math.round(ifevalGain)}×`,
    hookLabel: `the median score on IFEval, an instruction-following test, once the reply cap rose to 2048 tokens: ${Math.min(...ifevalLong)} to ${Math.max(...ifevalLong)} of 30, up from ${Math.min(...ifevalShort)} to ${Math.max(...ifevalShort)}`,
    viz: { kind: "columns", groups: rerunsCaps.map((r) => [{ value: grade(r.ifeval_640) }, { value: grade(r.ifeval_2048), on: true }]) },
  },
  {
    href: "/research/latency/",
    title: "Five chips, two runtimes",
    date: "3 and 4 September 2026",
    project: "OpenWeights",
    line: "How fast five small models answer on five phone chips, in llama.cpp and in ExecuTorch.",
    hook: `${firstToken.filter(Boolean).length} of ${firstToken.length}`,
    hookLabel: "model and chip pairs read the prompt sooner on ExecuTorch than on llama.cpp",
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
    hookLabel: `the H200's room for conversation memory (the KV cache) on an MI300X with 70 GB of weights loaded, from ${gpuKv.memory}× the memory`,
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
    line: "A MacBook Air against a Qualcomm reference board on AI work: CPU, GPU and NPU, inference and training, with the same llama.cpp release and byte-identical weights.",
    hook: `${(laptopGemma.m5Gpu / laptopGemma.x2Gpu).toFixed(1)}×`,
    hookLabel: `the X2 Elite's GPU speed at reading the prompt, on the M5 with Gemma 3 1B. On the CPU, the X2 Elite leads by ${(laptopGemma.x2Cpu / laptopGemma.m5Cpu).toFixed(1)}×`,
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
    line: "What an app without special permissions can do for AI on two flagship phone chips: the CPU, the GPU, the NPU (the chip built for AI) and training on the phone.",
    hook: `About ${Math.round(phoneMatmul.elite / phoneMatmul.dimensity)}×`,
    hookLabel: "the GPU's matrix-multiplication speed of a Dimensity 9500s, on a Snapdragon 8 Elite",
    viz: {
      kind: "bars",
      rows: [
        { label: "8 Elite", value: phoneMatmul.elite, shown: `${phoneMatmul.elite} GFLOP/s`, on: true },
        { label: "Dimensity 9500s", value: phoneMatmul.dimensity, shown: `${phoneMatmul.dimensity} GFLOP/s` },
      ],
    },
  },
];
