#!/usr/bin/env node
// Generates lib/gguf-bf16.ts from the OpenGrad repository at the frozen
// `study-001` tag, so the /gguf page never retypes a number. Companion to
// scripts/build-gguf-data.mjs, which reads the same tag's GGUF ladder.
//
//   OPENGRAD=../OpenGrad node scripts/build-gguf-bf16-data.mjs
//
// Two runs are joined here, and they are NOT the same hardware:
//   llama.cpp  - BF16 GGUF on one A100, single stream, llama-bench
//   vLLM       - the BF16 checkpoint on one H200, batching 1 to 256
// Engine, GPU and kernels all differ, so this is an engine-level comparison.
// OpenGrad records that caveat itself in vllm_vs_llamacpp_agreement.json.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OPENGRAD = resolve(process.env.OPENGRAD ?? "../OpenGrad");
const TAG = "study-001";
const GGUF_DIR = "results/quantization/gguf";
const H200_DIR = "results/benchmarks/h200";

const read = (path) =>
  JSON.parse(execFileSync("git", ["-C", OPENGRAD, "show", `${TAG}:${path}`], { encoding: "utf8", maxBuffer: 1 << 28 }));
const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
// "NVIDIA A100-SXM4-80GB" reads as "A100" in a sentence; "NVIDIA H200" as "H200".
const shortGpu = (name) => name.replace(/^NVIDIA\s+/, "").split("-")[0];

// --- llama.cpp on A100: the BF16 GGUF, single stream -------------------------
const base = read(`${GGUF_DIR}/bench_m1-v2-bf16.json`);
const tg = base.rows.find((r) => r.n_prompt === 0 && r.n_gen === 128);
const pp = base.rows.find((r) => r.n_prompt === 2048 && r.n_gen === 0);
const bf16Score = read(`${GGUF_DIR}/score_m1-v2-bf16_confirmatory.json`);

const llamacpp = {
  artifact: base.artifact,
  bytes: base.artifact_bytes,
  gib: round(base.artifact_bytes / 2 ** 30, 2),
  tg: round(tg.avg_ts, 1),
  tgSd: round(tg.stddev_ts, 1),
  pp: Math.round(pp.avg_ts),
  ppSd: Math.round(pp.stddev_ts),
  engine: `llama.cpp ${tg.build_commit}, ${tg.backends} backend, llama-bench`,
  gpu: tg.gpu_info,
  gpuShort: shortGpu(tg.gpu_info),
  offload: tg.n_gpu_layers >= 999 ? "all layers on the GPU" : `${tg.n_gpu_layers} layers on the GPU`,
  batch: `${tg.n_batch} batch, ${tg.n_ubatch} micro-batch, ${tg.n_threads} CPU threads`,
  kvCache: `${tg.type_k} keys, ${tg.type_v} values`,
  repetitions: tg.samples_ts.length,
  runDate: tg.test_time.slice(0, 10),
};

// --- vLLM on H200: the BF16 checkpoint, batching -----------------------------
const perf = read(`${H200_DIR}/perf_run.json`);
const env = perf.environment;

const vllm = {
  engine: `vLLM ${env.vllm}, torch ${env.torch}, CUDA ${env.cuda}`,
  gpu: env.gpu_name,
  gpuShort: shortGpu(env.gpu_name),
  driver: env.driver,
  dtype: env.dtype,
  gpuMemoryGib: env.gpu_total_memory_gib,
  gpuHourlyUsd: env.gpu_hourly_usd,
  maxModelLen: env.max_model_len,
  maxNumSeqs: env.max_num_seqs,
  prefixCaching: env.enable_prefix_caching,
  coldStartSeconds: round(perf.cold_start_model_load_seconds, 1),
  billedUsdUpperBound: perf.estimated_billed_gpu_usd_upper_bound,
  runDate: "2026-09-12",
};

const sweep = perf.records
  .map((r) => ({
    shape: r.shape,
    concurrency: r.concurrency,
    requestsPerSecond: round(r.requests_per_second, 1),
    outputTps: round(r.output_tokens_per_second, 1),
    totalTps: round(r.total_tokens_per_second, 1),
    promptTokens: r.prompt_tokens,
    outputTokens: r.output_tokens,
  }))
  .sort((a, b) => a.concurrency - b.concurrency || a.shape.localeCompare(b.shape));

// The only series that varies concurrency at a fixed shape, so it is the one
// the figure can plot without mixing prompt lengths.
const mixed = sweep.filter((r) => r.shape === "mixed");

// --- what the engine swap did to the model's decisions -----------------------
const agreement = read(`${H200_DIR}/vllm_vs_llamacpp_agreement.json`);

const decisions = {
  examples: agreement.examples,
  agreement: round(agreement.decision_agreement, 4),
  flips: agreement.decision_flips,
  exactOutputAgreement: round(agreement.exact_output_agreement, 4),
  flipsTokenizerDivergent: agreement.flips_among_known_tokenizer_divergent,
  flipsEngineNumerics: agreement.flips_attributable_to_engine_numerics,
  flipEffects: {
    bothWrong: agreement.flip_effects.both_wrong,
    llamacppCorrect: agreement.flip_effects.llamacpp_correct,
    vllmCorrect: agreement.flip_effects.vllm_correct,
  },
  note: agreement.note,
};

// The same yardstick against the quantization ladder: flips away from the
// llama.cpp BF16 GGUF reference, so the engine swap sits on one scale with the
// rungs the rest of the page reports.
const verdict = read(`${GGUF_DIR}/ladder_verdict.json`);
const quantFlips = verdict.rungs
  .map((r) => ({ rung: r.rung, flips: r.decision_flips, agreement: round(r.decision_agreement, 4) }))
  .sort((a, b) => a.flips - b.flips);

const score = read(`${H200_DIR}/score_vllm-bf16_confirmatory.json`);
const rerun = {
  callF1: round(score.metrics.call_f1, 4),
  referenceCallF1: round(score.frozen_reference_metrics.call_f1, 4),
  maxAbsDelta: round(Math.max(...Object.values(score.delta_vs_frozen_reference).map(Math.abs)), 4),
  parseValidRate: round(score.metrics.parse_valid_rate, 4),
};

const conditions = { llamacpp, vllm, examples: bf16Score.records };

const header = `// GENERATED by scripts/build-gguf-bf16-data.mjs from github.com/arjhinety/OpenGrad at
// tag ${TAG} (${GGUF_DIR}, ${H200_DIR}). Do not edit by hand; re-run the script.
// Two runs of the same M1-v2 checkpoint, joined for comparison and NOT on the
// same hardware. llama.cpp ran the BF16 GGUF on one A100, single stream,
// llama-bench: tg = generation of 128 tokens, pp = prompt processing at 2,048
// tokens. vLLM ran the BF16 checkpoint on one H200, batching 1 to 256, three
// shapes plus a mixed one. Engine, GPU and kernels all differ, so this is an
// engine-level comparison and not a measurement of either engine or GPU alone.
// Decisions compares the two engines per example on the same 1,277 confirmatory
// prompts; the quantized-rung flip counts come from the A100 ladder and use the
// llama.cpp BF16 GGUF as their reference.
`;

const body = [
  `export const ggufBf16Links = ${JSON.stringify({
    report: `https://github.com/arjhinety/OpenGrad/blob/${TAG}/reports/H200_BENCHMARK_RUN.md`,
    results: `https://github.com/arjhinety/OpenGrad/tree/${TAG}/${H200_DIR}`,
    agreement: `https://github.com/arjhinety/OpenGrad/blob/${TAG}/${H200_DIR}/vllm_vs_llamacpp_agreement.json`,
    errata: `https://github.com/arjhinety/OpenGrad/blob/${TAG}/reports/ERRATA.md`,
    study: "https://opengrad.arjhinety.com/studies/001#quantization",
  }, null, 2)};`,
  `export const ggufBf16Conditions = ${JSON.stringify(conditions, null, 2)};`,
  `export type ServingRow = {\n  shape: string;\n  concurrency: number;\n  requestsPerSecond: number;\n  outputTps: number;\n  totalTps: number;\n  promptTokens: number;\n  outputTokens: number;\n};`,
  `export const ggufBf16Sweep: ServingRow[] = ${JSON.stringify(sweep, null, 2)};`,
  `export const ggufBf16Mixed: ServingRow[] = ${JSON.stringify(mixed, null, 2)};`,
  `export const ggufBf16Decisions = ${JSON.stringify(decisions, null, 2)};`,
  `export const ggufBf16QuantFlips = ${JSON.stringify(quantFlips, null, 2)};`,
  `export const ggufBf16Rerun = ${JSON.stringify(rerun, null, 2)};`,
].join("\n\n");

writeFileSync(resolve("lib/gguf-bf16.ts"), `${header}\n${body}\n`);
console.log(
  `wrote lib/gguf-bf16.ts: llama.cpp ${llamacpp.tg} tg/s on ${llamacpp.gpu}, ` +
    `vLLM ${mixed.length} mixed points on ${vllm.gpu}, ${quantFlips.length} rungs`,
);
