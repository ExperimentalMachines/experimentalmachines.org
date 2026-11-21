// The 4-bit rounding study: what each figure on /research/rtn-gptq-awq/ reads, derived from lib/quant-data.ts
// (generated from every arm's results by the study's awq_site.py). Nothing here is typed in by hand but labels.

import { quant } from "@/lib/quant-data";

export { quant };

type Model = (typeof quant.models)[number];
type Book = { kl: number; ppl: number; hfPpl: number; top1: number; positions: number };
type Tails = { median: number; p90: number; p99: number; max: number };
// Pooled over both depths: the KL's tails and the change in the true token's probability (llama.cpp's Δp).
type BookAll = Book & { klTails: Tails; dp: { mean: number; rms: number; p1: number; p99: number } };
// [change against GPTQ as a fraction of GPTQ's, 95% interval low, high]
export type Change = [number, number, number];
export type Arm = {
  method: string;
  calibration: string | null;
  books: Record<string, Book>;
  booksAll: BookAll | null;
  needles: { found: number; of: number; hf: number; hits: number[]; hfHits: number[]; lost: number; gained: number };
  app: { kl: number; top1: number; medianKl: number; klTails: Tails; flips: number; replyKl: number; replyTop1: number };
  calls: { of: number; kept: number; extra: number };
  gate: { passed: boolean; agreed: number; graded: number; fp32Mean: number; exportMean: number };
  bytes: number;
  // Free-running replies against the original's (awq_compare.py generate): tokens matched before the first difference.
  gen: { replies: number; same: number; prefix: number; refLen: number; prefix8: number; lcsF1: number; capped: number } | null;
  firstRound?: { solveS: number | null; appKl: number; replyKl: number; gatePassed: boolean; topChanged: number };
};
type Against = { against: string; app: Change; reply: Change; books?: Change; booksFw?: Change; genLcs?: Change } & Record<string, Change | string | undefined>;

export const METHODS = ["rtn", "gptq", "awq", "awq_gptq"] as const;
export type Method = (typeof METHODS)[number];
// gptq_kv: the KV-cache study's own GPTQ file of each model, solved separately from the same calibration rows: how far
// two solves of one method land apart.
export type File = Method | "published" | "gptq_kv";
// The rows of every figure, in this order: the plain baseline, the method in use and its second solve, the
// alternatives, the shipped file.
export const FILES: File[] = ["rtn", "gptq", "gptq_kv", "awq", "awq_gptq", "published"];
export const methodName: Record<File, string> = {
  rtn: "RTN",
  gptq: "GPTQ",
  gptq_kv: "GPTQ, solved again",
  awq: "AWQ",
  awq_gptq: "AWQ + GPTQ",
  published: "Published file",
};
const armKey = (f: File) => (f === "gptq_kv" ? "gptq-kv" : f);
// A file's name in a figure: Qwen3's published and second GPTQ files are the two calibrated with thinking on.
export const fileLabel = (m: { key: string }, f: File) =>
  m.key === "qwen3-1.7b" && (f === "gptq_kv" || f === "published") ? `${methodName[f]} (thinking on)` : methodName[f];

const arms = (m: Model) => m.arms as unknown as Record<string, Arm>;
const against = (m: Model) => m.vsGptq as unknown as Record<string, Against>;

// Qwen3 is the one reasoning model: its comparison is every method calibrated with thinking off, as the app sends a
// turn. Where a thinking-off arm exists it is the one shown; RTN and the published file take no calibration.
export const models = quant.models.map((m) => ({
  key: m.key,
  name: m.name,
  callToken: m.callToken,
  heldoutRows: m.heldoutRows,
  // The first round's app-question divergence per method (2k builds; Qwen3 calibrated with thinking on).
  firstAppKl: m.firstAppKl as Record<"rtn" | Method, number | null>,
  arm: (f: File): Arm | undefined => arms(m)[`${armKey(f)}-nothink`] ?? arms(m)[armKey(f)],
  // Qwen3's GPTQ calibrated with thinking on (the template's default), for the calibration figure.
  thinkingOn: (): Arm | undefined => (m.key === "qwen3-1.7b" && arms(m)["gptq-nothink"] ? arms(m)["gptq"] : undefined),
  vs: (f: File): Against | undefined => against(m)[`${armKey(f)}-nothink`] ?? against(m)[armKey(f)],
}));
export type ModelView = (typeof models)[number];

// How a change against GPTQ reads: clearly closer to the original (the interval below zero), clearly further, or not
// clearly either.
export type Verdict = "closer" | "further" | "none";
export const verdict = (c: Change): Verdict => (c[2] < 0 ? "closer" : c[1] > 0 ? "further" : "none");

// Across models: how many each file was clearly closer or further than GPTQ on the long text.
export const tally = (f: File) =>
  models.reduce(
    (t, m) => {
      const c = m.vs(f)?.books;
      if (c) t[verdict(c)] += 1;
      return t;
    },
    { closer: 0, further: 0, none: 0 },
  );

// The first round's solve times (Modal, one method per 8-core sandbox, Qwen3 calibrated with thinking on): the one
// like-for-like timing of the three methods.
export const solveTimes = quant.models.map((m) => ({ model: m.name, gptq: m.solveS.gptq, awq: m.solveS.awq, awq_gptq: m.solveS.awq_gptq }));

// A file's perplexity above the original model's on the books, averaged over the models it was measured on.
export const pplGap = (f: File) => {
  const gaps = models.flatMap((m) => {
    const a = m.arm(f)?.booksAll;
    return a ? [a.ppl / a.hfPpl - 1] : [];
  });
  return gaps.length ? gaps.reduce((x, y) => x + y, 0) / gaps.length : NaN;
};

// Each model's change against GPTQ for a file, on the books or the app's first tokens, as a fraction of GPTQ's value.
export const change = (m: ModelView, f: File, on: "books" | "app") => m.vs(f)?.[on] as Change | undefined;
// The changes across the models that have them, for a sentence: "−25% to −62%".
export const span = (xs: number[]) => {
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  const a = Math.round(100 * lo);
  const b = Math.round(100 * hi);
  const fmt = (v: number) => (v > 0 ? `+${v}%` : v < 0 ? `−${-v}%` : "0%");
  // Both negative: the smaller change first ("−25% to −62%").
  return a === b ? fmt(a) : hi < 0 ? `${fmt(b)} to ${fmt(a)}` : `${fmt(a)} to ${fmt(b)}`;
};
// Sizes of changes, without sign, for a sentence: "25% to 62%".
export const sizes = (xs: number[]) => {
  const v = xs.map((x) => Math.round(100 * Math.abs(x))).sort((a, b) => a - b);
  return v[0] === v.at(-1) ? `${v[0]}%` : `${v[0]}% to ${v.at(-1)}%`;
};
// A ratio as "3.6×".
export const times = (x: number) => `${x.toFixed(x < 10 ? 1 : 0)}×`;

export const minutes = (s: number) => `${Math.round(s / 60)} min`;
export const pct = (x: number) => `${Math.round(100 * x)}%`;
// A change as a signed percentage: +17%, −4%, with a true minus sign.
export const signedPct = (x: number) => {
  const v = Math.round(100 * x);
  return v > 0 ? `+${v}%` : v < 0 ? `−${-v}%` : "0%";
};
export const signed = (x: number, d = 3) => (x > 0 ? `+${x.toFixed(d)}` : x < 0 ? `−${(-x).toFixed(d)}` : (0).toFixed(d));
export const kl = (x: number) => x.toFixed(x < 1 ? 3 : 2);

export const quantLinks = {
  gptq: "https://arxiv.org/abs/2210.17323",
  awq: "https://arxiv.org/abs/2306.00978",
  autoawq: "https://github.com/casper-hansen/AutoAWQ",
  hub: "https://huggingface.co/experimentalmachines",
  pg19: "https://github.com/google-deepmind/pg19",
};
