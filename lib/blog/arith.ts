// The arithmetic behind the training and inference post, in one place, so every slider, table and formula on
// the page uses the same functions. Units are named in each function: parameters in billions, memory in GB
// (10^9 bytes, as vendors quote it), bandwidth in GB/s, compute in TFLOP/s (10^12 operations a second).
// These are ceilings and estimates of the kind the cited references use; real systems reach a fraction of them.

/** Bytes each parameter takes at a given precision. */
export const precisions = [
  { name: "FP32", bytes: 4 },
  { name: "BF16 / FP16", bytes: 2 },
  { name: "FP8 / INT8", bytes: 1 },
  { name: "4-bit", bytes: 0.5 },
] as const;

/** Memory the weights take: parameters (billions) times bytes each, in GB. */
export const weightsGB = (paramsB: number, bytes: number) => paramsB * bytes;

/** Floating-point operations to read a prompt: about 2 per parameter per token (a multiply and an add). */
export const prefillFLOPs = (paramsB: number, tokens: number) => 2 * paramsB * 1e9 * tokens;

/** Seconds to read a prompt when compute is the limit, at a fraction `use` of the chip's peak. */
export const prefillSeconds = (paramsB: number, tokens: number, tflops: number, use: number) => prefillFLOPs(paramsB, tokens) / (tflops * 1e12 * use);

/** KV cache bytes per token: a key and a value (2) for every layer, KV head and head dimension. */
export const kvBytesPerToken = (layers: number, kvHeads: number, headDim: number, bytes: number) => 2 * layers * kvHeads * headDim * bytes;

/** KV cache for a whole batch at a given context, in GB. */
export const kvGB = (perTokenBytes: number, context: number, batch: number) => (perTokenBytes * context * batch) / 1e9;

/**
 * The fastest a single sequence can decode when memory bandwidth is the limit: every token reads all the weights
 * and its own KV cache once, so tokens a second is at most bandwidth over the bytes read per token.
 */
export const decodeCeiling = (bandwidthGBs: number, weightGB: number, kvPerSeqGB = 0) => bandwidthGBs / (weightGB + kvPerSeqGB);

/** The same ceiling when compute is the limit: about 2 operations per parameter per token. */
export const decodeComputeCeiling = (tflops: number, paramsB: number) => (tflops * 1e12) / (2 * paramsB * 1e9);

/**
 * A batch of B sequences shares one read of the weights, so total tokens a second grows with the batch until
 * compute runs out. Bandwidth bound: B x bandwidth / (weights + B x KV per sequence). Compute bound: peak / 2N.
 */
export const batchDecode = (batch: number, bandwidthGBs: number, weightGB: number, kvPerSeqGB: number, tflops: number, paramsB: number) =>
  Math.min((batch * bandwidthGBs) / (weightGB + batch * kvPerSeqGB), decodeComputeCeiling(tflops, paramsB));

/** A chip's ridge point: operations it can do per byte it reads. Work below it waits on memory; above it, on compute. */
export const ridge = (tflops: number, bandwidthGBs: number) => (tflops * 1e12) / (bandwidthGBs * 1e9);

/** Operations per byte of weights read when decoding a batch of B: 2 per parameter per sequence, over bytes per parameter. */
export const decodeIntensity = (batch: number, bytes: number) => (2 * batch) / bytes;

/** Training compute: about 6 operations per parameter per token, 2 forward and 4 backward. */
export const trainFLOPs = (paramsB: number, tokensB: number) => 6 * paramsB * 1e9 * tokensB * 1e9;

/** Days to train on `chips` chips at peak `tflops` each and model FLOPs utilisation `mfu`. */
export const trainDays = (paramsB: number, tokensB: number, chips: number, tflops: number, mfu: number) => trainFLOPs(paramsB, tokensB) / (chips * tflops * 1e12 * mfu) / 86400;

/**
 * Memory for mixed-precision training with Adam, before activations: 2 bytes of 16-bit weights, 2 of 16-bit
 * gradients, and 12 of 32-bit optimiser state (a master copy of the weights and two moments), 16 bytes in all.
 */
export const trainStateBytesPerParam = { weights: 2, gradients: 2, optimiser: 12 } as const;
export const trainStateGB = (paramsB: number) => paramsB * (trainStateBytesPerParam.weights + trainStateBytesPerParam.gradients + trainStateBytesPerParam.optimiser);

/** The shape of a decoder-only transformer, enough to count its parameters. */
export type Shape = {
  layers: number;
  dModel: number;
  heads: number;
  kvHeads: number;
  headDim: number;
  ffn: number;
  vocab: number;
  tied: boolean;
  experts?: number;
  activeExperts?: number;
};

/**
 * Parameters, counted the way a Llama or Qwen3 decoder is built: per layer, attention's four projections (query
 * and output are heads x headDim wide, key and value kvHeads x headDim) and a gated feed-forward block of three
 * matrices; a mixture of experts has `experts` such blocks and a router, of which a token uses `activeExperts`.
 * The embedding table is vocab x dModel, counted twice when the output layer has its own copy. Norms and
 * biases are left out: under 0.01% of these models.
 */
export function paramCount(s: Shape) {
  const attention = s.dModel * s.heads * s.headDim * 2 + 2 * s.dModel * s.kvHeads * s.headDim;
  const block = 3 * s.dModel * s.ffn;
  const router = s.experts ? s.dModel * s.experts : 0;
  const embeddings = s.vocab * s.dModel * (s.tied ? 1 : 2);
  const mlpTotal = block * (s.experts ?? 1) + router;
  const mlpActive = block * (s.activeExperts ?? 1) + router;
  return {
    attention: attention * s.layers,
    mlp: mlpTotal * s.layers,
    embeddings,
    total: (attention + mlpTotal) * s.layers + embeddings,
    active: (attention + mlpActive) * s.layers + embeddings,
  };
}

/**
 * Weights one pass reads, in GB, when `tokens` tokens go through together. A dense model reads all of them. For
 * a mixture of experts, assuming tokens pick experts evenly at random, each expert is touched with probability
 * 1 - (1 - k/E)^tokens: one token reads only its k experts, a long prompt or a big batch reads nearly all.
 */
export function weightsReadGB(s: Shape, tokens: number, bytes: number) {
  const c = paramCount(s);
  if (!s.experts || s.experts <= 1) return (c.total * bytes) / 1e9;
  const expertParams = s.layers * s.experts * 3 * s.dModel * s.ffn;
  const touched = 1 - Math.pow(1 - (s.activeExperts ?? 1) / s.experts, tokens);
  return ((c.total - expertParams + touched * expertParams) * bytes) / 1e9;
}

/** A readable number: three significant figures, grouped; from 1,000 up, the whole number, so 8,192 reads as 8,192. */
export const fmt = (x: number, digits = 3) => {
  if (!Number.isFinite(x)) return "n/a";
  if (x === 0) return "0";
  if (Math.abs(x) >= 1000) return Math.round(x).toLocaleString("en-US");
  const p = Number(x.toPrecision(digits));
  return p.toLocaleString("en-US", { maximumFractionDigits: Math.max(0, digits - 1 - Math.floor(Math.log10(Math.abs(p)))) });
};

const superscript = (n: number) =>
  String(n)
    .split("")
    .map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(c)] ?? (c === "-" ? "⁻" : c))
    .join("");

/** A large number as m × 10ⁿ, with the power as superscript digits so it works in plain text. */
export const sci = (x: number, digits = 2) => {
  const e = Math.floor(Math.log10(x));
  return `${(x / 10 ** e).toFixed(digits - 1)} × 10${superscript(e)}`;
};

/** Seconds as the largest sensible unit. */
export const fmtTime = (s: number) => {
  if (!Number.isFinite(s)) return "n/a";
  if (s < 1e-3) return `${fmt(s * 1e6)} µs`;
  if (s < 1) return `${fmt(s * 1e3)} ms`;
  if (s < 120) return `${fmt(s)} s`;
  if (s < 7200) return `${fmt(s / 60)} min`;
  if (s < 172800) return `${fmt(s / 3600)} h`;
  return `${fmt(s / 86400)} days`;
};
