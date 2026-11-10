// The values the three formulas posts share, computed once from the sourced data so a corrected number changes every
// post that uses it.
import { fmt, kvBytesPerToken, kvGB, paramCount, trainFLOPs, weightsGB } from "@/lib/blog/arith";
import { devices, featured, models } from "@/lib/blog/formulas-data";

export const dev = (id: string) => {
  const d = devices.find((x) => x.id === id);
  if (!d) throw new Error(`no device ${id}`);
  return d;
};
export const model = (id: string) => models.find((m) => m.id === id)!;
export type Model = (typeof models)[number];

export const llama8 = model("llama31-8b");
export const llama70 = model("llama31-70b");
export const qwen4 = model("qwen3-4b");
export const moe = model("qwen3-30b-a3b");
export const phone = dev("sd8eg5");
export const gpu = dev("rtx5090");
export const h100 = dev("h100");
export const chips = featured.chips.map(dev);
export const kindName = { edge: "Edge", consumer: "Consumer GPU", server: "Server GPU", asic: "ASIC" } as const;
export const bw = (gbs: number) => (gbs >= 1e6 ? `${fmt(gbs / 1e6)} PB/s` : gbs >= 1000 ? `${fmt(gbs / 1000)} TB/s` : `${fmt(gbs)} GB/s`);
export const cap = (gb: number) => (gb < 1 ? `${fmt(gb * 1000)} MB` : `${fmt(gb)} GB`);
export const kib = (m: Model) => kvBytesPerToken(m.layers, m.kvHeads, m.headDim, 2) / 1024;
export const kvAt = (m: Model, ctx: number) => kvGB(kvBytesPerToken(m.layers, m.kvHeads, m.headDim, 2), ctx, 1);
export const shareOf = (part: number, whole: number) => `${Math.round((part / whole) * 100)}%`;

// Llama 3.1 405B, from Meta's paper and model card: the one training run here whose own FLOP count is published.
export const big = { paramsB: 405, tokensB: 15600, gpuHours: 30.84e6 };
export const bigFLOPs = trainFLOPs(big.paramsB, big.tokensB);
export const bigAt40 = bigFLOPs / (h100.tflops! * 1e12 * 0.4) / 3600;

// Attention's own work per new token at a given context, beyond the 2N of the weights: the scores and the weighted
// sum of values, each 2 x context x (query heads x head size) per layer.
export const attnOps = (m: Model, ctx: number) => 4 * m.layers * ctx * m.heads * m.headDim;

// Our measured case: Qwen3 4B as a 2.38 GB Q4_0 file on the Snapdragon 8 Elite Gen 5 (research/prefill-decode),
// fastest decode 12.1 tokens a second.
export const measured = { fileGB: 2.38, bestTokS: 12.1, rangeTokS: "4.4 to 12.1" };

export const prompt = 2000;
export const q4 = paramCount(qwen4);
export const l8 = paramCount(llama8);
export const w8q = weightsGB(llama8.paramsB, 0.5);
