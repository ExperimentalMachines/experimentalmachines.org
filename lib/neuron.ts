// Every value is copied from github.com/alpharomercoma/torchneuronx
// (REPORT.md and REPORT-EXTENSIONS.md, results committed under */results/).
// GPU serving values are from MI300X-vs-H200 REPORT.md section 4.1, the same
// model, request shape and metric schema. The conditions that differ are
// listed in `servingConditions` and shown under the figure.

export const neuronLinks = {
  repo: "https://github.com/alpharomercoma/torchneuronx",
  gpuRepo: "https://github.com/alpharomercoma/MI300X-vs-H200",
  deck: "https://docs.google.com/presentation/d/1ya_FQCdA86mOHMK_VsPfgzmaG3NsbloIkc4ye1r2Ltc/edit?usp=sharing",
};

// Llama 3.1 8B Instruct, BF16, 1024 in / 1024 out, one accelerator each,
// output tokens per second over all streams. inf2 is bounded at 32 resident
// sequences by KV memory (config A: 2048 ctx x 32 seqs).
export const serving = {
  concurrency: [1, 4, 8, 16, 32, 64, 128, 256],
  inf2: [15.7, 61.4, 119.3, 226.6, 415.5, null, null, null] as (number | null)[],
  mi300x: [195, 603, 1137, 2066, 3443, 4956, 7022, 8085] as (number | null)[],
  h200: [199, 761, 1445, 2674, 4486, 6806, 9937, 11337] as (number | null)[],
  // TPOT p50 on inf2, ms, c1 to c32: decode stays flat while aggregate scales 26x.
  inf2Tpot: [63.2, 64.3, 65.4, 67.4, 70.8],
};

// $ per 1M output tokens = $/hr / (tok/s x 3600) x 1e6. On-demand list
// prices: us-west-2 for inf2 (AWS pricing API), the providers' published
// GPU-hour rates for the two GPUs.
export const cost = [
  { device: "inf2.xlarge, 1x Inferentia2", rate: 0.7582, matched: 0.507, best: 0.507, bestAt: 32, bestTok: 415.5, matchedTok: 415.5 },
  { device: "MI300X, 1 GPU", rate: 2.59, matched: 0.209, best: 0.089, bestAt: 256, bestTok: 8085, matchedTok: 3443 },
  { device: "H200, 1 GPU", rate: 4.5, matched: 0.279, best: 0.11, bestAt: 256, bestTok: 11337, matchedTok: 4486 },
];

export const servingConditions = [
  ["vLLM", "0.16, the newest AWS deep learning image that boots on these chips", "0.26 on the GPUs"],
  ["PyTorch", "2.9.1", "2.11.0"],
  ["Cloud", "AWS us-west-2, on-demand list price", "DigitalOcean (MI300X), Nebius (H200), published GPU-hour rates"],
  ["Device memory", "32 GB", "192 GB (MI300X), 141 GB (H200)"],
  ["Run date", "2026-07", "2026-08"],
];

// Llama 3.1 8B Instruct, LoRA r16, bf16, micro-batch 1, one chip each:
// trn1.2xlarge (2 NeuronCores v2, TP=2, $1.34/hr) and trn2.3xlarge
// (8 NeuronCores v3 as 4 logical, TP=4, $2.235/hr, sa-east-1). Steady-state
// tokens per second and MFU against each chip's published BF16 peak
// (210 and 667 TFLOP/s). Two physical Trainium2 chips ran the study and
// differed by 2.4%, which is also the seed-to-seed noise floor.
export const ladder = [
  { seq: 2048, trn1: { tok: 2952, mfu: 68.3 }, trn2: { tok: 3618, mfu: 26.5 } },
  { seq: 4096, trn1: { tok: 3575, mfu: 82.7 }, trn2: { tok: 7340, mfu: 50.3 } },
  { seq: 8192, trn1: null, trn2: { tok: 8337, mfu: 61.0 } },
];

export const trainingCost = {
  trn1: { seq2048: 0.126, seq4096: 0.104 },
};

// What each training objective did on one Trainium1. ORPO's two 30-step lanes measured speed and their
// loss rose (REPORT-EXTENSIONS §32.4), so it "runs" rather than "works". Pretraining's number is the
// NeuronTrainer lane on one of two NeuronCores, which held one graph from step 3 on (§32.11,
// trn1/results/phase4/pretrain_nt_362m_mb8.json); the per-step recompile was a separate hand-written loop (§32.8).
export const objectives = [
  { stage: "Fine-tuning (SFT), LoRA", model: "Llama 3.1 8B", status: "works", number: "2,952 tok/s, 68.3% MFU at 2,048 tokens" },
  { stage: "Preference tuning, ORPO", model: "Llama 3.1 8B", status: "runs", number: "1,181 tok/s, 30.2% MFU at 1,024 tokens; loss did not fall in its short test runs" },
  {
    stage: "Pretraining from scratch",
    model: "362M, SmolLM2 shape",
    status: "works",
    number: "4,573 tok/s, 7.0% MFU, on one of the chip's two cores; a hand-written training loop recompiled every step",
  },
  {
    stage: "Preference tuning, DPO",
    model: "Llama 3.1 8B",
    status: "unresolved",
    number: "the reference model's pass compiles once run before training, then the run dies copying data to the CPU",
  },
  { stage: "Online RL, GRPO and RLVR", model: "Qwen3 1.7B", status: "blocked", number: "the training model class has no generate(), so it cannot write replies" },
] as const;

// Held-out loss on the same rows on both chips, split seed 20260805.
export const qualityGate = [
  { chip: "Trainium1", from: 2.1491, to: 1.251 },
  { chip: "Trainium2", from: 2.1481, to: 1.2652 },
];

// Speculative decoding on trn1: Llama 3.1 8B target, Llama 3.2 1B draft,
// SpecDecode-Bench, 39 prompts, 43k tokens, greedy. k = draft tokens per
// call; agreement = share of drafted tokens the target accepted.
export const specDecode = [
  { k: 0, tok: 31.61, agreement: null },
  { k: 2, tok: 44.51, agreement: 96.6 },
  { k: 3, tok: 56.41, agreement: 92.8 },
  { k: 4, tok: 64.3, agreement: 88.8 },
  { k: 5, tok: 70.37, agreement: 85.9 },
  { k: 6, tok: 73.86, agreement: 82.4 },
  { k: 7, tok: 77.34, agreement: 80.4 },
  { k: 10, tok: 78.47, agreement: 70.9 },
];

// Every distinct graph is compiled ahead of time. Same serving config, same
// graphs, different weights: the fine-tune paid for no new compilation.
export const startup = [
  { label: "Llama 3.1 8B, first ever boot", seconds: 2372, note: "cold cache" },
  { label: "Same setup, weights from the Trainium1 fine-tune", seconds: 548, note: "warm cache, nothing recompiled" },
];

// REPORT-EXTENSIONS §34.6, with two rows narrowed to what the committed results show. Pretraining
// trained at 362M and at a 386M variant (pretrain_nt_386m_16h_tp1/_tp2.json), and a 1.7B model failed
// its compile on memory (pretrain_nt_smollm2_1.7b_tp2.failure.json): about 400M is the largest size
// that trained, not a measured ceiling. The serving range is the like-for-like 32-stream one.
export const decision = [
  ["Fine-tuning a supported model, LoRA or full, at fixed input sizes", "strong fit"],
  ["Preference tuning without a reference model (ORPO)", "runs; its short tests did not show it learning"],
  ["Pretraining a small model from scratch", "works at 362M and 386M parameters on one Trainium1; a 1.7B model did not fit its memory"],
  ["Online RL of any kind (GRPO, PPO, RLVR)", "blocked"],
  ["Serving an 8B model at the lowest cost", "a single GPU was 1.8× to 2.4× cheaper per token at 32 streams"],
  ["Serving where GPU supply or data residency decides", "reasonable, up to 32 streams"],
  ["A model type outside the export tool's list", "a wall, not a tuning problem"],
] as const;

// 30 minutes at concurrency 8, config A, seven iterations.
export const sustained = { first: 118.8, last: 119.3, retention: 100.4, ttftSpread: 1.6 };
