// Four studies published in their own repositories, copied from their reports. Each post on this site is the
// short version, and the repository keeps the full report and every raw result. The covers read these too, so a
// cover cannot drift from the page it opens.
//
// MI300X-vs-H200: REPORT.md. snapdragon-vs-m5: REPORT.md and shared/comparison.txt. snapdragon-vs-mediatek:
// README.md. copilot-local-bench: RESULTS.md, generated 2026-10-20 from results/tasks/rows.jsonl.

const me = "https://github.com/alpharomercoma";

const gpuRepo = `${me}/MI300X-vs-H200`;
export const gpuLinks = {
  repo: gpuRepo,
  report: `${gpuRepo}/blob/main/REPORT.md`,
  method: `${gpuRepo}/blob/main/METHODOLOGY.md`,
};

export const gpuKv = {
  mi300x: { gib: 102.25, tokens: 335040, concurrency: "20.45" },
  h200: { gib: 55.6, tokens: 182176, concurrency: "11.12" },
  advantage: "1.84",
  memory: "1.36",
};

export const gpuWinners = [
  ["Mixture-of-experts decode, concurrency 1", "H200", "2.72×"],
  ["Dense 8B, prefill-heavy, concurrency 256", "H200", "2.06×"],
  ["Dense 8B, balanced, concurrency 256", "H200", "1.40×"],
  ["Dense 8B, single stream", "Tie", "1.02×"],
  ["Dense 70B FP8, single stream", "H200", "1.12×"],
  ["Dense 70B FP8, balanced, concurrency 128", "MI300X", "1.14×"],
  ["Dense 70B FP8, decode-heavy, concurrency 256", "MI300X", "1.08×"],
  ["Dense 70B BF16 (141 GB weights)", "MI300X", "H200 cannot load it"],
  ["Training, 8B, BF16", "H200", "1.32× to 1.40×"],
];

export const gpuPaper = [
  ["BF16 dense", "1,307.4 TFLOP/s", "989.4 TFLOP/s", "MI300X 1.32×"],
  ["FP8 dense", "2,614.9 TFLOP/s", "1,978.9 TFLOP/s", "MI300X 1.32×"],
  ["HBM bandwidth", "5.3 TB/s", "4.8 TB/s", "MI300X 1.10×"],
  ["Capacity", "192 GB", "141 GB", "MI300X 1.36×"],
];

export const gpuMeasured = [
  ["BF16 GEMM", "619.4 TFLOP/s", "772.9 TFLOP/s", "H200 1.25×"],
  ["FP8 GEMM", "1,078.8 TFLOP/s", "1,313.8 TFLOP/s", "H200 1.22×"],
  ["HBM bandwidth", "4,012.7 GB/s", "4,464.8 GB/s", "H200 1.11×"],
];

// Llama 3.1 8B BF16, 1k in and 1k out: concurrency, output tok/s and ms per token on each GPU, and the ratio.
export const gpuBalanced = [
  [1, 195, 199, "1.02×", 4.99, "5.00"],
  [4, 603, 761, "1.26×", 6.45, 5.21],
  [8, 1137, 1445, "1.27×", 6.73, 5.46],
  [16, 2066, 2674, "1.29×", 7.42, 5.87],
  [32, 3443, 4486, "1.30×", 9.07, "7.00"],
  [64, 4956, 6806, "1.37×", 12.64, 9.21],
  [128, 7022, 9937, "1.42×", "18.00", 12.59],
  [256, 8085, 11337, "1.40×", 30.97, 21.55],
];

const laptopRepo = `${me}/snapdragon-vs-m5`;
export const laptopLinks = {
  repo: laptopRepo,
  report: `${laptopRepo}/blob/main/REPORT.md`,
  method: `${laptopRepo}/blob/main/METHODOLOGY.md`,
};

export const laptopGemma = { m5Gpu: 5603.7, x2Gpu: 1920.5, m5Cpu: 889.2, x2Cpu: 1689.3 };

// tok/s, Q4_0. pp512 and pp2048 are prefill, tg128 is decode. The CPU cells carry the thread count that did best.
export const laptopLlm = [
  ["Gemma 3 1B", "GPU prefill, 512 tokens", "5,604", "1,921", "M5 2.9×"],
  ["Gemma 3 1B", "GPU prefill, 2,048 tokens", "5,293", "1,712", "M5 3.1×"],
  ["Gemma 3 1B", "GPU decode", "144", "74.5", "M5 1.9×"],
  ["Gemma 3 1B", "CPU prefill, 512 tokens", "889.2 (10 threads)", "1,689.3 (12 threads)", "X2 1.9×"],
  ["Gemma 3 1B", "CPU decode", "116.3 (6 threads)", "127.9 (8 threads)", "X2 1.1×"],
  ["Qwen3 8B", "GPU prefill, 512 tokens", "643", "306", "M5 2.1×"],
  ["Qwen3 8B", "GPU prefill, 2,048 tokens", "562", "254", "M5 2.2×"],
  ["Qwen3 8B", "GPU decode", "25.6", "18.2", "M5 1.4×"],
  ["Qwen3 8B", "CPU prefill, 512 tokens", "85.3 (10 threads)", "270.7 (18 threads)", "X2 3.2×"],
  ["Qwen3 8B", "CPU decode", "17.2 (6 threads)", "23.4 (12 threads)", "X2 1.4×"],
];

export const laptopNpu = [
  ["fp16", "14.1 TFLOP/s (Neural Engine)", "15.2 TFLOP/s (Hexagon)"],
  ["int8", "15.6 TFLOP/s (Neural Engine)", "8.6 TOPS (Hexagon)"],
];

export const laptopTraining = [
  ["CPU", "1.25 TFLOP/s", "0.11 to 0.12 TFLOP/s, at 4, 12 or 18 threads"],
  ["GPU", "2.30 TFLOP/s (MPS)", "No Adreno backend exists"],
];

export const laptopQuality = [
  ["Gemma 3 1B Q4_0", "34.4694 ± 1.30", "34.6233 ± 1.31", "0.45%"],
  ["Gemma 3 1B Q4_K_M", "29.5493 ± 1.08", "29.5508 ± 1.08", "0.005%"],
  ["Quality cost of Q4_0", "+16.7%", "+17.2%", ""],
];

const phoneRepo = `${me}/snapdragon-vs-mediatek`;
export const phoneLinks = {
  repo: phoneRepo,
  mediatek: `${phoneRepo}/blob/main/dimensity-9500s/REPORT.md`,
  qualcomm: `${phoneRepo}/blob/main/snapdragon-8-elite/REPORT.md`,
};

export const phoneMatmul = { elite: 479, dimensity: 67 };

export const phoneTable = [
  ["NPU", "Hexagon HTP V79", "MDLA (NPU 890)"],
  ["NPU runtime access", "QNN 2.48 from Maven Central and public FastRPC, no SDK gate", "NeuroPilot 8.2.26, preinstalled as public system libraries"],
  ["NPU int8, 8-layer FC (32×2048×2048)", "4,307 GOPS, 0.50 ms", "1,100 to 1,470 GOPS, 1.46 ms"],
  ["NPU fp16 inference", "1,089 GFLOP/s", "Runs, not quantified"],
  ["NPU training", "Architecturally impossible", "Architecturally impossible"],
  ["CPU", "2× Oryon at 4.09 GHz and 6× at 2.78 GHz", "1× X925 at 3.73 GHz, 3× X4 and 4× A720"],
  ["Gemma 3 1B Q4, CPU prefill and decode, 8 threads", "171 to 173 and 62 to 64 tok/s", "58 to 74 and 22 to 31 tok/s"],
  ["GPU", "Adreno 830", "Immortalis-G925 MC11"],
  ["Working GPU compute API", "OpenCL (public library; Vulkan broken for quantized inference)", "Vulkan (OpenCL blocked by namespace)"],
  ["Gemma 3 1B Q4, GPU prefill and decode", "717 to 723 and 41.5 to 42.5 tok/s, OpenCL", "About 39 and about 27 tok/s, Vulkan"],
  ["Matmul, 4096³ f32", "479 GFLOP/s, 6.9× its CPU", "67 GFLOP/s, 1.69× its CPU (coopmat and f32 only)"],
  ["Transformer-layer training step, GPU and CPU", "403 and 62.5 GFLOP/s, 6.5×, OpenCL", "About 50 and 37 GFLOP/s, 1.1× to 1.4×"],
  ["GPU training (ggml MLP and AdamW)", "Vulkan, no flags, converges identically to CPU", "Vulkan with GGML_VK_DISABLE_COOPMAT=1, converges worse"],
  ["Best local LLM recipe", "GPU OpenCL prefill and CPU decode", "CPU prefill and GPU Vulkan decode"],
];

const copilotRepo = "https://github.com/ExperimentalMachines/copilot-local-bench";
export const copilotLinks = {
  repo: copilotRepo,
  results: `${copilotRepo}/blob/main/RESULTS.md`,
  protocol: `${copilotRepo}/blob/main/PROTOCOL.md`,
};

// The ten registered configurations: passed of 24 tasks, median seconds per run, and spend per completed task
// where it has a basis ($0.89 an hour of agent time on the rented 4090, credits at $0.01 on hosted plans).
export const copilotCells = [
  { name: "Copilot Free (education), Auto", passed: 24, wall: 54.7, cost: "$0.011" },
  { name: "Copilot Pro+, top model pinned", passed: 24, wall: 62.7, cost: "$0.582" },
  { name: "Copilot Pro, Auto", passed: 23, wall: 63.2, cost: "$0.148" },
  { name: "Copilot Pro+, Auto", passed: 22, wall: 57.9, cost: "$0.169", primary: true },
  { name: "Gemma 4 on the RTX 4090", passed: 14, wall: 50.2, cost: "$0.098" },
  { name: "Qwen3.6 on the RTX 4090", passed: 10, wall: 600.0, cost: "$0.218", primary: true },
  { name: "gpt-oss-20b on the RTX 4090", passed: 10, wall: 31.7, cost: "$0.022" },
  { name: "Gemma 4 on the MacBook Air", passed: 10, wall: 480.6, cost: "Not measured" },
  { name: "gpt-oss-20b on the MacBook Air", passed: 7, wall: 227.3, cost: "Not measured" },
  { name: "Qwen3.6 on the MacBook Air", passed: 7, wall: 600.1, cost: "Not measured" },
];

// Checked after the study on the same files: Copilot CLI and pi, both on the 4090. Exploratory, outside every contrast.
export const copilotHarness = [
  ["gpt-oss-20b", "7 of 24, 0.5 min", "10 of 24, 0.2 min"],
  ["Qwen3.6-35B-A3B", "12 of 24, 5.7 min", "18 of 24, 0.7 min"],
  ["Gemma 4 26B-A4B", "13 of 24, 0.6 min", "13 of 24, 0.5 min"],
  ["Qwen3.8-27B", "17 of 24, 1.3 min", "22 of 24, 1.2 min"],
  ["Mellum 2.1 12B, thinking", "11 of 24, 1.9 min", "8 of 24, 0.6 min"],
];

// The same results as numbers, for the charts. MI300X-vs-H200 REPORT.md sections 5, 9 and 4.5.
export const gpuTail = [
  { label: "1k in, 1k out", mi300x: 26.3, h200: 145.6, ratio: "5.5×" },
  { label: "1k in, 8k out", mi300x: 35.0, h200: 2200.5, ratio: "62.9×" },
];
export const gpuTraining = [
  { label: "Eager", mi300x: 5101.6, h200: 6707.0, ratio: "1.32×" },
  { label: "Compiled", mi300x: 5603.3, h200: 7821.6, ratio: "1.40×" },
];
export const gpuEnergy = { mi300x: 10.78, h200: 16.37 };

// snapdragon-vs-m5 shared/comparison.txt and REPORT.md: tok/s, Q4_0, best thread count per machine.
export const laptopDuel = [
  {
    title: "On the GPU",
    rows: [
      { label: "Gemma 3 1B prefill, 512 tokens", m5: 5603.7, x2: 1920.5 },
      { label: "Gemma 3 1B prefill, 2,048 tokens", m5: 5293.4, x2: 1711.8 },
      { label: "Gemma 3 1B decode", m5: 143.8, x2: 74.5 },
      { label: "Qwen3 8B prefill, 512 tokens", m5: 642.6, x2: 306.1 },
      { label: "Qwen3 8B prefill, 2,048 tokens", m5: 561.7, x2: 254.4 },
      { label: "Qwen3 8B decode", m5: 25.6, x2: 18.2 },
    ],
  },
  {
    title: "On the CPU",
    rows: [
      { label: "Gemma 3 1B prefill, 512 tokens", m5: 889.2, x2: 1689.3 },
      { label: "Gemma 3 1B decode", m5: 116.3, x2: 127.9 },
      { label: "Qwen3 8B prefill, 512 tokens", m5: 85.3, x2: 270.7 },
      { label: "Qwen3 8B decode", m5: 17.2, x2: 23.4 },
    ],
  },
];
export const laptopNpuBars = [
  { label: "fp16", m5: 14137, x2: 15205 },
  { label: "int8", m5: 15593, x2: 8602 },
];
// What moving from Q4_0 to Q4_K_M costs in speed on Gemma 3 1B, in percent.
export const laptopPenalty = [
  { label: "CPU prefill", m5: 43, x2: 60 },
  { label: "CPU decode", m5: 39, x2: 15 },
  { label: "GPU prefill", m5: 17, x2: 6 },
  { label: "GPU decode", m5: 38, x2: 12 },
];
export const laptopSustained = [
  { label: "Prefill kept over 10 minutes", a: 98.8, b: 99.1 },
  { label: "Decode kept over 10 minutes", a: 89.4, b: 98.2 },
];

// snapdragon-vs-mediatek README.md. Each side as [low, high]; one number where the source gives one.
export const phoneBars: { label: string; unit: string; elite: [number, number]; dimensity: [number, number]; aboutDimensity?: boolean }[] = [
  { label: "NPU int8, 8-layer FC", unit: "GOPS", elite: [4307, 4307], dimensity: [1100, 1470] },
  { label: "Gemma 3 1B prefill on the CPU", unit: "tok/s", elite: [171, 173], dimensity: [58, 74] },
  { label: "Gemma 3 1B decode on the CPU", unit: "tok/s", elite: [62, 64], dimensity: [22, 31] },
  { label: "Gemma 3 1B prefill on the GPU", unit: "tok/s", elite: [717, 723], dimensity: [39, 39], aboutDimensity: true },
  { label: "Gemma 3 1B decode on the GPU", unit: "tok/s", elite: [41.5, 42.5], dimensity: [27, 27], aboutDimensity: true },
  { label: "Matmul on the GPU, 4096³ f32", unit: "GFLOP/s", elite: [479, 479], dimensity: [67, 67] },
  { label: "Transformer-layer training step on the GPU", unit: "GFLOP/s", elite: [403, 403], dimensity: [50, 50], aboutDimensity: true },
];

// copilot-local-bench RESULTS.md: each contrast against Copilot Pro+ on Auto, in points, with its 95% interval. Declared
// means the study declares a difference after the Holm correction; the first row is the primary contrast.
export const copilotContrasts = [
  { label: "Qwen3.6 on the RTX 4090", gap: -50, low: -71, high: -29, verdict: "primary, Pro+ Auto ahead" },
  { label: "gpt-oss-20b on the RTX 4090", gap: -50, low: -71, high: -29, verdict: "declared" },
  { label: "Gemma 4 on the RTX 4090", gap: -33, low: -54, high: -12, verdict: "not declared after Holm" },
  { label: "gpt-oss-20b on the MacBook Air", gap: -62, low: -79, high: -42, verdict: "declared" },
  { label: "Qwen3.6 on the MacBook Air", gap: -62, low: -79, high: -42, verdict: "declared" },
  { label: "Gemma 4 on the MacBook Air", gap: -50, low: -71, high: -29, verdict: "declared" },
  { label: "Copilot Pro, Auto", first: true, gap: 4, low: 0, high: 12, verdict: "no difference declared" },
  { label: "Copilot Free (education), Auto", first: true, gap: 8, low: 0, high: 21, verdict: "no difference declared" },
  { label: "Copilot Pro+, top model pinned", first: true, gap: 8, low: 0, high: 21, verdict: "no difference declared" },
];

// Share of each configuration's summed agent time: prefill, decode, network and proxy, tools and CLI.
export const copilotWait = [
  { label: "Qwen3.6 on the RTX 4090", shares: [8, 32, 57, 3] },
  { label: "gpt-oss-20b on the RTX 4090", shares: [7, 38, 37, 19] },
  { label: "Gemma 4 on the RTX 4090", shares: [5, 51, 34, 10] },
  { label: "Qwen3.6 on the MacBook Air", shares: [23, 71, 1, 5] },
  { label: "gpt-oss-20b on the MacBook Air", shares: [27, 71, 1, 2] },
  { label: "Gemma 4 on the MacBook Air", shares: [32, 64, 1, 2] },
  { label: "Copilot Pro+, Auto", unsplit: 72, shares: [null, null, null, 28] },
  { label: "Copilot Pro, Auto", unsplit: 72, shares: [null, null, null, 28] },
  { label: "Copilot Free (education), Auto", unsplit: 71, shares: [null, null, null, 29] },
  { label: "Copilot Pro+, top model pinned", unsplit: 74, shares: [null, null, null, 26] },
];

// qwen3.8-27b-rtx4090-vllm docs/benchmarks/REPORT.md: Qwen3.8-27B on one RTX 4090, 2026-09-23 and 24.
const rtxRepo = `${me}/qwen3.8-27b-rtx4090-vllm`;
export const rtxLinks = {
  report: `${rtxRepo}/blob/main/docs/benchmarks/REPORT.md`,
  findings: `${rtxRepo}/blob/main/docs/benchmarks/FINDINGS.md`,
  raw: `${rtxRepo}/tree/main/results/raw`,
  review: `${rtxRepo}/tree/main/docs/benchmarks/review`,
};

export const rtxEngines = ["Ollama", "llama.cpp", "SGLang", "vLLM fp8", "vLLM int4 pinned"];

// Time to first token per agent turn, seconds, [p50, p90], in rtxEngines order.
export const rtxAgentWait: { agents: number; waits: [number, number][] }[] = [
  {
    agents: 1,
    waits: [
      [1.0, 1.1],
      [0.8, 1.0],
      [0.6, 0.7],
      [0.7, 0.9],
      [0.8, 0.9],
    ],
  },
  {
    agents: 4,
    waits: [
      [6.4, 13.4],
      [6.0, 7.9],
      [1.7, 5.6],
      [1.9, 2.8],
      [2.3, 3.5],
    ],
  },
  {
    agents: 8,
    waits: [
      [22.5, 38.0],
      [10.7, 14.1],
      [18.7, 29.6],
      [7.4, 15.7],
      [4.9, 7.2],
    ],
  },
];

// A 1k prompt and 256 tokens out, in rtxEngines order: tok/s per user, total tok/s, seconds to first token.
export const rtxDecode: { users: number; cells: [number, number, number][] }[] = [
  {
    users: 1,
    cells: [
      [102.2, 78, 0.8],
      [46.7, 42, 0.6],
      [53.5, 50, 0.3],
      [53.7, 50, 0.3],
      [52.5, 49, 0.3],
    ],
  },
  {
    users: 4,
    cells: [
      [101.8, 78, 10.5],
      [36.5, 109, 2.5],
      [45.1, 116, 1.1],
      [48.5, 156, 1.3],
      [45.9, 152, 1.2],
    ],
  },
  {
    users: 8,
    cells: [
      [102.6, 78, 23.3],
      [23.1, 142, 3.4],
      [47.8, 121, 10.4],
      [41.8, 255, 1.8],
      [36.7, 248, 1.3],
    ],
  },
  {
    users: 16,
    cells: [
      [102.4, 78, 49.4],
      [22.0, 141, 16.8],
      [46.0, 122, 26.1],
      [28.9, 368, 2.2],
      [26.5, 357, 1.8],
    ],
  },
];

// Prefill of one request, tok/s, in rtxEngines order. Ollama's 32k cell is starred in the report: of its three
// prompts, the one over its 32,768-token context was silently cut to 16,386 tokens.
export const rtxPrefill: { prompt: string; rates: number[] }[] = [
  { prompt: "1k", rates: [1226, 1770, 2965, 2814, 2809] },
  { prompt: "8k", rates: [2300, 2527, 2902, 2888, 2492] },
  { prompt: "32k", rates: [2263, 2434, 2588, 2568, 1768] },
];

// The recommended setup, vLLM int4 pinned, as agents are added.
export const rtxCapacity = [
  { agents: 1, p50: 0.8, p90: 0.9, perUser: 50.1, cached: 77, session: 36 },
  { agents: 2, p50: 1.3, p90: 1.5, perUser: 45.9, cached: 76, session: 44 },
  { agents: 4, p50: 2.3, p90: 3.5, perUser: 41.0, cached: 70, session: 60 },
  { agents: 8, p50: 4.9, p90: 7.2, perUser: 30.1, cached: 69, session: 91 },
  { agents: 12, p50: 7.4, p90: 14.6, perUser: 20.6, cached: 54, session: 160 },
  { agents: 16, p50: 16.5, p90: 29.6, perUser: 6.4, cached: 11, session: 355 },
];

// vLLM cache pools. Twelve agents did not run on the first.
export const rtxPools = [
  { name: "fp8, 0.95, host 1", pool: 84898, at8: 7.4, at12: null, cached12: null },
  { name: "int4, 0.97, host 1", pool: 180558, at8: 5.0, at12: [11.7, 29.9], cached12: 12 },
  { name: "int4, pinned 4.5 GiB, host 2", pool: 246094, at8: 4.9, at12: [7.4, 14.6], cached12: 54 },
  { name: "int4, 0.97, host 2", pool: 298255, at8: 5.1, at12: [6.7, 11.1], cached12: 69 },
];

export const rtxModels = [
  { label: "Agent turn wait at 8 agents", detail: "Median. Shorter is better", qwen: 4.9, oss: 0.26, unit: "s" },
  { label: "Agent turn wait at 16 agents", detail: "Median. Shorter is better", qwen: 16.5, oss: 0.88, unit: "s" },
  { label: "Prefill, 16k prompt", detail: "tok/s", qwen: 2199, oss: 13196, unit: "" },
  { label: "Decode, 1 user", detail: "tok/s", qwen: 52.5, oss: 197.6, unit: "" },
  { label: "Decode, 16 at once", detail: "Total tok/s", qwen: 357, oss: 1019, unit: "" },
];

export const rtxOssEngines = [
  ["Prefill 1k, 8k and 32k, tok/s", "15,624, 15,510, 10,069", "7,274, 11,198, 10,526", "5,958, 10,205, 9,977", "2,642, 4,949, 4,938"],
  ["Decode, 1 user, tok/s", "197.6", "242.6", "191.8", "24.3"],
  ["16 at once: per user, total, first token", "74.7, 1,019, 0.6 s", "77.4, 484, 5.1 s", "100.6, 336, 9.2 s", "8.0, 118, 2.9 s"],
  ["Agent turn wait p50 and p90, 1 agent", "0.14 and 0.15 s", "0.21 and 0.22 s", "0.25 and 0.31 s", "0.46 and 0.48 s"],
  ["Agent turn wait p50 and p90, 8 agents", "0.26 and 0.48 s", "1.64 and 3.10 s", "1.40 and 2.02 s", "1.06 and 1.50 s"],
  ["Errors", "0", "0", "0", "0"],
];

export const rtxMtp = [
  { label: "Decode, 1 user", detail: "tok/s. Longer is better", without: 52.5, withMtp: 82.3, unit: "" },
  { label: "Session time, 1 agent", detail: "Shorter is better", without: 36, withMtp: 37, unit: " s" },
  { label: "Session time, 8 agents", detail: "Shorter is better", without: 101, withMtp: 236, unit: " s" },
  { label: "First token, 16 at once", detail: "Shorter is better", without: 1.8, withMtp: 6.7, unit: " s" },
  { label: "Input served from cache, 1 agent", detail: "Longer is better", without: 77, withMtp: 51, unit: "%" },
];

// Share of a ~12k-token context still cached after each idle gap. Null where the gap was not run.
export const rtxIdle = [
  ["5 s", "93%", "93%", "93%"],
  ["30 s", "not run", "94%", "0%"],
  ["1 min", "94%", "97%", "0%"],
  ["2 min", "not run", "0%", "0%"],
  ["4 min", "not run", "0%", "0%"],
  ["5 min", "97%", "not run", "not run"],
  ["8 min", "not run", "invalid", "0%"],
  ["15 min", "88%", "not run", "not run"],
];

export const rtxPi = [
  ["vLLM int4, host 1", "off", "1, 4 and 8", "13 of 13", "24.1, 26.0 and 88.4 s"],
  ["vLLM int4, host 1", "medium", "1, 4 and 8", "13 of 13", "23.6, 58.5 and 70.3 s"],
  ["vLLM int4 pinned, host 2", "medium", "8", "8 of 8", "96.1 s"],
];
