import type { Metadata } from "next";
import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import { ArticleHeader, Bullets, DataTable, Formula, H3, P, Section, SeriesNav, Sources, Steps, Strong, Wide } from "@/components/blog/Article";
import { PassesLab } from "@/components/blog/formulas/Builder";
import { HybridLab } from "@/components/blog/formulas/Hardware";
import { DecodeLab, KvLab, RooflineLab } from "@/components/blog/formulas/Widgets";
import { posts } from "@/lib/blog";
import { decodeCeiling, fmt, fmtTime, prefillFLOPs, prefillSeconds, ridge, weightsGB } from "@/lib/blog/arith";
import { models, sources } from "@/lib/blog/formulas-data";
import { attnOps, bw, chips, gpu, h100, kib, kvAt, llama8, measured, moe, phone, prompt, qwen4, shareOf, w8q } from "@/lib/blog/formulas-shared";

const post = posts.find((p) => p.slug === "inference-formulas")!;

export const metadata: Metadata = {
  title: `${post.title}: Experimental Machines`,
  description: post.summary,
  openGraph: { title: post.title, description: post.summary, url: `/blog/${post.slug}/` },
};

export default function InferenceFormulas() {
  return (
    <main id="main" className="scroll-mt-28 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:scroll-mt-16">
      <ArticleHeader post={post} />
      <SeriesNav post={post} />
      <Section id="short" title="The short version">
        <P>
          Running a model has two phases. For a long prompt and one conversation, they usually wait on different numbers from the chip&apos;s spec sheet (
          <Go href="/blog/chip-formulas/" className={link}>
            part 1
          </Go>
          ): reading the prompt on compute, writing the reply on memory bandwidth.
        </P>
        <Bullets
          items={[
            <>
              <Strong>A parameter</Strong>, or weight, is one number the model learned. N is how many there are.
            </>,
            <>
              <Strong>A token</Strong> is a piece of text, a word or part of one. A model reads a prompt as tokens and writes its reply one token at a time.
            </>,
          ]}
        />
        <Wide>
          <DataTable
            label="The formulas for running a model"
            head={["What", "Formula", "Usually waits on"]}
            rows={[
              ["Weights in memory", "N × bytes per parameter", "Capacity"],
              ["Reading a prompt (prefill)", "2 × N × prompt tokens operations", "Compute"],
              ["Writing a reply (decode)", "tokens/s ≤ bandwidth ÷ bytes read per token", "Bandwidth"],
              ["KV cache, per token", "2 × layers × KV heads × head size × bytes", "Capacity, then bandwidth"],
              ["Decoding a batch, dense model", "about 2 × batch ÷ bytes per parameter operations per byte", "Bandwidth at small batches, compute at large ones"],
            ]}
          />
        </Wide>
        <P>This is part 2 of 3. The panels work out their estimates from what you choose and the sourced specs; change an input and everything that depends on it moves.</P>
      </Section>

      <Section id="inference" title="Inference: reading the prompt, writing the reply">
        <P>The weights are copied into memory once, when the model loads. After that, running it has two phases.</P>
        <H3>Prefill: reading the prompt</H3>
        <Steps
          items={[
            "The prompt (the system prompt, any tool descriptions, the conversation so far and the new message) is split into tokens, and each token becomes a vector: a list of a few thousand numbers.",
            "All of them go through every layer together. Each layer is attention (query, key and value projections, scores, an output projection) and a feed-forward block: many matrix multiplications, not one.",
            "Every layer keeps the keys and values it computed for every prompt token. That is the KV cache, and it is what prefill is mostly for.",
            "The last position's output becomes a score for every token in the vocabulary, and the first token of the reply is picked from them.",
          ]}
        />
        <H3>Decode: writing the reply</H3>
        <Steps
          items={[
            "The newest token goes through every layer, alone.",
            "In each layer, its key and value are added to the cache, and its query looks back over the whole cache.",
            "The scores at the end are turned into the next token: the most likely one, or a weighted random pick (temperature and top-p are the settings for how adventurous).",
            "That token is the next step's input. It stops at an end-of-text token or the length limit.",
          ]}
        />
        <Wide note="Both phases do about the same weight arithmetic per token. The difference is how many tokens share one read of the weights.">
          <PassesLab />
        </Wide>
        <Wide>
          <DataTable
            label="Prefill against decode"
            head={["", "Prefill", "Decode"]}
            rows={[
              ["Tokens per pass", "The whole prompt, or a large chunk of it", "One"],
              ["Operations per token", "About 2 × N", "About 2 × N"],
              ["Weights read", "Once per pass", "Once per token"],
              ["Operations per byte, at BF16", "About the number of tokens in the pass", "About 1"],
              ["Waits on", "Compute", "Memory bandwidth"],
              ["You feel it as", "Time to the first token", "Tokens a second"],
            ]}
          />
        </Wide>
        <P>When a system prompt is the same every time, its KV cache can be kept and reused, so only the new part of the prompt is read. That is prefix caching.</P>

        <H3>Prefill time</H3>
        <P>
          Almost all the work is matrix multiplication, roughly one multiply and one add per weight per token: about 2 × N operations, a first estimate. Attention over a long
          context adds more (see{" "}
          <a href="#limits" className={link}>
            what the formulas leave out
          </a>
          ).
        </P>
        <Formula label="Prefill time" where="Utilisation is the share of peak a real system reaches; 50% is a fair guess for a long prompt.">
          time ≈ 2 × N × prompt tokens ÷ (compute × utilisation)
        </Formula>
        <Bullets
          items={[
            <>
              {llama8.short} reading a {fmt(prompt)}-token prompt: 2 × {fmt(llama8.paramsB)}B × {fmt(prompt)} = {fmt(prefillFLOPs(llama8.paramsB, prompt) / 1e12)} trillion
              operations.
            </>,
            <>
              On an {h100.short} at 50% of its {fmt(h100.tflops!)} TFLOP/s, that is {fmtTime(prefillSeconds(llama8.paramsB, prompt, h100.tflops!, 0.5))}.
            </>,
          ]}
        />

        <H3>Decode speed</H3>
        <P>
          Every new token passes through every layer, so in the simple picture the weights are read from main memory once per token. Reading is far slower than computing, so for
          one conversation the limit is usually bandwidth. The formula gives a ceiling under that picture, not a measured speed.
        </P>
        <Formula
          label="Decode speed, one conversation: an ideal ceiling"
          where="Bytes read per token: the weights (only the active ones, for a mixture of experts) plus that conversation's KV cache. The examples below count the weights only, as at the start of a conversation."
        >
          tokens/s ≤ bandwidth ÷ bytes read per token
        </Formula>
        <Bullets
          items={[
            <>
              {llama8.short} at 4-bit is {fmt(w8q)} GB. On an {gpu.short} ({bw(gpu.bandwidthGBs)}) that is at most {fmt(decodeCeiling(gpu.bandwidthGBs, w8q))} tokens a second.
            </>,
            <>
              On a phone with a {phone.short} ({bw(phone.bandwidthGBs)}), at most {fmt(decodeCeiling(phone.bandwidthGBs, w8q))}.
            </>,
            <>
              Real speeds land below the ceiling. In{" "}
              <Go href="/research/prefill-decode/" className={link}>
                our Snapdragon runs
              </Go>
              , {qwen4.short} as a {measured.fileGB} GB Q4_0 file had a ceiling of {fmt(decodeCeiling(phone.bandwidthGBs, measured.fileGB))} tokens a second and wrote{" "}
              {measured.rangeTokS}, depending on which processor did it.
            </>,
          ]}
        />
        <Formula
          label="Model bandwidth utilisation (MBU)"
          where="An estimate of how much of the memory's peak a runtime uses, useful for comparing runtimes on the same chip. It is not a direct measurement of the memory bus."
        >
          MBU = bytes read per token × measured tokens/s ÷ peak bandwidth
        </Formula>
        <P>
          Our best {qwen4.short} run, counting the file size as the bytes, leaving out the small KV cache, against the estimated {fmt(phone.bandwidthGBs)} GB/s: {measured.fileGB}{" "}
          GB × {measured.bestTokS} ÷ {fmt(phone.bandwidthGBs)} = {shareOf(measured.fileGB * measured.bestTokS, phone.bandwidthGBs)}.
        </P>
        <Wide note="Pick a model, a precision and a device. The sweep is one read of the weights per token, slowed down so it can be seen.">
          <DecodeLab models={models} devices={chips} />
        </Wide>

        <H3>Mixtures of experts, in each phase</H3>
        <P>A mixture-of-experts model replaces each feed-forward block with many smaller ones, and a router picks a few of them for each token.</P>
        <Bullets
          items={[
            "In both phases a token runs only through its chosen experts, so operations per token follow the active parameters.",
            "In prefill, different tokens pick different experts, so a long prompt touches most of them. Each expert's read is shared by the tokens that picked it, so prefill usually still waits on compute, as long as each expert gets enough tokens.",
            <>
              In decode, one token reads only its own experts. {moe.short} stores {fmt(moe.paramsB)}B parameters and reads about {fmt(moe.activeB!)}B per token. That is why it
              writes fast.
            </>,
            "All the experts still have to fit in memory. And in batched decode, different conversations pick different experts, so the bytes read climb back toward the total. The roofline panel below models that.",
          ]}
        />

        <H3>Batching, and the roofline</H3>
        <P>A server&apos;s answer to the bandwidth limit is to serve many conversations at once. One read of the weights then writes a token for each of them.</P>
        <Formula
          label="Operations per byte of weights, decoding a batch of a dense model"
          where="B conversations, 2 operations per parameter each, over the bytes each parameter takes. KV caches add bytes, so the real figure is lower."
        >
          intensity ≈ 2 × B ÷ bytes per parameter
        </Formula>
        <Bullets
          items={[
            <>
              At BF16 the intensity equals the batch. An {h100.short} stops waiting on memory at a batch of about {fmt(ridge(h100.tflops!, h100.bandwidthGBs))}, its ridge point.
            </>,
            "Batching raises the total tokens a second. It does not make any one reply faster.",
            "Each conversation brings its own KV cache, which is read every step too, so long conversations eat into the gain.",
            "A phone serves one person. It runs at a batch of 1, on the far left of this chart.",
          ]}
        />
        <Wide note="The line is the most a chip can do at each intensity: rising while memory is the limit, flat once compute is. The decode point counts the KV caches too. For the mixture of experts it estimates the experts a batch touches, assuming each token picks its experts independently and evenly and each one touched is read once. Only weight reads and weight arithmetic are counted; attention adds more at long prompts.">
          <RooflineLab models={models} devices={chips} />
        </Wide>
      </Section>

      <Section id="kv" title="The KV cache">
        <P>
          To write token 1,001, attention looks back at the 1,000 before it. Rather than recompute them, the model keeps every past token&apos;s keys and values: vectors, not the
          tokens themselves.
        </P>
        <Formula label="KV cache per token" where="2 for a key and a value, in every layer, for every KV head, each head size numbers wide.">
          KV bytes per token = 2 × layers × KV heads × head size × bytes
        </Formula>
        <Bullets
          items={[
            <>
              {llama8.short}: 2 × {llama8.layers} × {llama8.kvHeads} × {llama8.headDim} × 2 bytes = {fmt(kib(llama8))} KiB a token.
            </>,
            <>
              A full 128k-token conversation: {fmt(kvAt(llama8, 131072))} GB, a little more than the weights at BF16 ({fmt(weightsGB(llama8.paramsB, 2))} GB). If weights and cache
              are each read once per token and bandwidth alone sets the speed, the ceiling at the end of that conversation is about half the one at its start.
            </>,
          ]}
        />
        <Wide>
          <DataTable
            label="KV cache for one conversation, BF16"
            right={[1, 2, 3, 4]}
            head={["Model", "Per token", "8k tokens", "32k tokens", "128k tokens"]}
            rows={models.map((m) => [m.short, `${fmt(kib(m))} KiB`, `${fmt(kvAt(m, 8192))} GB`, `${fmt(kvAt(m, 32768))} GB`, `${fmt(kvAt(m, 131072))} GB`])}
          />
        </Wide>
        <Wide note="The bar is the device's whole memory. Raise the context or the batch until the cache no longer fits.">
          <KvLab models={models} devices={chips} />
        </Wide>

        <H3>Hybrid models: attention in only some layers</H3>
        <P>Every layer of a transformer has the same skeleton. Only the mixer, the part that lets a token see earlier tokens, differs between designs.</P>
        <Formula
          label="One layer"
          where="x is the running vector each layer adds to. The feed-forward block treats each token on its own; only the mixer moves information between tokens."
        >
          x → norm → mixer → + x → norm → feed-forward → + x
        </Formula>
        <Wide>
          <DataTable
            label="Attention against a recurrent mixer"
            head={["", "Attention", "Recurrent (Mamba-2, Gated DeltaNet, RWKV)"]}
            rows={[
              ["What it keeps", "Every earlier token's key and value", "One state of fixed size that the past is folded into"],
              ["Prefill cost", "The comparisons between tokens grow with the square of the prompt length", "Grows in proportion to it"],
              ["Decode cost per token", "Grows as the cache grows", "The same at token 10 as at token 100,000"],
              ["Strength", "Can look straight back at any earlier token", "Cheap; but the state compresses the past, so details from far back can be lost"],
            ]}
          />
        </Wide>
        <P>A hybrid keeps a few attention layers for looking straight back and makes the rest recurrent. Only the attention layers have a KV cache:</P>
        <Formula label="KV cache of a hybrid" where="Only the layers with attention count; the recurrent layers add a fixed amount that does not grow.">
          KV bytes = 2 × attention layers × KV heads × head size × bytes × tokens
        </Formula>
        <Wide note="A 32-layer model shaped like Llama 3.1 8B, with the same KV heads in every attention layer. Left alone, the conversation grows from 1k to 128k tokens; drag the slider to hold it.">
          <HybridLab />
        </Wide>
        <P>Most recent designs exist partly to shrink this cache.</P>
        <Bullets
          items={[
            <>
              <Strong>Grouped-query attention.</Strong> Several query heads share one KV head. Llama 3.1 has {llama8.kvHeads} KV heads for {llama8.heads} query heads: a cache{" "}
              {llama8.heads / llama8.kvHeads} times smaller.
            </>,
            <>
              <Strong>Multi-query attention.</Strong> One KV head for all of them.
            </>,
            <>
              <Strong>Multi-head latent attention.</Strong> DeepSeek V2 and V3 store a compressed vector per token, plus a small positional key, instead of full keys and values.
            </>,
            <>
              <Strong>Sliding windows.</Strong> Some layers keep only the last few thousand tokens. Gemma 3 has five such layers for each one that sees everything.
            </>,
            <>
              <Strong>Recurrent layers.</Strong> As above: a state that does not grow.
            </>,
            <>
              <Strong>A smaller cache format.</Strong> Storing keys and values at FP8 halves it.
            </>,
          ]}
        />
      </Section>

      <Section id="phone" title="On a phone">
        <P>The same formulas explain why running a model on a phone is hard, and where it is easy.</P>
        <Bullets
          items={[
            <>
              <Strong>Bandwidth is the wall.</Strong> A {phone.short} reads about {bw(phone.bandwidthGBs)} by our estimate: {fmt(gpu.bandwidthGBs / phone.bandwidthGBs)} times less
              than an {gpu.short}, {fmt(h100.bandwidthGBs / phone.bandwidthGBs)} times less than an {h100.short}.
            </>,
            <>
              <Strong>Capacity is shared.</Strong> The phone&apos;s memory also holds the operating system and every app, so a model gets part of it.
            </>,
            <>
              <Strong>The batch is 1.</Strong> No other users share the weight read, so small models and 4-bit weights are what make writing fast.
            </>,
            <>
              <Strong>An NPU helps prefill most.</Strong> Prefill waits on compute, which an NPU adds. Decode mostly waits on the same shared memory, so more arithmetic helps it
              less.
            </>,
            <>
              <Strong>Heat changes the numbers.</Strong> A phone lowers its clocks when it gets hot, so sustained speed is lower than the first minute&apos;s.{" "}
              <Go href="/research/decode-stall/" className={link}>
                Our decode stall study
              </Go>{" "}
              measured what that does to a reply.
            </>,
          ]}
        />
      </Section>

      <Section id="limits" title="What the formulas leave out">
        <P>They are ceilings and estimates. Real systems land below them, for reasons the formulas do not see.</P>
        <Bullets
          items={[
            <>
              <Strong>Attention&apos;s own work.</Strong> 2 × N counts the weights. Attention also compares each new token with every earlier one: about 4 × layers × context ×
              (query heads × head size) more. For {llama8.short} that adds {shareOf(attnOps(llama8, 8192), 2 * llama8.paramsB * 1e9)} at 8k tokens of context, and is{" "}
              {fmt(attnOps(llama8, 131072) / (2 * llama8.paramsB * 1e9))} times the weights&apos; work at 128k.
            </>,
            <>
              <Strong>Overheads.</Strong> Unpacking 4-bit weights, launching kernels, waiting on threads and the operating system all take time the formulas do not count.
            </>,
            <>
              <Strong>Tricks that change the shape of the work.</Strong> Speculative decoding guesses several tokens and checks them in one pass, which turns some decode into
              something closer to prefill.
            </>,
          ]}
        />
      </Section>

      <Section id="sources" title="Sources">
        <P>The hardware figures are from part 1&apos;s device table. The formulas and examples come from these.</P>
        <Sources items={sources.filter((s) => s.for.includes("inference"))} />
      </Section>
      <SeriesNav post={post} end />
    </main>
  );
}
