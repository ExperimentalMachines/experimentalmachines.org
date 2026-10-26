// OpenWeights' reruns of the window matrix, copied from the page they were
// first published on, experimentalmachines.github.io/openweights/reruns.html
// (gh-pages 1f00e53): its DATA, CHIPS and ORDER tables, values as published.
// Run on 2026-09-07 on a Poco X8 Pro in hand and three phones on Firebase Test
// Lab. Each phone's colour and marker shape are in components/openweights/chips.tsx.

const repo = "https://github.com/ExperimentalMachines/openweights";
const hf = "https://huggingface.co/alpharomercoma";

export const rerunsLinks = {
  results: `${repo}/tree/main/tools/eval/results`,
  note: `${repo}/blob/main/docs/research/executorch-window-matrix.md`,
  // The page's Qwen3 link redirects here. Its two LFM2.5 export repositories
  // no longer resolve, so the page names them without a link.
  qwen3: `${hf}/Qwen3-1.7B-ExecuTorch`,
};

export type RerunsPhoneId = "D9400" | "8 Elite" | "Tensor G5" | "Exynos 2400";

// RAM is the manufacturer's figure for each device, in GB.
export const rerunsPhones: { id: RerunsPhoneId; name: string; short: string; device: string; ram: number }[] = [
  { id: "D9400", name: "Dimensity 9400", short: "Dimensity 9400", device: "Poco X8 Pro", ram: 12 },
  { id: "8 Elite", name: "Snapdragon 8 Elite", short: "8 Elite", device: "Galaxy S25 Ultra", ram: 12 },
  { id: "Tensor G5", name: "Tensor G5", short: "Tensor G5", device: "Pixel 10 Pro XL", ram: 16 },
  { id: "Exynos 2400", name: "Exynos 2400", short: "Exynos 2400", device: "Galaxy S24+", ram: 12 },
];

// The order rows are drawn in.
export const rerunsOrder: RerunsPhoneId[] = ["D9400", "8 Elite", "Tensor G5", "Exynos 2400"];

// LFM2.5-2.6B, prompts passed out of 30 at the suite's 640-token reply cap and
// at the 2048-token rerun, per phone and window.
export const rerunsCaps: {
  phone: RerunsPhoneId;
  window: string;
  gsm8k_640: string;
  ifeval_640: string;
  gsm8k_2048: string;
  ifeval_2048: string;
}[] = [
  { phone: "8 Elite", window: "32k", gsm8k_640: "13/30", ifeval_640: "5/30", gsm8k_2048: "24/30", ifeval_2048: "21/30" },
  { phone: "8 Elite", window: "4k", gsm8k_640: "13/30", ifeval_640: "5/30", gsm8k_2048: "25/30", ifeval_2048: "19/30" },
  { phone: "D9400", window: "2k", gsm8k_2048: "24/30", ifeval_2048: "21/30", gsm8k_640: "15/30", ifeval_640: "4/30" },
  { phone: "D9400", window: "32k", gsm8k_2048: "26/30", ifeval_2048: "21/30", gsm8k_640: "13/30", ifeval_640: "5/30" },
  { phone: "Exynos 2400", window: "32k", gsm8k_640: "18/30", ifeval_640: "3/30", gsm8k_2048: "27/30", ifeval_2048: "19/30" },
  { phone: "Exynos 2400", window: "4k", gsm8k_640: "10/30", ifeval_640: "5/30", gsm8k_2048: "25/30", ifeval_2048: "21/30" },
  { phone: "Tensor G5", window: "32k", gsm8k_640: "19/30", ifeval_640: "4/30", gsm8k_2048: "28/30", ifeval_2048: "18/30" },
  { phone: "Tensor G5", window: "4k", gsm8k_640: "17/30", ifeval_640: "6/30", gsm8k_2048: "23/30", ifeval_2048: "21/30" },
];

// How the 60 GSM8K and IFEval replies of each 2048-cap cell ended: finished,
// cut by the window (edge) or cut by the reply cap.
export const rerunsCuts: { phone: RerunsPhoneId; window: string; n: number; finished: number; edge: number; cap: number }[] = [
  { phone: "8 Elite", window: "32k", n: 60, finished: 45, edge: 0, cap: 15 },
  { phone: "8 Elite", window: "4k", n: 60, finished: 49, edge: 0, cap: 11 },
  { phone: "D9400", window: "2k", n: 60, finished: 46, edge: 14, cap: 0 },
  { phone: "D9400", window: "32k", n: 60, finished: 50, edge: 0, cap: 10 },
  { phone: "Exynos 2400", window: "32k", n: 60, finished: 50, edge: 0, cap: 10 },
  { phone: "Exynos 2400", window: "4k", n: 60, finished: 47, edge: 0, cap: 13 },
  { phone: "Tensor G5", window: "32k", n: 60, finished: 48, edge: 0, cap: 12 },
  { phone: "Tensor G5", window: "4k", n: 60, finished: 47, edge: 0, cap: 13 },
];

// Dimensity 9400, 2048 cap: [reply tokens, prompt tokens, set, grade] for each
// of the 60 replies at the 2k and the 32k window.
export const rerunsLengths: Record<"2k" | "32k", [number, number, string, string][]> = {
  "2k": [
    [886, 114, "gsm8k", "pass"], [1924, 123, "gsm8k", "fail"], [468, 103, "gsm8k", "pass"], [684, 84, "gsm8k", "pass"],
    [382, 80, "gsm8k", "pass"], [872, 88, "gsm8k", "fail"], [633, 99, "gsm8k", "pass"], [1974, 73, "gsm8k", "fail"],
    [446, 71, "gsm8k", "pass"], [1226, 83, "gsm8k", "pass"], [274, 69, "gsm8k", "pass"], [584, 84, "gsm8k", "pass"],
    [1233, 141, "gsm8k", "pass"], [964, 106, "gsm8k", "pass"], [435, 66, "gsm8k", "pass"], [422, 71, "gsm8k", "pass"],
    [552, 67, "gsm8k", "pass"], [733, 82, "gsm8k", "pass"], [555, 103, "gsm8k", "pass"], [363, 63, "gsm8k", "pass"],
    [1177, 61, "gsm8k", "pass"], [1958, 89, "gsm8k", "fail"], [786, 83, "gsm8k", "pass"], [529, 63, "gsm8k", "pass"],
    [784, 102, "gsm8k", "fail"], [646, 72, "gsm8k", "pass"], [1120, 125, "gsm8k", "pass"], [990, 191, "gsm8k", "pass"],
    [1919, 128, "gsm8k", "fail"], [246, 67, "gsm8k", "pass"], [1996, 51, "ifeval", "fail"], [2012, 35, "ifeval", "fail"],
    [544, 59, "ifeval", "pass"], [1982, 65, "ifeval", "fail"], [1210, 58, "ifeval", "pass"], [2017, 30, "ifeval", "fail"],
    [1195, 51, "ifeval", "pass"], [1982, 65, "ifeval", "fail"], [1986, 61, "ifeval", "pass"], [753, 49, "ifeval", "pass"],
    [1753, 38, "ifeval", "pass"], [2002, 45, "ifeval", "fail"], [1539, 56, "ifeval", "pass"], [1026, 219, "ifeval", "pass"],
    [797, 50, "ifeval", "pass"], [1008, 84, "ifeval", "pass"], [813, 101, "ifeval", "pass"], [1956, 91, "ifeval", "fail"],
    [729, 51, "ifeval", "pass"], [1697, 101, "ifeval", "pass"], [876, 80, "ifeval", "pass"], [426, 58, "ifeval", "pass"],
    [610, 94, "ifeval", "pass"], [1973, 74, "ifeval", "fail"], [800, 69, "ifeval", "pass"], [1490, 32, "ifeval", "pass"],
    [1442, 35, "ifeval", "pass"], [1738, 43, "ifeval", "pass"], [1967, 80, "ifeval", "fail"], [1356, 31, "ifeval", "pass"],
  ],
  "32k": [
    [915, 114, "gsm8k", "pass"], [1502, 123, "gsm8k", "pass"], [983, 103, "gsm8k", "pass"], [664, 84, "gsm8k", "pass"],
    [364, 80, "gsm8k", "pass"], [736, 88, "gsm8k", "pass"], [336, 99, "gsm8k", "pass"], [985, 73, "gsm8k", "pass"],
    [391, 71, "gsm8k", "pass"], [729, 83, "gsm8k", "pass"], [289, 69, "gsm8k", "pass"], [379, 84, "gsm8k", "pass"],
    [2047, 141, "gsm8k", "fail"], [683, 106, "gsm8k", "pass"], [273, 66, "gsm8k", "pass"], [345, 71, "gsm8k", "pass"],
    [678, 67, "gsm8k", "pass"], [630, 82, "gsm8k", "pass"], [504, 103, "gsm8k", "pass"], [457, 63, "gsm8k", "fail"],
    [806, 61, "gsm8k", "pass"], [589, 89, "gsm8k", "pass"], [591, 83, "gsm8k", "pass"], [836, 63, "gsm8k", "pass"],
    [1204, 102, "gsm8k", "fail"], [892, 72, "gsm8k", "pass"], [896, 125, "gsm8k", "pass"], [1395, 191, "gsm8k", "fail"],
    [1823, 128, "gsm8k", "pass"], [442, 67, "gsm8k", "pass"], [2047, 51, "ifeval", "fail"], [2047, 35, "ifeval", "fail"],
    [530, 59, "ifeval", "pass"], [2047, 65, "ifeval", "fail"], [1537, 58, "ifeval", "pass"], [2030, 30, "ifeval", "fail"],
    [1220, 51, "ifeval", "pass"], [2047, 65, "ifeval", "fail"], [2004, 61, "ifeval", "pass"], [937, 49, "ifeval", "pass"],
    [2047, 38, "ifeval", "pass"], [2047, 45, "ifeval", "fail"], [1537, 56, "ifeval", "pass"], [1004, 219, "ifeval", "pass"],
    [812, 50, "ifeval", "pass"], [677, 84, "ifeval", "pass"], [1370, 101, "ifeval", "pass"], [1207, 91, "ifeval", "fail"],
    [1162, 51, "ifeval", "pass"], [2047, 101, "ifeval", "pass"], [1224, 80, "ifeval", "pass"], [746, 58, "ifeval", "pass"],
    [853, 94, "ifeval", "pass"], [2047, 74, "ifeval", "fail"], [1087, 69, "ifeval", "pass"], [1227, 32, "ifeval", "pass"],
    [522, 35, "ifeval", "pass"], [1014, 43, "ifeval", "pass"], [2047, 80, "ifeval", "fail"], [934, 31, "ifeval", "pass"],
  ],
};

// Same file, same prompts, same phone, run twice: replies byte-identical
// (raw stream and shown text over n prompts, parsed calls over nbfcl BFCL
// prompts) and each set's grade in the first and the second run.
type Grades = { gsm8k: number; ifeval: number; bfcl: number };
export const rerunsControls: {
  model: string;
  window: string;
  phone: RerunsPhoneId;
  raw: number;
  content: number;
  calls: number;
  nbfcl: number;
  n: number;
  first: Grades;
  second: Grades;
}[] = [
  { model: "LFM2.5-1.2B", window: "16k", phone: "D9400", raw: 13, content: 20, calls: 23, nbfcl: 30, n: 90, first: { gsm8k: 13, ifeval: 20, bfcl: 27 }, second: { gsm8k: 14, ifeval: 16, bfcl: 28 } },
  { model: "LFM2.5-1.2B", window: "32k", phone: "D9400", raw: 15, content: 18, calls: 25, nbfcl: 30, n: 90, first: { gsm8k: 12, ifeval: 18, bfcl: 27 }, second: { gsm8k: 12, ifeval: 15, bfcl: 27 } },
  { model: "LFM2.5-2.6B", window: "2k", phone: "D9400", raw: 0, content: 29, calls: 24, nbfcl: 30, n: 90, first: { gsm8k: 15, ifeval: 4, bfcl: 24 }, second: { gsm8k: 13, ifeval: 6, bfcl: 24 } },
  { model: "Qwen3-1.7B", window: "2k", phone: "D9400", raw: 31, content: 31, calls: 30, nbfcl: 30, n: 90, first: { gsm8k: 20, ifeval: 15, bfcl: 24 }, second: { gsm8k: 17, ifeval: 18, bfcl: 24 } },
  { model: "LFM2.5-1.2B", window: "4k", phone: "Exynos 2400", raw: 7, content: 11, calls: 23, nbfcl: 30, n: 90, first: { gsm8k: 13, ifeval: 17, bfcl: 26 }, second: { gsm8k: 15, ifeval: 21, bfcl: 27 } },
];

// Qwen3-1.7B at 32k: resident memory after load in MB, prompts completed of
// 90, and what the log says stopped it.
export const rerunsKills: { phone: RerunsPhoneId; device: string; ram: number; prompts: number; rss: number; cause: string }[] = [
  { phone: "D9400", device: "Poco X8 Pro", ram: 12, prompts: 6, rss: 6188, cause: "MIUI ActivityManager, 6 GB PSS threshold (rerun: 7 prompts, 8.65 GB)" },
  { phone: "8 Elite", device: "Galaxy S25 Ultra", ram: 12, prompts: 12, rss: 6127, cause: "Samsung Heimdall, 6 GB threshold (8.67 GB used)" },
  { phone: "Exynos 2400", device: "Galaxy S24+", ram: 12, prompts: 7, rss: 6396, cause: "Samsung Heimdall, 6 GB threshold" },
  { phone: "Tensor G5", device: "Pixel 10 Pro XL", ram: 16, prompts: 90, rss: 8499, cause: "finished all 90" },
];

// Each rerun (b) beside the earlier run of the same cell (a): medians of
// prefill ms (ttft), ms per output token (tpot), prefill and decode tok/s, and
// resident memory after load and at the end in MB ("-" where not logged).
export type RerunsRun = { name: string; ttft: number; tpot: number; pre: number; dec: number; rss: string; rss_end: string };
export const rerunsTiming: { kind: "cap" | "repeat"; label: string; phone: RerunsPhoneId; window: string; a: RerunsRun; b: RerunsRun }[] = [
  { kind: "cap", label: "LFM2.5-2.6B", phone: "D9400", window: "2k", a: { name: "640 cap, 90 prompts", ttft: 882, tpot: 60.3, pre: 108, dec: 16.6, rss: "1979", rss_end: "1958" }, b: { name: "2048 cap, 60 prompts", ttft: 693, tpot: 62.8, pre: 105, dec: 15.9, rss: "1959", rss_end: "1783" } },
  { kind: "cap", label: "LFM2.5-2.6B", phone: "8 Elite", window: "4k", a: { name: "640 cap, 90 prompts", ttft: 1197, tpot: 55.4, pre: 72, dec: 18, rss: "2058", rss_end: "2194" }, b: { name: "2048 cap, 60 prompts", ttft: 866, tpot: 51.1, pre: 82, dec: 19.6, rss: "2055", rss_end: "2139" } },
  { kind: "cap", label: "LFM2.5-2.6B", phone: "Tensor G5", window: "4k", a: { name: "640 cap, 90 prompts", ttft: 1066, tpot: 92.2, pre: 88, dec: 10.8, rss: "2054", rss_end: "2221" }, b: { name: "2048 cap, 60 prompts", ttft: 776, tpot: 81.9, pre: 106, dec: 12.2, rss: "2055", rss_end: "2188" } },
  { kind: "cap", label: "LFM2.5-2.6B", phone: "Exynos 2400", window: "4k", a: { name: "640 cap, 90 prompts", ttft: 1142, tpot: 83.5, pre: 81, dec: 12, rss: "2136", rss_end: "2189" }, b: { name: "2048 cap, 60 prompts", ttft: 893, tpot: 87.1, pre: 84, dec: 11.5, rss: "2136", rss_end: "2187" } },
  { kind: "cap", label: "LFM2.5-2.6B", phone: "D9400", window: "32k", a: { name: "640 cap, 90 prompts", ttft: 882, tpot: 59.7, pre: 109, dec: 16.8, rss: "2937", rss_end: "2185" }, b: { name: "2048 cap, 60 prompts", ttft: 621, tpot: 59.5, pre: 113, dec: 16.8, rss: "2922", rss_end: "2262" } },
  { kind: "cap", label: "LFM2.5-2.6B", phone: "8 Elite", window: "32k", a: { name: "640 cap, 90 prompts", ttft: 1096, tpot: 49.7, pre: 81, dec: 20.1, rss: "2950", rss_end: "3082" }, b: { name: "2048 cap, 60 prompts", ttft: 982, tpot: 54.5, pre: 80, dec: 18.4, rss: "2950", rss_end: "2626" } },
  { kind: "cap", label: "LFM2.5-2.6B", phone: "Tensor G5", window: "32k", a: { name: "640 cap, 90 prompts", ttft: 968, tpot: 81.1, pre: 101, dec: 12.3, rss: "2962", rss_end: "3120" }, b: { name: "2048 cap, 60 prompts", ttft: 842, tpot: 102.4, pre: 80, dec: 9.8, rss: "2962", rss_end: "3123" } },
  { kind: "cap", label: "LFM2.5-2.6B", phone: "Exynos 2400", window: "32k", a: { name: "640 cap, 90 prompts", ttft: 1085, tpot: 84.5, pre: 80, dec: 11.8, rss: "3032", rss_end: "3084" }, b: { name: "2048 cap, 60 prompts", ttft: 924, tpot: 87.8, pre: 82, dec: 11.4, rss: "3028", rss_end: "3080" } },
  { kind: "repeat", label: "LFM2.5-1.2B", phone: "Exynos 2400", window: "4k", a: { name: "first run", ttft: 460, tpot: 34, pre: 195, dec: 29.4, rss: "1126", rss_end: "1213" }, b: { name: "second run", ttft: 516, tpot: 37.5, pre: 180, dec: 26.7, rss: "1126", rss_end: "1217" } },
  { kind: "repeat", label: "LFM2.5-1.2B", phone: "D9400", window: "16k", a: { name: "first run", ttft: 354, tpot: 25.9, pre: 262, dec: 38.6, rss: "-", rss_end: "993" }, b: { name: "second run", ttft: 368, tpot: 26.2, pre: 259, dec: 38.2, rss: "1416", rss_end: "1528" } },
  { kind: "repeat", label: "LFM2.5-1.2B", phone: "D9400", window: "32k", a: { name: "first run", ttft: 366, tpot: 26.3, pre: 257, dec: 38, rss: "-", rss_end: "1903" }, b: { name: "second run", ttft: 392, tpot: 28.8, pre: 237, dec: 34.8, rss: "1798", rss_end: "1901" } },
  { kind: "repeat", label: "LFM2.5-2.6B", phone: "D9400", window: "2k", a: { name: "first run", ttft: 882, tpot: 60.3, pre: 108, dec: 16.6, rss: "1979", rss_end: "1958" }, b: { name: "second run", ttft: 872, tpot: 59.6, pre: 110, dec: 16.8, rss: "1984", rss_end: "1871" } },
  { kind: "repeat", label: "Qwen3-1.7B", phone: "D9400", window: "2k", a: { name: "first run", ttft: 532, tpot: 45.1, pre: 174, dec: 22.2, rss: "1758", rss_end: "1833" }, b: { name: "second run", ttft: 532, tpot: 45.7, pre: 174, dec: 21.9, rss: "1766", rss_end: "1900" } },
];
