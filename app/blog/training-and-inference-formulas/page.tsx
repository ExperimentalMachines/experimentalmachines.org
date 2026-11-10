import type { Metadata } from "next";
import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import { ArticleHeader, Bullets, DataTable, Formula, H3, P, Section, Sources, Steps, Wide } from "@/components/blog/Article";
import { ModelBuilder, PassesLab, SpecBars } from "@/components/blog/formulas/Builder";
import { Hierarchy, HybridLab, SpecLab } from "@/components/blog/formulas/Hardware";
import { DecodeLab, KvLab, RooflineLab, TrainLab, TrainStepLab } from "@/components/blog/formulas/Widgets";
import { posts } from "@/lib/blog";
import { decodeCeiling, fmt, fmtTime, kvBytesPerToken, kvGB, paramCount, precisions, prefillFLOPs, prefillSeconds, ridge, sci, trainFLOPs, weightsGB } from "@/lib/blog/arith";
import { devices, featured, models, sources } from "@/lib/blog/formulas-data";

const post = posts.find((p) => p.slug === "training-and-inference-formulas")!;

export const metadata: Metadata = {
  title: `${post.title}: Experimental Machines`,
  description: post.summary,
  openGraph: { title: post.title, description: post.summary, url: `/blog/${post.slug}/` },
};

// Every number in the prose is computed from lib/blog/formulas-data.ts, so a corrected spec changes the text too.
const dev = (id: string) => {
  const d = devices.find((x) => x.id === id);
  if (!d) throw new Error(`no device ${id}`);
  return d;
};
const model = (id: string) => models.find((m) => m.id === id)!;
type Model = (typeof models)[number];

const llama8 = model("llama31-8b");
const llama70 = model("llama31-70b");
const qwen4 = model("qwen3-4b");
const moe = model("qwen3-30b-a3b");
const phone = dev("sd8eg5");
const gpu = dev("rtx5090");
const h100 = dev("h100");
const chips = featured.chips.map(dev);
const kindName = { edge: "Edge", consumer: "Consumer GPU", server: "Server GPU", asic: "ASIC" } as const;
const bw = (gbs: number) => (gbs >= 1e6 ? `${fmt(gbs / 1e6)} PB/s` : gbs >= 1000 ? `${fmt(gbs / 1000)} TB/s` : `${fmt(gbs)} GB/s`);
const cap = (gb: number) => (gb < 1 ? `${fmt(gb * 1000)} MB` : `${fmt(gb)} GB`);
const strong = (s: string) => <strong className="font-medium text-ink">{s}</strong>;

const kib = (m: Model) => kvBytesPerToken(m.layers, m.kvHeads, m.headDim, 2) / 1024;
const kvAt = (m: Model, ctx: number) => kvGB(kvBytesPerToken(m.layers, m.kvHeads, m.headDim, 2), ctx, 1);

// Llama 3.1 405B, from Meta's paper and model card: the one training run here whose own FLOP count is published.
const big = { paramsB: 405, tokensB: 15600, gpuHours: 30.84e6 };
const bigFLOPs = trainFLOPs(big.paramsB, big.tokensB);
const bigAt40 = bigFLOPs / (h100.tflops! * 1e12 * 0.4) / 3600;

// Attention's own work per new token at a given context, beyond the 2N of the weights: the scores and the
// weighted sum of values, each 2 x context x (query heads x head size) per layer.
const attnOps = (m: Model, ctx: number) => 4 * m.layers * ctx * m.heads * m.headDim;

// Our measured case: Qwen3 4B as a 2.38 GB Q4_0 file on the Snapdragon 8 Elite Gen 5 (research/prefill-decode),
// fastest decode 12.1 tokens a second.
const measured = { fileGB: 2.38, bestTokS: 12.1, rangeTokS: "4.4 to 12.1" };

const prompt = 2000;
const shareOf = (part: number, whole: number) => `${Math.round((part / whole) * 100)}%`;
const q4 = paramCount(qwen4);
const l8 = paramCount(llama8);
const w8q = weightsGB(llama8.paramsB, 0.5);

export default function FormulasPost() {
  return (
    <main id="main" className="scroll-mt-28 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:scroll-mt-16">
      <ArticleHeader post={post} />

      <Section id="short" title="The short version">
        <P>Every chip, from a phone to a datacenter accelerator, has three numbers that decide how it handles a language model.</P>
        <Bullets
          items={[
            <>{strong("Memory capacity")}, in GB: what fits.</>,
            <>{strong("Memory bandwidth")}, in GB/s: how fast memory can be read.</>,
            <>{strong("Compute")}, in TFLOP/s: trillions of arithmetic operations a second.</>,
          ]}
        />
        <P>Three words come up everywhere below.</P>
        <Bullets
          items={[
            <>{strong("A parameter")}, or weight, is one number the model learned. Llama 3.1 8B has about 8 billion of them.</>,
            <>{strong("A token")} is a piece of text: a word, or part of one. Models read text as tokens and write a reply one token at a time.</>,
            <>{strong("A FLOP")} is one arithmetic operation on decimal numbers. TFLOP/s is a trillion of them a second.</>,
          ]}
        />
        <P>Six formulas connect the three numbers to what a model does. N is the number of parameters, D the number of training tokens.</P>
        <Wide>
          <DataTable
            label="The six formulas"
            head={["What", "Formula", "Usually waits on"]}
            rows={[
              ["Weights in memory", "N × bytes per parameter", "Capacity"],
              ["Reading a prompt (prefill)", "2 × N × prompt tokens operations", "Compute"],
              ["Writing a reply (decode)", "tokens/s ≤ bandwidth ÷ bytes read per token", "Bandwidth"],
              ["KV cache, per token", "2 × layers × KV heads × head size × bytes", "Capacity, then bandwidth"],
              ["Training compute", "6 × N × D operations", "Compute"],
              ["Training memory", "about 16 bytes × N, before activations", "Capacity"],
            ]}
          />
        </Wide>
        <P>
          The rest of this post builds each one up, with a panel to try it. Every number is computed from the formulas and the sourced specs, so moving a slider moves everything
          that depends on it.
        </P>
      </Section>

      <Section id="spec" title="Three numbers on a spec sheet">
        <H3>Where the weights live</H3>
        <P>
          A chip only computes on data that is already inside it. On most chips the weights are far too big for that, so they live in main memory and stream in, over and over. (A
          few chips, below, are built the other way round.)
        </P>
        <Wide>
          <Hierarchy />
        </Wide>
        <Bullets
          items={[
            <>{strong("SRAM")} is fast and holds its value without refreshing, but takes a lot of chip area per bit. Chips have megabytes of it.</>,
            <>
              {strong("DRAM")} is dense and cheap, so it comes in gigabytes, but it sits off the compute die and is slower to reach. LPDDR, GDDR and HBM are all DRAM, with
              different buses.
            </>,
            <>{strong("VRAM")} is not a technology. It means a graphics card&apos;s own memory: GDDR on a gaming card, HBM on a server GPU.</>,
            <>
              {strong("Unified memory")} is what phones and Apple&apos;s chips have instead: the CPU, GPU and NPU share one pool. On a phone, the model&apos;s &quot;VRAM&quot; is
              the same memory every app uses.
            </>,
          ]}
        />

        <H3>Bandwidth, from the memory bus</H3>
        <P>Bandwidth is how many wires the memory has, times how fast each one goes. Each data pin carries one bit per transfer.</P>
        <Formula
          label="Memory bandwidth, GB/s"
          where="R: data rate per pin in MT/s. Channels × bits per channel: the bus width, which is also the number of data pins. 8 bits a byte, 1,000 MB a GB."
        >
          bandwidth = R × (channels × bits per channel) ÷ 8 ÷ 1,000
        </Formula>
        <Bullets
          items={[
            <>{strong("R comes from the memory's speed grade.")} LPDDR5X-10667 moves 10,667 million bits a second on each pin.</>,
            <>
              {strong("The bus comes from the chip's design.")} An LPDDR5X channel is 16 bits; phones usually have four, a 64-bit bus. HBM gets its bandwidth from width: 1,024 bits
              a stack, several stacks a chip.
            </>,
            <>
              {strong("Watch for MHz.")} Some spec sheets quote the memory clock instead of transfers. LPDDR5X moves two transfers a clock, so if Qualcomm&apos;s &quot;5,300
              MHz&quot; is that clock, it is 10,600 MT/s. On the usual 64-bit phone bus, which Qualcomm does not print either, that is {bw(phone.bandwidthGBs)}: our estimate, not a
              published figure, and the phone figures below use it.
            </>,
            <>{strong("Watch for GiB.")} Vendors use GB (10⁹ bytes). Many tools report GiB (2³⁰ bytes), about 7.4% more. Mix the two and an estimate is off by that much.</>,
          ]}
        />

        <H3>Compute, from the arithmetic units</H3>
        <P>Compute is counted the same way: how many units, how much each does per clock, how many clocks a second.</P>
        <Formula label="Compute, TFLOP/s" where="One multiply-add (a × b + c) counts as 2 operations: the 2 you will see everywhere. Clock in GHz; 1,000 GFLOP/s a TFLOP/s.">
          compute = units × multiply-adds per clock × 2 × clock ÷ 1,000
        </Formula>
        <Bullets
          items={[
            "Lower precision packs more multiply-adds into a clock. 16-bit is often twice 32-bit, and 8-bit twice 16-bit. Always check which precision a figure is for.",
            <>
              Vendors often quote &quot;with sparsity&quot;, twice the dense rate, which ordinary models do not use. This post uses dense figures, and the{" "}
              <a href="#devices" className={link}>
                device table
              </a>{" "}
              says where a dense figure had to be derived.
            </>,
            "The Snapdragon and Apple pages cited here give no comparable figure for their NPUs, only comparisons with the last generation. Where a phone vendor does quote TOPS, check the precision it is for.",
          ]}
        />
        <Wide note="The graphics-card and MI300X presets reproduce the bandwidth their vendors print, and both compute presets NVIDIA's; the phone's is an estimate from its memory speed. Change any input to see what it does.">
          <SpecLab />
        </Wide>

        <H3>Two clocks, two phases</H3>
        <Bullets
          items={[
            "The memory has its own clock. A faster memory clock means more bandwidth, which can speed up writing a reply.",
            "The processor's clock sets compute, which can speed up reading a prompt. Writing barely moves while it is waiting on memory.",
            "A phone moves both clocks up and down with load and temperature, so the bandwidth a model gets can sit well below the peak.",
          ]}
        />

        <H3>Four kinds of memory</H3>
        <Wide>
          <DataTable
            label="Kinds of memory"
            head={["Memory", "Where", "How it gets its bandwidth", "Example"]}
            rows={[
              ["LPDDR", "Phones, laptops, edge boxes", "Low power, soldered beside the chip, a narrow bus", `${phone.short}: ${bw(phone.bandwidthGBs)}`],
              ["GDDR", "Consumer graphics cards", "Very fast pins on a wide bus, around the chip on the board", `${gpu.short}: ${bw(gpu.bandwidthGBs)}`],
              ["HBM", "Server GPUs and most ASICs", "Stacked dies on the same package as the chip, a very wide bus", `${h100.short}: ${bw(h100.bandwidthGBs)}`],
              [
                "On-chip SRAM",
                "Groq, Cerebras",
                "The memory is on the chip itself: huge bandwidth, little capacity",
                featured.sram.map((id) => `${dev(id).short}: ${cap(dev(id).memoryGB)}, ${bw(dev(id).bandwidthGBs)}`).join("; "),
              ],
            ]}
          />
        </Wide>

        <H3>The devices, side by side</H3>
        <Wide note="Bars are on log scales: each step is ten times the last. The last column is decode's ideal ceiling for one conversation on one chip: bandwidth ÷ weights. On on-chip SRAM that number runs into the millions and is not a useful prediction: compute, the latency from layer to layer and the links between chips can limit it first.">
          <SpecBars models={models} devices={devices} />
        </Wide>
        <div id="devices" className="scroll-mt-28 lg:scroll-mt-16">
          <Wide>
            <DataTable
              label="The devices and their specs"
              right={[2, 4, 5]}
              head={["Device", "Kind", "Memory", "Type", "Bandwidth", "16-bit TFLOP/s, dense"]}
              rows={devices.map((d) => [
                <span key={d.id} className="block min-w-[12rem]">
                  <a href={d.source} className={link} target="_blank" rel="noreferrer">
                    {d.name}
                  </a>
                  {d.note && <span className="mt-0.5 block text-xs font-normal leading-5 text-ink-soft">{d.note}</span>}
                </span>,
                kindName[d.kind],
                cap(d.memoryGB),
                d.memoryType,
                bw(d.bandwidthGBs),
                d.tflops ? d.tflops.toLocaleString("en-US", { maximumFractionDigits: 1 }) : (d.computeNote ?? "not published"),
              ])}
            />
          </Wide>
        </div>

        <H3>The ridge point: which of the two you wait on</H3>
        <Formula label="Ridge point" where="Operations a second over bytes a second: how many operations a chip can do for each byte it reads.">
          ridge = compute ÷ bandwidth
        </Formula>
        <Bullets
          items={[
            <>
              An {h100.short} does {fmt(h100.tflops!)} trillion BF16 operations a second and reads {bw(h100.bandwidthGBs)}: about {fmt(ridge(h100.tflops!, h100.bandwidthGBs))}{" "}
              operations per byte.
            </>,
            "Work that does fewer operations per byte than that waits on memory. Work that does more waits on compute.",
            "Each phase below leans one way or the other, and the formulas show which.",
          ]}
        />
      </Section>

      <Section id="bytes" title="A model, in bytes">
        <Formula label="Weights in memory" where="Parameters in billions, times bytes per parameter, gives GB.">
          weights = N × bytes per parameter
        </Formula>
        <Wide>
          <DataTable
            label="Two models at each precision"
            right={[1, 2, 3]}
            head={["Precision", "Bytes per parameter", llama8.short, llama70.short]}
            rows={precisions.map((p) => [p.name, String(p.bytes), `${fmt(weightsGB(llama8.paramsB, p.bytes))} GB`, `${fmt(weightsGB(llama70.paramsB, p.bytes))} GB`])}
          />
        </Wide>
        <Bullets
          items={[
            "Training keeps weights in BF16 with a 32-bit master copy. Serving uses BF16, FP8 or 4-bit.",
            "Real 4-bit files are a little bigger: each small block of weights carries its own scale. llama.cpp's Q4_0 stores 32 weights in 18 bytes, 4.5 bits a weight.",
            "What has to fit is the weights, plus the KV cache, plus the runtime. On a phone, the operating system and every other app share the same memory.",
          ]}
        />
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
          context adds more (see the last section).
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
              {strong("Grouped-query attention.")} Several query heads share one KV head. Llama 3.1 has {llama8.kvHeads} KV heads for {llama8.heads} query heads: a cache{" "}
              {llama8.heads / llama8.kvHeads} times smaller.
            </>,
            <>{strong("Multi-query attention.")} One KV head for all of them.</>,
            <>{strong("Multi-head latent attention.")} DeepSeek V2 and V3 store a compressed vector per token, plus a small positional key, instead of full keys and values.</>,
            <>{strong("Sliding windows.")} Some layers keep only the last few thousand tokens. Gemma 3 has five such layers for each one that sees everything.</>,
            <>{strong("Recurrent layers.")} As above: a state that does not grow.</>,
            <>{strong("A smaller cache format.")} Storing keys and values at FP8 halves it.</>,
          ]}
        />
      </Section>

      <Section id="training" title="Training: forward, loss, backward, update">
        <P>
          Training repeats one step many thousands of times: run a batch of text through the model, measure how wrong its predictions were, work out how to change every weight, and
          change them.
        </P>
        <Bullets
          items={[
            <>
              {strong("In ordinary pretraining, the model does not read its own guesses.")} Each position predicts the next token from the real text before it. (In reinforcement
              learning the model writes, and is scored.)
            </>,
            <>
              {strong("All positions go through at once,")} like one huge prefill, with a mask so each position sees only earlier ones. A sequence of T tokens is T predictions in
              one pass.
            </>,
            <>{strong("Keys and values are computed, but not kept as a cache for later tokens.")} They are kept, or recomputed, as activations for the backward pass.</>,
            <>
              {strong("Each weight read serves a large batch of tokens,")} so training usually sits far past the ridge: it waits on compute. What runs out first is memory capacity.
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
              {strong("Budget and target.")} The compute budget fixes 6 × N × D. Where it will run sets the rest: a phone&apos;s memory caps the total parameters, its bandwidth
              caps the active ones.
            </>,
            <>{strong("Size.")} Pick N and D: about 20 tokens per parameter for the best model per unit of compute, many more for a model that will be run a lot.</>,
            <>{strong("Shape.")} Width, layers, query heads and KV heads, feed-forward width, vocabulary. Proven models&apos; ratios are a safe start.</>,
            <>
              {strong("The common parts.")} Many recent open models start from the same pieces: a normalisation (RMSNorm) before each block to keep its numbers in range, a gated
              feed-forward block (SwiGLU), rotary position embeddings to tell the model each token&apos;s place, few or no biases, little or no dropout in pretraining. Models still
              differ.
            </>,
            <>
              {strong("The open questions.")} Which mixer, in what ratio and where (attention, sliding windows, recurrent layers); how many experts, and how many each token uses.
            </>,
            <>
              {strong("The training recipe.")} Optimiser (AdamW or Muon), learning rate with its warm-up and decay, weight decay, batch size in tokens, gradient clipping,
              precision. Tuned on small models and carried up to big ones.
            </>,
            <>
              {strong("Data and phases.")} Tokenizer and data mix, then pretraining, a final pass on the best data, longer contexts, instruction tuning, and preference or
              reinforcement learning.
            </>,
          ]}
        />
        <P>Steps 2 and 3 are where the formulas in this post live. Start from a real model, change its shape, and see what follows.</P>
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

      <Section id="phone" title="On a phone">
        <P>The same formulas explain why running a model on a phone is hard, and where it is easy.</P>
        <Bullets
          items={[
            <>
              {strong("Bandwidth is the wall.")} A {phone.short} reads about {bw(phone.bandwidthGBs)} by our estimate: {fmt(gpu.bandwidthGBs / phone.bandwidthGBs)} times less than
              an {gpu.short}, {fmt(h100.bandwidthGBs / phone.bandwidthGBs)} times less than an {h100.short}.
            </>,
            <>{strong("Capacity is shared.")} The phone&apos;s memory also holds the operating system and every app, so a model gets part of it.</>,
            <>{strong("The batch is 1.")} No other users share the weight read, so small models and 4-bit weights are what make writing fast.</>,
            <>
              {strong("An NPU helps prefill most.")} Prefill waits on compute, which an NPU adds. Decode mostly waits on the same shared memory, so more arithmetic helps it less.
            </>,
            <>
              {strong("Heat changes the numbers.")} A phone lowers its clocks when it gets hot, so sustained speed is lower than the first minute&apos;s.{" "}
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
            <>{strong("Utilisation.")} Large training runs reach 30% to 50% of peak compute. Meta reports 38% to 43% for Llama 3 405B.</>,
            <>
              {strong("Attention's own work.")} 2 × N counts the weights. Attention also compares each new token with every earlier one: about 4 × layers × context × (query heads ×
              head size) more. For {llama8.short} that adds {shareOf(attnOps(llama8, 8192), 2 * llama8.paramsB * 1e9)} at 8k tokens of context, and is{" "}
              {fmt(attnOps(llama8, 131072) / (2 * llama8.paramsB * 1e9))} times the weights&apos; work at 128k.
            </>,
            <>{strong("Communication.")} Across thousands of chips, training spends time moving gradients and activations between them.</>,
            <>{strong("Overheads.")} Unpacking 4-bit weights, launching kernels, waiting on threads and the operating system all take time the formulas do not count.</>,
            <>
              {strong("Tricks that change the shape of the work.")} Speculative decoding guesses several tokens and checks them in one pass, which turns some decode into something
              closer to prefill.
            </>,
          ]}
        />
      </Section>

      <Section id="sources" title="Sources">
        <P>Hardware figures come from each vendor&apos;s page or datasheet, linked in the device table. The formulas and examples come from these.</P>
        <Sources items={sources} />
      </Section>
    </main>
  );
}
