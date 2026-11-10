import type { Metadata } from "next";
import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import { ArticleHeader, Bullets, DataTable, Formula, H3, P, Section, SeriesNav, Sources, Steps, Strong, Wide } from "@/components/blog/Article";
import { ModelBuilder } from "@/components/blog/formulas/Builder";
import { TrainLab, TrainStepLab } from "@/components/blog/formulas/Widgets";
import { posts } from "@/lib/blog";
import { fmt, sci } from "@/lib/blog/arith";
import { models, sources } from "@/lib/blog/formulas-data";
import { big, bigAt40, bigFLOPs, cap, chips, h100, kib, kvAt, l8, llama70, llama8, moe, q4, qwen4, shareOf } from "@/lib/blog/formulas-shared";

const post = posts.find((p) => p.slug === "training-formulas")!;

export const metadata: Metadata = {
  title: `${post.title}: Experimental Machines`,
  description: post.summary,
  openGraph: { title: post.title, description: post.summary, url: `/blog/${post.slug}/` },
};

export default function TrainingFormulas() {
  return (
    <main id="main" className="scroll-mt-28 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:scroll-mt-16">
      <ArticleHeader post={post} />
      <SeriesNav post={post} />
      <Section id="short" title="The short version">
        <P>
          Training usually waits on compute, and fitting everything it keeps into memory is a separate limit. The chip numbers are from{" "}
          <Go href="/blog/chip-formulas/" className={link}>
            part 1
          </Go>
          .
        </P>
        <Bullets
          items={[
            <>
              <Strong>A parameter</Strong>, or weight, is one number the model learned. N is how many there are; for a mixture of experts, the compute uses the ones each token runs
              through and the memory all of them.
            </>,
            <>
              <Strong>A token</Strong> is a piece of text, a word or part of one. D is how many the model trains on.
            </>,
          ]}
        />
        <Wide>
          <DataTable
            label="The formulas for training a model"
            min="20rem"
            head={["What", "Formula"]}
            rows={[
              ["Training compute", "6 × N × D operations"],
              ["Training time", "6 × N × D ÷ (chips × compute × utilisation)"],
              ["Training state, mixed precision with Adam", "about 16 bytes × all the parameters, before activations"],
              ["Tokens for the best model per unit of compute", "about 20 × N, for a dense model"],
            ]}
          />
        </Wide>
        <P>This is part 3 of 3. The panels work out their estimates from what you choose and the sourced specs; change an input and everything that depends on it moves.</P>
      </Section>

      <Section id="training" title="Training: forward, loss, backward, update">
        <P>
          Training repeats one step many thousands of times: run a batch of text through the model, measure how wrong its predictions were, work out how to change every weight, and
          change them.
        </P>
        <Bullets
          items={[
            <>
              <Strong>In ordinary pretraining, the model does not read its own guesses.</Strong> Each position predicts the next token from the real text before it. (In
              reinforcement learning the model writes, and is scored.)
            </>,
            <>
              <Strong>All positions go through at once,</Strong> like one huge prefill, with a mask so each position sees only earlier ones. A sequence of T tokens is T predictions
              in one pass.
            </>,
            <>
              <Strong>Keys and values are computed, but not kept as a cache for later tokens.</Strong> They are kept, or recomputed, as activations for the backward pass.
            </>,
            <>
              <Strong>Each weight read serves a large batch of tokens,</Strong> so training usually sits far past the ridge point (
              <Go href="/blog/chip-formulas/" className={link}>
                part 1
              </Go>
              ): it waits on compute. What runs out first is memory capacity.
            </>,
          ]}
        />
        <Wide note="Forward and backward are drawn 2 to 4, their share of the arithmetic. The loss and the update are drawn small only to show they exist: their real share depends on the setup.">
          <TrainStepLab />
        </Wide>
        <Wide>
          <DataTable
            label="The four parts of a training step"
            head={["Part", "What happens", "Operations", "Memory it needs"]}
            rows={[
              [
                "Forward",
                "The batch goes through every layer and comes out as a prediction for each next token",
                "2 × N per token",
                "Keeps each layer's activations for the backward pass",
              ],
              [
                "Loss",
                "Each prediction is scored against the token that actually came next (cross-entropy)",
                "Small: about the vocabulary size per token",
                "A score for every token in the vocabulary, at every position: large for big vocabularies",
              ],
              [
                "Backward",
                "The error flows back through the layers. Each matrix multiplication needs two more: one for its input's gradient, one for its weights'",
                "4 × N per token: twice the forward",
                "A gradient for every weight, 2 bytes each in BF16",
              ],
              [
                "Update",
                "The optimiser (usually Adam) moves every weight a little against its gradient",
                "A dozen or so per parameter, once per step",
                "Two running averages and a 32-bit copy of each weight: 12 bytes",
              ],
            ]}
          />
        </Wide>
        <Formula label="Training compute" where="2 forward plus 4 backward, per parameter per token. N parameters (the active ones, for a mixture of experts), D training tokens.">
          C ≈ 6 × N × D
        </Formula>
        <Formula label="Training time" where="MFU, model FLOPs utilisation: the share of peak compute a run actually achieves. The training counterpart of MBU.">
          time ≈ 6 × N × D ÷ (chips × compute × MFU)
        </Formula>
        <P>The formula lands on the same scale as a real run.</P>
        <Bullets
          items={[
            <>
              Llama 3.1 405B saw {fmt(big.tokensB / 1000)} trillion tokens: 6 × 405B × {fmt(big.tokensB / 1000)}T = {sci(bigFLOPs, 3)} operations. Meta reports 3.8 × 10²⁵.
            </>,
            <>
              At {fmt(h100.tflops!)} TFLOP/s per {h100.short} and 40% MFU, that is {fmt(bigAt40 / 1e6)} million GPU hours. Meta&apos;s model card lists {fmt(big.gpuHours / 1e6)}{" "}
              million: the same scale, from a simple estimate.
            </>,
          ]}
        />

        <H3>Memory, before activations</H3>
        <Formula label="Training state, mixed precision with Adam" where="BF16 weights and gradients, then a 32-bit master copy and Adam's two running averages.">
          2 + 2 + 4 + 4 + 4 = 16 bytes per parameter
        </Formula>
        <Bullets
          items={[
            <>
              {llama8.short} needs {fmt(16 * llama8.paramsB)} GB for this alone, more than one {h100.short} holds ({cap(h100.memoryGB)}).
            </>,
            "So training splits the state across chips (ZeRO, or PyTorch's FSDP), and each chip keeps a slice.",
            "Activations come on top, and grow with the batch, the sequence length, the layers and the width.",
            "Activation checkpointing throws most of them away and recomputes them in the backward pass: at most an extra forward, about 8 × N per token instead of 6, less when only some are recomputed.",
          ]}
        />

        <H3>How many tokens?</H3>
        <Bullets
          items={[
            "Chinchilla (2022) found the best dense model for a fixed compute budget sees about 20 tokens per parameter.",
            <>
              Models that will be run a lot are trained far longer, because a smaller model is cheaper every time it runs. Llama 3.1 8B saw about 15 trillion tokens: about{" "}
              {fmt(15000 / llama8.paramsB)} per parameter.
            </>,
          ]}
        />
        <Wide note="Time assumes the chips hold the utilisation you set for the whole run, with no failures or restarts. The last box is only the 16 bytes per parameter; activations need more.">
          <TrainLab models={models} devices={chips} />
        </Wide>
      </Section>

      <Section id="choices" title="Model building choices">
        <P>There are many knobs, and they interact. One workable order is to settle them like this, each step fixing something the next works within.</P>
        <Steps
          items={[
            <>
              <Strong>Budget and target.</Strong> The compute budget fixes 6 × N × D. Where it will run sets the rest: a phone&apos;s memory caps the total parameters, its
              bandwidth caps the active ones.
            </>,
            <>
              <Strong>Size.</Strong> Pick N and D: about 20 tokens per parameter for the best model per unit of compute, many more for a model that will be run a lot.
            </>,
            <>
              <Strong>Shape.</Strong> Width, layers, query heads and KV heads, feed-forward width, vocabulary. Proven models&apos; ratios are a safe start.
            </>,
            <>
              <Strong>The common parts.</Strong> Many recent open models start from the same pieces: a normalisation (RMSNorm) before each block to keep its numbers in range, a
              gated feed-forward block (SwiGLU), rotary position embeddings to tell the model each token&apos;s place, few or no biases, little or no dropout in pretraining. Models
              still differ.
            </>,
            <>
              <Strong>The open questions.</Strong> Which mixer, in what ratio and where (attention, sliding windows, recurrent layers); how many experts, and how many each token
              uses.
            </>,
            <>
              <Strong>The training recipe.</Strong> Optimiser (AdamW or Muon), learning rate with its warm-up and decay, weight decay, batch size in tokens, gradient clipping,
              precision. Tuned on small models and carried up to big ones.
            </>,
            <>
              <Strong>Data and phases.</Strong> Tokenizer and data mix, then pretraining, a final pass on the best data, longer contexts, instruction tuning, and preference or
              reinforcement learning.
            </>,
          ]}
        />
        <P>
          Steps 2 and 3 are where this series&apos; formulas live. Start from a real model, change its shape, and see what follows: its memory, its KV cache and how fast it can
          write a reply (all from{" "}
          <Go href="/blog/inference-formulas/" className={link}>
            part 2
          </Go>
          ), and what training it costs.
        </P>
        <Wide note="Picking a preset counts that model's parameters from its shape alone and lands on its model card's figure; Qwen3 30B-A3B counts 3.35B active, which its card rounds to 3.3B. Norms and biases are left out. Head size is fixed at 128, as in all four. Any shape is counted, though not every shape is one a runtime supports.">
          <ModelBuilder models={models} devices={chips} />
        </Wide>
        <Wide>
          <DataTable
            label="What each choice changes"
            head={["Choice", "What it changes", "Example"]}
            rows={[
              [
                "Parameters",
                "Weights, decode time, prefill and training compute: all in proportion to N",
                `${llama70.short} has ${fmt(llama70.paramsB / llama8.paramsB)} times the parameters of ${llama8.short}. If both fit and bandwidth sets the speed, its decode ceiling is about ${fmt(llama70.paramsB / llama8.paramsB)} times lower`,
              ],
              [
                "Precision",
                "Bytes per parameter: memory and decode speed",
                "4-bit weights are a quarter of BF16, so the decode ceiling is up to four times higher, at some cost in quality",
              ],
              [
                "Mixture of experts",
                "Memory follows the total parameters; compute and decode's reads follow the active ones",
                `${moe.short}: ${fmt(moe.paramsB)}B stored, ${fmt(moe.activeB!)}B used per token`,
              ],
              ["KV heads", "KV cache per token", `${llama8.short}: ${llama8.kvHeads} KV heads for ${llama8.heads} query heads`],
              [
                "Layers against width",
                "At the same N, more layers means more KV cache per token and more steps one after another",
                `${qwen4.short} has ${qwen4.layers} layers to ${llama8.short}'s ${llama8.layers}, and a bigger cache per token (${fmt(kib(qwen4))} against ${fmt(kib(llama8))} KiB) at half the size`,
              ],
              [
                "Mixer",
                "Recurrent and sliding-window layers keep a cache that stops growing",
                "A hybrid with attention in 1 layer of 4 keeps a quarter of the KV cache, plus small recurrent states",
              ],
              [
                "Context length",
                "The KV cache grows in proportion; attention's own work per token grows too",
                `${llama8.short} at 128k tokens: ${fmt(kvAt(llama8, 131072))} GB of cache`,
              ],
              [
                "Vocabulary",
                "The embedding table is vocabulary × width: a big share of a small model. A bigger vocabulary packs text into fewer tokens",
                `${qwen4.short}: ${fmt(q4.embeddings / 1e9)}B of its ${fmt(q4.total / 1e9)}B (${shareOf(q4.embeddings, q4.total)}) is the embedding table`,
              ],
              [
                "Tied embeddings",
                "The output layer reuses the input table, saving vocabulary × width parameters",
                `${qwen4.short} ties them; ${llama8.short} does not, and spends ${fmt(l8.embeddings / 2e9)}B more`,
              ],
            ]}
          />
        </Wide>
      </Section>

      <Section id="limits" title="What the formulas leave out">
        <P>They are estimates. Real runs land below them, for reasons the formulas do not see.</P>
        <Bullets
          items={[
            <>
              <Strong>Utilisation.</Strong> Large training runs reach 30% to 50% of peak compute. Meta reports 38% to 43% for Llama 3 405B.
            </>,
            <>
              <Strong>Communication.</Strong> Across thousands of chips, training spends time moving gradients and activations between them.
            </>,
            <>
              <Strong>Attention&apos;s own work.</Strong> 6 × N counts the weights; attention over long sequences adds more, as part 2 shows for a reply.
            </>,
          ]}
        />
      </Section>

      <Section id="sources" title="Sources">
        <P>The chip figures are from part 1&apos;s device table. The formulas and examples come from these.</P>
        <Sources items={sources.filter((s) => s.for.includes("training"))} />
      </Section>
      <SeriesNav post={post} end />
    </main>
  );
}
