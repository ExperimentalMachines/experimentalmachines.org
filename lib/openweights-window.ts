// OpenWeights' exported-window study, copied from the page it was first
// published on, experimentalmachines.github.io/openweights/window.html (gh-pages
// 1f00e53): its DATA table, as rendered from the graded reports by
// window_report.py. Values stay the strings the page printed ("17/30", "-",
// "INCOMPLETE: ..."); the figures parse them. Run on 2026-09-07.

const repo = "https://github.com/ExperimentalMachines/openweights";
const hf = "https://huggingface.co/alpharomercoma";

export const windowLinks = {
  note: `${repo}/blob/main/docs/research/executorch-window-matrix.md`,
  tables: `${repo}/blob/main/docs/research/window-matrix.md`,
  results: `${repo}/tree/main/tools/eval/results`,
  // The page's Qwen3 link redirects here. Its two LFM2.5 export repositories
  // no longer resolve, so the page names them without a link.
  qwen: `${hf}/Qwen3-1.7B-ExecuTorch`,
};

// The four conditions the page's picker offers: each model, and the 2.6B twice,
// under the suite's 640-token reply cap and rerun at 2048.
export const windowConditions = [
  { model: "LFM2.5-1.2B-Instruct-8da4w", label: "LFM2.5 1.2B" },
  { model: "LFM2.5-2.6B-8da4w", label: "LFM2.5 2.6B, 640 cap" },
  { model: "LFM2.5-2.6B-8da4w (cap 2048)", label: "LFM2.5 2.6B, 2048 cap" },
  { model: "Qwen3-1.7B-8da4w", label: "Qwen3 1.7B" },
];

// One graded run: a model at one exported window on one phone. A phone id
// ending " repeat" is a second run of the same file on that phone.
export type WindowCell = {
  model: string;
  window: string;
  file: string;
  phone: string;
  gsm8k: string;
  ifeval: string;
  bfcl: string;
  capped: string;
  prefill_ms: string;
  ms_tok: string;
  prefill_tps: string;
  decode_tps: string;
  ran_at: string;
  rss_load: string;
  rss_end: string;
};

export const windowCells: WindowCell[] = [
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "2k", file: "796 MB", phone: "D9400", gsm8k: "17/30", ifeval: "15/30", bfcl: "26/30", capped: "10/90", prefill_ms: "360", ms_tok: "25.9", prefill_tps: "254", decode_tps: "38.7", ran_at: "2048", rss_load: "-", rss_end: "1186" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "4k", file: "798 MB", phone: "D9400", gsm8k: "16/30", ifeval: "17/30", bfcl: "26/30", capped: "12/90", prefill_ms: "363", ms_tok: "26.7", prefill_tps: "253", decode_tps: "37.5", ran_at: "4096", rss_load: "1099", rss_end: "1218" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "4k", file: "798 MB", phone: "8 Elite", gsm8k: "13/30", ifeval: "18/30", bfcl: "28/30", capped: "11/90", prefill_ms: "374", ms_tok: "17.7", prefill_tps: "227", decode_tps: "56.4", ran_at: "4096", rss_load: "1104", rss_end: "1207" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "4k", file: "798 MB", phone: "Tensor G5", gsm8k: "13/30", ifeval: "18/30", bfcl: "27/30", capped: "14/90", prefill_ms: "817", ms_tok: "64.2", prefill_tps: "129", decode_tps: "15.6", ran_at: "4096", rss_load: "1113", rss_end: "1225" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "4k", file: "798 MB", phone: "Exynos 2400", gsm8k: "13/30", ifeval: "17/30", bfcl: "26/30", capped: "11/90", prefill_ms: "460", ms_tok: "34.0", prefill_tps: "195", decode_tps: "29.4", ran_at: "4096", rss_load: "1126", rss_end: "1213" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "4k", file: "798 MB", phone: "Exynos 2400 repeat", gsm8k: "15/30", ifeval: "21/30", bfcl: "27/30", capped: "10/90", prefill_ms: "516", ms_tok: "37.5", prefill_tps: "180", decode_tps: "26.7", ran_at: "4096", rss_load: "1126", rss_end: "1217" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "8k", file: "802 MB", phone: "D9400", gsm8k: "17/30", ifeval: "18/30", bfcl: "26/30", capped: "11/90", prefill_ms: "353", ms_tok: "26.1", prefill_tps: "259", decode_tps: "38.3", ran_at: "8192", rss_load: "1226", rss_end: "1333" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "16k", file: "810 MB", phone: "D9400", gsm8k: "13/30", ifeval: "20/30", bfcl: "27/30", capped: "12/90", prefill_ms: "354", ms_tok: "25.9", prefill_tps: "262", decode_tps: "38.6", ran_at: "16384", rss_load: "-", rss_end: "993" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "16k", file: "810 MB", phone: "D9400 repeat", gsm8k: "14/30", ifeval: "16/30", bfcl: "28/30", capped: "12/90", prefill_ms: "368", ms_tok: "26.2", prefill_tps: "259", decode_tps: "38.2", ran_at: "16384", rss_load: "1416", rss_end: "1528" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "32k", file: "827 MB", phone: "D9400", gsm8k: "12/30", ifeval: "18/30", bfcl: "27/30", capped: "16/90", prefill_ms: "366", ms_tok: "26.3", prefill_tps: "257", decode_tps: "38.0", ran_at: "32768", rss_load: "-", rss_end: "1903" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "32k", file: "827 MB", phone: "D9400 repeat", gsm8k: "12/30", ifeval: "15/30", bfcl: "27/30", capped: "12/90", prefill_ms: "392", ms_tok: "28.8", prefill_tps: "237", decode_tps: "34.8", ran_at: "32768", rss_load: "1798", rss_end: "1901" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "32k", file: "827 MB", phone: "8 Elite", gsm8k: "16/30", ifeval: "13/30", bfcl: "26/30", capped: "11/90", prefill_ms: "324", ms_tok: "16.3", prefill_tps: "261", decode_tps: "61.2", ran_at: "32768", rss_load: "-", rss_end: "1880" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "32k", file: "827 MB", phone: "Tensor G5", gsm8k: "16/30", ifeval: "18/30", bfcl: "27/30", capped: "13/90", prefill_ms: "862", ms_tok: "79.5", prefill_tps: "98", decode_tps: "12.6", ran_at: "32768", rss_load: "-", rss_end: "1896" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "32k", file: "827 MB", phone: "Exynos 2400", gsm8k: "14/30", ifeval: "20/30", bfcl: "25/30", capped: "11/90", prefill_ms: "462", ms_tok: "37.1", prefill_tps: "184", decode_tps: "27.0", ran_at: "32768", rss_load: "-", rss_end: "1883" },
  { model: "LFM2.5-2.6B-8da4w", window: "2k", file: "1783 MB", phone: "D9400", gsm8k: "15/30", ifeval: "4/30", bfcl: "24/30", capped: "42/90", prefill_ms: "882", ms_tok: "60.3", prefill_tps: "108", decode_tps: "16.6", ran_at: "2048", rss_load: "1979", rss_end: "1958" },
  { model: "LFM2.5-2.6B-8da4w", window: "2k", file: "1783 MB", phone: "D9400 repeat", gsm8k: "13/30", ifeval: "6/30", bfcl: "24/30", capped: "43/90", prefill_ms: "872", ms_tok: "59.6", prefill_tps: "110", decode_tps: "16.8", ran_at: "2048", rss_load: "1984", rss_end: "1871" },
  { model: "LFM2.5-2.6B-8da4w", window: "4k", file: "1786 MB", phone: "8 Elite", gsm8k: "13/30", ifeval: "5/30", bfcl: "22/30", capped: "44/90", prefill_ms: "1197", ms_tok: "55.4", prefill_tps: "72", decode_tps: "18.0", ran_at: "4096", rss_load: "2058", rss_end: "2194" },
  { model: "LFM2.5-2.6B-8da4w", window: "4k", file: "1786 MB", phone: "Tensor G5", gsm8k: "17/30", ifeval: "6/30", bfcl: "24/30", capped: "38/90", prefill_ms: "1066", ms_tok: "92.2", prefill_tps: "88", decode_tps: "10.8", ran_at: "4096", rss_load: "2054", rss_end: "2221" },
  { model: "LFM2.5-2.6B-8da4w", window: "4k", file: "1786 MB", phone: "Exynos 2400", gsm8k: "10/30", ifeval: "5/30", bfcl: "23/30", capped: "46/90", prefill_ms: "1142", ms_tok: "83.5", prefill_tps: "81", decode_tps: "12.0", ran_at: "4096", rss_load: "2136", rss_end: "2189" },
  { model: "LFM2.5-2.6B-8da4w", window: "32k", file: "1815 MB", phone: "D9400", gsm8k: "13/30", ifeval: "5/30", bfcl: "24/30", capped: "45/90", prefill_ms: "882", ms_tok: "59.7", prefill_tps: "109", decode_tps: "16.8", ran_at: "32768", rss_load: "2937", rss_end: "2185" },
  { model: "LFM2.5-2.6B-8da4w", window: "32k", file: "1815 MB", phone: "8 Elite", gsm8k: "13/30", ifeval: "5/30", bfcl: "25/30", capped: "42/90", prefill_ms: "1096", ms_tok: "49.7", prefill_tps: "81", decode_tps: "20.1", ran_at: "32768", rss_load: "2950", rss_end: "3082" },
  { model: "LFM2.5-2.6B-8da4w", window: "32k", file: "1815 MB", phone: "Tensor G5", gsm8k: "19/30", ifeval: "4/30", bfcl: "25/30", capped: "37/90", prefill_ms: "968", ms_tok: "81.1", prefill_tps: "101", decode_tps: "12.3", ran_at: "32768", rss_load: "2962", rss_end: "3120" },
  { model: "LFM2.5-2.6B-8da4w", window: "32k", file: "1815 MB", phone: "Exynos 2400", gsm8k: "18/30", ifeval: "3/30", bfcl: "25/30", capped: "39/90", prefill_ms: "1085", ms_tok: "84.5", prefill_tps: "80", decode_tps: "11.8", ran_at: "32768", rss_load: "3032", rss_end: "3084" },
  { model: "LFM2.5-2.6B-8da4w (cap 2048)", window: "2k", file: "1783 MB", phone: "D9400", gsm8k: "24/30", ifeval: "21/30", bfcl: "-", capped: "14/60", prefill_ms: "693", ms_tok: "62.8", prefill_tps: "105", decode_tps: "15.9", ran_at: "2048", rss_load: "1959", rss_end: "1783" },
  { model: "LFM2.5-2.6B-8da4w (cap 2048)", window: "4k", file: "1786 MB", phone: "8 Elite", gsm8k: "25/30", ifeval: "19/30", bfcl: "-", capped: "11/60", prefill_ms: "866", ms_tok: "51.1", prefill_tps: "82", decode_tps: "19.6", ran_at: "4096", rss_load: "2055", rss_end: "2139" },
  { model: "LFM2.5-2.6B-8da4w (cap 2048)", window: "4k", file: "1786 MB", phone: "Tensor G5", gsm8k: "23/30", ifeval: "21/30", bfcl: "-", capped: "13/60", prefill_ms: "776", ms_tok: "81.9", prefill_tps: "106", decode_tps: "12.2", ran_at: "4096", rss_load: "2055", rss_end: "2188" },
  { model: "LFM2.5-2.6B-8da4w (cap 2048)", window: "4k", file: "1786 MB", phone: "Exynos 2400", gsm8k: "25/30", ifeval: "21/30", bfcl: "-", capped: "13/60", prefill_ms: "893", ms_tok: "87.1", prefill_tps: "84", decode_tps: "11.5", ran_at: "4096", rss_load: "2136", rss_end: "2187" },
  { model: "LFM2.5-2.6B-8da4w (cap 2048)", window: "32k", file: "1815 MB", phone: "D9400", gsm8k: "26/30", ifeval: "21/30", bfcl: "-", capped: "10/60", prefill_ms: "621", ms_tok: "59.5", prefill_tps: "113", decode_tps: "16.8", ran_at: "32768", rss_load: "2922", rss_end: "2262" },
  { model: "LFM2.5-2.6B-8da4w (cap 2048)", window: "32k", file: "1815 MB", phone: "8 Elite", gsm8k: "24/30", ifeval: "21/30", bfcl: "-", capped: "15/60", prefill_ms: "982", ms_tok: "54.5", prefill_tps: "80", decode_tps: "18.4", ran_at: "32768", rss_load: "2950", rss_end: "2626" },
  { model: "LFM2.5-2.6B-8da4w (cap 2048)", window: "32k", file: "1815 MB", phone: "Tensor G5", gsm8k: "28/30", ifeval: "18/30", bfcl: "-", capped: "12/60", prefill_ms: "842", ms_tok: "102.4", prefill_tps: "80", decode_tps: "9.8", ran_at: "32768", rss_load: "2962", rss_end: "3123" },
  { model: "LFM2.5-2.6B-8da4w (cap 2048)", window: "32k", file: "1815 MB", phone: "Exynos 2400", gsm8k: "27/30", ifeval: "19/30", bfcl: "-", capped: "10/60", prefill_ms: "924", ms_tok: "87.8", prefill_tps: "82", decode_tps: "11.4", ran_at: "32768", rss_load: "3028", rss_end: "3080" },
  { model: "Qwen3-1.7B-8da4w", window: "2k", file: "1285 MB", phone: "D9400", gsm8k: "20/30", ifeval: "15/30", bfcl: "24/30", capped: "8/90", prefill_ms: "532", ms_tok: "45.1", prefill_tps: "174", decode_tps: "22.2", ran_at: "2048", rss_load: "1758", rss_end: "1833" },
  { model: "Qwen3-1.7B-8da4w", window: "2k", file: "1285 MB", phone: "D9400 repeat", gsm8k: "17/30", ifeval: "18/30", bfcl: "24/30", capped: "7/90", prefill_ms: "532", ms_tok: "45.7", prefill_tps: "174", decode_tps: "21.9", ran_at: "2048", rss_load: "1766", rss_end: "1900" },
  { model: "Qwen3-1.7B-8da4w", window: "2k", file: "1285 MB", phone: "8 Elite", gsm8k: "18/30", ifeval: "13/30", bfcl: "25/30", capped: "12/90", prefill_ms: "673", ms_tok: "41.9", prefill_tps: "141", decode_tps: "23.9", ran_at: "2048", rss_load: "1771", rss_end: "1887" },
  { model: "Qwen3-1.7B-8da4w", window: "2k", file: "1285 MB", phone: "Tensor G5", gsm8k: "23/30", ifeval: "13/30", bfcl: "24/30", capped: "8/90", prefill_ms: "814", ms_tok: "89.3", prefill_tps: "121", decode_tps: "11.2", ran_at: "2048", rss_load: "1772", rss_end: "1892" },
  { model: "Qwen3-1.7B-8da4w", window: "2k", file: "1285 MB", phone: "Exynos 2400", gsm8k: "17/30", ifeval: "12/30", bfcl: "23/30", capped: "10/90", prefill_ms: "734", ms_tok: "65.9", prefill_tps: "125", decode_tps: "15.2", ran_at: "2048", rss_load: "1838", rss_end: "1886" },
  { model: "Qwen3-1.7B-8da4w", window: "32k", file: "1348 MB", phone: "D9400", gsm8k: "INCOMPLETE: process ended after 6/90 prompts", ifeval: "", bfcl: "", capped: "", prefill_ms: "", ms_tok: "", prefill_tps: "", decode_tps: "", ran_at: "32768", rss_load: "6188", rss_end: "5426 (last observed)" },
  { model: "Qwen3-1.7B-8da4w", window: "32k", file: "1348 MB", phone: "8 Elite", gsm8k: "INCOMPLETE: process ended after 12/90 prompts", ifeval: "", bfcl: "", capped: "", prefill_ms: "", ms_tok: "", prefill_tps: "", decode_tps: "", ran_at: "32768", rss_load: "6127", rss_end: "4836 (last observed)" },
  { model: "Qwen3-1.7B-8da4w", window: "32k", file: "1348 MB", phone: "Tensor G5", gsm8k: "16/30", ifeval: "14/30", bfcl: "25/30", capped: "8/90", prefill_ms: "844", ms_tok: "94.0", prefill_tps: "139", decode_tps: "10.6", ran_at: "32768", rss_load: "8499", rss_end: "8602" },
  { model: "Qwen3-1.7B-8da4w", window: "32k", file: "1348 MB", phone: "Exynos 2400", gsm8k: "INCOMPLETE: process ended after 7/90 prompts", ifeval: "", bfcl: "", capped: "", prefill_ms: "", ms_tok: "", prefill_tps: "", decode_tps: "", ran_at: "32768", rss_load: "6396", rss_end: "6380 (last observed)" },
];

// Replies identical to the model's largest-window export, one value per
// smaller window in order, "-" where that pair was not run.
export type WindowIdent = { model: string; phone: string; values: string[] };

export const windowIdent: WindowIdent[] = [
  { model: "LFM2.5-1.2B-Instruct-8da4w", phone: "D9400", values: ["raw 12/90, calls 25/30, content 17/90", "raw 17/90, calls 26/30, content 18/90", "raw 18/90, calls 28/30, content 19/90", "raw 12/90, calls 24/30, content 16/90"] },
  { model: "LFM2.5-1.2B-Instruct-8da4w", phone: "D9400 repeat", values: ["-", "-", "-", "raw 14/90, calls 25/30, content 17/90"] },
  { model: "LFM2.5-1.2B-Instruct-8da4w", phone: "8 Elite", values: ["-", "raw 13/90, calls 26/30, content 15/90", "-", "-"] },
  { model: "LFM2.5-1.2B-Instruct-8da4w", phone: "Tensor G5", values: ["-", "raw 10/90, calls 24/30, content 14/90", "-", "-"] },
  { model: "LFM2.5-1.2B-Instruct-8da4w", phone: "Exynos 2400", values: ["-", "raw 16/90, calls 28/30, content 16/90", "-", "-"] },
  { model: "LFM2.5-2.6B-8da4w", phone: "D9400", values: ["raw 0/90, calls 24/30, content 29/90", "-"] },
  { model: "LFM2.5-2.6B-8da4w", phone: "8 Elite", values: ["-", "raw 0/90, calls 25/30, content 29/90"] },
  { model: "LFM2.5-2.6B-8da4w", phone: "Tensor G5", values: ["-", "raw 0/90, calls 27/30, content 30/90"] },
  { model: "LFM2.5-2.6B-8da4w", phone: "Exynos 2400", values: ["-", "raw 0/90, calls 25/30, content 30/90"] },
  { model: "LFM2.5-2.6B-8da4w (cap 2048)", phone: "D9400", values: ["raw 0/60, calls 0/0, content 0/60", "-"] },
  { model: "LFM2.5-2.6B-8da4w (cap 2048)", phone: "8 Elite", values: ["-", "raw 0/60, calls 0/0, content 0/60"] },
  { model: "LFM2.5-2.6B-8da4w (cap 2048)", phone: "Tensor G5", values: ["-", "raw 0/60, calls 0/0, content 0/60"] },
  { model: "LFM2.5-2.6B-8da4w (cap 2048)", phone: "Exynos 2400", values: ["-", "raw 0/60, calls 0/0, content 0/60"] },
  { model: "Qwen3-1.7B-8da4w", phone: "D9400", values: ["raw 0/6, calls 0/0, content 0/6"] },
  { model: "Qwen3-1.7B-8da4w", phone: "8 Elite", values: ["raw 0/12, calls 0/0, content 0/12"] },
  { model: "Qwen3-1.7B-8da4w", phone: "Tensor G5", values: ["raw 29/90, calls 27/30, content 31/90"] },
  { model: "Qwen3-1.7B-8da4w", phone: "Exynos 2400", values: ["raw 0/7, calls 0/0, content 0/7"] },
];

// The same file run twice on the same phone.
export type WindowControl = { model: string; window: string; phone: string; identity: string };

export const windowControl: WindowControl[] = [
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "4k", phone: "Exynos 2400", identity: "raw 7/90, calls 23/30, content 11/90" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "16k", phone: "D9400", identity: "raw 13/90, calls 23/30, content 20/90" },
  { model: "LFM2.5-1.2B-Instruct-8da4w", window: "32k", phone: "D9400", identity: "raw 15/90, calls 25/30, content 18/90" },
  { model: "LFM2.5-2.6B-8da4w", window: "2k", phone: "D9400", identity: "raw 0/90, calls 24/30, content 29/90" },
  { model: "Qwen3-1.7B-8da4w", window: "2k", phone: "D9400", identity: "raw 31/90, calls 30/30, content 31/90" },
];

// The fixed-prompt speed probe on the Dimensity 9400: medians with min to max.
export type WindowProbe = { file: string; turns: number; prefill: string; decode: string; prefill_ms: number; rss: number };

export const windowProbe: WindowProbe[] = [
  { file: "LFM2.5-1.2B-Instruct-8da4w-2k", turns: 6, prefill: "332 (288 to 344)", decode: "40.2 (33.7 to 41.0)", prefill_ms: 2804, rss: 1050 },
  { file: "LFM2.5-1.2B-Instruct-8da4w-4k", turns: 6, prefill: "340 (330 to 344)", decode: "40.4 (36.9 to 41.0)", prefill_ms: 2738, rss: 1098 },
  { file: "LFM2.5-1.2B-Instruct-8da4w-8k", turns: 6, prefill: "343 (327 to 345)", decode: "40.8 (40.0 to 41.2)", prefill_ms: 2712, rss: 1194 },
  { file: "LFM2.5-1.2B-Instruct-8da4w-16k", turns: 6, prefill: "342 (326 to 345)", decode: "40.5 (39.8 to 41.2)", prefill_ms: 2718, rss: 1386 },
  { file: "LFM2.5-1.2B-Instruct-8da4w-32k", turns: 6, prefill: "343 (329 to 346)", decode: "40.5 (39.9 to 40.9)", prefill_ms: 2712, rss: 1768 },
  { file: "LFM2.5-2.6B-8da4w-2k", turns: 6, prefill: "149 (142 to 153)", decode: "19.0 (16.7 to 19.5)", prefill_ms: 6254, rss: 1984 },
  { file: "LFM2.5-2.6B-8da4w-4k", turns: 6, prefill: "148 (135 to 153)", decode: "18.1 (16.5 to 19.5)", prefill_ms: 6264, rss: 2046 },
  { file: "LFM2.5-2.6B-8da4w-8k", turns: 6, prefill: "149 (140 to 153)", decode: "18.2 (16.7 to 19.5)", prefill_ms: 6234, rss: 2172 },
  { file: "LFM2.5-2.6B-8da4w-16k", turns: 6, prefill: "149 (138 to 153)", decode: "18.4 (16.6 to 19.5)", prefill_ms: 6226, rss: 2427 },
  { file: "LFM2.5-2.6B-8da4w-32k", turns: 6, prefill: "149 (139 to 152)", decode: "18.1 (16.2 to 19.5)", prefill_ms: 6240, rss: 2936 },
  { file: "Qwen3-1.7B-8da4w-2k", turns: 6, prefill: "200 (193 to 206)", decode: "18.0 (16.1 to 18.2)", prefill_ms: 4680, rss: 1758 },
  { file: "Qwen3-1.7B-8da4w-32k", turns: 6, prefill: "184 (162 to 203)", decode: "16.6 (15.1 to 17.6)", prefill_ms: 5064, rss: 6153 },
];

// Each probe turn against the same turn of the model's smallest window.
export type WindowRatio = { file: string; prefill: string; decode: string; turns: number };

export const windowRatio: WindowRatio[] = [
  { file: "LFM2.5-1.2B-Instruct-8da4w-2k", prefill: "1.000 (1.000 to 1.000)", decode: "1.000 (1.000 to 1.000)", turns: 6 },
  { file: "LFM2.5-1.2B-Instruct-8da4w-4k", prefill: "1.007 (0.987 to 1.181)", decode: "0.999 (0.927 to 1.190)", turns: 6 },
  { file: "LFM2.5-1.2B-Instruct-8da4w-8k", prefill: "1.003 (0.995 to 1.198)", decode: "1.011 (0.995 to 1.187)", turns: 6 },
  { file: "LFM2.5-1.2B-Instruct-8da4w-16k", prefill: "1.008 (0.992 to 1.190)", decode: "1.009 (0.988 to 1.187)", turns: 6 },
  { file: "LFM2.5-1.2B-Instruct-8da4w-32k", prefill: "1.013 (0.999 to 1.202)", decode: "1.006 (0.993 to 1.184)", turns: 6 },
  { file: "LFM2.5-2.6B-8da4w-2k", prefill: "1.000 (1.000 to 1.000)", decode: "1.000 (1.000 to 1.000)", turns: 6 },
  { file: "LFM2.5-2.6B-8da4w-4k", prefill: "0.995 (0.947 to 1.002)", decode: "0.985 (0.946 to 1.005)", turns: 6 },
  { file: "LFM2.5-2.6B-8da4w-8k", prefill: "0.997 (0.983 to 1.005)", decode: "0.991 (0.943 to 1.000)", turns: 6 },
  { file: "LFM2.5-2.6B-8da4w-16k", prefill: "1.003 (0.971 to 1.005)", decode: "0.997 (0.938 to 1.005)", turns: 6 },
  { file: "LFM2.5-2.6B-8da4w-32k", prefill: "0.997 (0.975 to 1.003)", decode: "0.976 (0.943 to 1.005)", turns: 6 },
  { file: "Qwen3-1.7B-8da4w-2k", prefill: "1.000 (1.000 to 1.000)", decode: "1.000 (1.000 to 1.000)", turns: 6 },
  { file: "Qwen3-1.7B-8da4w-32k", prefill: "0.941 (0.793 to 0.982)", decode: "0.953 (0.835 to 1.012)", turns: 6 },
];
