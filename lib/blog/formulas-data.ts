// The sourced numbers behind the training and inference post: model architectures from each model's own
// config.json on Hugging Face, and hardware from vendors' spec pages (each device names its source). Change a
// number here and every table, slider and formula on the page follows.

export type ModelPreset = {
  id: string;
  short: string;
  name: string;
  // Parameters in billions; `activeB` is set for a mixture of experts, the parameters one token uses.
  paramsB: number;
  activeB?: number;
  layers: number;
  heads: number;
  kvHeads: number;
  headDim: number;
  // Width of the residual stream, of each feed-forward block (each expert's, for a mixture of experts), and
  // whether the output layer reuses the input embedding table.
  dModel: number;
  ffn: number;
  tied: boolean;
  experts?: number;
  activeExperts?: number;
  vocab: number;
  source: string;
};

export const models: ModelPreset[] = [
  {
    id: "qwen3-4b",
    short: "Qwen3 4B",
    name: "Qwen3 4B",
    paramsB: 4.0,
    layers: 36,
    heads: 32,
    kvHeads: 8,
    headDim: 128,
    dModel: 2560,
    ffn: 9728,
    tied: true,
    vocab: 151936,
    source: "https://huggingface.co/Qwen/Qwen3-4B",
  },
  {
    id: "llama31-8b",
    short: "Llama 3.1 8B",
    name: "Llama 3.1 8B",
    paramsB: 8.03,
    layers: 32,
    heads: 32,
    kvHeads: 8,
    headDim: 128,
    dModel: 4096,
    ffn: 14336,
    tied: false,
    vocab: 128256,
    source: "https://huggingface.co/meta-llama/Llama-3.1-8B",
  },
  {
    id: "qwen3-30b-a3b",
    short: "Qwen3 30B-A3B",
    name: "Qwen3 30B-A3B, a mixture of experts",
    paramsB: 30.5,
    // The model card says 3.3B; counted from the shape (lib/blog/arith.ts paramCount) it is 3.35B.
    activeB: 3.35,
    layers: 48,
    heads: 32,
    kvHeads: 4,
    headDim: 128,
    dModel: 2048,
    ffn: 768,
    tied: false,
    experts: 128,
    activeExperts: 8,
    vocab: 151936,
    source: "https://huggingface.co/Qwen/Qwen3-30B-A3B",
  },
  {
    id: "llama31-70b",
    short: "Llama 3.1 70B",
    name: "Llama 3.1 70B",
    paramsB: 70.6,
    layers: 80,
    heads: 64,
    kvHeads: 8,
    headDim: 128,
    dModel: 8192,
    ffn: 28672,
    tied: false,
    vocab: 128256,
    source: "https://huggingface.co/meta-llama/Llama-3.1-70B",
  },
];

export type Device = {
  id: string;
  short: string;
  name: string;
  kind: "edge" | "consumer" | "server" | "asic";
  // GB and GB/s are decimal (10^9) throughout; vendors that print GiB are converted, and the note says so.
  memoryGB: number;
  memoryType: string;
  bandwidthGBs: number;
  // Dense BF16 or FP16 matrix compute, TFLOP/s; null where the vendor publishes no dense figure.
  tflops: number | null;
  computeNote?: string;
  // Where a number is derived rather than printed by the vendor, how.
  note?: string;
  source: string;
};

const GiB = 1.073741824;

// Vendor spec pages and datasheets, fetched 2026-11-10; each device names its source.
export const devices: Device[] = [
  {
    id: "sd8eg5",
    short: "Snapdragon 8 Elite Gen 5",
    name: "Snapdragon 8 Elite Gen 5 (phone)",
    kind: "edge",
    memoryGB: 24,
    memoryType: "LPDDR5X",
    bandwidthGBs: 84.8,
    tflops: null,
    computeNote: "no TOPS published",
    note: "Up to 24 GB. Bandwidth derived: Qualcomm's 5,300 MHz memory clock moves 2 transfers a cycle, 10,600 MT/s, on a 64-bit bus (4 channels of 16), which Qualcomm does not print.",
    source: "https://www.qualcomm.com/content/dam/qcomm-martech/dm-assets/documents/Snapdragon-8-Elite-Gen-5-product-brief.pdf",
  },
  {
    id: "m5air",
    short: "Apple M5",
    name: "Apple M5 (MacBook Air)",
    kind: "edge",
    memoryGB: 32,
    memoryType: "Unified memory",
    bandwidthGBs: 153,
    tflops: null,
    computeNote: "no TFLOP/s published",
    note: "Up to 32 GB. Apple does not name the memory type.",
    source: "https://www.apple.com/macbook-air/specs/",
  },
  {
    id: "orin",
    short: "Jetson AGX Orin",
    name: "NVIDIA Jetson AGX Orin 64GB",
    kind: "edge",
    memoryGB: 64,
    memoryType: "LPDDR5",
    bandwidthGBs: 204.8,
    tflops: 43,
    note: "FP16 on the GPU's tensor cores, dense; the 275 TOPS headline is sparse INT8.",
    source: "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/",
  },
  {
    id: "rtx4090",
    short: "RTX 4090",
    name: "NVIDIA GeForce RTX 4090",
    kind: "consumer",
    memoryGB: 24,
    memoryType: "GDDR6X",
    bandwidthGBs: 1008,
    tflops: 165.2,
    note: "BF16 with FP32 accumulate, dense.",
    source: "https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf",
  },
  {
    id: "rtx5090",
    short: "RTX 5090",
    name: "NVIDIA GeForce RTX 5090",
    kind: "consumer",
    memoryGB: 32,
    memoryType: "GDDR7",
    bandwidthGBs: 1792,
    tflops: 209.5,
    note: "BF16 with FP32 accumulate, dense.",
    source: "https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf",
  },
  {
    id: "h100",
    short: "H100",
    name: "NVIDIA H100 SXM",
    kind: "server",
    memoryGB: 80,
    memoryType: "HBM3",
    bandwidthGBs: 3350,
    tflops: 989,
    note: "NVIDIA's page prints 1,979 TFLOP/s with sparsity; dense is half.",
    source: "https://www.nvidia.com/en-us/data-center/h100/",
  },
  {
    id: "h200",
    short: "H200",
    name: "NVIDIA H200 SXM",
    kind: "server",
    memoryGB: 141,
    memoryType: "HBM3e",
    bandwidthGBs: 4800,
    tflops: 989,
    note: "Dense derived: half of the 1,979 TFLOP/s NVIDIA prints with sparsity.",
    source: "https://www.nvidia.com/en-us/data-center/h200/",
  },
  {
    id: "b200",
    short: "B200",
    name: "NVIDIA B200",
    kind: "server",
    memoryGB: 180,
    memoryType: "HBM3e",
    bandwidthGBs: 8000,
    tflops: 2250,
    note: "Dense derived: NVIDIA prints 36 PFLOP/s sparse for 8 GPUs, and dense as half.",
    source: "https://docs.nvidia.com/enterprise-reference-architectures/hgx-ai-factory/latest/components.html",
  },
  {
    id: "mi300x",
    short: "MI300X",
    name: "AMD Instinct MI300X",
    kind: "server",
    memoryGB: 192,
    memoryType: "HBM3",
    bandwidthGBs: 5300,
    tflops: 1307.4,
    source: "https://www.amd.com/en/products/accelerators/instinct/mi300/mi300x.html",
  },
  {
    id: "tpuv5e",
    short: "TPU v5e",
    name: "Google TPU v5e",
    kind: "asic",
    memoryGB: 16,
    memoryType: "HBM",
    bandwidthGBs: Math.round(800 * GiB),
    tflops: 197,
    note: "Google prints 800 GiB/s.",
    source: "https://docs.cloud.google.com/tpu/docs/v5e",
  },
  {
    id: "tpuv6e",
    short: "TPU v6e",
    name: "Google TPU v6e (Trillium)",
    kind: "asic",
    memoryGB: 32,
    memoryType: "HBM",
    bandwidthGBs: 1638,
    tflops: 918,
    source: "https://docs.cloud.google.com/tpu/docs/v6e",
  },
  {
    id: "tpu7x",
    short: "TPU Ironwood",
    name: "Google TPU7x (Ironwood)",
    kind: "asic",
    memoryGB: Math.round(192 * GiB),
    memoryType: "HBM",
    bandwidthGBs: 7380,
    tflops: 2307,
    note: "Google prints 192 GiB.",
    source: "https://docs.cloud.google.com/tpu/docs/tpu7x",
  },
  {
    id: "trn2",
    short: "Trainium2",
    name: "AWS Trainium2",
    kind: "asic",
    memoryGB: Math.round(96 * GiB),
    memoryType: "HBM",
    bandwidthGBs: 2900,
    tflops: 667,
    note: "AWS prints 96 GiB.",
    source: "https://awsdocs-neuron.readthedocs-hosted.com/en/latest/general/arch/neuron-hardware/trainium2.html",
  },
  {
    id: "lpu",
    short: "Groq 3 LPU",
    name: "NVIDIA Groq 3 LPU",
    kind: "asic",
    memoryGB: 0.5,
    memoryType: "On-chip SRAM",
    bandwidthGBs: 150000,
    tflops: null,
    computeNote: "not published per chip",
    note: "A model is spread across many chips; a rack holds 128 GB of SRAM.",
    source: "https://www.nvidia.com/en-us/data-center/lpx/",
  },
  {
    id: "wse3",
    short: "Cerebras WSE-3",
    name: "Cerebras WSE-3",
    kind: "asic",
    memoryGB: 44,
    memoryType: "On-chip SRAM",
    bandwidthGBs: 21e6,
    tflops: null,
    computeNote: "125 PFLOP/s, sparse only",
    note: "One wafer-sized chip.",
    source: "https://cdn.sanity.io/files/e4qjo92p/production/864133620041e5af418074842e42a669c137fa23.pdf",
  },
];

// The devices offered as choices in the interactive panels, so each row of chips stays short: one or two of
// each kind. `sram` are the two shown as the on-chip memory example.
export const featured = {
  chips: ["sd8eg5", "m5air", "rtx5090", "h100", "b200", "tpuv6e"],
  sram: ["lpu", "wse3"],
};

// Which posts cite each source: the chip, inference or training part of the series.
export const sources: { for: ("chip" | "inference" | "training")[]; label: string; href: string; note: string }[] = [
  {
    for: ["chip"],
    label: "Unikeyic, LPDDR Memory Explained",
    href: "https://www.unikeyic.com/blog/lpddr-memory.html",
    note: "LPDDR generations and their data rates, from LPDDR1 to LPDDR6",
  },
  {
    for: ["chip", "inference", "training"],
    label: "EleutherAI, Transformer Math 101",
    href: "https://blog.eleuther.ai/transformer-math/",
    note: "C ≈ 6PD, and the bytes per parameter for training and inference",
  },
  {
    for: ["chip", "inference"],
    label: "kipply, Transformer Inference Arithmetic",
    href: "https://kipp.ly/transformer-inference-arithmetic/",
    note: "the KV cache per token, and where decode turns from memory bound to compute bound",
  },
  {
    for: ["chip", "inference"],
    label: "Google DeepMind, How to Scale Your Model: All About Rooflines",
    href: "https://jax-ml.github.io/scaling-book/roofline/",
    note: "arithmetic intensity, and the batch a TPU needs to be compute bound",
  },
  {
    for: ["inference"],
    label: "NVIDIA, Mastering LLM Techniques: Inference Optimization",
    href: "https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization/",
    note: "why decode is memory bound, and the KV cache's size",
  },
  {
    for: ["inference"],
    label: "Databricks, LLM Inference Performance Engineering",
    href: "https://www.databricks.com/blog/llm-inference-performance-engineering-best-practices",
    note: "prefill against decode, and model bandwidth utilisation (MBU)",
  },
  {
    for: ["inference"],
    label: "Baseten, A guide to LLM inference and performance",
    href: "https://www.baseten.co/blog/llm-transformer-inference-guide/",
    note: "time per token from weight bytes and bandwidth",
  },
  {
    for: ["inference", "training"],
    label: "Kaplan et al. 2020, Scaling Laws for Neural Language Models",
    href: "https://arxiv.org/abs/2001.08361",
    note: "6N operations per training token, and the attention term",
  },
  {
    for: ["training"],
    label: "Hoffmann et al. 2022, Training Compute-Optimal Large Language Models",
    href: "https://arxiv.org/abs/2203.15556",
    note: "Chinchilla: scale parameters and tokens together, about 20 tokens per parameter in its Table 3",
  },
  {
    for: ["training"],
    label: "Rajbhandari et al. 2020, ZeRO",
    href: "https://arxiv.org/abs/1910.02054",
    note: "2 + 2 + 12 = 16 bytes per parameter for mixed-precision Adam, and how to split them across chips",
  },
  {
    for: ["training"],
    label: "Llama Team 2024, The Llama 3 Herd of Models",
    href: "https://arxiv.org/abs/2407.21783",
    note: "405B trained with 3.8 × 10²⁵ FLOPs on 15.6T tokens at 38% to 43% MFU",
  },
  {
    for: ["training"],
    label: "Meta, Llama 3.1 model card",
    href: "https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md",
    note: "GPU hours per model: 1.46M, 7.0M and 30.84M",
  },
  {
    for: ["inference"],
    label: "Gemma Team 2025, Gemma 3 Technical Report",
    href: "https://arxiv.org/abs/2503.19786",
    note: "five local sliding-window layers for each global one",
  },
  { for: ["inference"], label: "DeepSeek-AI 2024, DeepSeek-V2", href: "https://arxiv.org/abs/2405.04434", note: "multi-head latent attention" },
  {
    for: ["chip"],
    label: "ggml, block_q4_0",
    href: "https://github.com/ggml-org/llama.cpp/blob/master/ggml/src/ggml-common.h",
    note: "Q4_0 stores 32 weights and one 16-bit scale in 18 bytes",
  },
];
