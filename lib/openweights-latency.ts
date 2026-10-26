// OpenWeights' latency study, copied from the page it was first published on,
// experimentalmachines.github.io/openweights/latency.html (gh-pages 1f00e53):
// its DATA and PREFILL tables. Medians from one pass per cell on 2026-09-03 and
// 04, 60 to 90 benchmark prompts each. Median prefill rates are from the
// openweights repository's docs/research/benchmark-matrix.md.

const repo = "https://github.com/ExperimentalMachines/openweights";

export const latencyLinks = {
  matrix: `${repo}/blob/main/docs/research/benchmark-matrix.md`,
};

export const latencyChips = [
  { name: "Dimensity 9400", short: "D9400" },
  { name: "Snapdragon 8 Gen 3", short: "8 Gen 3" },
  { name: "Snapdragon 8 Elite", short: "8 Elite" },
  { name: "Tensor G5", short: "Tensor G5" },
  { name: "Exynos 2400", short: "Exynos 2400" },
];

// Per chip, in latencyChips order: time to first token in seconds, time per
// output token in ms, and the median prefill rate in tokens per second.
export type LatencyPoint = { ttft: number; tpot: number; prefill: number };

export type LatencyModel = { name: string; llama: LatencyPoint[]; et: LatencyPoint[] };

export const latencyModels: LatencyModel[] = [
  {
    name: "Gemma 3 1B",
    llama: [
      { ttft: 1.27, tpot: 42, prefill: 61 },
      { ttft: 1.02, tpot: 51, prefill: 69 },
      { ttft: 0.8, tpot: 28, prefill: 79 },
      { ttft: 1.35, tpot: 113, prefill: 56 },
      { ttft: 1.68, tpot: 75, prefill: 45 },
    ],
    et: [
      { ttft: 0.43, tpot: 48, prefill: 164 },
      { ttft: 0.37, tpot: 27, prefill: 192 },
      { ttft: 0.4, tpot: 44, prefill: 167 },
      { ttft: 0.48, tpot: 50, prefill: 156 },
      { ttft: 0.45, tpot: 56, prefill: 151 },
    ],
  },
  {
    name: "LFM2.5 1.2B",
    llama: [
      { ttft: 0.81, tpot: 31, prefill: 138 },
      { ttft: 0.73, tpot: 43, prefill: 130 },
      { ttft: 0.59, tpot: 27, prefill: 153 },
      { ttft: 0.83, tpot: 106, prefill: 112 },
      { ttft: 0.97, tpot: 59, prefill: 92 },
    ],
    et: [
      { ttft: 0.3, tpot: 25, prefill: 321 },
      { ttft: 0.44, tpot: 27, prefill: 217 },
      { ttft: 0.3, tpot: 18, prefill: 288 },
      { ttft: 0.32, tpot: 46, prefill: 248 },
      { ttft: 0.42, tpot: 38, prefill: 208 },
    ],
  },
  {
    name: "Qwen3 1.7B",
    llama: [
      { ttft: 1.05, tpot: 57, prefill: 113 },
      { ttft: 0.49, tpot: 74, prefill: 195 },
      { ttft: 0.37, tpot: 40, prefill: 266 },
      { ttft: 1.17, tpot: 184, prefill: 93 },
      { ttft: 0.89, tpot: 97, prefill: 100 },
    ],
    et: [
      { ttft: 0.76, tpot: 64, prefill: 122 },
      { ttft: 0.77, tpot: 41, prefill: 120 },
      { ttft: 0.75, tpot: 41, prefill: 130 },
      { ttft: 0.89, tpot: 94, prefill: 102 },
      { ttft: 0.81, tpot: 67, prefill: 112 },
    ],
  },
  {
    name: "Llama 3.2 3B",
    llama: [
      { ttft: 2.39, tpot: 82, prefill: 39 },
      { ttft: 2.11, tpot: 107, prefill: 43 },
      { ttft: 1.7, tpot: 83, prefill: 48 },
      { ttft: 2.43, tpot: 180, prefill: 37 },
      { ttft: 3.46, tpot: 151, prefill: 25 },
    ],
    et: [
      { ttft: 1.36, tpot: 82, prefill: 87 },
      { ttft: 1.82, tpot: 91, prefill: 66 },
      { ttft: 1.47, tpot: 63, prefill: 80 },
      { ttft: 1.55, tpot: 125, prefill: 71 },
      { ttft: 1.73, tpot: 119, prefill: 64 },
    ],
  },
  {
    name: "SmolLM3 3B",
    llama: [
      { ttft: 1.18, tpot: 79, prefill: 42 },
      { ttft: 1.43, tpot: 101, prefill: 39 },
      { ttft: 1.03, tpot: 79, prefill: 47 },
      { ttft: 1.86, tpot: 239, prefill: 35 },
      { ttft: 1.79, tpot: 132, prefill: 29 },
    ],
    et: [
      { ttft: 12.69, tpot: 91, prefill: 13 },
      { ttft: 10.33, tpot: 85, prefill: 14 },
      { ttft: 7.18, tpot: 67, prefill: 21 },
      { ttft: 15.9, tpot: 108, prefill: 11 },
      { ttft: 12.26, tpot: 121, prefill: 11 },
    ],
  },
];
