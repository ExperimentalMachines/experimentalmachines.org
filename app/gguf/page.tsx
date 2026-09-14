import type { Metadata } from "next";
import EngineComparisonFigure from "@/components/gguf/EngineComparisonFigure";
import ThroughputFigure from "@/components/gguf/ThroughputFigure";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { sibling } from "@/lib/content";
import { ggufConditions, ggufLinks, ggufRecommended, ggufRows } from "@/lib/gguf";
import {
  ggufBf16Conditions,
  ggufBf16Decisions,
  ggufBf16Links,
  ggufBf16QuantFlips,
  ggufBf16Rerun,
  ggufBf16Sweep,
} from "@/lib/gguf-bf16";

export const metadata: Metadata = {
  title: "GGUF on one A100",
  description:
    "A 2B tool-calling model as BF16 GGUF and nine llama.cpp quantizations, benchmarked on one NVIDIA A100: size, bits per weight, generation and prompt throughput, against the same weights served by vLLM.",
};

function Section({ id, title, lede, children }: { id: string; title: string; lede?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-14 border-t border-rule">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
        <h2 className="wide text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        {lede && <p className="mt-3 max-w-2xl text-lg leading-7 text-ink-soft">{lede}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="text-blue hover:text-blue-deep">
    {children}
  </a>
);

const bf16 = ggufRows.find((r) => r.format === "BF16")!;
const quant = ggufRows.filter((r) => r.format !== "BF16");
const bySize = [...quant].sort((a, b) => a.bytes - b.bytes);
const pct = (x: number) => `${Math.round(x * 100)}%`;
const signed = (x: number) => `${x >= 0 ? "+" : "−"}${Math.abs(Math.round(x * 100))}%`;
const genGain = quant.map((r) => r.tg / bf16.tg - 1);
const ppShare = quant.map((r) => r.pp / bf16.pp);
const q6Flips = ggufBf16QuantFlips.find((r) => r.rung === ggufRecommended)!.flips;

export default function Gguf() {
  return (
    <>
      <Nav />
      <main>
        <section id="top" className="scroll-mt-14">
          <div className="mx-auto max-w-6xl px-6 pb-14 pt-14 sm:pt-20">
            <h1 className="wide max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              A 2B model in {ggufRows.length} GGUF formats on one A100.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-7 text-ink-soft">
              The <A href={ggufLinks.model}>checkpoint</A> is a Qwen3.5-2B tool-calling model from OpenGrad, the research repository of{" "}
              <A href={sibling.url}>{sibling.name}</A>. It was converted to BF16 GGUF and quantized {quant.length} ways with llama.cpp and one importance matrix, then
              benchmarked on one {ggufConditions.gpu} with every layer on the GPU. Every number is generated from the{" "}
              <A href={ggufLinks.results}>committed results</A>. What quantization did to the model&apos;s decisions is covered in full on the{" "}
              <A href={ggufLinks.study}>OpenGrad study page</A>. All {ggufRows.length} files are on{" "}
              <A href={ggufLinks.files}>Hugging Face</A>.
            </p>
          </div>
        </section>

        <Section
          id="throughput"
          title="Throughput per format"
          lede={`Against BF16, the quantized formats generate ${pct(Math.min(...genGain))} to ${pct(Math.max(...genGain))} faster, and process long prompts at ${pct(Math.min(...ppShare))} to ${pct(Math.max(...ppShare))} of its rate. On this GPU, quantization mainly saves memory.`}
        >
          <ThroughputFigure />
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft">
            Mean of {ggufConditions.repetitions} llama-bench repetitions; whiskers are one standard deviation. The dashed line is BF16. Prompt throughput is
            shown at 2,048 tokens because the 512-token runs had a standard deviation of up to {Math.round(ggufConditions.pp512MaxRelSd * 100)}% of their mean.
          </p>
        </Section>

        <Section id="formats" title="Size, bits per weight and what each format keeps">
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Per-format table, scrolls sideways on small screens">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead className="text-left text-ink-soft">
                <tr className="border-b border-rule">
                  <th className="py-2 pr-4 font-normal">Format</th>
                  <th className="py-2 pr-4 text-right font-normal">File</th>
                  <th className="py-2 pr-4 text-right font-normal">Bits per weight</th>
                  <th className="py-2 pr-4 text-right font-normal">Generation, tok/s</th>
                  <th className="py-2 pr-4 text-right font-normal">vs BF16</th>
                  <th className="py-2 pr-4 text-right font-normal">Prompt 2,048, tok/s</th>
                  <th className="py-2 pr-4 text-right font-normal">Decisions kept</th>
                  <th className="py-2 font-normal">Quality gate</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {[...bySize, bf16].map((r) => (
                  <tr key={r.format} className={`border-b border-rule align-top ${r.format === ggufRecommended ? "bg-plate font-medium" : ""}`}>
                    <td className="py-2.5 pr-4">
                      {r.format}
                      {r.format === ggufRecommended && <span className="ml-2 text-xs text-blue">recommended</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-right">{r.gib.toFixed(2)} GiB</td>
                    <td className="py-2.5 pr-4 text-right">{r.bitsPerWeight.toFixed(2)}</td>
                    <td className="py-2.5 pr-4 text-right">{r.tg.toFixed(1)}</td>
                    <td className="py-2.5 pr-4 text-right">{r.format === "BF16" ? "—" : signed(r.tg / bf16.tg - 1)}</td>
                    <td className="py-2.5 pr-4 text-right">{r.pp.toLocaleString("en-US")}</td>
                    <td className="py-2.5 pr-4 text-right">{r.agreement === null ? "reference" : `${(r.agreement * 100).toFixed(1)}%`}</td>
                    <td className={`py-2.5 ${r.passes ? "" : "text-ink-soft"}`}>{r.passes ? "passes" : "fails"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft">
            Bits per weight is the file size over {(ggufConditions.params / 1e9).toFixed(2)}B parameters, metadata included. Decisions kept is the share of{" "}
            {ggufConditions.examples.toLocaleString("en-US")} tool-use test prompts where the format decided the same thing as BF16. The quality gate is OpenGrad&apos;s,
            frozen before any format existed. {ggufRecommended} is the smallest format that passes it, by one example, and{" "}
            <A href={ggufLinks.errata}>OpenGrad&apos;s errata</A> show that margin is within rerun noise. Full method in the{" "}
            <A href={ggufLinks.report}>quantization report</A>.
          </p>
        </Section>

        <Section
          id="engines"
          title="The BF16 GGUF against a serving engine"
          lede={`These files are the deployment format. The same weights also ran as the plain BF16 checkpoint behind vLLM on an ${ggufBf16Conditions.vllm.gpu}, batching up to ${ggufBf16Conditions.vllm.maxNumSeqs} concurrent requests. This is not a like-for-like comparison: the sections above are llama.cpp on an ${ggufBf16Conditions.llamacpp.gpu}, and the engine, the GPU and the kernels all differ. Read it as one engine against another, not as ${ggufBf16Conditions.llamacpp.gpuShort} against ${ggufBf16Conditions.vllm.gpuShort}.`}
        >
          <EngineComparisonFigure />
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft">
            Top: vLLM output throughput as concurrency rises on a mixed request shape. The dashed line is this page&apos;s BF16 GGUF on the A100 at a single
            stream, {ggufBf16Conditions.llamacpp.tg} tokens per second, drawn at one request. Bottom: decisions changed out of{" "}
            {ggufBf16Conditions.examples.toLocaleString("en-US")} confirmatory prompts, each counted against the llama.cpp BF16 GGUF.
          </p>
          <div className="mt-8 overflow-x-auto" tabIndex={0} role="region" aria-label="vLLM serving sweep, scrolls sideways on small screens">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead className="text-left text-ink-soft">
                <tr className="border-b border-rule">
                  <th className="py-2 pr-4 text-right font-normal">Concurrent</th>
                  <th className="py-2 pr-4 font-normal">Shape</th>
                  <th className="py-2 pr-4 text-right font-normal">Requests/s</th>
                  <th className="py-2 pr-4 text-right font-normal">Output tok/s</th>
                  <th className="py-2 text-right font-normal">Total tok/s</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {ggufBf16Sweep.map((r) => (
                  <tr key={`${r.concurrency}-${r.shape}`} className="border-b border-rule">
                    <td className="py-2.5 pr-4 text-right">{r.concurrency}</td>
                    <td className="py-2.5 pr-4">{r.shape}</td>
                    <td className="py-2.5 pr-4 text-right">{r.requestsPerSecond.toFixed(1)}</td>
                    <td className="py-2.5 pr-4 text-right">{r.outputTps.toFixed(1)}</td>
                    <td className="py-2.5 text-right">{Math.round(r.totalTps).toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft">
            Requests per second peak at {ggufBf16Sweep.reduce((a, b) => (b.requestsPerSecond > a.requestsPerSecond ? b : a)).concurrency} concurrent and dip
            slightly at {Math.max(...ggufBf16Sweep.map((r) => r.concurrency))}, while total tokens per second keeps climbing — the later gain is prompt tokens,
            not decode. One request of each shape was also run separately: {ggufBf16Sweep.filter((r) => r.concurrency === 1).map((r) => `${r.shape} ${r.outputTps.toFixed(0)}`).join(", ")} output
            tokens per second. Cold start, loading the checkpoint into vLLM, was {ggufBf16Conditions.vllm.coldStartSeconds} seconds.
          </p>
          <div className="mt-8 max-w-3xl border-t border-rule pt-6">
            <h3 className="wide text-xl font-bold tracking-tight">What the engine changed</h3>
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              Changing the engine, the GPU and the kernels together moved {ggufBf16Decisions.flips} of {ggufBf16Decisions.examples.toLocaleString("en-US")}{" "}
              decisions — {pct(ggufBf16Decisions.agreement)} agreement, and {pct(ggufBf16Decisions.exactOutputAgreement)} on exact output. Of those flips,{" "}
              {ggufBf16Decisions.flipsTokenizerDivergent} fall on the six prompts already known to tokenize differently between the two engines, leaving{" "}
              {ggufBf16Decisions.flipsEngineNumerics} attributable to engine numerics. For scale, the {ggufRecommended} quantization this page recommends
              changed {q6Flips}. Moving between inference engines cost about as much per-example disagreement as the quantization OpenGrad spent a phase
              gating, which is why the comparison is reported here rather than folded into the ladder. The vLLM rerun reproduced the frozen reference within{" "}
              {ggufBf16Rerun.maxAbsDelta} call F1 at a parse-valid rate of {pct(ggufBf16Rerun.parseValidRate)}, so both engines were scored against a confirmed
              reference. Method and the per-example flips are in the{" "}
              <A href={ggufBf16Links.report}>H200 run report</A> and the <A href={ggufBf16Links.agreement}>agreement record</A>.
            </p>
          </div>
        </Section>

        <Section id="conditions" title="Conditions">
          <table className="w-full max-w-4xl border-collapse text-sm">
            <tbody>
              {[
                ["Engine", ggufConditions.engine],
                ["Hardware", `One ${ggufConditions.gpu}, on Modal`],
                ["Offload", ggufConditions.offload],
                ["Batching", ggufConditions.batch],
                ["KV cache", ggufConditions.kvCache],
                ["Repetitions", `${ggufConditions.repetitions} per test`],
                ["Run date", ggufConditions.runDate],
                ["Engine, vLLM run", ggufBf16Conditions.vllm.engine],
                ["Hardware, vLLM run", `One ${ggufBf16Conditions.vllm.gpu}, ${ggufBf16Conditions.vllm.gpuMemoryGib} GiB, on Modal`],
                [
                  "Batching, vLLM run",
                  `${ggufBf16Conditions.vllm.maxModelLen}-token context, up to ${ggufBf16Conditions.vllm.maxNumSeqs} sequences${
                    ggufBf16Conditions.vllm.prefixCaching ? "" : ", prefix caching off"
                  }, ${ggufBf16Conditions.vllm.dtype}`,
                ],
                ["Run date, vLLM run", ggufBf16Conditions.vllm.runDate],
              ].map((d) => (
                <tr key={d[0]} className="border-b border-rule align-top">
                  <td className="py-2.5 pr-6 text-ink-soft">{d[0]}</td>
                  <td className="py-2.5">{d[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-ink-soft">
            The throughput rows are single-stream llama-bench runs from an empty context. The vLLM run is a separate batching sweep on different hardware, so
            the two are not comparable row for row. Laptop, phone and CPU throughput were not measured for these files; on a phone, where memory bandwidth is
            the limit, the ranking can differ.
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
