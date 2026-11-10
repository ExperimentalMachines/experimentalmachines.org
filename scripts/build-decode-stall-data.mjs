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
//    session's start, from the 1 s logger trig-r31.txt.
// A run is found by its chain log's start line and the one START line its process logged after it.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OPENWEIGHTS = resolve(process.env.OPENWEIGHTS ?? "../../mobile-inference");
const REF = process.argv[2] ?? "HEAD";
const DIR = "tools/snapdragon/results/2026-10-24-sm8850";
const WORKTREE = REF === "worktree";
const commit = WORKTREE ? "worktree" : execFileSync("git", ["-C", OPENWEIGHTS, "rev-parse", REF], { encoding: "utf8" }).trim();
const file = (name) =>
  WORKTREE
    ? readFileSync(resolve(OPENWEIGHTS, DIR, name), "utf8")
    : execFileSync("git", ["-C", OPENWEIGHTS, "show", `${commit}:${DIR}/${name}`], { encoding: "utf8", maxBuffer: 1 << 30 });

const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;

// "epoch pid tid L Tag: message", as the chains' logcat -v epoch wrote it.
const logcat = (name) =>
  file(name)
    .split("\n")
    .map((l) => l.match(/^\s*(\d+\.\d+)\s+(\d+)\s+\d+\s+\w\s+(\S+?)\s*:\s(.*)$/))
    .filter(Boolean)
    .map((m) => ({ t: Number(m[1]), pid: m[2], tag: m[3], msg: m[4] }));
const fields = (msg) => Object.fromEntries([...msg.matchAll(/(\w+)=([^\s,]+)/g)].map((m) => [m[1], m[2]]));
const chainTime = (chain, pattern) => {
  const line = file(chain).split("\n").find((l) => pattern.test(l));
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
    return { t: Number(p[0]), pid: p[1], th: Object.fromEntries(p.slice(3).map((f) => f.split(":")).map(([tid, cpu, ticks]) => [tid, [Number(cpu), Number(ticks)]])) };
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
const thermHead = thermLines[0].trim().split(/\s+/).map((x) => x.split("=")[1]);
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

// Chat sessions on phone D: the XO thermistor's mean over each 30 s, minutes from the session's start.
export const sessionHeat: { label: string; pause: string; minutes: number; peak: number; points: [number, number][] }[] = ${JSON.stringify(sessions, null, 2)};
`;
writeFileSync(new URL("../lib/decode-stall-data.ts", import.meta.url), out);
console.log(
  `lib/decode-stall-data.ts from ${commit.slice(0, 12)}: held ${held.with.progress.length}/${held.without.progress.length} progress lines, guard ${JSON.stringify(held.with.guard)}; short guard ${JSON.stringify(short.with.guard)}; sessions ${sessions.map((s) => `${s.label} ${s.minutes} min peak ${s.peak}`).join(", ")}; placement ${JSON.stringify(threadPlacement)}; bench ${JSON.stringify({ ...benchmarkHeat, points: benchmarkHeat.points.length })}`,
);
