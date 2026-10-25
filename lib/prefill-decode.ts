// The prefill/decode matrix on a Snapdragon 8 Elite Gen 5, for /openweights/prefill-decode.
// Figures are copied from OpenWeights' report (docs/research/snapdragon-pd-matrix.md and
// tools/snapdragon/results/2026-10-24-sm8850/ in its repository); change them there first.
// The findings table is not stored: the page derives it from the cells.

const repo = "https://github.com/ExperimentalMachines/openweights";

export const pdLinks = {
  report: `${repo}/blob/main/docs/research/snapdragon-pd-matrix.md`,
  results: `${repo}/tree/main/tools/snapdragon/results/2026-10-24-sm8850`,
};

export const processors = ["CPU", "GPU", "NPU"] as const;

// Tokens per second for the prompt (prefill) and the reply (decode), and the summed time of
// every turn in the cell: prefill, first token, handoff and decode.
export type PdCell = { prefill: number; decode: number; seconds: number };

export type PdModel = {
  name: string;
  quant: string;
  session: "first" | "second";
  run: string;
  hexagonSessions: number;
  // Rows are the prefill processor and columns the decode processor, both in `processors` order.
  cells: [PdCell, PdCell, PdCell][];
};

export const pdModels: PdModel[] = [
  {
    name: "Qwen3 0.6B",
    quant: "Q4_0",
    session: "first",
    run: "r4",
    hexagonSessions: 1,
    cells: [
      [{ prefill: 237, decode: 59.6, seconds: 84.3 }, { prefill: 234, decode: 29.0, seconds: 122.7 }, { prefill: 247, decode: 48.2, seconds: 91.1 }],
      [{ prefill: 568, decode: 62.1, seconds: 55.0 }, { prefill: 532, decode: 30.3, seconds: 90.5 }, { prefill: 672, decode: 47.4, seconds: 62.4 }],
      [{ prefill: 3079, decode: 69.3, seconds: 34.6 }, { prefill: 2965, decode: 32.1, seconds: 69.9 }, { prefill: 2999, decode: 47.6, seconds: 47.6 }],
    ],
  },
  {
    name: "Gemma 3 1B",
    quant: "Q4_0",
    session: "first",
    run: "r4",
    hexagonSessions: 1,
    cells: [
      [{ prefill: 332, decode: 62.9, seconds: 70.2 }, { prefill: 336, decode: 29.8, seconds: 106.8 }, { prefill: 350, decode: 48.3, seconds: 78.5 }],
      [{ prefill: 561, decode: 64.8, seconds: 54.4 }, { prefill: 552, decode: 30.1, seconds: 91.5 }, { prefill: 658, decode: 47.9, seconds: 62.6 }],
      [{ prefill: 3664, decode: 69.3, seconds: 33.6 }, { prefill: 3434, decode: 33.4, seconds: 66.2 }, { prefill: 3542, decode: 47.3, seconds: 47.5 }],
    ],
  },
  {
    name: "Llama 3.2 1B",
    quant: "Q4_0",
    session: "first",
    run: "r4",
    hexagonSessions: 1,
    cells: [
      [{ prefill: 234, decode: 46.4, seconds: 93.9 }, { prefill: 241, decode: 32.7, seconds: 111.5 }, { prefill: 251, decode: 39.0, seconds: 99.2 }],
      [{ prefill: 525, decode: 48.8, seconds: 64.9 }, { prefill: 533, decode: 33.6, seconds: 83.5 }, { prefill: 537, decode: 38.6, seconds: 75.8 }],
      [{ prefill: 3017, decode: 52.5, seconds: 43.7 }, { prefill: 3047, decode: 36.5, seconds: 61.1 }, { prefill: 3058, decode: 38.8, seconds: 57.4 }],
    ],
  },
  {
    name: "LFM2.5 1.2B",
    quant: "QAD Q4_0, hybrid",
    session: "first",
    run: "r4",
    hexagonSessions: 1,
    cells: [
      [{ prefill: 304, decode: 59.4, seconds: 75.1 }, { prefill: 327, decode: 44.8, seconds: 83.9 }, { prefill: 335, decode: 42.9, seconds: 85.0 }],
      [{ prefill: 626, decode: 63.2, seconds: 52.6 }, { prefill: 585, decode: 44.4, seconds: 67.6 }, { prefill: 660, decode: 42.5, seconds: 67.7 }],
      [{ prefill: 3227, decode: 67.1, seconds: 34.9 }, { prefill: 3401, decode: 51.0, seconds: 44.7 }, { prefill: 3477, decode: 42.8, seconds: 52.1 }],
    ],
  },
  {
    name: "Qwen3 1.7B",
    quant: "Q4_0",
    session: "first",
    run: "r4",
    hexagonSessions: 1,
    cells: [
      [{ prefill: 139, decode: 32.4, seconds: 148.5 }, { prefill: 138, decode: 18.3, seconds: 199.5 }, { prefill: 141, decode: 29.6, seconds: 153.8 }],
      [{ prefill: 281, decode: 32.8, seconds: 105.9 }, { prefill: 274, decode: 18.6, seconds: 154.2 }, { prefill: 295, decode: 30.0, seconds: 110.1 }],
      [{ prefill: 2091, decode: 34.1, seconds: 67.3 }, { prefill: 2115, decode: 19.3, seconds: 114.7 }, { prefill: 2086, decode: 30.0, seconds: 74.9 }],
    ],
  },
  {
    name: "Qwen3 1.7B",
    quant: "Q8_0",
    session: "second",
    run: "r6",
    hexagonSessions: 1,
    cells: [
      [{ prefill: 143, decode: 26.4, seconds: 160.3 }, { prefill: 143, decode: 16.1, seconds: 212.1 }, { prefill: 147, decode: 25.0, seconds: 163.8 }],
      [{ prefill: 248, decode: 26.3, seconds: 127.1 }, { prefill: 240, decode: 16.5, seconds: 174.8 }, { prefill: 274, decode: 24.8, seconds: 127.8 }],
      [{ prefill: 1937, decode: 27.0, seconds: 83.8 }, { prefill: 2010, decode: 17.1, seconds: 128.7 }, { prefill: 1870, decode: 21.1, seconds: 104.7 }],
    ],
  },
  {
    name: "LFM2.5 2.6B",
    quant: "QAD Q4_0, hybrid",
    session: "second",
    run: "r7",
    hexagonSessions: 1,
    cells: [
      [{ prefill: 135, decode: 27.2, seconds: 163.1 }, { prefill: 138, decode: 21.4, seconds: 181.8 }, { prefill: 137, decode: 20.2, seconds: 188.2 }],
      [{ prefill: 238, decode: 27.7, seconds: 124.3 }, { prefill: 239, decode: 21.1, seconds: 147.4 }, { prefill: 253, decode: 21.0, seconds: 145.7 }],
      [{ prefill: 1454, decode: 28.4, seconds: 81.3 }, { prefill: 1574, decode: 22.2, seconds: 101.7 }, { prefill: 1493, decode: 21.0, seconds: 106.8 }],
    ],
  },
  {
    name: "Llama 3.2 3B",
    quant: "Q4_0",
    session: "second",
    run: "r6",
    hexagonSessions: 2,
    cells: [
      [{ prefill: 85, decode: 20.3, seconds: 237.7 }, { prefill: 106, decode: 16.9, seconds: 232.6 }, { prefill: 86, decode: 19.0, seconds: 243.8 }],
      [{ prefill: 167, decode: 20.5, seconds: 171.0 }, { prefill: 163, decode: 12.8, seconds: 232.8 }, { prefill: 165, decode: 19.0, seconds: 180.2 }],
      [{ prefill: 1152, decode: 20.8, seconds: 111.0 }, { prefill: 1307, decode: 12.8, seconds: 173.2 }, { prefill: 1202, decode: 19.0, seconds: 119.2 }],
    ],
  },
  {
    name: "Qwen3 4B",
    quant: "Q4_0",
    session: "second",
    run: "r6",
    hexagonSessions: 2,
    cells: [
      [{ prefill: 54, decode: 15.3, seconds: 353.5 }, { prefill: 53, decode: 6.2, seconds: 557.9 }, { prefill: 55, decode: 15.4, seconds: 349.8 }],
      [{ prefill: 102, decode: 15.0, seconds: 253.7 }, { prefill: 106, decode: 6.3, seconds: 443.0 }, { prefill: 105, decode: 15.3, seconds: 249.0 }],
      [{ prefill: 813, decode: 15.5, seconds: 149.5 }, { prefill: 951, decode: 6.4, seconds: 338.9 }, { prefill: 801, decode: 15.4, seconds: 149.9 }],
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
