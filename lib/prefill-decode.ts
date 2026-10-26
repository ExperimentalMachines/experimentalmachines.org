// The prefill/decode matrix on a Snapdragon 8 Elite Gen 5, for /openweights/prefill-decode.
// Figures are copied from OpenWeights' report (docs/research/snapdragon-pd-matrix.md and
// tools/snapdragon/results/2026-10-24-sm8850/ in its repository); change them there first.
// The cells keep the decimals the raw rows give, so the ratios the page derives from them match
// the report's, which rounds once; the page rounds them for display. The findings table is not
// stored: the page derives it from the cells.

const repo = "https://github.com/ExperimentalMachines/openweights";

export const pdLinks = {
  report: `${repo}/blob/main/docs/research/snapdragon-pd-matrix.md`,
  results: `${repo}/tree/main/tools/snapdragon/results/2026-10-24-sm8850`,
};

export const processors = ["CPU", "GPU", "NPU"] as const;
export type Processor = (typeof processors)[number];

// Tokens per second for the prompt (prefill) and the reply (decode), and the summed time of
// every turn in the cell: prefill, first token, handoff and decode.
export type PdCell = { prefill: number; decode: number; seconds: number };

// One pairing in one reply-length run: the turns it completed, its summed time over them, the
// same time with the CPU's stalled decode steps (over 500 ms) taken out where it had any, and
// whether the cooling gate before it passed or timed out.
export type PdReplyCell = { turns: number; seconds: number; withoutStalls?: number; gate: "passed" | "timed out" };

// One run of `pd_bench --gen-ref` (analysis-r8.md to analysis-r11.md), where every turn decodes
// the dataset reply's own length, on one unit of the phone. `pair` is NPU + CPU against NPU only
// on the turns both completed, in percent of NPU only's time: positive when NPU + CPU took longer.
export type PdReplyRun = {
  run: string;
  unit: string;
  npuOnly?: PdReplyCell;
  npuCpu?: PdReplyCell;
  gpuCpu?: PdReplyCell;
  cpuOnly?: PdReplyCell;
  pair?: { turns: number; against: number; withoutStalls?: number };
};

export type PdModel = {
  name: string;
  quant: string;
  session: "first" | "second";
  run: string;
  hexagonSessions: number;
  // Rows are the prefill processor and columns the decode processor, both in `processors` order.
  cells: [PdCell, PdCell, PdCell][];
  // The 64-token matrix again in another cell order (r5, analysis-r5-vs-first.md): the median and
  // the largest change in a cell's time, in percent, and the fastest pairing that time.
  secondPass?: { median: number; largest: number; fastest: [Processor, Processor] };
  reply: PdReplyRun[];
};

export const pdModels: PdModel[] = [
  {
    name: "Qwen3 0.6B",
    quant: "Q4_0",
    session: "first",
    run: "r4",
    hexagonSessions: 1,
    cells: [
      [{ prefill: 236.59, decode: 59.637, seconds: 84.278 }, { prefill: 234.32, decode: 28.991, seconds: 122.702 }, { prefill: 247.27, decode: 48.2, seconds: 91.122 }],
      [{ prefill: 568.07, decode: 62.099, seconds: 54.959 }, { prefill: 532.46, decode: 30.337, seconds: 90.545 }, { prefill: 672.05, decode: 47.414, seconds: 62.404 }],
      [{ prefill: 3078.9, decode: 69.31, seconds: 34.551 }, { prefill: 2964.55, decode: 32.082, seconds: 69.915 }, { prefill: 2998.6, decode: 47.642, seconds: 47.574 }],
    ],
    secondPass: { median: 1.4, largest: 5.5, fastest: ["NPU", "CPU"] },
    reply: [
      { run: "r8", unit: "727ba80", npuOnly: { turns: 33, seconds: 292.737, gate: "timed out" }, npuCpu: { turns: 33, seconds: 257.84, gate: "passed" }, gpuCpu: { turns: 33, seconds: 327.629, gate: "timed out" }, cpuOnly: { turns: 33, seconds: 344.355, gate: "passed" }, pair: { turns: 33, against: -11.9 } },
      { run: "r9", unit: "a1716cc4", npuOnly: { turns: 33, seconds: 292.754, gate: "timed out" }, npuCpu: { turns: 33, seconds: 305.096, gate: "timed out" }, gpuCpu: { turns: 33, seconds: 328.807, gate: "timed out" }, cpuOnly: { turns: 33, seconds: 348.766, gate: "timed out" }, pair: { turns: 33, against: 4.2 } },
    ],
  },
  {
    name: "Gemma 3 1B",
    quant: "Q4_0",
    session: "first",
    run: "r4",
    hexagonSessions: 1,
    cells: [
      [{ prefill: 332.36, decode: 62.884, seconds: 70.191 }, { prefill: 335.56, decode: 29.826, seconds: 106.83 }, { prefill: 349.59, decode: 48.3, seconds: 78.494 }],
      [{ prefill: 561.07, decode: 64.765, seconds: 54.448 }, { prefill: 551.61, decode: 30.129, seconds: 91.474 }, { prefill: 657.95, decode: 47.905, seconds: 62.615 }],
      [{ prefill: 3663.61, decode: 69.299, seconds: 33.586 }, { prefill: 3434.33, decode: 33.42, seconds: 66.18 }, { prefill: 3541.91, decode: 47.256, seconds: 47.536 }],
    ],
    reply: [
      { run: "r11", unit: "c581fd31", npuOnly: { turns: 33, seconds: 288.316, gate: "timed out" }, npuCpu: { turns: 33, seconds: 221.631, gate: "passed" }, cpuOnly: { turns: 33, seconds: 289.991, gate: "passed" }, pair: { turns: 33, against: -23.1 } },
    ],
  },
  {
    name: "Llama 3.2 1B",
    quant: "Q4_0",
    session: "first",
    run: "r4",
    hexagonSessions: 1,
    cells: [
      [{ prefill: 234.34, decode: 46.398, seconds: 93.866 }, { prefill: 241.31, decode: 32.747, seconds: 111.53 }, { prefill: 251.29, decode: 39.044, seconds: 99.211 }],
      [{ prefill: 525.24, decode: 48.8, seconds: 64.89 }, { prefill: 532.71, decode: 33.575, seconds: 83.548 }, { prefill: 537.49, decode: 38.551, seconds: 75.793 }],
      [{ prefill: 3017.08, decode: 52.471, seconds: 43.682 }, { prefill: 3046.63, decode: 36.533, seconds: 61.135 }, { prefill: 3058.2, decode: 38.756, seconds: 57.428 }],
    ],
    secondPass: { median: 1.2, largest: 5.9, fastest: ["NPU", "CPU"] },
    reply: [
      { run: "r9", unit: "a1716cc4", npuOnly: { turns: 33, seconds: 330.663, gate: "timed out" }, npuCpu: { turns: 33, seconds: 342.0497, gate: "timed out" }, cpuOnly: { turns: 33, seconds: 390.767, gate: "timed out" }, pair: { turns: 33, against: 3.4 } },
    ],
  },
  {
    name: "LFM2.5 1.2B",
    quant: "QAD Q4_0, hybrid",
    session: "first",
    run: "r4",
    hexagonSessions: 1,
    cells: [
      [{ prefill: 303.86, decode: 59.386, seconds: 75.092 }, { prefill: 327.08, decode: 44.827, seconds: 83.87 }, { prefill: 334.61, decode: 42.883, seconds: 84.974 }],
      [{ prefill: 626.09, decode: 63.206, seconds: 52.578 }, { prefill: 585.09, decode: 44.429, seconds: 67.638 }, { prefill: 660.05, decode: 42.474, seconds: 67.659 }],
      [{ prefill: 3227.31, decode: 67.11, seconds: 34.877 }, { prefill: 3400.96, decode: 50.964, seconds: 44.681 }, { prefill: 3477.12, decode: 42.765, seconds: 52.135 }],
    ],
    secondPass: { median: 1.4, largest: 6.4, fastest: ["NPU", "CPU"] },
    reply: [
      { run: "r9", unit: "a1716cc4", npuOnly: { turns: 33, seconds: 321.418, gate: "timed out" }, npuCpu: { turns: 33, seconds: 271.074, gate: "timed out" }, cpuOnly: { turns: 33, seconds: 315.328, gate: "timed out" }, pair: { turns: 33, against: -15.7 } },
    ],
  },
  {
    name: "Qwen3 1.7B",
    quant: "Q4_0",
    session: "first",
    run: "r4",
    hexagonSessions: 1,
    cells: [
      [{ prefill: 138.79, decode: 32.355, seconds: 148.484 }, { prefill: 137.79, decode: 18.312, seconds: 199.546 }, { prefill: 141.4, decode: 29.559, seconds: 153.776 }],
      [{ prefill: 280.92, decode: 32.842, seconds: 105.902 }, { prefill: 274.4, decode: 18.636, seconds: 154.219 }, { prefill: 295.4, decode: 30.015, seconds: 110.064 }],
      [{ prefill: 2090.88, decode: 34.109, seconds: 67.328 }, { prefill: 2114.54, decode: 19.274, seconds: 114.729 }, { prefill: 2086.39, decode: 29.995, seconds: 74.941 }],
    ],
    secondPass: { median: 1.8, largest: 3.7, fastest: ["NPU", "CPU"] },
    reply: [
      { run: "r9", unit: "a1716cc4", npuOnly: { turns: 33, seconds: 452.938, gate: "timed out" }, npuCpu: { turns: 33, seconds: 510.985, gate: "timed out" }, gpuCpu: { turns: 33, seconds: 519.311, gate: "timed out" }, cpuOnly: { turns: 33, seconds: 518.537, gate: "passed" }, pair: { turns: 33, against: 12.8 } },
      { run: "r9r", unit: "a1716cc4", npuOnly: { turns: 33, seconds: 441.093, gate: "timed out" }, npuCpu: { turns: 33, seconds: 518.082, gate: "timed out" }, cpuOnly: { turns: 33, seconds: 648.947, gate: "timed out" }, pair: { turns: 33, against: 17.5 } },
    ],
  },
  {
    name: "Qwen3 1.7B",
    quant: "Q8_0",
    session: "second",
    run: "r6",
    hexagonSessions: 1,
    cells: [
      [{ prefill: 143.13, decode: 26.443, seconds: 160.293 }, { prefill: 143.44, decode: 16.079, seconds: 212.073 }, { prefill: 146.78, decode: 24.959, seconds: 163.768 }],
      [{ prefill: 248.23, decode: 26.323, seconds: 127.109 }, { prefill: 239.84, decode: 16.5, seconds: 174.795 }, { prefill: 274.17, decode: 24.77, seconds: 127.845 }],
      [{ prefill: 1936.58, decode: 27.037, seconds: 83.779 }, { prefill: 2009.92, decode: 17.114, seconds: 128.666 }, { prefill: 1869.95, decode: 21.117, seconds: 104.73 }],
    ],
    reply: [
      { run: "r11", unit: "c581fd31", npuOnly: { turns: 33, seconds: 528.123, gate: "timed out" }, npuCpu: { turns: 33, seconds: 634.417, withoutStalls: 580.699, gate: "timed out" }, cpuOnly: { turns: 33, seconds: 851.758, withoutStalls: 679.796, gate: "timed out" }, pair: { turns: 33, against: 20.1, withoutStalls: 10.0 } },
    ],
  },
  {
    name: "LFM2.5 2.6B",
    quant: "QAD Q4_0, hybrid",
    session: "second",
    run: "r7",
    hexagonSessions: 1,
    cells: [
      [{ prefill: 135.08, decode: 27.174, seconds: 163.053 }, { prefill: 138.45, decode: 21.42, seconds: 181.804 }, { prefill: 137.17, decode: 20.212, seconds: 188.216 }],
      [{ prefill: 238.32, decode: 27.749, seconds: 124.312 }, { prefill: 238.9, decode: 21.133, seconds: 147.362 }, { prefill: 252.73, decode: 20.983, seconds: 145.669 }],
      [{ prefill: 1453.89, decode: 28.438, seconds: 81.308 }, { prefill: 1574.17, decode: 22.155, seconds: 101.652 }, { prefill: 1492.7, decode: 21.02, seconds: 106.763 }],
    ],
    reply: [
      // The reservation ended 29 turns into NPU only, before CPU only.
      { run: "r9", unit: "a1716cc4", npuOnly: { turns: 29, seconds: 537.785, gate: "timed out" }, npuCpu: { turns: 33, seconds: 599.151, gate: "timed out" }, pair: { turns: 29, against: -2.1 } },
      // The phone stopped answering before NPU + CPU finished.
      { run: "r10", unit: "c581fd31", npuOnly: { turns: 33, seconds: 599.759, gate: "passed" }, cpuOnly: { turns: 33, seconds: 569.426, gate: "passed" } },
      { run: "r11", unit: "c581fd31", npuOnly: { turns: 33, seconds: 601.764, gate: "timed out" }, npuCpu: { turns: 33, seconds: 678.433, withoutStalls: 560.177, gate: "timed out" }, cpuOnly: { turns: 33, seconds: 704.525, withoutStalls: 642.991, gate: "timed out" }, pair: { turns: 33, against: 12.7, withoutStalls: -6.9 } },
    ],
  },
  {
    name: "Llama 3.2 3B",
    quant: "Q4_0",
    session: "second",
    run: "r6",
    hexagonSessions: 2,
    cells: [
      [{ prefill: 84.83, decode: 20.332, seconds: 237.741 }, { prefill: 105.85, decode: 16.91, seconds: 232.626 }, { prefill: 85.93, decode: 19.045, seconds: 243.765 }],
      [{ prefill: 167.49, decode: 20.522, seconds: 171.02 }, { prefill: 162.9, decode: 12.82, seconds: 232.766 }, { prefill: 165.33, decode: 19.001, seconds: 180.199 }],
      [{ prefill: 1151.85, decode: 20.756, seconds: 110.982 }, { prefill: 1306.63, decode: 12.757, seconds: 173.2 }, { prefill: 1202.26, decode: 18.969, seconds: 119.18 }],
    ],
    reply: [
      { run: "r9", unit: "a1716cc4", npuOnly: { turns: 33, seconds: 733.537, gate: "timed out" }, npuCpu: { turns: 33, seconds: 1014.092, withoutStalls: 878.647, gate: "timed out" }, cpuOnly: { turns: 33, seconds: 1150.895, withoutStalls: 1016.954, gate: "timed out" }, pair: { turns: 33, against: 38.2, withoutStalls: 19.8 } },
    ],
  },
  {
    name: "Qwen3 4B",
    quant: "Q4_0",
    session: "second",
    run: "r6",
    hexagonSessions: 2,
    cells: [
      [{ prefill: 53.81, decode: 15.256, seconds: 353.474 }, { prefill: 53.18, decode: 6.177, seconds: 557.901 }, { prefill: 54.72, decode: 15.388, seconds: 349.751 }],
      [{ prefill: 102.4, decode: 15.042, seconds: 253.681 }, { prefill: 105.78, decode: 6.253, seconds: 443.021 }, { prefill: 104.66, decode: 15.287, seconds: 249.034 }],
      [{ prefill: 813.18, decode: 15.512, seconds: 149.539 }, { prefill: 951.41, decode: 6.402, seconds: 338.942 }, { prefill: 800.95, decode: 15.371, seconds: 149.869 }],
    ],
    // Against r6, where all nine of its cells ran.
    secondPass: { median: 2.9, largest: 5.1, fastest: ["NPU", "NPU"] },
    reply: [
      // The reservation ended 20 turns into CPU only.
      { run: "r8", unit: "727ba80", npuOnly: { turns: 33, seconds: 1064.709, gate: "timed out" }, npuCpu: { turns: 33, seconds: 1339.856, withoutStalls: 1049.272, gate: "timed out" }, cpuOnly: { turns: 20, seconds: 911.938, withoutStalls: 717.368, gate: "timed out" }, pair: { turns: 33, against: 25.8, withoutStalls: -1.4 } },
    ],
  },
];

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Each processor's prefill and decode rate is the mean of the three cells that use it for that
// phase; the fastest and slowest pairings are by total time.
export function pdSummary(m: PdModel) {
  const all = m.cells.flatMap((row, i) => row.map((c, j) => ({ ...c, prefillOn: processors[i], decodeOn: processors[j] })));
  return {
    prefill: m.cells.map((row) => mean(row.map((c) => c.prefill))),
    decode: processors.map((_, j) => mean(m.cells.map((row) => row[j].decode))),
    fastest: all.reduce((a, b) => (b.seconds < a.seconds ? b : a)),
    slowest: all.reduce((a, b) => (b.seconds > a.seconds ? b : a)),
    cpuOnly: m.cells[0][0],
  };
}

// One pairing across a model's reply-length runs: the mean of the runs that completed all 33
// turns, how far apart those were (the longest over the shortest, less one), and which they were.
export function pdReplyMean(m: PdModel, key: "npuOnly" | "npuCpu" | "cpuOnly") {
  const done = m.reply.filter((r) => r[key]?.turns === pdTurns);
  const xs = done.map((r) => r[key]!.seconds);
  return xs.length ? { seconds: mean(xs), apart: Math.max(...xs) / Math.min(...xs) - 1, runs: done.map((r) => r.run) } : undefined;
}

// The first conversation in each length bucket (by characters) with at least two user turns.
// Token counts are from Qwen3's tokenizer.
export const pdConversations = [
  { set: "WildChat-1M", index: 23, length: "short", characters: 1378, turns: 3, newTokens: [18, 197], context: 303 },
  { set: "WildChat-1M", index: 18, length: "medium", characters: 9368, turns: 6, newTokens: [63, 823], context: 2110 },
  { set: "WildChat-1M", index: 40, length: "long", characters: 14528, turns: 6, newTokens: [263, 625], context: 3191 },
  { set: "UltraChat 200k", index: 3, length: "short", characters: 2085, turns: 2, newTokens: [59, 162], context: 221 },
  { set: "UltraChat 200k", index: 0, length: "medium", characters: 3087, turns: 4, newTokens: [55, 209], context: 501 },
  { set: "UltraChat 200k", index: 2, length: "long", characters: 16333, turns: 4, newTokens: [139, 1104], context: 2417 },
  { set: "Daring-Anteater", index: 8, length: "short", characters: 1703, turns: 2, newTokens: [59, 167], context: 226 },
  { set: "Daring-Anteater", index: 6, length: "medium", characters: 8847, turns: 3, newTokens: [253, 665], context: 1186 },
  { set: "Daring-Anteater", index: 0, length: "long", characters: 11525, turns: 3, newTokens: [30, 985], context: 1532 },
];

export const pdTurns = pdConversations.reduce((n, c) => n + c.turns, 0);

export const pdPhone = {
  cores: [
    { cores: "cpu6, cpu7", type: "Prime", max: "4.608 GHz", min: "768 MHz" },
    { cores: "cpu0 to cpu5", type: "Performance", max: "3.629 GHz", min: "384 MHz" },
  ],
  gpu: "Adreno 840, OpenCL 3.0 with FP16, 160 MHz to 1.2 GHz in 18 steps. Thermally capped on most turns, as far down as 578 MHz.",
  npu: "Hexagon v81 (HTP). Each session: 8 hardware threads, 8 HVX vector units, 1 HMX matrix unit, 8 MB VTCM.",
  llamacpp: "b2e5e9b",
};

// Qwen3 0.6B on the NPU alone, through ExecuTorch 1.5.1's QNN runner and through llama.cpp.
export const pdExecutorch = [
  { measure: "Decode", executorch: "30.3 / 30.4 tok/s", llamacpp: "50.7 tok/s" },
  { measure: "Prefill, first turns (same tokens)", executorch: "644 / 656 tok/s", llamacpp: "2,400 tok/s" },
  { measure: "Median time to first token", executorch: "333 / 330 ms (re-reads the whole history)", llamacpp: "70 ms (reads new tokens only)" },
];
