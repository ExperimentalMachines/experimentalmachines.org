#!/usr/bin/env node
// Generates lib/prefill-decode-data.ts from OpenWeights' raw results (tools/snapdragon/results/
// 2026-10-24-sm8850/results-r12.jsonl to results-r15.jsonl at a given commit), so the
// /openweights/prefill-decode page never retypes a number.
//
//   OPENWEIGHTS=../../mobile-inference node scripts/build-prefill-decode-data.mjs [ref]
//
// Each model's nine cells come from the one run that holds all nine of them on one unit. A cell
// whose cooling gate passed started cooler than the rest: it is kept, marked, and left out of
// every comparison and every per-processor rate.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OPENWEIGHTS = resolve(process.env.OPENWEIGHTS ?? "../../mobile-inference");
const REF = process.argv[2] ?? "HEAD";
const DIR = "tools/snapdragon/results/2026-10-24-sm8850";
// "worktree" reads the files on disk, for a preview before they are committed; publish from a commit.
const WORKTREE = REF === "worktree";
const commit = WORKTREE ? "worktree" : execFileSync("git", ["-C", OPENWEIGHTS, "rev-parse", REF], { encoding: "utf8" }).trim();

const rows = (run) =>
  (WORKTREE
    ? readFileSync(resolve(OPENWEIGHTS, DIR, `results-${run}.jsonl`), "utf8")
    : execFileSync("git", ["-C", OPENWEIGHTS, "show", `${commit}:${DIR}/results-${run}.jsonl`], { encoding: "utf8", maxBuffer: 1 << 30 })
  )
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));

const models = [
// Each model's nine cells come from one run on one phone. Phones: A 64a112da, B c581fd31, C 783ee7e5.
  { file: "Qwen3-0.6B-Q4_0", name: "Qwen3 0.6B", quant: "Q4_0", run: "r12", unit: "64a112da", phone: "A" },
  { file: "google_gemma-3-1b-it-Q4_0", name: "Gemma 3 1B", quant: "Q4_0", run: "r12", unit: "64a112da", phone: "A" },
  { file: "Llama-3.2-1B-Instruct-Q4_0", name: "Llama 3.2 1B", quant: "Q4_0", run: "r12", unit: "64a112da", phone: "A" },
  { file: "LFM2.5-1.2B-Instruct-QAD-Q4_0", name: "LFM2.5 1.2B", quant: "Q4_0, hybrid", run: "r15", unit: "783ee7e5", phone: "C" },
  // r13's first two cells started cool; r16 ran all nine again, after a warm-up, on another unit.
  { file: "Qwen3-1.7B-Q4_0", name: "Qwen3 1.7B", quant: "Q4_0", run: "r16", unit: "783ee7e5", phone: "C" },
  { file: "Qwen3-1.7B-Q8_0", name: "Qwen3 1.7B", quant: "Q8_0", run: "r13", unit: "c581fd31", phone: "B" },
  { file: "LFM2.5-2.6B-QAD-Q4_0", name: "LFM2.5 2.6B", quant: "Q4_0, hybrid", run: "r13", unit: "c581fd31", phone: "B" },
  { file: "Llama-3.2-3B-Instruct-Q4_0", name: "Llama 3.2 3B", quant: "Q4_0", run: "r14", unit: "783ee7e5", phone: "C" },
  // r14's first cell (gpu:cpu) started cool: kept, marked and not compared, so the matrix stays one run.
  { file: "Qwen3-4B-Q4_0", name: "Qwen3 4B", quant: "Q4_0", run: "r14", unit: "783ee7e5", phone: "C" },
];
const P = ["cpu", "gpu", "npu"];
const TURNS = 33;
const STALL_MS = 500;
const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const base = (m) => m.split("/").pop().replace(/\.gguf$/, "");

const cache = {};
// Every compared CPU-decode turn in which a step went over 500 ms: its stuck stretch (first to last
// such step), whether those steps ran back to back, its place in the cell's 33 turns, its length.
const stuck = [];
const cpuReplies = [];
let warmTurns = 0;
let ceilingTurns = 0;
let gpuCapTurns = 0;
const gateC = [];
const warmMax = { cpu: 0, gpu: 0, npu: 0 };
const newTok = [Infinity, 0];
const out = models.map((m) => {
  const fromRun = (run) => (cache[run] ??= rows(run)).filter((r) => r.model && base(r.model) === m.file);
  const swapped = new Set(Object.keys(m.replace ?? {}));
  const cellOf = (r) => `${r.prefill}:${r.decode}`;
  const all = [
    ...fromRun(m.run).filter((r) => !("prefill" in r) || !swapped.has(cellOf(r))),
    ...Object.entries(m.replace ?? {}).flatMap(([c, run]) => fromRun(run).filter((r) => "prefill" in r && cellOf(r) === c)),
  ];
  const turns = all.filter((r) => "turn_ms" in r);
  const gates = Object.fromEntries(all.filter((r) => r.kind === "cooled").map((r) => [`${r.prefill}:${r.decode}`, r]));
  const order = [...new Set(turns.map((r) => `${r.prefill}:${r.decode}`))];
  const cell = (p, d) => turns.filter((r) => r.prefill === p && r.decode === d);
  const cells = P.map((p) =>
    P.map((d) => {
      const rs = cell(p, d);
      if (rs.length !== TURNS || rs.some((r) => r.error)) throw new Error(`${m.file} ${p}:${d}: ${rs.length} turns`);
      const coolStart = gates[`${p}:${d}`].gate === "passed";
      if (!coolStart) {
        const g = gates[`${p}:${d}`];
        gateC.push(Math.max(g.cpu_c, g.gpu_c, g.npu_c));
        warmTurns += rs.length;
        ceilingTurns += rs.filter((r) => r.before_cpu_max_mhz === "0:1900/3628,6:2227/4608" && r.cpu_max_mhz === "0:1900/3628,6:2227/4608").length;
        gpuCapTurns += rs.filter((r) => r.before_gpu_cap === 8 && r.gpu_cap === 8 && r.gpu_mhz === 578).length;
        for (const r of rs) for (const k of ["cpu", "gpu", "npu"]) warmMax[k] = Math.max(warmMax[k], r[`${k}_c`], r[`before_${k}_c`]);
        for (const r of rs) [newTok[0], newTok[1]] = [Math.min(newTok[0], r.new_tokens), Math.max(newTok[1], r.new_tokens)];
      }
      return {
        seconds: round(sum(rs.map((r) => r.turn_ms)) / 1000, 3),
        // The share of that time spent writing the reply.
        decodeShare: round(sum(rs.map((r) => r.decode_ms)) / sum(rs.map((r) => r.turn_ms)), 5),
        // Steps over 500 ms on a CPU-decode cell are stalls; on a GPU-decode cell they are the
        // decoder's own pace at long context, so they are not counted there.
        stalls: d === "cpu" ? sum(rs.map((r) => r.step_ms.filter((s) => s > STALL_MS).length)) : 0,
        // Their summed time: how long the reply sat frozen.
        frozenSeconds: d === "cpu" ? round(sum(rs.flatMap((r) => r.step_ms.filter((s) => s > STALL_MS))) / 1000, 3) : 0,
        // The longest single one, and how many of the 33 turns had any.
        longestStopSeconds: d === "cpu" ? round(Math.max(0, ...rs.flatMap((r) => r.step_ms.filter((s) => s > STALL_MS))) / 1000, 3) : 0,
        stopTurns: d === "cpu" ? rs.filter((r) => r.step_ms.some((s) => s > STALL_MS)).length : 0,
        coolStart,
        order: order.indexOf(`${p}:${d}`) + 1,
        // The run the cell came from, where it is not the model's.
        run: m.replace?.[`${p}:${d}`] ?? m.run,
      };
    }),
  );
  // Per processor, pooled over the cells that used it for that phase and did not start cool.
  const warm = turns.filter((r) => gates[`${r.prefill}:${r.decode}`].gate !== "passed");
  const prefill = P.map((p) => {
    const rs = warm.filter((r) => r.prefill === p);
    return {
      tokS: round((sum(rs.map((r) => r.new_tokens)) / sum(rs.map((r) => r.prompt_ms))) * 1000, 2),
      firstTokenMs: round(median(rs.map((r) => r.prefill_ms)), 1),
      cells: new Set(rs.map((r) => r.decode)).size,
    };
  });
  const decode = P.map((d) => {
    const rs = warm.filter((r) => r.decode === d);
    return { tokS: round((sum(rs.map((r) => r.decode_steps)) / sum(rs.map((r) => r.decode_ms))) * 1000, 3), cells: new Set(rs.map((r) => r.prefill)).size };
  });
  for (const r of warm.filter((x) => x.decode === "cpu")) {
    cpuReplies.push(r.decode_steps);
    const idx = r.step_ms.flatMap((v, j) => (v > STALL_MS ? [j] : []));
    if (!idx.length) continue;
    const a = idx[0], b = idx.at(-1);
    const cellTurns = turns.filter((x) => x.prefill === r.prefill && x.decode === r.decode);
    stuck.push({
      seconds: sum(r.step_ms.slice(a, b + 1)) / 1000,
      minStep: Math.min(...r.step_ms.slice(a, b + 1)) / 1000,
      maxStep: Math.max(...r.step_ms.slice(a, b + 1)) / 1000,
      steps: idx.length,
      backToBack: b - a + 1 === idx.length,
      place: cellTurns.indexOf(r) + 1,
      reply: r.decode_steps,
    });
  }
  // The median CPU decode step, for what "normal" means beside a frozen one.
  const cpuStepMs = Math.round(median(warm.filter((r) => r.decode === "cpu").flatMap((r) => r.step_ms)));
  return { name: m.name, quant: m.quant, run: m.run, unit: m.unit, phone: m.phone, replaced: m.replace ?? {}, hexagonSessions: m.file.match(/4B|3B/) ? 2 : 1, cells, prefill, decode, cpuStepMs };
});

const multi = stuck.filter((x) => x.steps > 1);
const pdStuck = {
  turns: stuck.length,
  backToBack: stuck.filter((x) => x.backToBack).length,
  stretchSeconds: [round(Math.min(...multi.map((x) => x.seconds)), 1), round(Math.max(...multi.map((x) => x.seconds)), 1)],
  tokensInStretch: [Math.min(...multi.map((x) => x.steps)), Math.max(...multi.map((x) => x.steps))],
  secondsPerToken: [round(Math.min(...multi.map((x) => x.seconds / x.steps)), 1), round(Math.max(...multi.map((x) => x.seconds / x.steps)), 1)],
  tokenSeconds: [round(Math.min(...multi.map((x) => x.minStep)), 1), round(Math.max(...multi.map((x) => x.maxStep)), 1)],
  single: stuck.filter((x) => x.steps === 1).map((x) => round(x.seconds, 1)).sort((a, b) => a - b),
  place: [Math.min(...stuck.map((x) => x.place)), Math.max(...stuck.map((x) => x.place))],
  replyMedian: median(stuck.map((x) => x.reply)),
  allRepliesMedian: median(cpuReplies),
};
const qwenTurns = cache.r12.filter((r) => "turn_ms" in r && base(r.model) === "Qwen3-0.6B-Q4_0" && r.prefill === "cpu" && r.decode === "cpu");
const replyTokens = (() => {
  const steps = qwenTurns.map((r) => r.decode_steps);
  return { median: median(steps), max: Math.max(...steps) };
})();
const newTokens = newTok;

const ts = `// Generated by scripts/build-prefill-decode-data.mjs from OpenWeights at ${commit.slice(0, 12)}
// (${DIR}/results-r12.jsonl to results-r16.jsonl). Do not edit by hand: re-run the script.

export const pdSource = { commit: "${commit}", dir: "${DIR}" };

// Rows are the processor that read the prompt, columns the one that wrote the reply, both in
// CPU, GPU, NPU order. seconds: the 33 turns' summed time (prompt, first token, handoff, reply);
// decodeShare: the part of it spent writing the reply. stalls: CPU decode steps over 500 ms (the
// reply stopped that long before its next token); frozenSeconds their summed time,
// longestStopSeconds the longest, stopTurns how many turns had one. coolStart: the cooling gate before the cell passed, so it
// started cooler than the rest and is not compared. order: its place in the model's run.
export type PdCell = {
  seconds: number;
  decodeShare: number;
  stalls: number;
  frozenSeconds: number;
  longestStopSeconds: number;
  stopTurns: number;
  coolStart: boolean;
  order: number;
  run: string;
};

// prefill: tokens per second reading the prompt and the median time to the first token, per
// processor; decode: tokens per second writing the reply. Both pooled over the cells that used
// that processor for that phase, cool starts left out; cells: how many that is (3 unless one was
// left out). Values keep their precision; the page rounds for display. cpuStepMs: the median CPU
// decode step.
export type PdModel = {
  name: string;
  quant: string;
  run: string;
  unit: string;
  phone: string;
  // Cells taken from a later run on the same unit, by "prefill:decode".
  replaced: Record<string, string>;
  hexagonSessions: number;
  cells: PdCell[][];
  prefill: { tokS: number; firstTokenMs: number; cells: number }[];
  decode: { tokS: number; cells: number }[];
  cpuStepMs: number;
};

export const pdModels: PdModel[] = ${JSON.stringify(out, null, 2)};

// Over every turn of every compared cell: how many, and how many read the CPU ceilings at 1.90
// and 2.23 GHz and the GPU capped at 578 MHz at both the turn's start and its end; the hottest CPU, GPU
// or NPU zone when each compared cell's gate gave up, lowest and highest; and each processor's hottest
// zone read at any compared turn's start or end, in degrees C.
export const pdWarm = { turns: ${warmTurns}, cpuCeilingTurns: ${ceilingTurns}, gpuCapTurns: ${gpuCapTurns}, gateC: [${Math.min(...gateC)}, ${Math.max(...gateC)}], maxC: ${JSON.stringify(warmMax)} };

export const pdTurns = ${TURNS};

// The dataset replies' lengths in Qwen3 tokens (Qwen3 0.6B's timed decode steps). Each model decodes
// its own tokenizer's count of the reply plus one for the end of turn; the first of those comes from
// the prefill.
export const pdReplyTokens = ${JSON.stringify(replyTokens)};

// Compared CPU-decode turns that got stuck (a step over 500 ms): how many; how many had all such steps
// back to back; the stuck stretch in seconds, the tokens written in it, the stretch's average seconds
// per token (lowest and highest) and its single tokens' seconds (fastest and slowest), where it held
// more than one;
// the turns with a single slow token, in seconds; the turn's place in its cell (1 to 33); and the
// median reply length of the stuck turns against all compared CPU-decode turns.
export const pdStuck = ${JSON.stringify(pdStuck)};

// New tokens prefilled per turn, fewest and most, across every compared turn of every model (each in
// its own tokenizer): earlier turns are already cached.
export const pdNewTokens = ${JSON.stringify(newTokens)};
`;
writeFileSync(resolve(import.meta.dirname, "../lib/prefill-decode-data.ts"), ts);
console.log(`lib/prefill-decode-data.ts from ${commit.slice(0, 12)}: ${out.length} models, ${warmTurns} compared turns`);
