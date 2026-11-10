import type { Metadata } from "next";
import { link } from "@/components/home/ui";
import { ArticleHeader, Bullets, DataTable, Formula, H3, P, Section, SeriesNav, Sources, Strong, Wide } from "@/components/blog/Article";
import { SpecBars } from "@/components/blog/formulas/Builder";
import { Hierarchy, SpecLab } from "@/components/blog/formulas/Hardware";
import { posts } from "@/lib/blog";
import { fmt, precisions, ridge, weightsGB } from "@/lib/blog/arith";
import { devices, featured, models, sources } from "@/lib/blog/formulas-data";
import { bw, cap, dev, gpu, h100, kindName, llama70, llama8, phone } from "@/lib/blog/formulas-shared";

const post = posts.find((p) => p.slug === "chip-formulas")!;

export const metadata: Metadata = {
  title: `${post.title}: Experimental Machines`,
  description: post.summary,
  openGraph: { title: post.title, description: post.summary, url: `/blog/${post.slug}/` },
};

export default function ChipFormulas() {
  return (
    <main id="main" className="scroll-mt-28 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:scroll-mt-16">
      <ArticleHeader post={post} />
      <SeriesNav post={post} />
      <Section id="short" title="The short version">
        <P>Every chip, from a phone to a datacenter accelerator, has three numbers that decide how it handles a language model.</P>
        <Bullets
          items={[
            <>
              <Strong>Memory capacity</Strong>, in GB: what fits.
            </>,
            <>
              <Strong>Memory bandwidth</Strong>, in GB/s: how fast memory can be read.
            </>,
            <>
              <Strong>Compute</Strong>, in TFLOP/s: trillions of arithmetic operations a second.
            </>,
          ]}
        />
        <P>Three words come up everywhere below.</P>
        <Bullets
          items={[
            <>
              <Strong>A parameter</Strong>, or weight, is one number the model learned. Llama 3.1 8B has about 8 billion of them.
            </>,
            <>
              <Strong>A token</Strong> is a piece of text: a word, or part of one. Models read text as tokens and write a reply one token at a time.
            </>,
            <>
              <Strong>A FLOP</Strong> is one arithmetic operation on decimal numbers. TFLOP/s is a trillion of them a second.
            </>,
          ]}
        />
        <P>Four formulas turn a spec sheet into something you can reason with. N is the number of parameters.</P>
        <Wide>
          <DataTable
            label="The chip's formulas"
            min="20rem"
            head={["What", "Formula"]}
            rows={[
              ["Memory bandwidth", "data rate per pin × bus width ÷ 8"],
              ["Compute", "units × multiply-adds per clock × 2 × clock"],
              ["Ridge point: which of the two a job waits on", "compute ÷ bandwidth"],
              ["Weights in memory: whether a model fits", "N × bytes per parameter"],
            ]}
          />
        </Wide>
        <P>
          This is part 1 of 3. Part 2 uses these numbers to work out how fast a model reads a prompt and writes a reply; part 3, how long it takes to train one. The panels work out
          their estimates from what you choose and the sourced specs; change an input and everything that depends on it moves.
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
            <>
              <Strong>SRAM</Strong> is fast and holds its value without refreshing, but takes a lot of chip area per bit. Chips have megabytes of it.
            </>,
            <>
              <Strong>DRAM</Strong> is dense and cheap, so it comes in gigabytes, but it sits off the compute die and is slower to reach. LPDDR, GDDR and HBM are all DRAM, with
              different buses.
            </>,
            <>
              <Strong>VRAM</Strong> is not a technology. It means a graphics card&apos;s own memory: GDDR on a gaming card, HBM on a server GPU.
            </>,
            <>
              <Strong>Unified memory</Strong> is what phones and Apple&apos;s chips have instead: the CPU, GPU and NPU share one pool. On a phone, the model&apos;s &quot;VRAM&quot;
              is the same memory every app uses.
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
            <>
              <Strong>R comes from the memory&apos;s speed grade.</Strong> LPDDR5X-10667 moves 10,667 million bits a second on each pin.
            </>,
            <>
              <Strong>The bus comes from the chip&apos;s design.</Strong> An LPDDR5X channel is 16 bits; phones usually have four, a 64-bit bus. HBM gets its bandwidth from width:
              1,024 bits a stack, several stacks a chip.
            </>,
            <>
              <Strong>Watch for MHz.</Strong> Some spec sheets quote the memory clock instead of transfers. LPDDR5X moves two transfers a clock, so if Qualcomm&apos;s &quot;5,300
              MHz&quot; is that clock, it is 10,600 MT/s. On the usual 64-bit phone bus, which Qualcomm does not print either, that is {bw(phone.bandwidthGBs)}: our estimate, not a
              published figure, and the phone figures below use it.
            </>,
            <>
              <Strong>Watch for GiB.</Strong> Vendors use GB (10⁹ bytes). Many tools report GiB (2³⁰ bytes), about 7.4% more. Mix the two and an estimate is off by that much.
            </>,
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
        <Wide note="Bars are on log scales: each step is ten times the last. The last column is decode's ideal ceiling for one conversation on one chip, bandwidth ÷ weights, which part 2 explains. On on-chip SRAM that number runs into the millions and is not a useful prediction: compute, the latency from layer to layer and the links between chips can limit it first.">
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
            "Parts 2 and 3 show which one each phase of running and training a model waits on.",
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

      <Section id="sources" title="Sources">
        <P>Hardware figures come from each vendor&apos;s page or datasheet, linked in the device table. The formulas and examples come from these.</P>
        <Sources items={sources.filter((s) => s.for.includes("chip"))} />
      </Section>
      <SeriesNav post={post} end />
    </main>
  );
}
