// The prefill/decode matrix on a Snapdragon 8 Elite Gen 5, for /research/prefill-decode.
// The cells are generated (lib/prefill-decode-data.ts, from scripts/build-prefill-decode-data.mjs).
// The facts below come from the OpenWeights report (docs/research/snapdragon-pd-matrix.md, sections
// "All nine pairings at reply length" and "Why the CPU's reply gets stuck"), its result files and logs,
// readings taken from the phone, and the llama.cpp and app code. Change them there first.

import { pdSource, type PdCell, type PdModel } from "./prefill-decode-data";

export { pdModels, pdNewTokens, pdReplyTokens, pdStuck, pdTurns, pdWarm, type PdCell, type PdModel } from "./prefill-decode-data";

const repo = "https://github.com/ExperimentalMachines/openweights";
// A preview generated from uncommitted files links to main; a published page is generated from a commit.
const ref = pdSource.commit === "worktree" ? "main" : pdSource.commit;

export const pdLinks = {
  report: `${repo}/blob/${ref}/docs/research/snapdragon-pd-matrix.md#all-nine-pairings-at-reply-length-r12-to-r16`,
  results: `${repo}/tree/${ref}/${pdSource.dir}`,
};

export const processors = ["CPU", "GPU", "NPU"] as const;
export type Processor = (typeof processors)[number];

export const pdPhone = {
  soc: "Snapdragon 8 Elite Gen 5 (SM8850)",
  dates: "2 to 4 November 2026",
  llamacpp: "b2e5e9b (release b10549)",
};

// What the benchmark and the loggers read. The cooling wait (pd_bench.cpp, cool_down and heat) reads
// the hottest cpu-0-*/cpu-1-*, gpuss-* and nsphvx-*/nsphmx-* zones, the GPU's kgsl thermal_pwrlevel and
// each CPU policy's scaling_max_freq against cpuinfo_max_freq. The XO thermistor is sys-therm-0, which
// the device tree wires to ADC channel 0x44 of the PMK8850 power-management chip, labelled
// pmk8850_xo_therm. The throttle switches are the cooling devices thermal-pause-C0, thermal-pause-3C,
// kgsl and cdsp.
export const pdSensors = [
  { sensor: "Processor temperatures", what: "The hottest of each processor's own sensors: CPU, GPU and NPU", use: "When a pairing may start" },
  { sensor: "Clock ceilings", what: "The highest clock the phone currently allows each CPU core group and the GPU", use: "Seeing the soft throttle" },
  {
    sensor: "XO thermistor",
    what: "A temperature sensor on the board, read by the phone's power-management chip and named for the crystal oscillator (XO) that clocks the chip",
    use: "It switches the hard throttle",
  },
  { sensor: "Throttle switches", what: "The phone's switches named thermal-pause-C0, thermal-pause-3C, kgsl and cdsp", use: "Seeing the hard throttle" },
];

// The cooling wait before each pairing.
export const pdGate = { limitC: 55, pollS: 5, maxS: 120 };

// Warming up and cooling down. Cool starts read 40.7 to 52.1 C when the wait passed at once (r12 to
// r16). The soft throttle first appeared 0.7 to 7.0 minutes after a cool start (r12, r13, r14, r15warm,
// r16warm), with the CPU's sensors anywhere from about 70 to 105 C at that turn. After r14 ended, the
// GPU cap was still on 1.4 minutes later and gone 8.2 minutes later (thermlog-r14, thermlog-r15), and
// r15warm's wait found full CPU ceilings 9.6 minutes after. The hard throttle: a 78 C passive trip with
// 8 C hysteresis on sys-therm-0, shared by all four switches; the 2 s log (trig-r16.txt) shows the first
// readings after each switch at 78.08 to 78.14 C and 69.73 to 69.91 C.
export const pdTrigger = { onC: 78, offC: 70 };

// What each throttle does to each processor, from matched turns on one phone. Soft: Qwen3 4B GPU ->
// CPU, the 9 turns r14 ran with nothing capped (1,200 MHz GPU, full CPU ceilings) against the same turns
// in r16 (578 MHz, 1.90 and 2.23 GHz), phone C. NPU, soft: LFM2.5 2.6B's NPU-only cell, 599.8, 601.8
// and 597.5 s in r10, r11 and r13 on phone B. Hard, NPU: analysis-r14-heat.md and analysis-r13-heat.md
// (turns at least half under cdsp above 0 against the same turn without) and Qwen3 1.7B's three GPU ->
// NPU turns in the 18:12 hard throttle (r16) against the same turns in its other NPU-decode cells.
// GPU decode, soft: r21 on phone B (2026-11-09), the same three Qwen3 4B turns with the 578 MHz cap set by
// hand (kgsl max_pwrlevel 8) after a cooling gate against six uncapped probes, 0.635 to 0.769 (r20's thermal cap on
// a hot phone gave 0.64 to 0.80 against one). CPU, soft, second figure: r25, the soft throttle's ceilings
// written to scaling_max_freq after a cooling gate, decode 0.803 to 0.828 of no ceiling set. GPU, hard: r24, the
// CPU pause switches set by hand after a cooling gate, GPU decode 0.984 to 1.002 of the same turns without (r20's
// natural pauses: 0.997 and 0.994). The GPU's allowed ceiling read 578 MHz in every 2 s sample through r20's
// natural hard throttles (trig-r20b.txt).
export const pdThrottle = {
  soft: {
    CPU: {
      what: "Clock ceilings cut about in half: 6 cores from 3.63 to 1.90 GHz, 2 cores from 4.61 to 2.23 GHz",
      seen: "Decode 21% slower (17.1 to 13.6 tok/s), steady. The same ceilings set by hand after a cooling gate left decode at 80% to 83% of its rate with no ceiling set",
    },
    GPU: {
      what: "Clock capped at 578 MHz, from 1.2 GHz",
      seen:
        "Prefill about half as fast (202 to 105 tok/s). The same cap set by hand after a cooling gate left decode at 64% to 77% of uncapped, close to what the thermal cap gave on a hot phone",
    },
    NPU: { what: "No visible limit; its clock cannot be read", seen: "No slowdown found: an NPU-only pairing repeated within 1% with the soft throttle on and off" },
  },
  hard: {
    // "seen" for the CPU is filled in on the page from the generated stuck-turn figures.
    CPU: { what: "6 of its 8 cores paused, leaving cores 0 and 1 (going by the switches' names)", seen: "" },
    GPU: {
      what: "Its cap stayed at 578 MHz",
      seen: "Little or no extra slowdown: pausing the CPU cores by hand cut GPU decode by at most 1.6% among the turn medians, and no prefill slowdown was found",
    },
    NPU: { what: "Slowed", seen: "Decode at about half to two thirds of its speed at the median, never stuck" },
  },
};

// Heat spreads across the chip: Llama 3.2 3B in r14, median of each processor's hottest sensor at the
// end of a turn. In the CPU-only cell the NPU and GPU copies of the model are loaded but idle.
export const pdSpread = { cpuOnlyNpuC: 94, npuOnlyCpuC: 95 };

// From earlier cooling-device logs (thermlog-r13 and -r14; analysis-r14-heat.md), and Qwen3 1.7B's first
// run on phone B, whose first pairing started with the GPU at full clock: on the 14 turns uncapped at
// both ends the capped CPU decoded faster in 39 of 39 matched turn pairs. Qwen3 4B's median GPU decode
// step by context length.
export const pdThermal = {
  stretchMinutes: [0.6, 13.9],
  gpuUncapped: { turns: 14, pairs: 39 },
  gpuStep4b: { before: 107, after: 430 },
};

// Why CPU decode gets stuck. From the 2 s log of the XO thermistor and the switches (trig-r16.txt) beside
// r16's turns, the 5 s affinity log, llama.cpp's CPU backend (ggml_barrier in ggml-cpu.c at the vendored
// commit), Android's thermal service and the app's ThermalPolicy.kt and ModelRuntime.kt.
export const pdStall = {
  // Llama 3.2 3B's reserved graph for one token (log-r14: "graph nodes = 874"); skipped and fused nodes
  // mean this is not an exact count of thread waits.
  graphNodes: 874,
  // A fourth phone (D, unit 4816891, r18b; trig-r18.txt) logged five hard throttles at the same switch
  // points: first readings after each switch on 78.00 to 78.20 C, after each switch off 69.69 to 69.93 C.
  phoneD: { events: 5, onC: [78.0, 78.2], offC: [69.7, 69.9] },
  // Six hard throttles the 2 s log caught on 3 November, local time, with who was decoding.
  events: [
    { on: "18:00:50", off: "18:01:51", seconds: 61, decode: "CPU", model: "Qwen3 1.7B", stuck: "18:00:50 to 18:01:51" },
    { on: "18:12:04", off: "18:13:29", seconds: 85, decode: "NPU", model: "Qwen3 1.7B", stuck: "" },
    { on: "18:51:27", off: "18:52:26", seconds: 59, decode: "CPU", model: "Qwen3 4B", stuck: "18:51:27 to 18:52:24" },
    { on: "18:55:43", off: "18:56:48", seconds: 65, decode: "CPU", model: "Qwen3 4B", stuck: "18:55:48 to 18:56:47" },
    { on: "19:00:31", off: "19:01:33", seconds: 62, decode: "CPU", model: "Qwen3 4B", stuck: "19:00:32 to 19:01:33" },
    { on: "19:05:20", off: "19:06:27", seconds: 67, decode: "CPU", model: "Qwen3 4B", stuck: "19:05:23 to 19:06:25" },
  ],
  // Android's own heat signal, the one an app reads: two readings about 20 minutes apart (17:38 and
  // 17:59 local; phone-evidence-2026-11-03.md), and this phone's skin thresholds (light 48, moderate 49,
  // severe 50, critical 60, emergency 61, shutdown 90).
  android: [
    { status: "severe", skinC: 57.8 },
    { status: "emergency", skinC: 64.1 },
  ],
  // The app's decode threads, set once before each reply: 4 here (half the cores), 3 at light or
  // moderate, 2 at severe; at critical or above it does not start the reply.
  app: { normal: 4, light: 3, severe: 2 },
};

export type PdPair = { prefill: Processor; decode: Processor; cell: PdCell };

export const pairs = (m: PdModel): PdPair[] =>
  m.cells.flatMap((row, i) => row.map((cell, j) => ({ prefill: processors[i], decode: processors[j], cell })));

// Only cells that did not start cool are ranked or compared.
export const ranked = (m: PdModel) => pairs(m).filter((p) => !p.cell.coolStart).sort((a, b) => a.cell.seconds - b.cell.seconds);

export const name = (p: { prefill: string; decode: string }) => `${p.prefill} → ${p.decode}`;
