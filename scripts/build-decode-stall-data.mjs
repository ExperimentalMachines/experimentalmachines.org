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

// Chat sessions on phone D: the XO thermistor's mean over each 30 s, minutes from the session's start.
export const sessionHeat: { label: string; pause: string; minutes: number; peak: number; points: [number, number][] }[] = ${JSON.stringify(sessions, null, 2)};
`;
writeFileSync(new URL("../lib/decode-stall-data.ts", import.meta.url), out);
console.log(
  `lib/decode-stall-data.ts from ${commit.slice(0, 12)}: held ${held.with.progress.length}/${held.without.progress.length} progress lines, guard ${JSON.stringify(held.with.guard)}; short guard ${JSON.stringify(short.with.guard)}; sessions ${sessions.map((s) => `${s.label} ${s.minutes} min peak ${s.peak}`).join(", ")}`,
);
