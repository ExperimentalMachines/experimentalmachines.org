import type { Metadata } from "next";
import { ArticleHeader, Bullets, Closing, Finding, InThisPost, SeriesNav, Sources, Strong, TEXT } from "@/components/blog/Article";
import { ModelBuilder } from "@/components/blog/formulas/Builder";
import { StateBar } from "@/components/blog/formulas/Hardware";
import { TrainLab, TrainStepLab } from "@/components/blog/formulas/Widgets";
import { PostNav } from "@/components/blog/PostNav";
import { posts } from "@/lib/blog";
import { fmt, sci } from "@/lib/blog/arith";
import { models, sources } from "@/lib/blog/formulas-data";
import { big, bigAt40, bigFLOPs, cap, chips, h100, llama8, q4, qwen4 } from "@/lib/blog/formulas-shared";

const post = posts.find((p) => p.slug === "training-formulas")!;

export const metadata: Metadata = {
  title: `${post.title}: Experimental Machines`,
  description: post.summary,
  openGraph: { title: post.title, description: post.summary, url: `/blog/${post.slug}/`, images: post.banner ? [post.banner] : undefined },
};

const state8 = 16 * llama8.paramsB;

const findings = [
  { id: "step", short: "One step", question: "What happens in one training step?", answer: "Forward, loss, backward, update" },
  { id: "work", short: "How much work", question: "How much work does training take?", answer: `${sci(bigFLOPs, 3)} operations` },
  { id: "time", short: "How long", question: "How long will that take?", answer: `${fmt(bigAt40 / 1e6)} million GPU hours` },
  { id: "memory", short: "Memory", question: "How much memory does training need?", answer: `${fmt(state8)} GB of training state for an 8B model` },
  { id: "tokens", short: "How many tokens", question: "How many tokens should it see?", answer: "About 20 per parameter, by one rule" },
  { id: "shape", short: "Design choices", question: "How do design choices change the costs?", answer: "Each choice moves a formula" },
];

export default function TrainingFormulas() {
  return (
    <main id="main" className="scroll-mt-28 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:scroll-mt-16">
      <PostNav sections={[...findings, { id: "limits", short: "Left out" }, { id: "sources", short: "Sources" }]} />
      <ArticleHeader post={post} />
      <InThisPost items={findings} />

      <Finding
        {...findings[0]}
        answer="Forward, loss, backward, update"
        label="Four stages, repeated for every batch of text."
        takeaway="Each step adjusts the weights to make the training loss smaller."
        details={
          <ul>
            <li>In ordinary pretraining the model never reads its own guesses: each position predicts from the real text before it.</li>
            <li>All positions go through at once, like reading a prompt, with a mask so each sees only earlier ones.</li>
            <li>Each weight read serves a whole batch of tokens, so training usually waits on compute (part 1&apos;s ridge).</li>
          </ul>
        }
      >
        <TrainStepLab />
      </Finding>

      <Finding
        {...findings[1]}
        answer={`${sci(bigFLOPs, 3)} operations`}
        label={`Llama 3.1 405B on ${fmt(big.tokensB / 1000)} trillion tokens. Meta reports 3.8 × 10²⁵.`}
        example={`6 × 405 billion parameters × ${fmt(big.tokensB / 1000)} trillion tokens`}
        formula="6 × parameters × training tokens"
        takeaway="Twice the parameters or twice the tokens: twice the work."
        details={<p>For a mixture of experts, count the parameters each token uses, not all of them.</p>}
      />

      <Finding
        {...findings[2]}
        answer={`${fmt(bigAt40 / 1e6)} million GPU hours`}
        label={`GPU hours for that run on ${h100.short}s at 40% of peak: about ${Math.round(bigAt40 / 16384 / 24)} days on 16,384 of them. Meta's model card lists ${fmt(big.gpuHours / 1e6)} million.`}
        example={`${sci(bigFLOPs, 3)} ÷ (${fmt(h100.tflops!)} trillion a second × 40%)`}
        formula="work ÷ (compute per chip × utilisation), in chip hours; ÷ chips for the days"
        takeaway="Chips and utilisation turn work into days."
        details={
          <ul>
            <li>Utilisation (MFU) is the share of peak a run achieves: 30% to 50% in large runs; Meta reports 38% to 43% for this one.</li>
            <li>Across thousands of chips, time also goes to moving gradients between them.</li>
          </ul>
        }
      >
        <TrainLab models={models} devices={chips} />
      </Finding>

      <Finding
        {...findings[3]}
        answer={`${fmt(state8)} GB of training state for ${llama8.short}`}
        label={`Before activations: more than one ${h100.short} holds (${cap(h100.memoryGB)}).`}
        example={`16 bytes × ${fmt(llama8.paramsB)} billion parameters`}
        formula="16 bytes × parameters, mixed precision with Adam"
        takeaway="Training splits its memory across many chips."
        details={
          <ul>
            <li>ZeRO, or PyTorch&apos;s FSDP, gives each chip a slice of this state.</li>
            <li>Activations come on top, growing with the batch and the sequence length.</li>
            <li>Activation checkpointing recomputes them instead: up to about 8 × N per token instead of 6.</li>
          </ul>
        }
      >
        <StateBar />
      </Finding>

      <Finding
        {...findings[4]}
        answer="About 20 per parameter, by Chinchilla's rule"
        label="Chinchilla's best dense model for a fixed amount of compute."
        example={`${llama8.short} saw about 15 trillion tokens: ${fmt(15000 / llama8.paramsB)} per parameter`}
        takeaway="Models that will run a lot are trained far longer."
        details={<p>A smaller model trained longer costs more to train but less every time it runs.</p>}
      />

      <Finding
        {...findings[5]}
        answer="Each choice moves a formula"
        label="Start from a real model, then change its shape."
        takeaway="Parameters, precision, experts and KV heads set most of the costs."
        details={
          <ul>
            <li>
              <Strong>Parameters:</Strong> memory, writing speed and training work all scale with them.
            </li>
            <li>
              <Strong>Precision:</Strong> 4 bits is a quarter of 16, in memory and in bytes read.
            </li>
            <li>
              <Strong>Experts:</Strong> memory follows all of them; work and reads follow the ones used.
            </li>
            <li>
              <Strong>KV heads and layers:</Strong> set the KV cache per token (part 2).
            </li>
            <li>
              <Strong>Vocabulary:</Strong> {qwen4.short}&apos;s embedding table is {fmt(q4.embeddings / 1e9)}B of its {fmt(q4.total / 1e9)}B parameters.
            </li>
          </ul>
        }
      >
        <ModelBuilder models={models} devices={chips} />
      </Finding>

      <Closing id="limits" title="What the formulas leave out">
        <Bullets items={["Utilisation below peak, and failures and restarts.", "Time spent moving data between chips.", "Attention's own work over long sequences."]} />
      </Closing>

      <Closing id="sources" title="Sources">
        <p className={`${TEXT} text-base leading-7 text-ink-soft`}>Chip figures are from part 1&apos;s device list. The formulas come from these.</p>
        <Sources items={sources.filter((s) => s.for.includes("training"))} />
      </Closing>
      <SeriesNav post={post} end />
    </main>
  );
}
