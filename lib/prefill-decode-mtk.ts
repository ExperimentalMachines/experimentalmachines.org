// The prefill/decode matrix on a Dimensity 9300+ tablet and a Snapdragon 8 Gen 3 phone, for
// /research/dimensity-9300-snapdragon-8-gen-3.
// The cells are generated (lib/prefill-decode-mtk-data.ts, from scripts/build-prefill-decode-mtk-data.mjs).
// The facts below come from the OpenWeights run notes (tools/mediatek/results/2026-11-16-mt6989/NOTES.md),
// the result files and logs beside them, and readings taken from the tablets. Change them there first.

import type { PhoneSpec } from "./prefill-decode";
import { mtkSource, type MtkCell, type MtkModel } from "./prefill-decode-mtk-data";

export {
  mtkHot,
  mtkModels,
  mtkSessions,
  sdDropped,
  sdExtra,
  sdModels,
  sdShared,
  sdTwins,
  type MtkCell,
  type MtkModel,
  type MtkProbe,
  type MtkSession,
} from "./prefill-decode-mtk-data";

const repo = "https://github.com/ExperimentalMachines/openweights";
// A preview generated from uncommitted files links to main; a published page is generated from a commit.
const ref = mtkSource.commit === "worktree" ? "main" : mtkSource.commit;

export const mtkLinks = {
  notes: `${repo}/blob/${ref}/${mtkSource.dir}/NOTES.md`,
  results: `${repo}/tree/${ref}/${mtkSource.dir}`,
  bench: `${repo}/tree/${ref}/tools/mediatek`,
  sdNotes: `${repo}/blob/${ref}/tools/snapdragon/results/2026-11-16-s24/NOTES.md`,
  sdResults: `${repo}/tree/${ref}/tools/snapdragon/results/2026-11-16-s24`,
  sdBench: `${repo}/blob/${ref}/tools/snapdragon/pd_bench_sd.cpp`,
};

export const processors = ["CPU", "GPU", "NPU"] as const;

// Read from the tablets over adb (session 6, unit 317808dd, 2026-11-16): ro.product.model SM-X820,
// ro.soc.model MT6989, Android 16; cpufreq policies 0 (cpu0-3, 2.0 GHz), 4 (cpu4-6, 2.85 GHz) and 7
// (cpu7, 3.4 GHz); CPU parts 0xd81 (Cortex-A720) on cpu0-3 and 0xd82 (Cortex-X4) on cpu4-7; the Vulkan
// device llama.cpp found, Mali-G720-Immortalis MC12; MemTotal 11,803,532 kB (11.3 GiB). The NPU's name
// is MediaTek's, from its Dimensity 9300+ product page; the tablet does not report one.
export const mtkSpec: PhoneSpec = {
  name: "Samsung Galaxy Tab S10+",
  chip: "MediaTek Dimensity 9300+ (MT6989)",
  used: "The MediaTek device",
  clusters: [
    { cores: [0, 1, 2, 3], type: "Cortex-A720", ghz: 2.0 },
    { cores: [4, 5, 6], type: "Cortex-X4", ghz: 2.85 },
    { cores: [7], type: "Cortex-X4", ghz: 3.4 },
  ],
  rows: [
    ["GPU", "Mali-G720 Immortalis MC12"],
    ["NPU", "MediaTek APU 790 (MediaTek's name), through NeuroPilot"],
    ["Memory", "11.3 GiB visible to Android"],
    ["Software", "Android 16, shell only (no root)"],
    ["Where", "Firebase Device Streaming"],
  ],
};

// Read from the S24 Ultra units over adb (sessions s24a and s24b, 2026-11-16): ro.product.model SM-S928B,
// ro.soc.model SM8650, Android 16; CPU parts 0xd80 (Cortex-A520) on cpu0-1, 0xd81 (Cortex-A720) on cpu2-6,
// 0xd82 (Cortex-X4) on cpu7; cpufreq policy0 2.27 GHz, policy2 3.15, policy5 2.96, policy7 3.40; OpenCL
// device "QUALCOMM Adreno(TM) 750", kgsl max_gpuclk 1,000 MHz; llama.cpp's Hexagon backend: arch v75, 4 HVX
// units, 1 HMX, 8 MB VTCM; MemTotal 11,351,852 kB (10.8 GiB). The six later units (sessions s24c to s24h)
// reported ro.product.model SM-S928B or SM-S928U1 (the US model), every one ro.soc.model SM8650.
export const sdSpec: PhoneSpec = {
  name: "Samsung Galaxy S24 Ultra",
  chip: "Snapdragon 8 Gen 3 (SM8650)",
  used: "The Snapdragon device",
  clusters: [
    { cores: [0, 1], type: "Cortex-A520", ghz: 2.27 },
    { cores: [2, 3, 4], type: "Cortex-A720", ghz: 3.15 },
    { cores: [5, 6], type: "Cortex-A720", ghz: 2.96 },
    { cores: [7], type: "Cortex-X4", ghz: 3.4 },
  ],
  rows: [
    ["GPU", "Adreno 750, limited to 1.0 GHz"],
    ["NPU", "Hexagon v75, through llama.cpp"],
    ["Memory", "10.8 GiB visible to Android"],
    ["Software", "Android 16, shell only (no root)"],
    ["Where", "Firebase Device Streaming"],
    ["Variants", "SM-S928B and SM-S928U1, both SM8650"],
  ],
};

export const mtkRun = {
  dates: "15 to 17 November 2026",
  llamacpp: "b2e5e9b (release b10549)",
  executorch: "v1.6.0",
  // The NPU exports' window: a 4,096-token export took 6.5 GB of kernel memory and, with the GPU's copy
  // of the model loaded beside it, restarted the tablet twice (session 3, kp1 and kp2).
  windowTokens: 2048,
  gate: { limitC: 55, maxS: 120 },
};

export type MtkPair = { prefill: (typeof processors)[number]; decode: (typeof processors)[number]; cell: MtkCell };

// The pairings a model ran; a null cell did not fit in the tablet's memory and is not a pairing here.
export const pairs = (m: MtkModel): MtkPair[] => m.cells.flatMap((row, i) => row.flatMap((cell, j) => (cell ? [{ prefill: processors[i], decode: processors[j], cell }] : [])));

// One processor's pooled rate against another's within a model, when both ran (index: CPU 0, GPU 1, NPU 2).
export const rateRatio = (xs: ({ tokS: number } | null)[], a: number, b: number) => (xs[a] && xs[b] ? xs[a]!.tokS / xs[b]!.tokS : null);

export const ranked = (m: MtkModel) => pairs(m).sort((a, b) => a.cell.seconds - b.cell.seconds);

export const name = (p: { prefill: string; decode: string }) => `${p.prefill} → ${p.decode}`;

// Memory (NOTES.md, sessions 8, 10 and 11): Qwen3 1.7B's A16W4 NPU export took MemAvailable from 8.1 GB
// to 1.7 GB while running (6.4 GB: kernel vmalloc +3.8 GB, the process 0.7 GB, the rest most likely DMA
// buffers), leaving no room for llama.cpp's copy (2,232 MB needed with the margin set after session 3's
// out-of-memory kernel panics). Llama 3.2 3B's ran alone with 636 MB left at its lowest; Qwen3 4B's was
// refused before loading (7,098 MB available, and the 1.7B's use suggests about 10 GB needed).
export const mtkMemory = { qwen17Gb: 6.4, leftMb: 1463, neededMb: 2232, llama3bLowMb: 636 };
