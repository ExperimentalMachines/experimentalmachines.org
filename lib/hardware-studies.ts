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
  ["CPU", "1.25 TFLOP/s", "0.11 TFLOP/s, at 4, 12 or 18 threads"],
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
