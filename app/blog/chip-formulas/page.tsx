import type { Metadata } from "next";
import { ArticleHeader, Closing, Finding, InThisPost, SeriesNav, Sources, Strong, TEXT } from "@/components/blog/Article";
import { BandwidthLab, ComputeLab, DeviceCompare, Hierarchy, MemoryKinds, PrecisionLab, RidgeScale } from "@/components/blog/formulas/Hardware";
import { PostNav } from "@/components/blog/PostNav";
import { link } from "@/components/home/ui";
import { posts } from "@/lib/blog";
import { fmt, ridge, weightsGB } from "@/lib/blog/arith";
import { devices, models, sources } from "@/lib/blog/formulas-data";
import { bw, cap, dev, gpu, h100, llama8, phone } from "@/lib/blog/formulas-shared";

const post = posts.find((p) => p.slug === "chip-formulas")!;

export const metadata: Metadata = {
  title: `${post.title}: Experimental Machines`,
  description: post.summary,
  openGraph: { title: post.title, description: post.summary, url: `/blog/${post.slug}/`, images: post.banner ? [post.banner] : undefined },
};

const wse = dev("wse3");
const lpu = dev("lpu");
const ridgeH100 = ridge(h100.tflops!, h100.bandwidthGBs);
const w16 = weightsGB(llama8.paramsB, 2);
const w4 = weightsGB(llama8.paramsB, 0.5);

const findings = [
  { id: "where", short: "Where weights live", question: "Where do the weights live?", answer: "Usually in main memory, beside the chip" },
  { id: "bandwidth", short: "Bandwidth", question: "How fast can memory be read?", answer: `${bw(h100.bandwidthGBs)} on an H100` },
  { id: "compute", short: "Compute", question: "How much arithmetic can it do?", answer: `${fmt(h100.tflops!)} TFLOP/s on an H100` },
  { id: "ridge", short: "Which limit", question: "Which one does a job wait on?", answer: `${fmt(ridgeH100)} operations per byte` },
  { id: "fit", short: "Weights", question: "How much memory do the weights need?", answer: `${fmt(w16)} GB, or ${fmt(w4)} GB at 4 bits` },
  { id: "compare", short: "Real chips", question: "How do real chips compare?", answer: `${bw(phone.bandwidthGBs)} to ${bw(wse.bandwidthGBs)}` },
];

export default function ChipFormulas() {
  return (
    <main id="main" className="scroll-mt-28 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:scroll-mt-16">
      <PostNav sections={[...findings, { id: "sources", short: "Sources" }]} />
      <ArticleHeader post={post} />
      <InThisPost items={findings} />

      <Finding
        {...findings[0]}
        answer="Usually in main memory, beside the chip"
        label="Writing a reply, the chip reads them in again for every token."
        example={`${llama8.short} at 16 bits: ${fmt(w16)} GB, read once per reply token`}
        takeaway="The link from memory into the chip is the speed limit to watch."
        details={
          <ul>
            <li>
              <Strong>SRAM</Strong> sits on the chip: fast, but megabytes. <Strong>DRAM</Strong> (LPDDR, GDDR, HBM) sits beside it: gigabytes, slower to reach.
            </li>
            <li>
              <Strong>VRAM</Strong> is not a kind of memory. It means a graphics card&apos;s own DRAM.
            </li>
            <li>
              <Strong>Unified memory</Strong>, on phones and Apple chips, is one pool the CPU, GPU and NPU share with every app.
            </li>
          </ul>
        }
      >
        <Hierarchy />
      </Finding>

      <Finding
        {...findings[1]}
        answer={`${bw(h100.bandwidthGBs)} on an H100`}
        label={`About ${bw(phone.bandwidthGBs)} on a phone. Memory bandwidth: bytes a second into the chip.`}
        example="10,667 MT/s × 64 bits ÷ 8 = 85.3 GB/s, a phone's LPDDR5X"
        formula="data rate per pin × bus width ÷ 8"
        takeaway="Bandwidth is how many wires, times how fast each one goes."
        details={
          <ul>
            <li>
              <Strong>The bus width</Strong> is channels × bits each: a phone has four 16-bit channels; HBM has 1,024 bits a stack.
            </li>
            <li>
              <Strong>Watch for MHz.</Strong> LPDDR5X moves two transfers a clock, so Qualcomm&apos;s &quot;5,300 MHz&quot; is 10,600 MT/s. With the usual 64-bit bus, which
              Qualcomm does not print, that is about {bw(phone.bandwidthGBs)}: our estimate.
            </li>
            <li>
              <Strong>Watch for GiB.</Strong> Vendors use GB (10⁹ bytes); many tools report GiB (2³⁰), 7.4% more.
            </li>
          </ul>
        }
      >
        <BandwidthLab />
      </Finding>

      <Finding
        {...findings[2]}
        answer={`${fmt(h100.tflops!)} trillion operations a second`}
        label="An H100 at 16 bits. This is the TFLOP/s on a spec sheet."
        example="16,384 cores × 1 × 2 × 2.52 GHz = 82.6 TFLOP/s, an RTX 4090 at 32 bits"
        formula="units × multiply-adds per clock × 2 × clock"
        takeaway="Lower precision, where the chip supports it, fits more operations into each clock."
        details={
          <ul>
            <li>A multiply and an add count as two operations: that is the 2.</li>
            <li>Figures &quot;with sparsity&quot; are twice the dense rate, which ordinary models do not reach. This series uses dense figures.</li>
            <li>The phone chips here publish no comparable figure, only comparisons with the last generation.</li>
            <li>The memory and the processor have separate clocks: memory&apos;s sets bandwidth, the processor&apos;s sets compute.</li>
          </ul>
        }
      >
        <ComputeLab />
      </Finding>

      <Finding
        {...findings[3]}
        answer={`${fmt(ridgeH100)} operations per byte`}
        label="An H100's ridge point: its compute over its bandwidth."
        example={`${fmt(h100.tflops!)} TFLOP/s ÷ ${bw(h100.bandwidthGBs)} = ${fmt(ridgeH100)}`}
        formula="compute ÷ bandwidth"
        takeaway="Below the ridge, a job waits on memory. Above it, on compute."
      >
        <RidgeScale
          ridgeAt={ridgeH100}
          jobs={[
            { label: "Writing a reply", at: 1, tone: "#d9480f" },
            { label: "Reading a 2,000-token prompt", at: 2000, tone: "#2b44e6" },
          ]}
        />
      </Finding>

      <Finding
        {...findings[4]}
        answer={`${fmt(w16)} GB at 16 bits, ${fmt(w4)} GB at 4 bits`}
        label={`${llama8.short}'s weights alone, at ideal sizes.`}
        example={`${fmt(llama8.paramsB)} billion parameters × 2 bytes = ${fmt(w16)} GB`}
        formula="parameters × bytes per parameter"
        takeaway="Halve the bits, halve the memory."
        details={
          <ul>
            <li>Real 4-bit files are a little bigger: llama.cpp&apos;s Q4_0 stores 32 weights in 18 bytes, 4.5 bits each.</li>
            <li>What has to fit is the weights, the KV cache (part 2) and the runtime.</li>
            <li>On a phone, the operating system and every app share the same memory.</li>
          </ul>
        }
      >
        <PrecisionLab models={models} marks={[phone, gpu, h100]} />
      </Finding>

      <Finding
        {...findings[5]}
        answer={`${bw(phone.bandwidthGBs)} to ${bw(wse.bandwidthGBs)}`}
        label="Memory bandwidth, from a phone to a wafer-sized chip."
        takeaway="Memory type and bus width set most of the difference."
        details={
          <>
            <p>
              Every figure is from the vendor&apos;s own page, linked below. Where a figure is ours, the note says how. Groq&apos;s chip holds {cap(lpu.memoryGB)}: a model is
              spread across many.
            </p>
            <ul>
              {devices.map((d) => (
                <li key={d.id}>
                  <a href={d.source} className={link} target="_blank" rel="noreferrer">
                    {d.name}
                  </a>
                  : {cap(d.memoryGB)} {d.memoryType}, {bw(d.bandwidthGBs)}, {d.tflops ? `${fmt(d.tflops)} TFLOP/s` : (d.computeNote ?? "no TFLOP/s published")}.
                  {d.note ? ` ${d.note}` : ""}
                </li>
              ))}
            </ul>
          </>
        }
      >
        <div className="space-y-4">
          <DeviceCompare devices={devices} initial={["sd8eg5", "rtx5090", "h100"]} />
          <MemoryKinds
            examples={{
              LPDDR: `${phone.short}: ${bw(phone.bandwidthGBs)}`,
              GDDR: `${gpu.short}: ${bw(gpu.bandwidthGBs)}`,
              HBM: `${h100.short}: ${bw(h100.bandwidthGBs)}`,
              SRAM: `${wse.short}: ${bw(wse.bandwidthGBs)}`,
            }}
          />
        </div>
      </Finding>

      <Closing id="sources" title="Sources">
        <p className={`${TEXT} text-base leading-7 text-ink-soft`}>Hardware figures are linked from each device above. The formulas come from these.</p>
        <Sources items={sources.filter((s) => s.for.includes("chip"))} />
      </Closing>
      <SeriesNav post={post} end />
    </main>
  );
}
