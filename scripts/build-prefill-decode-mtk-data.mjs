#!/usr/bin/env node
// Generates lib/prefill-decode-mtk-data.ts from OpenWeights' raw MediaTek results
// (tools/mediatek/results/2026-11-16-mt6989/s*/results-*.jsonl), so the MediaTek prefill/decode
// page never retypes a number.
//
//   OPENWEIGHTS=../../mobile-inference node scripts/build-prefill-decode-mtk-data.mjs [ref|worktree]
//
// Each model's nine cells ran on one Galaxy Tab S10+ unit in one Device Streaming session, after a
// throwaway warm-up, each cell behind a cooling gate (AP and SKIN at or under 55 C, every CPU
// ceiling at its top, thermal status 0, at most 120 s). This tablet passed the gate before almost
// every cell, so unlike the Snapdragon page no cell is set aside for starting cool: all compared.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OPENWEIGHTS = resolve(process.env.OPENWEIGHTS ?? "../../mobile-inference");
const REF = process.argv[2] ?? "worktree";
const DIR = "tools/mediatek/results/2026-11-16-mt6989";
const WORKTREE = REF === "worktree";
const commit = WORKTREE ? "worktree" : execFileSync("git", ["-C", OPENWEIGHTS, "rev-parse", REF], { encoding: "utf8" }).trim();

// A JSONL file under a results folder of the OpenWeights tree (the MediaTek one unless given).
const readIn = (dir) => (path) =>
  (WORKTREE
    ? readFileSync(resolve(OPENWEIGHTS, dir, path), "utf8")
    : execFileSync("git", ["-C", OPENWEIGHTS, "show", `${commit}:${dir}/${path}`], { encoding: "utf8", maxBuffer: 1 << 30 })
  )
    .split("\n")
    .filter((l) => l.startsWith("{"))
    .map((l) => JSON.parse(l));
const read = readIn(DIR);
// The Galaxy S24 Ultra (Snapdragon 8 Gen 3) run, for the same-generation comparison.
const SD_DIR = "tools/snapdragon/results/2026-11-16-s24";

// One entry per model: the files that hold its cells (one session, one unit), and the NPU export it
// used. Units are the first 8 characters of sha256(ro.serialno). From Qwen3 1.7B up the NPU export and
// a llama.cpp copy of the model do not fit in the tablet's memory together (NOTES.md, session 8), so
// those models ran only the five pairings without a handoff (fits: 5); the other four are null.
const models = [
  { file: "Llama-3.2-1B-Instruct-Q4_0", name: "Llama 3.2 1B", quant: "Q4_0", npu: "A16W8", files: ["s4/results-s4.jsonl"], unit: "4bff7833", session: "4" },
  { file: "Qwen3-0.6B-Q4_0", name: "Qwen3 0.6B", quant: "Q4_0", npu: "A16W8", files: ["s5/results-s5.jsonl", "s5/results-s5b.jsonl"], unit: "d6761b43", session: "5" },
  { file: "google_gemma-3-1b-it-Q4_0", name: "Gemma 3 1B", quant: "Q4_0", npu: "A16W8", files: ["s6/results-s6.jsonl"], unit: "317808dd", session: "6" },
  { file: "LFM2.5-1.2B-Instruct-QAD-Q4_0", name: "LFM2.5 1.2B", quant: "Q4_0, hybrid", npu: "A16W8", files: ["s7/results-s7.jsonl"], unit: "d6761b43", session: "7" },
  { file: "Qwen3-1.7B-Q4_0", name: "Qwen3 1.7B", quant: "Q4_0", npu: "A16W4", files: ["s8/results-s8.jsonl"], unit: "c8340578", session: "8", fits: 5 },
  { file: "Qwen3-1.7B-Q8_0", name: "Qwen3 1.7B", quant: "Q8_0", npu: "A16W4", files: ["s8/results-s8.jsonl"], unit: "c8340578", session: "8", fits: 5 },
  // Nine pairings over every turn would not finish in one 3-hour session, so this model read two
  // conversations of each dataset (phone/conversations-6.jsonl, the first two of each in file order).
  { file: "LFM2.5-2.6B-QAD-Q4_0", name: "LFM2.5 2.6B", quant: "Q4_0, hybrid", npu: "A16W4", files: ["s9/results-s9.jsonl"], unit: "e880d908", session: "9", convs: 6 },
  { file: "Llama-3.2-3B-Instruct-Q4_0", name: "Llama 3.2 3B", quant: "Q4_0", npu: "A16W4", files: ["s11/results-s11.jsonl"], unit: "4e2d9065", session: "11", fits: 5 },
  // Its NPU export did not load at all (fits: 4): only the llama.cpp pairings.
  { file: "Qwen3-4B-Q4_0", name: "Qwen3 4B", quant: "Q4_0", npu: "A16W4", files: ["s10/results-s10.jsonl"], unit: "4bff7833", session: "10", fits: 4 },
];
const P = ["cpu", "gpu", "npu"];
const HANDOFF = new Set(["cpu:npu", "npu:cpu", "gpu:npu", "npu:gpu"]);
const STALL_MS = 500;
const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
// Rates keep six decimals: the page rounds them once for display, and a rate stored at two decimals was
// rounded twice (29.154 tok/s stored as 29.15 showed as 29.1).
const RATE_DP = 6;
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const base = (m) =>
  m
    .split("/")
    .pop()
    .replace(/\.gguf$/, "");

// The Snapdragon's NPU prefill against its CPU prefill on the same turns this tablet ran, from the
// Snapdragon page's own run for the model (its data module names it) and that run's raw rows, pooled
// over the cells the Snapdragon page compares (not its cool starts). The tablet reads only the turns
// that fit the NPU's 2,048-token window, and prefill rates change with prompt length, so the two
// chips' ratios are only comparable on matched turns (Codex review, round four).
const pd = readFileSync(resolve(import.meta.dirname, "../lib/prefill-decode-data.ts"), "utf8");
const pdStart = pd.indexOf("= [", pd.indexOf("export const pdModels")) + 2;
const pdModels = JSON.parse(pd.slice(pdStart, pd.indexOf("];", pdStart) + 1));
const snapdragonRatio = (m, common) => {
  const twin = pdModels.find((s) => s.name === m.name && s.quant === m.quant);
  if (!twin) return null;
  let rows;
  try {
    rows = readFileSync(resolve(OPENWEIGHTS, `tools/snapdragon/results/2026-10-24-sm8850/results-${twin.run}.jsonl`), "utf8")
      .split("\n")
      .filter((l) => l.startsWith("{"))
      .map((l) => JSON.parse(l));
  } catch {
    return null;
  }
  const ok = (r) => {
    if (r.kind !== "turn" || r.error || r.label !== twin.run || base(r.model) !== m.file || !common.has(`${r.conv}#${r.turn}`)) return false;
    const c = twin.cells[P.indexOf(r.prefill)][P.indexOf(r.decode)];
    return c && !c.coolStart && c.run === twin.run;
  };
  const rate = (p) => {
    const rs = rows.filter((r) => ok(r) && r.prefill === p);
    return rs.length ? sum(rs.map((r) => r.new_tokens)) / sum(rs.map((r) => r.prompt_ms)) : null;
  };
  const npu = rate("npu");
  const cpu = rate("cpu");
  const turnsMatched = new Set(rows.filter(ok).map((r) => `${r.conv}#${r.turn}`)).size;
  return npu && cpu ? { run: twin.run, npuOverCpu: round(npu / cpu, 2), turns: turnsMatched } : null;
};

// The S24's rows come from the same build so they meet the same checks: all nine pairings in one
// llama.cpp process (CPU, OpenCL, Hexagon), the tablet's turns and seeded orders.
const sdModels = [
  { file: "Qwen3-0.6B-Q4_0", name: "Qwen3 0.6B", quant: "Q4_0", npu: "Hexagon v75", files: ["s24a/results-s24a.jsonl"], dir: SD_DIR, unit: "ccc0f521", session: "s24a" },
  // Llama 3.2 1B and Gemma 3 1B ran in a second session (unit a64940db) after the first one's driver
  // cancelled on an adb gap; the first session's three Llama pairings (s24a) are left out, so each
  // model's cells stay on one unit.
  {
    file: "Llama-3.2-1B-Instruct-Q4_0",
    name: "Llama 3.2 1B",
    quant: "Q4_0",
    npu: "Hexagon v75",
    files: ["s24b/results-s24b.jsonl"],
    dir: SD_DIR,
    unit: "a64940db",
    session: "s24b",
  },
  {
    file: "google_gemma-3-1b-it-Q4_0",
    name: "Gemma 3 1B",
    quant: "Q4_0",
    npu: "Hexagon v75",
    files: ["s24b/results-s24b.jsonl"],
    dir: SD_DIR,
    unit: "a64940db",
    session: "s24b",
    convs: 6,
  },
  // The other six models, one fresh unit each, six sessions at once on a second account's project
  // (voltaic-psyche-514908-s2), 2026-11-16 from 11:39 UTC. Llama 3.2 3B and Qwen3 4B read one conversation
  // per dataset (conversations-3.jsonl): the warm-up, a full CPU-only pass, took 16 to 20 minutes of the
  // 3-hour session on these two, leaving too little for the six-conversation subset.
  ...[
    ["s24c", "LFM2.5-1.2B-Instruct-QAD-Q4_0", "LFM2.5 1.2B", "Q4_0, hybrid", "a64940db", 9],
    ["s24d", "Qwen3-1.7B-Q4_0", "Qwen3 1.7B", "Q4_0", "51282bf2", 9],
    ["s24e", "Qwen3-1.7B-Q8_0", "Qwen3 1.7B", "Q8_0", "7105a059", 9],
    ["s24f", "LFM2.5-2.6B-QAD-Q4_0", "LFM2.5 2.6B", "Q4_0, hybrid", "9bec6dcd", 6],
    ["s24g", "Llama-3.2-3B-Instruct-Q4_0", "Llama 3.2 3B", "Q4_0", "1d54d50f", 3],
    // s24h (unit b1dd1f26) ran only CPU only: its memory guard refused the GPU's and the NPU's copies
    // beside the CPU's. s24i reran Qwen3 4B in processes of two copies each, margin 768 MB.
    ["s24i", "Qwen3-4B-Q4_0", "Qwen3 4B", "Q4_0", "f36d3562", 3],
  ].map(([session, file, name, quant, unit, convs]) => ({
    file,
    name,
    quant,
    npu: "Hexagon v75",
    files: [`${session}/results-${session}.jsonl`],
    dir: SD_DIR,
    unit,
    session,
    convs,
  })),
];

// Whether a logger sample (epoch seconds) fell inside one of the given turns' timed spans.
const duringTurns = (t, rows) => rows.some((r) => t >= r.wall_ms / 1000 && t <= (r.wall_ms + r.turn_ms) / 1000);
// Each built model's work per turn ("pos/new tokens/decode steps"), for the check across devices.
const workOf = new WeakMap();

const build = (list) => {
  const out = [];
  for (const m of list) {
    let files;
    try {
      files = m.files.map(readIn(m.dir ?? DIR));
    } catch {
      continue; // not run yet
    }
    const mine = (r) => r.model && base(r.model) === m.file && !String(r.label).endsWith("warm");
    const rows = files.flatMap((f) => f.filter(mine));
    // A failed turn withholds the model: dropping it would publish less work than was run (Codex fairness
    // review, round one). A pairing whose model did not load writes no turns; it is rerun elsewhere.
    const failed = rows.filter((r) => (r.kind === "turn" && r.error) || r.kind === "turn_error");
    if (failed.length) {
      console.warn(`${m.file}: ${failed.length} failed turns, withheld`);
      continue;
    }
    const turns = rows.filter((r) => r.kind === "turn" && !r.error);
    const cellOf = (r) => `${r.prefill}:${r.decode}`;
    // A cell counts only once the process that ran it finished: a done row for the same model and label
    // after the cell's start row, in the same file. One turn used to be enough, so a session still
    // running reached the page (Codex review, round four).
    const finished = new Set();
    for (const f of files)
      f.forEach((r, i) => {
        if (mine(r) && r.kind === "cell" && r.when === "start" && f.slice(i + 1).some((x) => mine(x) && x.kind === "done" && x.label === r.label)) finished.add(cellOf(r));
      });
    // A restricted build keeps only the given pairings (the S24's rows on the pairings the tablet ran).
    const present = P.flatMap((p) => P.map((d) => `${p}:${d}`)).filter((c) => turns.some((r) => cellOf(r) === c) && (!m.onlyCells || m.onlyCells.has(c)));
    if (present.some((c) => !finished.has(c))) continue; // still running
    // One row per cell and turn, and every cell doing the same work on each turn, or the model is wrong.
    const seen = new Set();
    for (const r of turns) {
      const k = `${cellOf(r)}#${r.conv}#${r.turn}`;
      if (seen.has(k)) throw new Error(`${m.file}: duplicate turn ${k}`);
      seen.add(k);
    }
    const fits = m.fits ?? 9;
    // 9: every pairing; 5: no handoff between the NPU and llama.cpp; 4: no NPU at all.
    if (present.length !== fits || (fits < 9 && present.some((c) => HANDOFF.has(c))) || (fits === 4 && present.includes("npu:npu"))) continue;
    // The turns every cell completed: the comparison set.
    const key = (r) => `${r.conv}#${r.turn}`;
    let common = null;
    for (const c of present) {
      const ks = new Set(turns.filter((r) => cellOf(r) === c).map(key));
      common = common ? new Set([...common].filter((k) => ks.has(k))) : ks;
    }
    // Every pairing must have read the same turns, or one of them stopped short.
    const union = new Set(turns.filter((r) => present.includes(cellOf(r))).map(key));
    if (union.size !== common.size) throw new Error(`${m.file}: pairings read different turns (${union.size} in any, ${common.size} in all)`);
    // A restricted build keeps only the given turns (the tablet's rows on a subset the S24 read).
    if (m.only) common = new Set([...common].filter((k) => m.only.has(k)));
    if (!common.size) continue;
    const work = new Map();
    for (const k of common) {
      const w = new Set(turns.filter((r) => key(r) === k && present.includes(cellOf(r))).map((r) => `${r.pos}/${r.new_tokens}/${r.decode_steps}`));
      if (w.size !== 1) throw new Error(`${m.file} ${k}: cells did different work ${[...w]}`);
      work.set(k, [...w][0]);
    }
    const gates = Object.fromEntries(rows.filter((r) => r.kind === "cooled").map((r) => [cellOf(r), r]));
    const loads = rows.filter((r) => r.kind === "load");
    const order = [...new Set(turns.map(cellOf))];
    const cells = P.map((p) =>
      P.map((d) => {
        if (!present.includes(`${p}:${d}`)) return null;
        const rs = turns.filter((r) => r.prefill === p && r.decode === d && common.has(key(r)));
        const g = gates[`${p}:${d}`];
        return {
          seconds: round(sum(rs.map((r) => r.turn_ms)) / 1000, 3),
          prefillTokS: round((sum(rs.map((r) => r.new_tokens)) / sum(rs.map((r) => r.prompt_ms))) * 1000, RATE_DP),
          decodeTokS: round((sum(rs.map((r) => r.decode_steps)) / sum(rs.map((r) => r.decode_ms))) * 1000, RATE_DP),
          handoffSeconds: round(sum(rs.map((r) => r.xfer_get_ms + r.xfer_set_ms)) / 1000, 3),
          decodeShare: round(sum(rs.map((r) => r.decode_ms)) / sum(rs.map((r) => r.turn_ms)), 5),
          stalls: d === "cpu" ? sum(rs.map((r) => r.step_ms.filter((s) => s > STALL_MS).length)) : 0,
          longestStepS: round(Math.max(0, ...rs.flatMap((r) => r.step_ms)) / 1000, 3),
          medianStepMs: round(median(rs.flatMap((r) => r.step_ms)), 1),
          // Turns whose reply held an end-of-generation token (the bench decodes the dataset's length
          // regardless, so a chat would have stopped there), and those where it was the first token.
          eogTurns: rs.filter((r) => r.eog_at >= 0).length,
          eogFirst: rs.filter((r) => r.eog_at === 0).length,
          startApC: round(median(rs.map((r) => r.before_ap_c)), 1),
          cappedTurns: rs.filter((r) => r.before_cpu_capped).length,
          hotTurns: rs.filter((r) => (r.before_status ?? 0) >= 3).length,
          gate: g?.gate ?? "?",
          gateWaitS: g?.waited_s ?? null,
          order: order.indexOf(`${p}:${d}`) + 1,
        };
      }),
    );
    const pooled = (phase) =>
      P.map((x) => {
        // Only the included pairings: a restricted build (the S24 on the tablet's pairings) must not pool
        // the turns of pairings it left out.
        const rs = turns.filter((r) => r[phase] === x && common.has(key(r)) && present.includes(cellOf(r)));
        if (!rs.length) return null;
        return phase === "prefill"
          ? { tokS: round((sum(rs.map((r) => r.new_tokens)) / sum(rs.map((r) => r.prompt_ms))) * 1000, 2), firstTokenMs: round(median(rs.map((r) => r.prefill_ms)), 1) }
          : { tokS: round((sum(rs.map((r) => r.decode_steps)) / sum(rs.map((r) => r.decode_ms))) * 1000, 3) };
      });
    const npuLoad = present.some((c) => c.includes("npu")) ? loads.filter((r) => r.proc === "npu" && !r.error) : [];
    // Heat while this model ran, from its own device's logger (mtklog on the tablet, sdlog on the S24,
    // the same columns named in a header line), limited to this model's compared turns so both devices
    // are read over the same work. Each CPU policy's top comes from the turn rows ("policy:limit/top").
    const heat = (() => {
      const folder = m.files[0].split("/")[0];
      const text = [`${folder}/mtklog-${folder}.txt`, `${folder}/sdlog-${folder}.txt`]
        .map((f) => {
          try {
            return WORKTREE
              ? readFileSync(resolve(OPENWEIGHTS, m.dir ?? DIR, f), "utf8")
              : execFileSync("git", ["-C", OPENWEIGHTS, "show", `${commit}:${m.dir ?? DIR}/${f}`], { encoding: "utf8", maxBuffer: 1 << 30 });
          } catch {
            return null;
          }
        })
        .find(Boolean);
      if (!text) return null;
      const ls = text.split("\n");
      const head = (ls.find((l) => l.startsWith("epoch")) ?? "").split("|")[0].trim().split(/\s+/);
      const pols = head.flatMap((h, i) => {
        const mm = /^p(\d+)_max$/.exec(h);
        return mm ? [{ p: mm[1], i }] : [];
      });
      const mt = turns.filter((r) => common.has(key(r)) && present.includes(cellOf(r)));
      const tops = Object.fromEntries(
        String(mt[0].before_cpu_max_mhz)
          .split(",")
          .map((x) => [x.split(":")[0], Number(x.split(":")[1].split("/")[1]) * 1000]),
      );
      // Only samples taken while a compared turn was timed: cooling waits, loads and the turns left out of
      // a subset fall outside (Codex fairness review, round one).
      const rowsIn = ls.filter((l) => /^\d/.test(l) && duringTurns(Number(l.split(" ")[0]), mt));
      const f = rowsIn.map((l) => l.split("|")[0].trim().split(/\s+/));
      const hal = rowsIn.filter((l) => l.includes("|")).map((l) => l.split("|")[1].trim().split(/\s+/));
      if (!f.length || !pols.length) return null;
      const atTop = f.filter((x) => pols.every(({ p, i }) => Number(x[i]) >= (tops[p] ?? Infinity) - 1000)).length;
      const steps = mt.filter((r) => r.decode === "cpu").flatMap((r) => r.step_ms);
      const aps = hal.map((h) => Number(h[1])).filter((x) => !Number.isNaN(x));
      return {
        samples: f.length,
        // Two decimals, so a page that rounds to whole percent rounds once (Codex fairness review, round three).
        topShare: round((100 * atTop) / f.length, 2),
        lowestGhz: pols.map(({ i }) => round(Math.min(...f.map((x) => Number(x[i]))) / 1e6, 2)),
        criticalShare: round((100 * hal.filter((h) => Number(h[0]) >= 4).length) / Math.max(1, hal.length), 2),
        maxApC: aps.length ? Math.max(...aps) : null,
        allOnline: f.every((x) => x[1] === "0-7"),
        cpuSteps: steps.length,
        slowSteps: steps.filter((x) => x > STALL_MS).length,
        longestStepMs: steps.length ? Math.round(Math.max(...steps)) : null,
        policies: pols.map(({ p }) => p),
        topGhz: pols.map(({ p }) => round((tops[p] ?? NaN) / 1e6, 2)),
        statusCounts: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((k) => [k, hal.filter((h) => Number(h[0]) === k).length]).filter(([, n]) => n)),
        maxSkinC: (() => {
          const xs = hal.map((h) => Number(h[2])).filter((x) => !Number.isNaN(x));
          return xs.length ? Math.max(...xs) : null;
        })(),
        // Minutes of timed turns the samples cover, summed over every turn.
        timedMinutes: round(sum(mt.map((r) => r.turn_ms)) / 60000, 0),
      };
    })();
    out.push({
      name: m.name,
      quant: m.quant,
      npuExport: m.npu,
      unit: m.unit,
      session: m.session,
      fits,
      convs: m.convs ?? 9,
      turns: common.size,
      newTokens: sum(turns.filter((r) => cellOf(r) === "cpu:cpu" && common.has(key(r))).map((r) => r.new_tokens)),
      replyTokens: sum(turns.filter((r) => cellOf(r) === "cpu:cpu" && common.has(key(r))).map((r) => r.decode_steps + 1)),
      cpuStepMs: round(median(turns.filter((r) => r.decode === "cpu" && common.has(key(r)) && present.includes(cellOf(r))).flatMap((r) => r.step_ms)), 1),
      npuMemoryMb: npuLoad.length ? Math.round(median(npuLoad.map((r) => r.avail_before_mb - r.avail_after_mb))) : null,
      cells,
      prefill: pooled("prefill"),
      decode: pooled("decode"),
      snapdragon: snapdragonRatio(m, common),
      // How often the first reply token after an NPU prefill was the CPU's (cpu:cpu's) on the same turn.
      npuFirstToken: (() => {
        const cpu = new Map(turns.filter((r) => cellOf(r) === "cpu:cpu" && common.has(key(r))).map((r) => [key(r), r.tokens[0]]));
        const npu = turns.filter((r) => r.prefill === "npu" && common.has(key(r)) && cpu.has(key(r)) && present.includes(cellOf(r)));
        return npu.length ? { same: npu.filter((r) => r.tokens[0] === cpu.get(key(r))).length, of: npu.length, tokens: [...new Set(npu.map((r) => r.tokens[0]))].length } : null;
      })(),
      // The turns read, as conversation#turn, so another chip's rows can be checked against them.
      turnKeys: [...common].sort(),
      // Processes that ran this model's pairings (one done row each): 1 when every pairing shared one.
      processes: rows.filter((r) => r.kind === "done").length,
      // Loads the memory guard refused (a copy that did not fit); 0 where a split was planned instead.
      refusedLoads: loads.filter((r) => String(r.error).startsWith("insufficient memory")).length,
      heat,
    });
    workOf.set(out.at(-1), work);
  }
  return out;
};
const out = build(models);
// Turn parity (2026-11-16, from 15:02 UTC): Gemma 3 1B on all 23 turns with all nine pairings, Llama 3.2
// 3B on all 24 turns and Qwen3 4B on all 23 with only the pairings the tablet ran, each on a fresh unit.
// A finished parity run replaces the subset run in the comparison; the subset run is kept, published as
// an extra row on its own unit (sdExtra), never mixed into a comparison.
const sdParity = [
  ["s24j", "google_gemma-3-1b-it-Q4_0", "Gemma 3 1B", "Q4_0", "4eb65273", 9],
  ["s24k", "Llama-3.2-3B-Instruct-Q4_0", "Llama 3.2 3B", "Q4_0", "dede0011", 5],
  ["s24l", "Qwen3-4B-Q4_0", "Qwen3 4B", "Q4_0", "ccc0f521", 4],
].map(([session, file, name, quant, unit, fits]) => ({ file, name, quant, npu: "Hexagon v75", files: [`${session}/results-${session}.jsonl`], dir: SD_DIR, unit, session, fits }));
const sdOut = build(sdModels);
const sdExtra = [];
for (const p of build(sdParity)) {
  const i = sdOut.findIndex((m) => m.name === p.name && m.quant === p.quant);
  if (i >= 0) {
    sdExtra.push(sdOut[i]);
    sdOut[i] = p;
  } else sdOut.push(p);
}
// The tablet's side of each S24 comparison, on the S24's turns. Where the S24 read every turn the
// tablet did, that is the tablet's own row; where it read a subset (Gemma 3 1B, the six-conversation
// file, so it fit the session), the tablet's rows are rebuilt on those turns alone. Turns the S24 read
// and the tablet did not would make the comparison wrong, so they stop the build.
const sdTwins = sdOut.map((s) => {
  const t = out.find((m) => m.name === s.name && m.quant === s.quant);
  if (!t) return null;
  const extra = s.turnKeys.filter((k) => !t.turnKeys.includes(k));
  if (extra.length) throw new Error(`${s.name}: the S24 read turns the tablet did not: ${extra.slice(0, 3)}`);
  // The same turn must have done the same work on both devices: position, new tokens, reply tokens.
  for (const k of s.turnKeys) {
    if (workOf.get(s).get(k) !== workOf.get(t).get(k)) throw new Error(`${s.name} ${k}: the S24 did ${workOf.get(s).get(k)}, the tablet ${workOf.get(t).get(k)}`);
  }
  if (t.turnKeys.join() === s.turnKeys.join()) return t;
  const entry = models.find((m) => m.name === s.name && m.quant === s.quant);
  return build([{ ...entry, only: new Set(s.turnKeys), convs: s.convs }])[0] ?? null;
});

// The S24's side of each comparison, on the pairings the tablet ran: the tablet could not hold an NPU
// copy and a llama.cpp copy of the larger models together (5 pairings) or load Qwen3 4B's NPU export at
// all (4), so comparing the S24's nine against those would pool different work. The S24's own row keeps
// all nine for its matrix; findings and comparisons read this one.
const sdShared = sdOut.map((s, i) => {
  const t = sdTwins[i];
  if (!t) return null;
  // Nothing to restrict where the S24 row already ran exactly the tablet's pairings (a parity run).
  if (t.fits === 9 || s.fits === t.fits) return s;
  const cells = new Set(P.flatMap((p, a) => P.flatMap((d, b) => (t.cells[a][b] ? [`${p}:${d}`] : []))));
  // The entry of the run this row came from (its session), not merely one with the same model: a parity
  // run and the subset run it replaced share a model (a rebuild from the wrong one mixed 9 turns into a
  // 24-turn comparison).
  const entry = [...sdModels, ...sdParity].find((m) => m.session === s.session && m.name === s.name && m.quant === s.quant);
  return build([{ ...entry, fits: t.fits, onlyCells: cells }])[0] ?? null;
});

// The first S24 session's Llama 3.2 1B pairings, cut short when that session was cancelled (an adb gap
// its driver read as a lost device). They are not in the comparison, because each model's cells stay on
// one unit, but they are published beside the second unit's same pairings, every turn they finished.
const sdDropped = (() => {
  let rows;
  try {
    rows = readIn(SD_DIR)("s24a/results-s24a.jsonl");
  } catch {
    return null;
  }
  const file = "Llama-3.2-1B-Instruct-Q4_0";
  const t = rows.filter((r) => r.kind === "turn" && !r.error && r.model && base(r.model) === file && !String(r.label).endsWith("warm"));
  const byCell = Object.groupBy(t, (r) => `${r.prefill}:${r.decode}`);
  const most = Math.max(0, ...Object.values(byCell).map((rs) => rs.length));
  const started = rows.filter((r) => r.kind === "cell" && r.when === "start" && r.model && base(r.model) === file).length;
  const second = sdOut.find((m) => m.name === "Llama 3.2 1B");
  const cells = Object.entries(byCell)
    .filter(([, rs]) => rs.length === most)
    .map(([c, rs]) => {
      const [p, d] = c.split(":");
      const keys = new Set(rs.map((r) => `${r.conv}#${r.turn}`));
      const other = second?.cells[P.indexOf(p)][P.indexOf(d)] ?? null;
      return {
        prefill: p.toUpperCase(),
        decode: d.toUpperCase(),
        turns: rs.length,
        seconds: round(sum(rs.map((r) => r.turn_ms)) / 1000, 3),
        prefillTokS: round((sum(rs.map((r) => r.new_tokens)) / sum(rs.map((r) => r.prompt_ms))) * 1000, RATE_DP),
        decodeTokS: round((sum(rs.map((r) => r.decode_steps)) / sum(rs.map((r) => r.decode_ms))) * 1000, RATE_DP),
        // The second unit's same pairing, only when it read exactly these turns.
        secondSeconds: other && second.turnKeys.length === keys.size && second.turnKeys.every((k) => keys.has(k)) ? other.seconds : null,
      };
    });
  return { name: "Llama 3.2 1B", quant: "Q4_0", unit: "ccc0f521", started, finished: cells.length, cells };
})();

// Heat. The probes (phone/hot.sh): one conversation's first three turns on the CPU, 6 and 2 threads,
// cool behind the gate and then straight after 8 shell busy loops and 8 dd loops; and every session's
// logger (phone/mtklog.sh: online CPUs, each CPU policy's ceiling every 2 s; Android's thermal status,
// AP and SKIN every 10 s), with every CPU decode step of that session's matrix.
const lines = (path) => {
  try {
    return (
      WORKTREE
        ? readFileSync(resolve(OPENWEIGHTS, DIR, path), "utf8")
        : execFileSync("git", ["-C", OPENWEIGHTS, "show", `${commit}:${DIR}/${path}`], { encoding: "utf8", maxBuffer: 1 << 30 })
    ).split("\n");
  } catch {
    return null;
  }
};
const TOP = [2000000, 2850000, 3400000];
// Both devices' probes go through this one loop: the tablet's two (Gemma 3 1B, after sessions 6 and 7)
// and the S24's two (Gemma 3 1B, after s24c and s24d), each read from its own folder and logger.
const linesIn = (dir, path) => {
  try {
    return (
      WORKTREE
        ? readFileSync(resolve(OPENWEIGHTS, dir, path), "utf8")
        : execFileSync("git", ["-C", OPENWEIGHTS, "show", `${commit}:${dir}/${path}`], { encoding: "utf8", maxBuffer: 1 << 30 })
    ).split("\n");
  } catch {
    return null;
  }
};
// "0-7" or "0-1,4-7": how many CPUs a cpu list names.
const cpuCount = (list) =>
  String(list)
    .split(",")
    .filter(Boolean)
    .reduce((a, part) => {
      const [x, y] = part.split("-").map(Number);
      return a + (Number.isNaN(y) ? 1 : y - x + 1);
    }, 0);
const mtkHot = [];
for (const [device, dir, session, unit] of [
  ["mtk", DIR, "s6", "317808dd"],
  ["mtk", DIR, "s7", "d6761b43"],
  ["sd", SD_DIR, "s24c", "a64940db"],
  ["sd", SD_DIR, "s24d", "51282bf2"],
  // The hard-throttle attempts: no matrix, up to 40 minutes of heating (MAXHEAT=2400) against 20.
  ["mtk", DIR, "s12", "4bff7833"],
  ["sd", SD_DIR, "s24m", "51282bf2"],
  // The longest attempts (MAXHEAT=9000, about 2.5 h), rerun after s24n and session 13 were cancelled in
  // error at 50 and 56 minutes; a probe counts only once its log says HOT_DONE.
  ["mtk", DIR, "s14", "d6761b43"],
  ["sd", SD_DIR, "s24o", "ccc0f521"],
]) {
  let rows;
  try {
    rows = readIn(dir)(`${session}/results-${session}hot.jsonl`);
  } catch {
    continue;
  }
  const probes = {};
  const turnsOf = (tag) => rows.filter((r) => r.kind === "turn" && !r.error && r.label.endsWith(`-${tag}`)).sort((x, y) => x.turn - y.turn);
  const keys = (T) => T.map((r) => `${r.conv}#${r.turn}`).join(",");
  for (const tag of ["cool6", "cool2", "hot6", "hot2"]) {
    const T = turnsOf(tag);
    // A pair is kept only when cool and hot both read the same three turns.
    const twin = turnsOf(tag.startsWith("cool") ? `hot${tag.slice(-1)}` : `cool${tag.slice(-1)}`);
    if (T.length !== 3 || keys(T) !== keys(twin)) continue;
    const steps = T.flatMap((r) => r.step_ms);
    probes[tag] = {
      status: T[0].before_status,
      apC: T[0].before_ap_c,
      ceilingsGhz: T[0].before_cpu_max_mhz.split(",").map((x) => Number(x.split(":")[1].split("/")[0]) / 1000),
      prefillTokS: round((sum(T.map((r) => r.new_tokens)) / sum(T.map((r) => r.prompt_ms))) * 1000, RATE_DP),
      decodeTokS: round((sum(T.map((r) => r.decode_steps)) / sum(T.map((r) => r.decode_ms))) * 1000, RATE_DP),
      medianStepMs: round(median(steps), 1),
      longestStepMs: Math.round(Math.max(...steps)),
      slowSteps: steps.filter((x) => x > STALL_MS).length,
    };
  }
  // The heat window: from the first heat to the last probe, read from hot.sh's own log.
  const hl = linesIn(dir, `${session}/hot-${session}hot.log`) ?? [];
  if (!hl.some((l) => l.includes("HOT_DONE"))) continue; // still running
  if (!hl.some((l) => l.includes("heat off")) || !Object.keys(probes).length) continue;
  const on = hl.filter((l) => l.includes("heat on")).map((l) => Number(l.split(" ")[0]));
  const end = hl.filter((l) => l.includes("probe hot2")).map((l) => Number(l.split(" ")[0]));
  const log = (linesIn(dir, `${session}/mtklog-${session}.txt`) ?? linesIn(dir, `${session}/sdlog-${session}.txt`) ?? []).filter((l) => /^\d/.test(l));
  // Cores the logger read online during the heat window (both loggers' second column).
  const online = log.filter((l) => on.length && Number(l.split(" ")[0]) >= on[0] && Number(l.split(" ")[0]) <= (end[0] ?? Infinity)).map((l) => cpuCount(l.split(" ")[1]));
  const hal = log
    .map((l) => [Number(l.split(" ")[0]), (l.split("|")[1] ?? "").trim().split(/\s+/)])
    .filter(([t, h]) => on.length && t >= on[0] && t <= (end[0] ?? Infinity) && h.length >= 3);
  mtkHot.push({
    device,
    // The hard-throttle attempts heated longer and followed no matrix; they are kept apart on the page.
    long: ["s12", "s24m", "s14", "s24o"].includes(session),
    unit,
    session: device === "mtk" ? session.slice(1) : session,
    minOnline: online.length ? Math.min(...online) : null,
    heatMinutes: on.length ? round((Number(hl.find((l) => l.includes("heat off")).split(" ")[0]) - on[0]) / 60, 1) : null,
    // The second heating, between the 6-thread and the 2-thread heated probes.
    heat2Minutes: (() => {
      const offs = hl.filter((l) => l.includes("heat off")).map((l) => Number(l.split(" ")[0]));
      return on.length > 1 && offs.length > 1 ? round((offs[1] - on[1]) / 60, 1) : null;
    })(),
    maxStatus: Math.max(...hal.map(([, h]) => Number(h[0]))),
    maxApC: Math.max(...hal.map(([, h]) => Number(h[1]))),
    maxSkinC: Math.max(...hal.map(([, h]) => Number(h[2]))),
    probes,
  });
}
// Every session that ran a published matrix, on both devices: how its own logger saw the throttle, and
// its CPU decode steps. Each logger names its columns in a header line (the tablet has three CPU
// policies, the S24 four), and each policy's top comes from the turn rows ("policy:limit/top"), so both
// are read by the same code. Only the published models' turns count: from the first to the end of the
// last (warm-ups, the heat probes and the S24's cancelled Llama pairings fall outside), so the samples
// and the decode steps cover the same stretch (Codex review, round four).
const textIn = (dir, path) => {
  try {
    return WORKTREE
      ? readFileSync(resolve(OPENWEIGHTS, dir, path), "utf8")
      : execFileSync("git", ["-C", OPENWEIGHTS, "show", `${commit}:${dir}/${path}`], { encoding: "utf8", maxBuffer: 1 << 30 });
  } catch {
    return null;
  }
};
const mtkSessions = [];
const published = [...out.map((m) => ({ ...m, device: "mtk" })), ...sdOut.map((m) => ({ ...m, device: "sd" }))];
for (const [device, dir, list] of [
  ["mtk", DIR, models],
  ["sd", SD_DIR, [...sdModels, ...sdParity]],
]) {
  for (const folder of [...new Set(list.map((m) => m.files[0].split("/")[0]))]) {
    const entries = list.filter(
      (m) => m.files[0].startsWith(`${folder}/`) && published.some((x) => x.device === device && x.name === m.name && x.quant === m.quant && x.session === m.session),
    );
    if (!entries.length) continue;
    let mrows = [];
    for (const f of [...new Set(entries.flatMap((m) => m.files))]) {
      try {
        mrows = mrows.concat(readIn(dir)(f).filter((r) => r.kind === "turn" && !r.error && !String(r.label).endsWith("warm") && entries.some((m) => base(r.model) === m.file)));
      } catch {}
    }
    if (!mrows.length) continue;
    const t0 = Math.min(...mrows.map((r) => r.wall_ms)) / 1000;
    const t1 = Math.max(...mrows.map((r) => r.wall_ms + r.turn_ms)) / 1000;
    const text = textIn(dir, `${folder}/mtklog-${folder}.txt`) ?? textIn(dir, `${folder}/sdlog-${folder}.txt`);
    if (!text) continue;
    const ls = text.split("\n");
    const head = (ls.find((l) => l.startsWith("epoch")) ?? "").split("|")[0].trim().split(/\s+/);
    const pols = head.flatMap((h, i) => {
      const mm = /^p(\d+)_max$/.exec(h);
      return mm ? [{ p: mm[1], i }] : [];
    });
    const tops = Object.fromEntries(
      String(mrows[0].before_cpu_max_mhz)
        .split(",")
        .map((x) => [x.split(":")[0], Number(x.split(":")[1].split("/")[1]) * 1000]),
    );
    const raw = ls.filter((l) => /^\d/.test(l) && duringTurns(Number(l.split(" ")[0]), mrows));
    const log = raw.map((l) => l.split("|")[0].trim().split(/\s+/));
    if (!log.length || !pols.length) continue;
    const hal = raw.filter((l) => l.includes("|")).map((l) => l.split("|")[1].trim().split(/\s+/));
    const gaps = (ts) => median(ts.slice(1).map((t, k) => t - ts[k]));
    const steps = mrows.filter((r) => r.decode === "cpu").flatMap((r) => r.step_ms);
    mtkSessions.push({
      device,
      session: folder,
      unit: entries[0].unit,
      models: [...new Set(entries.map((m) => `${m.name} ${m.quant.split(",")[0]}`))],
      minutes: round((t1 - t0) / 60, 0),
      samples: log.length,
      everyS: round(gaps(raw.map((l) => Number(l.split(" ")[0]))), 1),
      statusEveryS: round(gaps(raw.filter((l) => l.includes("|")).map((l) => Number(l.split(" ")[0]))), 1),
      policies: pols.map(({ p }) => p),
      topGhz: pols.map(({ p }) => round((tops[p] ?? NaN) / 1e6, 2)),
      topShare: round((100 * log.filter((f) => pols.every(({ p, i }) => Number(f[i]) >= (tops[p] ?? Infinity) - 1000)).length) / log.length, 1),
      lowestGhz: pols.map(({ i }) => round(Math.min(...log.map((f) => Number(f[i]))) / 1e6, 2)),
      statusCounts: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((k) => [k, hal.filter((h) => Number(h[0]) === k).length]).filter(([, n]) => n)),
      maxApC: Math.max(...hal.map((h) => Number(h[1])).filter((x) => !Number.isNaN(x))),
      maxSkinC: Math.max(...hal.map((h) => Number(h[2])).filter((x) => !Number.isNaN(x))),
      allOnline: log.every((f) => f[1] === "0-7"),
      cpuSteps: steps.length,
      slowSteps: steps.filter((x) => x > STALL_MS).length,
      longestStepMs: steps.length ? Math.round(Math.max(...steps)) : null,
    });
  }
}

const ts = `// Generated by scripts/build-prefill-decode-mtk-data.mjs from OpenWeights at ${commit.slice(0, 12)}
// (${DIR}). Do not edit by hand: re-run the script.

export const mtkSource = { commit: "${commit}", dir: "${DIR}" };

// Rows are the processor that read the prompt, columns the one that wrote the reply, both in
// CPU, GPU, NPU order, over the turns every cell run completed. A null cell did not fit in memory
// (fits: 5, the pairings that hand over between the NPU and llama.cpp). seconds: those turns' summed time
// (prompt, first token, handoff, reply); handoffSeconds: the state copies between processors in it.
// stalls: CPU decode steps over 500 ms; longestStepS: the cell's longest decode step. startApC: the median AP temperature at each turn's start;
// cappedTurns: turns that started with a CPU ceiling lowered; hotTurns: thermal status 3 or more.
export type MtkCell = {
  seconds: number;
  prefillTokS: number;
  decodeTokS: number;
  handoffSeconds: number;
  decodeShare: number;
  stalls: number;
  longestStepS: number;
  medianStepMs: number;
  eogTurns: number;
  eogFirst: number;
  startApC: number;
  cappedTurns: number;
  hotTurns: number;
  gate: string;
  gateWaitS: number | null;
  order: number;
};

export type MtkModel = {
  name: string;
  quant: string;
  npuExport: string;
  unit: string;
  session: string;
  fits: number;
  convs: number;
  turns: number;
  newTokens: number;
  replyTokens: number;
  cpuStepMs: number;
  npuMemoryMb: number | null;
  cells: (MtkCell | null)[][];
  prefill: ({ tokS: number; firstTokenMs: number } | null)[];
  decode: ({ tokS: number } | null)[];
  // The Snapdragon's NPU prefill over its CPU prefill on this model's turns, from the run its page used.
  snapdragon: { run: string; npuOverCpu: number; turns: number } | null;
  // NPU-prefilled turns whose first reply token matched CPU only's, of how many, and how many distinct first tokens the NPU gave.
  npuFirstToken: { same: number; of: number; tokens: number } | null;
  turnKeys: string[];
  processes: number;
  refusedLoads: number;
  // Heat while the model's compared turns ran, from its device's logger: samples, the share with every CPU
  // limit at its top, each CPU group's lowest limit (GHz), the share of Android heat-status readings at
  // critical (4) or above, the hottest AP reading, all cores online, CPU decode steps and those over 500 ms.
  heat: {
    samples: number;
    topShare: number;
    lowestGhz: number[];
    criticalShare: number;
    maxApC: number | null;
    allOnline: boolean;
    cpuSteps: number;
    slowSteps: number;
    longestStepMs: number | null;
    policies: string[];
    topGhz: number[];
    statusCounts: Record<string, number>;
    maxSkinC: number | null;
    timedMinutes: number;
  } | null;
};

export const mtkModels: MtkModel[] = ${JSON.stringify(out, null, 2)};

// The same three small models on a Galaxy S24 Ultra (Snapdragon 8 Gen 3, unit ccc0f521), unrooted:
// every pairing of CPU, Adreno 750 (OpenCL) and Hexagon v75 (HTP) in one llama.cpp process, on the
// tablet's turns and in its seeded orders (tools/snapdragon/results/2026-11-16-s24).
export const sdModels: MtkModel[] = ${JSON.stringify(sdOut, null, 2)};

// S24 runs a parity run replaced in the comparison (a subset of turns, or all nine pairings on fewer
// turns), each on its own unit; shown as extra rows, never compared.
export const sdExtra: MtkModel[] = ${JSON.stringify(sdExtra, null, 2)};

// The tablet's row for each S24 model, on the S24's turns (null if the tablet has no such model).
export const sdTwins: (MtkModel | null)[] = ${JSON.stringify(sdTwins, null, 2)};

// The heat probes, unit by unit: status, AP and the CPU ceilings in GHz (cpu0-3, cpu4-6, cpu7) as each
// probe's first turn started (a snapshot: the ceilings can move during the three turns),
// rates pooled over its three turns, and decode steps over 500 ms. The heat window's hottest readings.
export type MtkProbe = { status: number; apC: number; ceilingsGhz: number[]; prefillTokS: number; decodeTokS: number; medianStepMs: number; longestStepMs: number; slowSteps: number };
export const mtkHot: { device: "mtk" | "sd"; long: boolean; unit: string; session: string; minOnline: number | null; heatMinutes: number | null; heat2Minutes: number | null; maxStatus: number; maxApC: number; maxSkinC: number; probes: Record<string, MtkProbe> }[] = ${JSON.stringify(mtkHot, null, 2)};

// Each matrix session's logger: samples, the share with every CPU ceiling at its top, the lowest
// ceilings, Android's thermal statuses (samples per status), the hottest AP reading, whether all eight
// CPUs read online in every sample, and the session's CPU decode steps and those over 500 ms.
export type MtkSession = {
  device: "mtk" | "sd";
  session: string;
  unit: string;
  models: string[];
  minutes: number;
  samples: number;
  everyS: number;
  statusEveryS: number;
  policies: string[];
  topGhz: number[];
  topShare: number;
  lowestGhz: number[];
  statusCounts: Record<string, number>;
  maxApC: number;
  maxSkinC: number;
  allOnline: boolean;
  cpuSteps: number;
  slowSteps: number;
  longestStepMs: number | null;
};
// The first S24 unit's Llama 3.2 1B pairings that finished before its session was cancelled, beside the
// second unit's same pairing on the same turns (null until the second unit's run is published).
export const sdDropped: { name: string; quant: string; unit: string; started: number; finished: number; cells: { prefill: string; decode: string; turns: number; seconds: number; prefillTokS: number; decodeTokS: number; secondSeconds: number | null }[] } | null = ${JSON.stringify(sdDropped, null, 2)};

// The S24's rows on only the pairings the tablet ran (its own row where the tablet ran all nine), one per
// sdModels entry; null where the tablet has no twin.
export const sdShared: (MtkModel | null)[] = ${JSON.stringify(sdShared, null, 2)};

export const mtkSessions: MtkSession[] = ${JSON.stringify(mtkSessions, null, 2)};
`;
writeFileSync(resolve(import.meta.dirname, "../lib/prefill-decode-mtk-data.ts"), ts);
console.log(
  `wrote lib/prefill-decode-mtk-data.ts: ${out.length} models (${out.map((m) => m.name).join(", ")}), ${mtkHot.length} heat probes, ${mtkSessions.length} sessions' logs`,
);
