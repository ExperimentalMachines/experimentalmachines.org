// Generates lib/decode-stall-data.ts from OpenWeights' raw results (tools/snapdragon/results/
// 2026-10-24-sm8850 at a given commit), so the /research/decode-stall charts never retype a number.
//
//   OPENWEIGHTS=../../mobile-inference node scripts/build-decode-stall-data.mjs [ref]
//
// Three series, each from the logs the report's own figures came from:
//  - A pause that stays (r38-1 with the guard, r38-2 without): tokens written since both pause switches
//    were set, against seconds from that moment, from each run's progress lines in logcat-r38.txt.
//  - A 30 s pause (r39-1 with the guard, r34-9 without): tokens a second in 2 s bins around the pause,
//    from logcat-r39.txt and logcat-r34.txt, with the guard's own fallback and return lines.
//  - Three chat sessions on phone D (r33-A, r33-B, r39-S): the XO thermistor each 30 s from the
//    session's start, from the 1 s logger trig-r31.txt; and r46's three on phone A, back to back.
//  - The hard throttle forced by heat on phone A (r47, r48): tokens written each second from the trip.
// A run is found by its chain log's start line and the one START line its process logged after it.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OPENWEIGHTS = resolve(process.env.OPENWEIGHTS ?? "../../mobile-inference");
const REF = process.argv[2] ?? "HEAD";
const DIR = "tools/snapdragon/results/2026-10-24-sm8850";
const WORKTREE = REF === "worktree";
const commit = WORKTREE ? "worktree" : execFileSync("git", ["-C", OPENWEIGHTS, "rev-parse", REF], { encoding: "utf8" }).trim();
const file = (name, dir = DIR) =>
  WORKTREE
    ? readFileSync(resolve(OPENWEIGHTS, dir, name), "utf8")
    : execFileSync("git", ["-C", OPENWEIGHTS, "show", `${commit}:${dir}/${name}`], { encoding: "utf8", maxBuffer: 1 << 30 });

const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;

// "epoch pid tid L Tag: message", as the chains' logcat -v epoch wrote it.
const logcat = (name, dir = DIR) =>
  file(name, dir)
    .split("\n")
    .map((l) => l.match(/^\s*(\d+\.\d+)\s+(\d+)\s+\d+\s+\w\s+(\S+?)\s*:\s(.*)$/))
    .filter(Boolean)
    .map((m) => ({ t: Number(m[1]), pid: m[2], tag: m[3], msg: m[4] }));
const fields = (msg) => Object.fromEntries([...msg.matchAll(/(\w+)=([^\s,]+)/g)].map((m) => [m[1], m[2]]));
const chainTime = (chain, pattern) => {
  const line = file(chain)
    .split("\n")
    .find((l) => pattern.test(l));
  if (!line) throw new Error(`${chain}: no line matching ${pattern}`);
  return Number(line.split(" ")[0]);
};

// One run: its process, decode progress as [seconds from the pause, tokens], and its guard lines.
function run(chain, cat, label) {
  const started = chainTime(chain, new RegExp(`^\\d+ run ${label} `));
  const ended = chainTime(chain, new RegExp(`^\\d+ run ${label} end`));
  const pauseOn = chainTime(chain, new RegExp(`^\\d+ ${label} pause on`));
  const lines = logcat(cat).filter((x) => x.t >= started - 1 && x.t <= ended + 2);
  const starts = lines.filter((x) => x.tag === "OpenWeightsBench" && x.msg.startsWith("START"));
  if (starts.length !== 1) throw new Error(`${label}: ${starts.length} START lines`);
  const pid = starts[0].pid;
  const progress = lines
    .filter((x) => x.pid === pid && x.msg.startsWith("PROGRESS"))
    .map((x) => ({ t: x.t - pauseOn, f: fields(x.msg) }))
    .filter((x) => x.f.reading === "false")
    .map((x) => [x.t, Number(x.f.generated)]);
  const guard = lines
    .filter((x) => x.pid === pid && x.tag === "OpenWeights" && x.msg.includes("decode steps"))
    .map((x) => ({ at: round(x.t - pauseOn, 1), event: x.msg.includes("stalled") ? "fell back" : "back" }));
  return { label, progress, guard, decodeFrom: round(progress[0][0], 1), endsAt: round(ended - pauseOn, 1) };
}

// Tokens written since the pause began, at each whole step of `every` seconds from the pause to the run's last
// progress line: the count at each step less the count when both switches were set.
const sincePause = (r, every) => {
  const count = (t) => {
    const seen = r.progress.filter(([x]) => x <= t);
    return seen.length ? seen.at(-1)[1] : 0;
  };
  const base = count(0);
  const out = [];
  const last = r.progress.at(-1)[0];
  for (let t = 0; t <= last; t += every) out.push([t, count(t) - base]);
  return out;
};

// Tokens a second in bins of `width` seconds, from tokens written at each bin's edges.
const rate = (r, from, to, width) => {
  const at = (t) => {
    const seen = r.progress.filter(([x]) => x <= t);
    return seen.length ? seen.at(-1)[1] : 0;
  };
  const out = [];
  for (let t = from; t + width <= to; t += width) out.push([t + width / 2, round((at(t + width) - at(t)) / width, 2)]);
  return out;
};

const held = { with: run("chain38.log", "logcat-r38.txt", "r38-1-M4-G"), without: run("chain38.log", "logcat-r38.txt", "r38-2-M4-0") };
const short = { with: run("chain39.log", "logcat-r39.txt", "r39-1-W4-G"), without: run("chain34.log", "logcat-r34.txt", "r34-9-W4-0") };
const shortOff = {
  with: chainTime("chain39.log", /^\d+ r39-1-W4-G pause off/) - chainTime("chain39.log", /^\d+ r39-1-W4-G pause on/),
  without: chainTime("chain34.log", /^\d+ r34-9-W4-0 pause off/) - chainTime("chain34.log", /^\d+ r34-9-W4-0 pause on/),
};

// trig-r31.txt: "epoch xo_milliC ..." each second, with header lines between logger restarts.
const trig = file("trig-r31.txt")
  .split("\n")
  .map((l) => l.split(" "))
  .filter((p) => /^\d+$/.test(p[0]) && /^\d+$/.test(p[1]))
  .map((p) => [Number(p[0]), Number(p[1]) / 1000]);
const session = (chain, label, pause) => {
  const from = chainTime(chain, new RegExp(`^\\d+ session ${label} `));
  const to = chainTime(chain, new RegExp(`^\\d+ session ${label} end`));
  const points = [];
  for (let t = from; t <= to; t += 30) {
    const w = trig.filter(([x]) => x >= t && x < t + 30);
    if (w.length) points.push([round((t - from) / 60, 2), round(w.reduce((a, [, v]) => a + v, 0) / w.length, 1)]);
  }
  const peak = Math.max(...trig.filter(([x]) => x >= from && x <= to).map(([, v]) => v));
  return { label, pause, minutes: round((to - from) / 60, 1), peak: round(peak, 1), points };
};
const sessions = [session("chain33.log", "r33-A", "30 s"), session("chain33.log", "r33-B", "5 s"), session("chain39.log", "r39-S", "none")];

// Where the six decode threads ran, in r19 on phone B (Qwen3 4B, GPU prefill, CPU decode, 6 threads, the
// phone's own hard throttles). place19.txt gives, every 2 s, each benchmark thread's last core and its CPU
// time in ticks of 1/100 s; affinity19.txt gives the two CPU pause switches every 5 s. An interval counts
// when exactly six threads used CPU time in it. A thread's share of a core is its ticks over the interval,
// capped at 1, because whole-second timestamps make a busy thread read slightly over.
const pauseLog = file("affinity19.txt")
  .split("\n")
  .map((l) => l.trim().split(/\s+/))
  .filter((p) => /^\d+$/.test(p[0]) && p.length > 3)
  .map((p) => [Number(p[0]), p.slice(3).some((x) => x.split("=")[1] !== "0")]);
const pausedAt = (t) => {
  let on = false;
  for (const [x, v] of pauseLog) {
    if (x > t) break;
    on = v;
  }
  return on;
};
const samples = file("place19.txt")
  .split("\n")
  .filter((l) => /^\d+ /.test(l))
  .map((l) => {
    const p = l.trim().split(/\s+/);
    return {
      t: Number(p[0]),
      pid: p[1],
      th: Object.fromEntries(
        p
          .slice(3)
          .map((f) => f.split(":"))
          .map(([tid, cpu, ticks]) => [tid, [Number(cpu), Number(ticks)]]),
      ),
    };
  });
const intervals = [];
for (let i = 1; i < samples.length; i++) {
  const [a, b] = [samples[i - 1], samples[i]];
  if (a.pid !== b.pid || b.t <= a.t) continue;
  const busy = Object.entries(b.th)
    .filter(([tid, [, ticks]]) => a.th[tid] && ticks > a.th[tid][1])
    .map(([tid, [core, ticks]]) => ({ core, share: Math.min(1, (ticks - a.th[tid][1]) / (b.t - a.t) / 100) }));
  intervals.push({ t: b.t, paused: pausedAt(b.t), busy });
}
const median = (xs) => {
  const s = [...xs].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const placement = (paused) => {
  const six = intervals.map((x, i) => ({ ...x, i })).filter((x) => x.busy.length === 6 && x.paused === paused);
  const cores = six.map((x) => new Set(x.busy.map((b) => b.core)).size);
  const shares = six.flatMap((x) => x.busy.map((b) => b.share));
  const mid = median(shares);
  // The interval shown: for the unpaused case the first that spread over six cores; for the paused case one
  // inside a pause on both sides whose threads' median share is nearest the overall median.
  const stable = (x) => !paused || (intervals[x.i - 1]?.paused && intervals[x.i + 1]?.paused);
  const pick = paused
    ? six.filter(stable).reduce((best, x) => (Math.abs(median(x.busy.map((b) => b.share)) - mid) < Math.abs(median(best.busy.map((b) => b.share)) - mid) ? x : best))
    : (six.find((x) => new Set(x.busy.map((b) => b.core)).size === 6) ?? six[0]);
  return {
    intervals: six.length,
    cores: [Math.min(...cores), Math.max(...cores)],
    share: round(mid, 2),
    coresUsed: round(median(six.map((x) => x.busy.reduce((s, b) => s + b.share, 0))), 2),
    sample: { at: pick.t, threads: pick.busy.map((b) => ({ core: b.core, share: round(b.share, 2) })).sort((x, y) => x.core - y.core) },
  };
};
const threadPlacement = { normal: placement(false), paused: placement(true) };

// The benchmark run that logged the natural hard throttles (r16 on phone C, 3 November): a Qwen3 1.7B warm-up,
// its nine pairings, then a Qwen3 4B cell, back to back. Minutes run from the warm-up's first reading. The board
// sensor (sys-therm-0) comes from the results' env and cell rows, read at each run's and each pairing's start
// and end, until the 2 s logger trig-r16.txt starts, and from that logger's 30 s means after it. The hard
// throttle's spans are where trig-r16.txt shows either CPU pause switch on; thermlog-r16.txt, every 10 s over
// the whole run, is checked to show no pause before the 2 s logger began.
const jsonl = (name) =>
  file(name)
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
const r16 = [...jsonl("results-r16warm.jsonl"), ...jsonl("results-r16.jsonl")];
const xoOf = (temps) => {
  const m = /sys-therm-0=(\d+)/.exec(temps ?? "");
  return m ? Number(m[1]) / 1000 : null;
};
const t0 = r16.find((r) => r.kind === "env").time;
const trig16 = file("trig-r16.txt")
  .split("\n")
  .map((l) => l.trim().split(/\s+/))
  .filter((p) => /^\d+$/.test(p[0]) && /^\d+$/.test(p[1]))
  .map((p) => ({ t: Number(p[0]), xo: Number(p[1]) / 1000, paused: p[2] !== "0" || p[3] !== "0" }));
const trigFrom = trig16[0].t;
// Before the 2 s logger the sensor was read only by the env rows, at the run's start and after the warm-up (the
// cell rows do not carry it), so the series starts with the logger and those two readings are kept as numbers.
const envXo = r16.filter((r) => r.kind === "env" && xoOf(r.temps) !== null).map((r) => ({ t: Number(r.time), xo: xoOf(r.temps) }));
const afterWarmup = envXo.find((x) => x.t > t0);
const dense = [];
for (let t = trigFrom; t <= trig16.at(-1).t; t += 30) {
  const w = trig16.filter((x) => x.t >= t && x.t < t + 30);
  if (w.length) dense.push({ t: t + 15, xo: w.reduce((a, x) => a + x.xo, 0) / w.length });
}
const benchPoints = [...dense].sort((a, b) => a.t - b.t).map((x) => [round((x.t - t0) / 60, 2), round(x.xo, 1)]);
const spans = [];
for (const x of trig16) {
  const m = (x.t - t0) / 60;
  if (x.paused && (!spans.length || spans.at(-1).closed)) spans.push({ from: m, to: m, closed: false });
  else if (x.paused) spans.at(-1).to = m;
  else if (spans.length && !spans.at(-1).closed) spans.at(-1).closed = true;
}
// The 10 s logger's two CPU pause columns, found by name in its header, must be off before the 2 s logger began.
const thermLines = file("thermlog-r16.txt").split("\n");
const thermHead = thermLines[0]
  .trim()
  .split(/\s+/)
  .map((x) => x.split("=")[1]);
const pauseCols = thermHead.map((n, i) => (n === "thermal-pause-C0" || n === "thermal-pause-3C" ? i + 1 : -1)).filter((i) => i > 0);
const earlyPause = thermLines
  .slice(1)
  .map((l) => l.trim().split(/\s+/))
  .filter((p) => /^\d+$/.test(p[0]) && Number(p[0]) < trigFrom)
  .some((p) => pauseCols.some((i) => p[i] && p[i] !== "0"));
if (earlyPause) throw new Error("thermlog-r16 shows a pause before trig-r16 began; the spans would miss it");
const benchmarkHeat = {
  minutes: round((trig16.at(-1).t - t0) / 60, 1),
  denseFrom: round((trigFrom - t0) / 60, 1),
  startC: round(xoOf(r16.find((r) => r.kind === "env").temps), 1),
  warmup: { minutes: round((afterWarmup.t - t0) / 60, 1), c: round(afterWarmup.xo, 1) },
  peak: round(Math.max(...trig16.map((x) => x.xo)), 1),
  firstThrottle: round(spans[0].from, 1),
  throttles: spans.map((x) => ({ from: round(x.from, 2), to: round(x.to, 2) })),
  points: benchPoints,
};

// The loggers of r46 to r48 (trig46.sh to trig48.sh): "epoch xo_milliC cpu_milliC" then the eleven pause devices,
// about once a second; trig48.txt carries more columns after them, read by none of this.
const trigOf = (name) =>
  file(name)
    .split("\n")
    .map((l) => l.trim().split(/\s+/))
    .filter((p) => /^\d+$/.test(p[0]) && /^\d+$/.test(p[1]))
    .map((p) => ({ t: Number(p[0]), xo: Number(p[1]) / 1000, cpu: Number(p[2]) / 1000, on: p.slice(3, 14).some((x) => x !== "0") }));

// r46 on phone A: three chat sessions with no pause between turns, back to back, from the first's start to the
// third's end: the XO's mean over each 30 s, each session's start, the peak and the samples with a device on.
const trig46 = trigOf("trig46.txt");
const longFrom = chainTime("chain46.log", /^\d+ session r46-S1 think/);
const longTo = chainTime("chain46.log", /^\d+ session r46-S3 end/);
const longPoints = [];
for (let t = longFrom; t <= longTo; t += 30) {
  const w = trig46.filter((x) => x.t >= t && x.t < t + 30);
  if (w.length) longPoints.push([round((t - longFrom) / 60, 2), round(w.reduce((a, x) => a + x.xo, 0) / w.length, 1)]);
}
const longIn = trig46.filter((x) => x.t >= longFrom && x.t <= longTo);
const longSession = {
  minutes: round((longTo - longFrom) / 60, 1),
  starts: ["S1", "S2", "S3"].map((k) => round((chainTime("chain46.log", new RegExp(`^\\d+ session r46-${k} think`)) - longFrom) / 60, 1)),
  peak: round(Math.max(...longIn.map((x) => x.xo)), 1),
  samples: longIn.length,
  samplesOn: longIn.filter((x) => x.on).length,
  points: longPoints,
};

// r47 and r48 on phone A: heated with busy loops and dd loops until a pause device read non-zero by itself, then
// ThreadCountBenchmark's 19-token prompt and up to 256 tokens. The pause's edges are the logger's first sample with
// a device on and its first after with all off. Each run's process is the one whose START line falls between the
// chain's start and end lines for it; times are seconds from the first sample with a device on.
function tripRun(n, label) {
  const chain = `chain${n}.log`;
  const tr = trigOf(`trig${n}.txt`);
  const heatOn = chainTime(chain, /^\d+ heat on:/);
  const first = tr.find((x) => x.t >= heatOn && x.on);
  const off = tr.find((x) => x.t > first.t && !x.on);
  const started = chainTime(chain, new RegExp(`^\\d+ run ${label} guard`));
  const ended = chainTime(chain, new RegExp(`^\\d+ run ${label} end`));
  const lines = logcat(`logcat-r${n}.txt`).filter((x) => x.t >= started - 1 && x.t <= ended + 2);
  const starts = lines.filter((x) => x.tag === "OpenWeightsBench" && x.msg.startsWith("START"));
  if (starts.length !== 1) throw new Error(`${label}: ${starts.length} START lines`);
  const pid = starts[0].pid;
  const mine = lines.filter((x) => x.pid === pid);
  const prog = mine.filter((x) => x.msg.startsWith("PROGRESS")).map((x) => ({ t: x.t - first.t, f: fields(x.msg) }));
  const decoding = prog.filter((x) => x.f.reading === "false" && x.f.decodeMs !== "null").map((x) => [x.t, Number(x.f.generated)]);
  const pauseS = off.t - first.t;
  const inside = decoding.filter(([t]) => t >= 0 && t < pauseS);
  const tokS = (xs) => (xs.length > 1 ? round((xs.at(-1)[1] - xs[0][1]) / (xs.at(-1)[0] - xs[0][0]), 2) : null);
  const guard = mine.filter((x) => x.tag === "OpenWeights" && x.msg.includes("decode steps stalled")).map((x) => round(x.t - first.t, 1));
  const bench = fields(mine.find((x) => x.msg.startsWith("BENCH")).msg.replace(/ tok\/s/g, ""));
  const count = (t) => {
    const seen = decoding.filter(([x]) => x <= t);
    return seen.length ? seen.at(-1)[1] : 0;
  };
  const points = [];
  for (let t = 0; t <= Math.ceil(decoding.at(-1)[0]); t += 1) points.push([t, count(t)]);
  return {
    label,
    heatMinutes: round((first.t - heatOn) / 60, 1),
    heatFromC: round(tr.find((x) => x.t >= heatOn).xo, 1),
    onC: round(first.xo, 3),
    offC: round(off.xo, 3),
    pauseS,
    startS: started - first.t,
    promptMs: Number(prog.find((x) => x.f.prefillMs !== "null").f.prefillMs),
    inPause: tokS(inside),
    afterFallback: guard.length ? tokS(inside.filter(([t]) => t >= guard[0])) : null,
    guard,
    decode: Number(bench.decode),
    points,
  };
}
// The cool runs before heating, r47-B0 (guard off) and r47-B1 (on): decode rate and the prompt's reading time, from
// the same progress records as the hot runs.
const coolRuns = ["r47-B0", "r47-B1"].map((label) => {
  const started = chainTime("chain47.log", new RegExp(`^\\d+ run ${label} guard`));
  const ended = chainTime("chain47.log", new RegExp(`^\\d+ run ${label} end`));
  const mine = logcat("logcat-r47.txt").filter((x) => x.t >= started && x.t <= ended + 2);
  const b = mine.find((x) => x.msg.startsWith("BENCH"));
  const read = mine.find((x) => x.msg.startsWith("PROGRESS") && fields(x.msg).prefillMs !== "null");
  return { label, decode: Number(fields(b.msg.replace(/ tok\/s/g, "")).decode), promptMs: Number(fields(read.msg).prefillMs) };
});
// r47-P1, with the guard, started after r47's pause had released. The stall runs from the progress record before
// the first slow gap between records (over 1.5 s of decode) to the guard's line; the CPU zone is the logger's
// sample at the stall's start and its lowest during it; the board temperature is the chain's at the run's start.
const afterTrip = (() => {
  const startLine = file("chain47.log")
    .split("\n")
    .find((l) => /^\d+ run r47-P1 guard/.test(l));
  const started = Number(startLine.split(" ")[0]);
  const ended = chainTime("chain47.log", /^\d+ run r47-P1 end/);
  const mine = logcat("logcat-r47.txt").filter((x) => x.t >= started && x.t <= ended);
  const g = mine.find((x) => x.msg.includes("decode steps stalled"));
  const m = /stalled \((\d+) ms against (\d+)\)/.exec(g.msg);
  const prog = mine.filter((x) => x.msg.startsWith("PROGRESS") && fields(x.msg).decodeMs !== "null").map((x) => ({ t: x.t, ms: Number(fields(x.msg).decodeMs) }));
  const k = prog.findIndex((x, i) => i > 0 && x.ms - prog[i - 1].ms > 1500 && x.t <= g.t + 1);
  const from = prog[k - 1].t;
  const tr = trigOf("trig47.txt");
  const during = tr.filter((x) => x.t >= Math.floor(from) && x.t <= g.t);
  return {
    stepMs: Number(m[1]),
    normalMs: Number(m[2]),
    sampled: during.length,
    anyOn: during.some((x) => x.on),
    cpuBefore: during[0].cpu,
    cpuLow: round(Math.min(...during.map((x) => x.cpu)), 1),
    xo: round(Number(/ xo (\d+)/.exec(startLine)[1]) / 1000, 1),
  };
})();
const forced = { off: tripRun(47, "r47-P0"), on: tripRun(48, "r48-P1"), cool: coolRuns, afterTrip };

// r49 on phone A: the app's engine at 1 to 8 threads, normally (N) and with six cores taken out of use by hand (P),
// three rounds; a 19-token prompt and up to 32 tokens, the guard off. A run is the process whose START line falls
// between the chain's start and end lines for it. Prefill tok/s is promptRead over prefillMs; decode tok/s is the
// tokens after the first over decodeMs, as the engine's BENCH line counts it, up to the last progress line, so a
// run its watchdog stopped still counts. A paused run counts only if its threads ran on CPUs 0 and 1 alone in
// every place-<label>.txt sample with any of them busy. Medians per thread count and state.
const chain49 = file("chain49.log").split("\n");
const cat49 = logcat("logcat-r49.txt");
const runs49 = chain49
  .map((l) => l.match(/^(\d+) run (r49-\d-[NP]\d) threads (\d+) state ([NP])/))
  .filter(Boolean)
  .map((m) => {
    const label = m[2];
    const t0 = Number(m[1]);
    const end = chain49.find((l) => l.includes(` run ${label} end `));
    if (!end) return null;
    const t1 = Number(end.split(" ")[0]);
    const win = cat49.filter((x) => x.t >= t0 - 1 && x.t <= t1 + 2);
    const st = win.filter((x) => x.tag === "OpenWeightsBench" && x.msg.startsWith("START"));
    if (st.length !== 1) throw new Error(`${label}: ${st.length} START lines`);
    const prog = win.filter((x) => x.pid === st[0].pid && x.msg.startsWith("PROGRESS")).map((x) => fields(x.msg));
    const read = prog.find((f) => f.prefillMs !== "null");
    const dec = prog.filter((f) => f.decodeMs !== "null" && Number(f.decodeMs) > 0);
    let held = true;
    if (m[4] === "P") {
      let prev = null;
      let busySamples = 0;
      for (const line of file(`place-${label}.txt`).split("\n")) {
        const p = line.trim().split(/\s+/);
        if (!/^\d+$/.test(p[0]) || p.length < 4) continue;
        // Every sample must also read all three pause switches on.
        if (p[2] !== "111") held = false;
        const cur = Object.fromEntries(
          p
            .slice(3)
            .map((f) => f.split(":"))
            .map(([tid, cpu, ticks]) => [tid, [Number(cpu), Number(ticks)]]),
        );
        if (prev) {
          const busy = Object.entries(cur).filter(([tid, [, ticks]]) => prev[tid] && ticks > prev[tid][1]);
          if (busy.length) busySamples++;
          if (busy.some(([, [cpu]]) => cpu > 1)) held = false;
        }
        prev = cur;
      }
      if (!busySamples) held = false;
    }
    return {
      label,
      threads: Number(m[3]),
      state: m[4],
      held,
      watchdog: chain49.some((l) => l.includes(`watchdog stopped ${label}`)),
      prefill: read ? (Number(read.promptRead) / Number(read.prefillMs)) * 1000 : null,
      decode: dec.length ? ((Number(dec.at(-1).generated) - 1) / Number(dec.at(-1).decodeMs)) * 1000 : null,
    };
  })
  .filter(Boolean);
const med = (xs) => (xs.length ? median(xs) : null);
const threadMatrix = [1, 2, 3, 4, 5, 6, 7, 8].map((t) => {
  const n = runs49.filter((r) => r.threads === t && r.state === "N");
  const p = runs49.filter((r) => r.threads === t && r.state === "P" && r.held);
  const pick = (xs, k, d) =>
    xs
      .map((r) => r[k])
      .filter((x) => x !== null)
      .map((x) => round(x, d));
  return {
    threads: t,
    decode: { normal: med(pick(n, "decode", 3)), paused: med(pick(p, "decode", 4)), runs: [pick(n, "decode", 3), pick(p, "decode", 4)] },
    prefill: { normal: med(pick(n, "prefill", 2)), paused: med(pick(p, "prefill", 3)), runs: [pick(n, "prefill", 2), pick(p, "prefill", 3)] },
    left: runs49.filter((r) => r.threads === t && r.state === "P" && !r.held).map((r) => r.label),
    watchdog: runs49.filter((r) => r.threads === t && r.watchdog).length,
  };
});

// r49's two traced 6-thread runs: the kernel's sched_switch events for 2 s of decode. The engine's threads are the
// ones named openweights-inf in the run's thread list, numbered by thread id. Each core's time goes to the task it
// ran; before a core's first switch in the window, to that switch's previous task. Shares are of the whole window;
// the segments, of `windowMs` from `fromMs`, are drawn as they are.
function schedTrace(label, fromMs, windowMs) {
  const eng = file(`tasks-${label}.txt`)
    .split("\n")
    .filter((l) => l.includes("openweights-inf"))
    .map((l) => l.split(" ")[0])
    .sort((a, b) => Number(a) - Number(b));
  const num = Object.fromEntries(eng.map((tid, i) => [tid, i + 1]));
  const ev = file(`trace-${label}.txt`)
    .split("\n")
    .map((l) => l.match(/\[(\d+)\].*?\s(\d+\.\d+): sched_switch: prev_comm=.* prev_pid=(\d+) .*==> next_comm=.* next_pid=(\d+)/))
    .filter(Boolean)
    .map((m) => ({ t: Number(m[2]), cpu: Number(m[1]), prev: m[3], next: m[4] }))
    .sort((a, b) => a.t - b.t);
  const t0 = ev[0].t;
  const t1 = ev.at(-1).t;
  const cur = {};
  const since = {};
  const busy = {};
  const segs = [];
  const a = fromMs / 1000;
  const b = (fromMs + windowMs) / 1000;
  const engineStretches = [];
  const account = (cpu, tid, fr, to) => {
    busy[`${cpu}:${tid}`] = (busy[`${cpu}:${tid}`] ?? 0) + to - fr;
    if (num[tid]) engineStretches.push(to - fr);
    const f = fr - t0;
    const e = to - t0;
    if (tid !== "0" && e > a && f < b) segs.push({ cpu, thread: num[tid] ?? 0, from: round((Math.max(f, a) - a) * 1000, 3), to: round((Math.min(e, b) - a) * 1000, 3) });
  };
  for (const x of ev) {
    account(x.cpu, cur[x.cpu] ?? x.prev, since[x.cpu] ?? t0, x.t);
    cur[x.cpu] = x.next;
    since[x.cpu] = x.t;
  }
  for (const cpu of Object.keys(cur)) account(Number(cpu), cur[cpu], since[cpu], t1);
  const span = t1 - t0;
  const shares = eng.map((tid) => {
    const per = Object.entries(busy).filter(([k]) => k.split(":")[1] === tid);
    const total = per.reduce((s, [, v]) => s + v, 0);
    // The cores it spent at least 1% of the window on.
    const cpus = per
      .filter(([, v]) => v / span >= 0.01)
      .map(([k]) => Number(k.split(":")[0]))
      .sort((x, y) => x - y);
    return { thread: num[tid], share: round(total / span, 3), cpus };
  });
  const cores = [0, 1, 2, 3, 4, 5, 6, 7].map((cpu) => {
    const on = Object.entries(busy).filter(([k]) => Number(k.split(":")[0]) === cpu);
    const engine = on.filter(([k]) => num[k.split(":")[1]]).reduce((s, [, v]) => s + v, 0);
    const idle = on.filter(([k]) => k.split(":")[1] === "0").reduce((s, [, v]) => s + v, 0);
    const all = on.reduce((s, [, v]) => s + v, 0);
    return { cpu, engine: round(engine / span, 3), other: round((all - engine - idle) / span, 3), idle: round(idle / span, 3), events: ev.filter((x) => x.cpu === cpu).length };
  });
  const stretches = { count: engineStretches.length, medianMs: round(median(engineStretches) * 1000, 3) };
  // How an engine thread left its core: still runnable (R, R+: the scheduler took it) or blocked (S, D: the thread
  // gave it up), and how often the kernel woke one. A thread that waited by sleeping would leave blocked and be woken.
  const lines = file(`trace-${label}.txt`).split("\n");
  const leftBy = {};
  for (const l of lines) {
    const m = l.match(/sched_switch: prev_comm=.* prev_pid=(\d+) .*prev_state=(\S+) ==>/);
    if (m && num[m[1]]) leftBy[m[2]] = (leftBy[m[2]] ?? 0) + 1;
  }
  const taken = Object.entries(leftBy)
    .filter(([st]) => st.startsWith("R"))
    .reduce((n, [, c]) => n + c, 0);
  const left = { taken, gaveUp: Object.values(leftBy).reduce((n, c) => n + c, 0) - taken };
  const woken = lines.filter((l) => {
    const m = l.match(/sched_wakeup: comm=.* pid=(\d+) /);
    return m && num[m[1]];
  }).length;
  return { label, spanMs: round(span * 1000, 0), switches: ev.length, stretches, left, woken, fromMs, windowMs, shares, cores, segs };
}
const traces = { normal: schedTrace("r49-T-N6", 1000, 10), paused: schedTrace("r49-T-P6", 1000, 10) };

// r50 and r50b on an SM8550 (QDC sa964839): the guard's early try against its 30 s schedule alone, with the
// phone's own pause device set by hand. For each run that ended: when the guard came back to 4 threads after the
// pause went off (W runs), or how many tries it made inside a pause that stayed (M runs). r50 logged the pause as a
// whole-second timestamp after the write, so its returns are approximate; r50b also logged a marker into logcat
// just after each write, so its returns are measured to the millisecond from that marker. A run with no end line
// (r50b-4, cut when the reservation ended) is left out.
const DIR50 = "tools/snapdragon/results/2026-11-10-sm8550";
function guardRuns(chainName, catName) {
  const chain = file(chainName, DIR50).split("\n");
  const cat = logcat(catName, DIR50);
  return chain
    .map((l) => l.match(/^(\d+) run (r50b?-\d-([WMN])([ET])) arm/))
    .filter(Boolean)
    .map((m) => {
      const label = m[2];
      const t0 = Number(m[1]);
      const endLine = chain.find((l) => l.includes(` run ${label} end `));
      if (!endLine) return null;
      const t1 = Number(endLine.split(" ")[0]);
      const win = cat.filter((x) => x.t >= t0 - 1 && x.t <= t1 + 2);
      const mark = (what) => win.find((x) => x.msg === `CHAIN pause ${what} ${label}`)?.t;
      const secs = (what) => {
        const l = chain.find((x) => x.endsWith(`${label} pause ${what}`));
        return l ? Number(l.split(" ")[0]) : null;
      };
      const exact = mark("on") !== undefined;
      const off = exact ? mark("off") : secs("off");
      const g = win.filter((x) => x.tag === "OpenWeights" && x.msg.startsWith("threads:"));
      const back = g.find((x) => x.msg.includes("back to"));
      const tries = g.filter((x) => x.msg.includes("trying"));
      return {
        label,
        arm: m[3],
        early: m[4] === "E",
        exact,
        backS: m[3] === "W" && back && off ? round(back.t - off, 1) : null,
        tries: tries.length,
        earlyTries: tries.filter((x) => x.msg.includes("sped up")).length,
        failedMs: g.filter((x) => x.msg.includes("the try at") && x.msg.includes("stalled")).map((x) => Number(/\((\d+) ms\)/.exec(x.msg)[1])),
      };
    })
    .filter(Boolean);
}
const earlyTry = [...guardRuns("chain50.log", "logcat-r50.txt"), ...guardRuns("chain50b.log", "logcat-r50b.txt")];

// r52 on phone F (unit 45b9a8ad): the app's engine at 1, 2, 3, 4, 6 and 8 threads on the 1,751-token prompt with up
// to 400 tokens, the guard off. N runs without the pause; D with it written once the chain saw the first decode
// progress line, stopped 300 s later; R with it set before launch. Same rules as analyze_threads52.py: the whole
// prompt is prefillMs on a run's first line in decode (to the end of its last batch), N and D read it unpaused and
// R paused; a D run's decode runs from its first line at least 1 s after its "CHAIN pause on" marker, against its N
// (same round, else the other) between the first and last generated counts both logged. A paused run counts only
// if its place samples pass the sampled check from 1 s after the marker (or the run's start) to 2 s before the off
// marker: all three switches on, every thread busy since the sample before last on CPU 0 or 1, at least one busy
// sample, no gap over 5 s, the first and last within 5 s of the window's ends.
const DIR52 = "tools/snapdragon/results/2026-11-11-sm8850-r52";
const chain52 = file("chain52.log", DIR52).split("\n");
const cat52 = logcat("logcat-r52.txt", DIR52);
const num52 = (f, k) => (f[k] !== undefined && /^-?\d+$/.test(f[k]) ? Number(f[k]) : null);
// The samples of a run's place file: time, switch states, XO, the two CPU frequency ceilings, and each thread.
const place52 = (label) =>
  file(`place-${label}.txt`, DIR52)
    .split("\n")
    .map((l) => l.trim().split(/\s+/))
    .filter((p) => p.length > 8 && /^\d+$/.test(p[0]) && p[1] === "sw" && p[7] === "cap")
    .map((p) => ({
      t: Number(p[0]),
      sw: p[2],
      xo: Number(p[4]) / 1000,
      cap: p[8],
      threads: Object.fromEntries(
        p
          .slice(9)
          .filter((f) => /^\d+:\d+:\d+$/.test(f))
          .map((f) => f.split(":"))
          .map(([tid, cpu, ticks]) => [tid, [Number(cpu), Number(ticks)]]),
      ),
    }));
// The judged samples between ws and we: each compared with the one before, which must also be inside.
function judged52(label, ws, we) {
  const out = [];
  let prev = null;
  for (const s of place52(label)) {
    if (s.t >= ws && s.t <= we && prev && prev.t >= ws && Object.keys(s.threads).length) {
      const busy = Object.entries(s.threads)
        .filter(([tid, [, ticks]]) => prev.threads[tid] && ticks > prev.threads[tid][1])
        .map(([, [cpu]]) => cpu);
      out.push({ t: s.t, busy: busy.length > 0, bad: s.sw !== "111" || busy.some((c) => c > 1) });
    }
    prev = s;
  }
  return out;
}
function held52(label, ws, we) {
  const js = judged52(label, ws, we);
  if (!js.length) return false;
  const gap = Math.max(0, ...js.slice(1).map((j, i) => j.t - js[i].t));
  return js.every((j) => !j.bad) && js.some((j) => j.busy) && gap <= 5 && js[0].t - ws <= 5 && we - js.at(-1).t <= 5;
}
const runs52 = chain52
  .map((l) => l.match(/^(\d+) run (r52-(\d)-([NDR])(\d)) threads (\d) arm/))
  .filter(Boolean)
  .map((m) => {
    const label = m[2];
    const t0 = Number(m[1]);
    const endLine = chain52.find((l) => l.includes(` run ${label} end `));
    if (!endLine) return null;
    const end = Number(endLine.split(" ")[0]);
    const st = cat52.filter((x) => x.tag === "OpenWeightsBench" && x.msg.startsWith("START") && x.t >= t0 && x.t < end + 1);
    if (st.length !== 1) throw new Error(`${label}: ${st.length} START lines`);
    const prog = cat52
      .filter((x) => x.pid === st[0].pid && x.tag === "OpenWeightsBench" && x.t >= st[0].t && x.t < end + 1 && x.msg.startsWith("PROGRESS"))
      .map((x) => ({ t: x.t, f: fields(x.msg) }));
    const mark = (what) => {
      const ms = cat52.filter((x) => x.tag === "OpenWeightsBench" && x.msg === `CHAIN pause ${what} ${label}` && x.t >= t0 - 5 && x.t < end + 1);
      return ms.length === 1 ? ms[0].t : null;
    };
    const arm = m[4];
    const on = arm === "N" ? null : mark("on");
    const off = arm === "N" ? null : mark("off");
    const win = on === null ? null : [Math.max(on, st[0].t) + 1, (off ?? end) - 2];
    const firstDecode = prog.find((p) => p.f.reading === "false" && num52(p.f, "prefillMs"));
    return {
      label,
      round: Number(m[3]),
      arm,
      threads: Number(m[6]),
      on,
      win,
      held: arm === "N" || (win !== null && held52(label, ...win)),
      passed: endLine.trimEnd().endsWith("result 1"),
      prog,
      promptMs: firstDecode ? num52(firstDecode.f, "prefillMs") : null,
    };
  })
  .filter(Boolean);
// {generated: decodeMs} from lines in decode, the first line for each count, from a time on when given.
const points52 = (prog, after = null) => {
  const out = new Map();
  for (const { t, f } of prog) {
    const g = num52(f, "generated");
    const ms = num52(f, "decodeMs");
    if (f.reading === "false" && g && ms !== null && (after === null || t >= after) && !out.has(g)) out.set(g, ms);
  }
  return out;
};
const rate52 = (pts, a, b) => (b > a && pts.get(b) > pts.get(a) ? ((b - a) / (pts.get(b) - pts.get(a))) * 1000 : null);
const pair52 = (r) => {
  const n = runs52.filter((x) => x.threads === r.threads && x.arm === "N" && x.passed);
  return n.find((x) => x.round === r.round) ?? n.find((x) => x.round !== r.round) ?? null;
};
// A D run against its N between the first and last generated counts both logged, from a given time on.
function decodePair52(r, after) {
  const n = pair52(r);
  if (!n) return null;
  const pd = points52(r.prog, after);
  const pn = points52(n.prog);
  const common = [...pd.keys()].filter((g) => pn.has(g)).sort((a, b) => a - b);
  if (pd.size < 2 || common.length < 2) return null;
  const [a, b] = [common[0], common.at(-1)];
  const paused = rate52(pd, a, b);
  const normal = rate52(pn, a, b);
  return paused && normal ? { label: r.label, from: a, to: b, paused: round(paused, 3), normal: round(normal, 2), crossRound: n.round !== r.round } : null;
}
const sorted = (xs) => xs.filter((x) => x !== null).sort((a, b) => a - b);
const realLength = [1, 2, 3, 4, 6, 8].map((t) => {
  const mine = runs52.filter((r) => r.threads === t);
  return {
    threads: t,
    promptS: {
      normal: sorted(mine.filter((r) => r.arm !== "R").map((r) => r.promptMs)).map((x) => round(x / 1000, 1)),
      paused: sorted(mine.filter((r) => r.arm === "R" && r.held).map((r) => r.promptMs)).map((x) => round(x / 1000, 1)),
    },
    decode: mine
      .filter((r) => r.arm === "D" && r.held)
      .map((r) => decodePair52(r, r.on + 1))
      .filter(Boolean),
    // The paused runs' tokens written when they stopped (3 threads and more stopped at 300 s).
    lastGenerated: mine.filter((r) => r.arm === "D" && r.held).map((r) => Math.max(...r.prog.map((p) => num52(p.f, "generated") ?? 0))),
    left: mine.filter((r) => r.arm !== "N" && !r.held).map((r) => r.label),
  };
});
// A D run left out because its samples showed threads past CPU 1 early in the pause and none after: how long that
// lasted from the marker, the tokens written then and their rate, and, post hoc, the decode from 2 s after it.
const lateHold = runs52
  .filter((r) => r.arm === "D" && !r.held && r.win)
  .map((r) => {
    const bad = judged52(r.label, ...r.win).filter((j) => j.bad);
    if (!bad.length) return null;
    const last = bad.at(-1).t;
    const early = points52(r.prog, r.on + 1);
    const before = [...early.keys()].filter((g) => !points52(r.prog, last + 2).has(g)).sort((a, b) => a - b);
    return {
      label: r.label,
      threads: r.threads,
      untilS: Math.round(last - r.on),
      early: { from: before[0], to: before.at(-1), rate: round(rate52(early, before[0], before.at(-1)), 1) },
      after: decodePair52(r, last + 2),
    };
  })
  .filter(Boolean);
// How warm each kind of run got, and how often both CPU frequency ceilings sat at their maximum.
const heat52 = (arm) => {
  const rs = runs52.filter((r) => r.arm === arm);
  const full = rs.map((r) => {
    const ss = place52(r.label);
    return ss.filter((s) => s.cap === "3628800/4608000").length / ss.length;
  });
  const xo = rs.map((r) => Math.max(...place52(r.label).map((s) => s.xo)));
  return { atMax: [round(Math.min(...full) * 100, 0), round(Math.max(...full) * 100, 0)], xoMax: [round(Math.min(...xo), 0), round(Math.max(...xo), 0)] };
};
const realHeat = { normal: heat52("N"), paused: heat52("R") };

const out = `// Generated by scripts/build-decode-stall-data.mjs from OpenWeights at ${commit.slice(0, 12)}
// (${DIR}). Do not edit: change the script or the results and run it again.

export const stallSource = { commit: ${JSON.stringify(commit)}, dir: ${JSON.stringify(DIR)} };

// A pause that stays: tokens written since the pause began, each 2 s, seconds from the pause.
export const heldPause = {
  with: { label: ${JSON.stringify(held.with.label)}, decodeFrom: ${held.with.decodeFrom}, guard: ${JSON.stringify(held.with.guard)}, points: ${JSON.stringify(sincePause(held.with, 2))} as [number, number][] },
  without: { label: ${JSON.stringify(held.without.label)}, decodeFrom: ${held.without.decodeFrom}, endsAt: ${held.without.endsAt}, points: ${JSON.stringify(sincePause(held.without, 2))} as [number, number][] },
};

// A 30 s pause: tokens a second in 2 s bins from 10 s before the pause to 90 s after.
export const shortPause = {
  pauseSeconds: ${JSON.stringify(shortOff)},
  with: { label: ${JSON.stringify(short.with.label)}, guard: ${JSON.stringify(short.with.guard)}, points: ${JSON.stringify(rate(short.with, -10, 90, 2))} as [number, number][] },
  without: { label: ${JSON.stringify(short.without.label)}, points: ${JSON.stringify(rate(short.without, -10, 90, 2))} as [number, number][] },
};

// Where the six decode threads ran in r19 on phone B, in 2 s intervals with all six busy: how many intervals,
// how many distinct cores they used, each thread's median share of a core, the cores used in all, and one
// interval drawn in full.
export const threadPlacement = ${JSON.stringify(threadPlacement, null, 2)};

// The benchmark run behind the natural hard throttles, r16 on phone C: the board sensor's 30 s means from the
// 2 s logger, in minutes from the warm-up's start; its readings at the start and after the warm-up; and each
// hard throttle's span.
export const benchmarkHeat = {
  minutes: ${benchmarkHeat.minutes},
  denseFrom: ${benchmarkHeat.denseFrom},
  startC: ${benchmarkHeat.startC},
  warmup: ${JSON.stringify(benchmarkHeat.warmup)},
  peak: ${benchmarkHeat.peak},
  firstThrottle: ${benchmarkHeat.firstThrottle},
  throttles: ${JSON.stringify(benchmarkHeat.throttles)},
  points: ${JSON.stringify(benchmarkHeat.points)} as [number, number][],
};

// r46 on phone A: three chat sessions with no pause, back to back; the XO's 30 s means in minutes from the first's
// start, each session's start, the peak, and how many logger samples had any pause device on.
export const longSession = ${JSON.stringify(longSession)} as { minutes: number; starts: number[]; peak: number; samples: number; samplesOn: number; points: [number, number][] };

// r47 and r48 on phone A: the hard throttle forced by heat, the same short decode inside it without the guard (off)
// and with it (on); tokens written each second from the first logger sample with a pause device on.
export const forcedTrip = ${JSON.stringify(forced)} as {
  off: ForcedRun;
  on: ForcedRun;
  cool: { label: string; decode: number; promptMs: number }[];
  afterTrip: { stepMs: number; normalMs: number; sampled: number; anyOn: boolean; cpuBefore: number; cpuLow: number; xo: number };
};
type ForcedRun = {
  label: string;
  heatMinutes: number;
  heatFromC: number;
  onC: number;
  offC: number;
  pauseS: number;
  startS: number;
  promptMs: number;
  inPause: number;
  afterFallback: number | null;
  guard: number[];
  decode: number;
  points: [number, number][];
};

// r49 on phone A: the app's engine at 1 to 8 threads, normally and with six cores out of use, medians over the runs
// that count, every run's value, the paused runs left out because their pause did not hold, and watchdog stops.
export const threadMatrix = ${JSON.stringify(threadMatrix)} as {
  threads: number;
  decode: { normal: number | null; paused: number | null; runs: number[][] };
  prefill: { normal: number | null; paused: number | null; runs: number[][] };
  left: string[];
  watchdog: number;
}[];

// r49's scheduler traces of six engine threads writing a reply, normally and with six cores out of use: each thread's
// share of a core over 2 s and the cores it used, each core's time, and every stretch in a short window.
export const schedTraces = ${JSON.stringify(traces)} as Record<"normal" | "paused", {
  label: string;
  spanMs: number;
  switches: number;
  stretches: { count: number; medianMs: number };
  left: { taken: number; gaveUp: number };
  woken: number;
  fromMs: number;
  windowMs: number;
  shares: { thread: number; share: number; cpus: number[] }[];
  cores: { cpu: number; engine: number; other: number; idle: number; events: number }[];
  segs: { cpu: number; thread: number; from: number; to: number }[];
}>;

// r50 and r50b on an SM8550: the guard with its early try (early) or its 30 s schedule alone, each run that ended.
// backS: seconds from the pause-off log line to "back to 4" (W runs); exact: from r50b's ms marker, not a second.
export const earlyTry: {
  label: string;
  arm: "W" | "M" | "N";
  early: boolean;
  exact: boolean;
  backS: number | null;
  tries: number;
  earlyTries: number;
  failedMs: number[];
}[] = ${JSON.stringify(earlyTry)};

// r52 on phone F: each thread count at a realistic length. promptS: the whole 1,751-token prompt, s, every run
// sorted (normal: N and D runs; paused: R runs that passed the check). decode: each D run against an N run between
// the same generated counts, tok/s. lastGenerated: the paused D runs' last logged count. left: paused runs left out.
export const realLength: {
  threads: number;
  promptS: { normal: number[]; paused: number[] };
  decode: { label: string; from: number; to: number; paused: number; normal: number; crossRound: boolean }[];
  lastGenerated: number[];
  left: string[];
}[] = ${JSON.stringify(realLength)};

// r52's paused run left out because its samples showed threads past CPU 1 for a while after the switches read on.
export const realLateHold: {
  label: string;
  threads: number;
  untilS: number;
  early: { from: number; to: number; rate: number };
  after: { label: string; from: number; to: number; paused: number; normal: number; crossRound: boolean } | null;
}[] = ${JSON.stringify(lateHold)};

// r52: the share of samples with both CPU frequency ceilings at their maximum (lowest and highest run, %), and the
// XO's peak (lowest and highest run, °C), for the normal runs and the runs paused before launch.
export const realHeat = ${JSON.stringify(realHeat)};

// Chat sessions on phone D: the XO thermistor's mean over each 30 s, minutes from the session's start.
export const sessionHeat: { label: string; pause: string; minutes: number; peak: number; points: [number, number][] }[] = ${JSON.stringify(sessions, null, 2)};
`;
writeFileSync(new URL("../lib/decode-stall-data.ts", import.meta.url), out);
console.log(
  `lib/decode-stall-data.ts from ${commit.slice(0, 12)}: held ${held.with.progress.length}/${held.without.progress.length} progress lines, guard ${JSON.stringify(held.with.guard)}; short guard ${JSON.stringify(short.with.guard)}; sessions ${sessions.map((s) => `${s.label} ${s.minutes} min peak ${s.peak}`).join(", ")}; placement ${JSON.stringify(threadPlacement)}; bench ${JSON.stringify({ ...benchmarkHeat, points: benchmarkHeat.points.length })}; matrix ${JSON.stringify(threadMatrix.map((r) => [r.threads, r.decode.normal, r.decode.paused, r.prefill.normal, r.prefill.paused, r.left.length]))}; traces ${JSON.stringify(Object.fromEntries(Object.entries(traces).map(([k, v]) => [k, { shares: v.shares, stretches: v.stretches, segs: v.segs.length }])))}; long ${JSON.stringify({ ...longSession, points: longSession.points.length })}; forced ${JSON.stringify({ off: { ...forced.off, points: forced.off.points.length }, on: { ...forced.on, points: forced.on.points.length }, cool: forced.cool, afterTrip: forced.afterTrip })}; early ${JSON.stringify(earlyTry.map((r) => [r.label, r.backS, r.tries, r.earlyTries]))}; real ${JSON.stringify(realLength.map((r) => [r.threads, r.promptS, r.decode.map((d) => [d.paused, d.normal]), r.left]))}; late ${JSON.stringify(lateHold)}; heat ${JSON.stringify(realHeat)}`,
);
