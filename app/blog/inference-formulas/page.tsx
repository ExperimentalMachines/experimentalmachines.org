import type { Metadata } from "next";
import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import { ArticleHeader, Bullets, Closing, Finding, InThisPost, SeriesNav, Sources, Strong, TEXT } from "@/components/blog/Article";
import { PassesLab } from "@/components/blog/formulas/Builder";
import { HybridLab, MixerCards } from "@/components/blog/formulas/Hardware";
import { DecodeLab, KvLab, RooflineLab } from "@/components/blog/formulas/Widgets";
import { PostNav } from "@/components/blog/PostNav";
import { posts } from "@/lib/blog";
import { decodeCeiling, fmt, fmtTime, prefillFLOPs, prefillSeconds, ridge, weightsGB } from "@/lib/blog/arith";
import { models, sources } from "@/lib/blog/formulas-data";
import { attnOps, bw, chips, gpu, h100, kib, kvAt, llama8, measured, moe, phone, prompt, shareOf, w8q } from "@/lib/blog/formulas-shared";

const post = posts.find((p) => p.slug === "inference-formulas")!;

export const metadata: Metadata = {
  title: `${post.title}: Experimental Machines`,
  description: post.summary,
  openGraph: { title: post.title, description: post.summary, url: `/blog/${post.slug}/`, images: post.banner ? [post.banner] : undefined },
};

const prefillT = prefillSeconds(llama8.paramsB, prompt, h100.tflops!, 0.5);
const ceiling = decodeCeiling(gpu.bandwidthGBs, w8q);
const kv128 = kvAt(llama8, 131072);
const ridgeH100 = ridge(h100.tflops!, h100.bandwidthGBs);

const findings = [
  { id: "phases", short: "Two phases", question: "What happens when you send a prompt?", answer: "Read it at once, then write" },
  { id: "prefill", short: "Reading the prompt", question: "How long does reading a prompt take?", answer: `${fmtTime(prefillT)} for 2,000 tokens` },
  { id: "decode", short: "Writing the reply", question: "How fast can it write a reply?", answer: `At most ${fmt(ceiling)} tokens a second` },
  { id: "kv", short: "The KV cache", question: "Why does a long chat use more memory?", answer: `${fmt(kv128)} GB at 128k tokens` },
  { id: "hybrid", short: "Hybrids", question: "How do newer models shrink it?", answer: "Attention in only some layers" },
  { id: "batch", short: "Batching", question: "How do servers write faster?", answer: `A batch of about ${fmt(ridgeH100)}` },
];

export default function InferenceFormulas() {
  return (
    <main id="main" className="scroll-mt-28 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:scroll-mt-16">
      <PostNav sections={[...findings, { id: "phone", short: "On a phone" }, { id: "limits", short: "Left out" }, { id: "sources", short: "Sources" }]} />
      <ArticleHeader post={post} />
      <InThisPost items={findings} />

      <Finding
        {...findings[0]}
        answer="It reads the prompt at once, then writes one token at a time"
        label="Reading is prefill; writing is decode. Each token of the reply needs the one before it."
        takeaway="Same work per token. The difference is how often the weights are read."
        details={
          <ul>
            <li>Prefill keeps every layer&apos;s keys and values for the prompt: the KV cache. That is most of what it is for.</li>
            <li>Each decode step adds one token&apos;s keys and values, then picks the next token from the scores.</li>
            <li>When a system prompt never changes, its cache can be kept and reused: prefix caching.</li>
          </ul>
        }
      >
        <PassesLab />
      </Finding>

      <Finding
        {...findings[1]}
        answer={`${fmtTime(prefillT)} for 2,000 tokens`}
        label={`${llama8.short} on an ${h100.short}, at half its peak compute.`}
        example={`2 × ${fmt(llama8.paramsB)}B × 2,000 = ${fmt(prefillFLOPs(llama8.paramsB, prompt) / 1e12)} trillion operations`}
        formula="2 × parameters × prompt tokens ÷ (compute × utilisation)"
        takeaway="Reading a prompt usually waits on compute."
        details={
          <p>
            2 × N counts the weights&apos; work. Attention also compares each token with every earlier one, which adds {shareOf(attnOps(llama8, 8192), 2 * llama8.paramsB * 1e9)} at
            8k tokens of context and {fmt(attnOps(llama8, 131072) / (2 * llama8.paramsB * 1e9))} times the weights&apos; work at 128k.
          </p>
        }
      />

      <Finding
        {...findings[2]}
        answer={`At most ${fmt(ceiling)} tokens a second`}
        label={`${llama8.short} at 4 bits on an ${gpu.short}: an ideal ceiling, not a measured speed.`}
        example={`${bw(gpu.bandwidthGBs)} ÷ ${fmt(w8q)} GB = ${fmt(ceiling)} tokens a second`}
        formula="bandwidth ÷ bytes read per token"
        takeaway="Writing a reply usually waits on memory bandwidth."
        details={
          <ul>
            <li>
              On a phone ({bw(phone.bandwidthGBs)}, our estimate) the same model&apos;s ceiling is {fmt(decodeCeiling(phone.bandwidthGBs, w8q))}.
            </li>
            <li>
              In{" "}
              <Go href="/research/prefill-decode/" className={link}>
                our Snapdragon runs
              </Go>
              , a {measured.fileGB} GB Qwen3 4B file wrote {measured.rangeTokS} tokens a second against a ceiling of {fmt(decodeCeiling(phone.bandwidthGBs, measured.fileGB))}:
              about {shareOf(measured.fileGB * measured.bestTokS, phone.bandwidthGBs)} of the bandwidth at best.
            </li>
            <li>
              A mixture of experts reads only the experts each token uses: {moe.short} stores {fmt(moe.paramsB)}B parameters and reads about {fmt(moe.activeB!)}B a token.
            </li>
          </ul>
        }
      >
        <DecodeLab models={models} devices={chips} />
      </Finding>

      <Finding
        {...findings[3]}
        answer={`${fmt(kv128)} GB at 128k tokens`}
        label={`${llama8.short}'s KV cache for one conversation, at 16 bits: more than its ${fmt(weightsGB(llama8.paramsB, 2))} GB of weights.`}
        example={`2 × ${llama8.layers} layers × ${llama8.kvHeads} KV heads × ${llama8.headDim} × 2 bytes = ${fmt(kib(llama8))} KiB a token`}
        formula="2 × layers × KV heads × head size × bytes"
        takeaway="The cache grows with every token, and is read for every new one."
        details={
          <ul>
            <li>It holds every earlier token&apos;s keys and values, so attention need not recompute them.</li>
            <li>Read in full for each new token, at 128k it roughly halves the bandwidth ceiling.</li>
            <li>
              <Strong>Grouped-query attention</Strong> shares a KV head across query heads: {llama8.heads} query heads, {llama8.kvHeads} KV heads, a cache{" "}
              {llama8.heads / llama8.kvHeads} times smaller.
            </li>
          </ul>
        }
      >
        <KvLab models={models} devices={chips} />
      </Finding>

      <Finding
        {...findings[4]}
        answer="Attention in only some layers"
        label="A hybrid with attention in 1 layer of 4 keeps a quarter of the KV cache, plus small states that do not grow."
        takeaway="Fewer attention layers: a smaller cache, with trade-offs that depend on the task."
        details={
          <ul>
            <li>
              <Strong>Sliding windows</Strong> keep only recent tokens in some layers: Gemma 3 has five such layers for each that sees everything.
            </li>
            <li>
              <Strong>Latent attention</Strong> (DeepSeek V2 and V3) stores a compressed vector per token instead of full keys and values.
            </li>
            <li>
              <Strong>An 8-bit cache</Strong> halves it.
            </li>
          </ul>
        }
      >
        <div className="space-y-4">
          <MixerCards />
          <HybridLab />
        </div>
      </Finding>

      <Finding
        {...findings[5]}
        answer={`A batch of about ${fmt(ridgeH100)}`}
        label={`Conversations an ${h100.short} needs at once before writing stops waiting on memory, at 16 bits: an ideal that ignores the KV cache.`}
        example={`2 × ${fmt(ridgeH100)} ÷ 2 bytes = ${fmt(ridgeH100)} operations per byte, the ridge (part 1)`}
        formula="2 × batch ÷ bytes per parameter"
        takeaway="Batching raises the total, not any one reply's speed."
        details={
          <ul>
            <li>Each conversation brings its own KV cache, read every step, so long chats eat into the gain.</li>
            <li>In a mixture of experts, a batch touches more experts, so it reads more of the weights.</li>
          </ul>
        }
      >
        <RooflineLab models={models} devices={chips} />
      </Finding>

      <Closing id="phone" title="On a phone">
        <Bullets
          items={[
            <>
              <Strong>Bandwidth is the wall:</Strong> {fmt(gpu.bandwidthGBs / phone.bandwidthGBs)} times less than an {gpu.short}.
            </>,
            <>
              <Strong>No batch:</Strong> small models and 4 bits are what make writing fast.
            </>,
            <>
              <Strong>Heat:</Strong> sustained speed drops, as{" "}
              <Go href="/research/decode-stall/" className={link}>
                our decode-stall study
              </Go>{" "}
              measured.
            </>,
          ]}
        />
      </Closing>

      <Closing id="limits" title="What the formulas leave out">
        <Bullets
          items={[
            "Attention's own work, which grows with the context.",
            "Overheads: unpacking 4-bit weights, launching kernels, waiting on threads.",
            "Speculative decoding, which checks several guessed tokens in one pass.",
          ]}
        />
      </Closing>

      <Closing id="sources" title="Sources">
        <p className={`${TEXT} text-base leading-7 text-ink-soft`}>Hardware figures are from part 1&apos;s device list. The formulas come from these.</p>
        <Sources items={sources.filter((s) => s.for.includes("inference"))} />
      </Closing>
      <SeriesNav post={post} end />
    </main>
  );
}
