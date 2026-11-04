import EngineComparisonFigure from "@/components/gguf/EngineComparisonFigure";
import ThroughputFigure from "@/components/gguf/ThroughputFigure";
import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import { Scroll, th, thNum } from "@/components/openweights/pd-parts";
import Post, { Figure, Findings, More, P, postMetadata, Row, Rows, Section } from "@/components/research/Post";
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

const href = "/research/a100-quantization/";

export const metadata = postMetadata(
  href,
  "A 2B tool-calling model as BF16 GGUF and nine llama.cpp quantizations, benchmarked on one NVIDIA A100: size, bits per weight, generation and prompt throughput, against the same weights served by vLLM.",
);

const bf16 = ggufRows.find((r) => r.format === "BF16")!;
const quant = ggufRows.filter((r) => r.format !== "BF16");
const bySize = [...quant].sort((a, b) => a.bytes - b.bytes);
const pct = (x: number) => `${Math.round(x * 100)}%`;
const signed = (x: number) => `${x >= 0 ? "+" : "−"}${Math.abs(Math.round(x * 100))}%`;
const genGain = quant.map((r) => r.tg / bf16.tg - 1);
const ppShare = quant.map((r) => r.pp / bf16.pp);
const q6Flips = ggufBf16QuantFlips.find((r) => r.rung === ggufRecommended)!.flips;
const singleStream = ggufBf16Sweep
  .filter((r) => r.concurrency === 1)
  .map((r) => `${r.shape} ${r.outputTps.toFixed(0)}`)
  .join(", ");
const peak = ggufBf16Sweep.reduce((a, b) => (b.requestsPerSecond > a.requestsPerSecond ? b : a)).concurrency;
const top = Math.max(...ggufBf16Sweep.map((r) => r.concurrency));

const Cell = "py-2.5 pr-4 text-right";

export default function Gguf() {
  return (
    <Post
      href={href}
      sources={[
        { label: "Committed results", href: ggufLinks.results },
        { label: "Quantization report", href: ggufLinks.report },
        { label: "OpenGrad's errata", href: ggufLinks.errata },
        { label: "OpenGrad study page", href: ggufLinks.study },
        { label: "The ten files on Hugging Face", href: ggufLinks.files },
        { label: "H200 run report", href: ggufBf16Links.report },
        { label: "Agreement record", href: ggufBf16Links.agreement },
      ]}
    >
      <Section id="findings" title="What we found">
        <Findings
          items={[
            {
              headline: `${ggufRecommended} is the smallest format to pass the quality gate`,
              line: (
                <>
                  It passes by one example, and <Go href={ggufLinks.errata} className={link}>OpenGrad&apos;s errata</Go> show that margin is within rerun noise. The gate is OpenGrad&apos;s,
                  frozen before any format existed.
                </>
              ),
            },
            {
              headline: "On this GPU, quantization mainly saves memory",
              line: `Against BF16, the quantized formats generate ${pct(Math.min(...genGain))} to ${pct(Math.max(...genGain))} faster, and process long prompts at ${pct(Math.min(...ppShare))} to ${pct(Math.max(...ppShare))} of its rate.`,
            },
            {
              headline: "Changing the engine moved about as much as the quantization",
              line: `Changing the engine, the GPU and the kernels together moved ${ggufBf16Decisions.flips} of ${ggufBf16Decisions.examples.toLocaleString("en-US")} decisions. The ${ggufRecommended} quantization changed ${q6Flips}.`,
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="throughput"
          title="Throughput per format"
          note={`Mean of ${ggufConditions.repetitions} llama-bench repetitions; whiskers are one standard deviation. The dashed line is BF16. Prompt throughput is shown at 2,048 tokens because the 512-token runs had a standard deviation of up to ${Math.round(ggufConditions.pp512MaxRelSd * 100)}% of their mean.`}
        >
          <ThroughputFigure />
        </Figure>

        <Figure
          id="formats"
          title="Size, bits per weight and what each format keeps"
          note={
            <>
              Bits per weight is the file size over {(ggufConditions.params / 1e9).toFixed(2)}B parameters, metadata included. Decisions kept is the share of{" "}
              {ggufConditions.examples.toLocaleString("en-US")} tool-use test prompts where the format decided the same thing as BF16.
            </>
          }
        >
          <Scroll label="Per-format table">
            <table className="w-full min-w-[46rem] border-collapse text-sm tabular-nums">
              <thead>
                <tr className="align-bottom">
                  <th className={th}>Format</th>
                  <th className={thNum}>File</th>
                  <th className={thNum}>Bits per weight</th>
                  <th className={thNum}>Generation, tok/s</th>
                  <th className={thNum}>vs BF16</th>
                  <th className={thNum}>Prompt 2,048, tok/s</th>
                  <th className={thNum}>Decisions kept</th>
                  <th className={th}>Quality gate</th>
                </tr>
              </thead>
              <tbody>
                {[...bySize, bf16].map((r) => (
                  <tr key={r.format} className={`border-t border-rule align-top ${r.format === ggufRecommended ? "bg-bench font-medium" : ""}`}>
                    <td className="py-2.5 pr-4">
                      {r.format}
                      {r.format === ggufRecommended && <span className="ml-2 text-xs text-blue-deep">recommended</span>}
                    </td>
                    <td className={Cell}>{r.gib.toFixed(2)} GiB</td>
                    <td className={Cell}>{r.bitsPerWeight.toFixed(2)}</td>
                    <td className={Cell}>{r.tg.toFixed(1)}</td>
                    <td className={Cell}>{r.format === "BF16" ? "reference" : signed(r.tg / bf16.tg - 1)}</td>
                    <td className={Cell}>{r.pp.toLocaleString("en-US")}</td>
                    <td className={Cell}>{r.agreement === null ? "reference" : `${(r.agreement * 100).toFixed(1)}%`}</td>
                    <td className={`py-2.5 ${r.passes ? "" : "text-ink-soft"}`}>{r.passes ? "passes" : "fails"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroll>
        </Figure>

        <Figure
          id="engines"
          title="The BF16 GGUF against a serving engine"
          lede={`These files are the deployment format. The same weights also ran as the plain BF16 checkpoint behind vLLM on an ${ggufBf16Conditions.vllm.gpu}, batching up to ${ggufBf16Conditions.vllm.maxNumSeqs} concurrent requests.`}
          note={`Top: vLLM output throughput as concurrency rises on a mixed request shape. The dashed line is this page's BF16 GGUF on the A100 at a single stream, ${ggufBf16Conditions.llamacpp.tg} tokens per second, drawn at one request. Bottom: decisions changed out of ${ggufBf16Conditions.examples.toLocaleString("en-US")} confirmatory prompts, each counted against the llama.cpp BF16 GGUF.`}
        >
          <EngineComparisonFigure />
        </Figure>

        <More title="The vLLM serving sweep" summary="Requests and tokens per second at each concurrency">
          <Scroll label="vLLM serving sweep">
            <table className="w-full min-w-[40rem] border-collapse text-sm tabular-nums">
              <thead>
                <tr className="align-bottom">
                  <th className={thNum}>Concurrent</th>
                  <th className={th}>Shape</th>
                  <th className={thNum}>Requests/s</th>
                  <th className={thNum}>Output tok/s</th>
                  <th className={thNum}>Total tok/s</th>
                </tr>
              </thead>
              <tbody>
                {ggufBf16Sweep.map((r) => (
                  <tr key={`${r.concurrency}-${r.shape}`} className="border-t border-rule">
                    <td className={Cell}>{r.concurrency}</td>
                    <td className="py-2.5 pr-4">{r.shape}</td>
                    <td className={Cell}>{r.requestsPerSecond.toFixed(1)}</td>
                    <td className={Cell}>{r.outputTps.toFixed(1)}</td>
                    <td className={Cell}>{Math.round(r.totalTps).toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroll>
          <P>
            Requests per second peak at {peak} concurrent and dip slightly at {top}, while total tokens per second keeps climbing: the later gain is prompt tokens, not decode. One request of
            each shape was also run separately: {singleStream} output tokens per second. Cold start, loading the checkpoint into vLLM, was {ggufBf16Conditions.vllm.coldStartSeconds} seconds.
          </P>
        </More>

        <Figure id="engine-changed" title="What the engine changed">
          <div className="space-y-4">
            <P>
              Changing the engine, the GPU and the kernels together moved {ggufBf16Decisions.flips} of {ggufBf16Decisions.examples.toLocaleString("en-US")} decisions: {pct(ggufBf16Decisions.agreement)}{" "}
              agreement, and {pct(ggufBf16Decisions.exactOutputAgreement)} on exact output. Of those flips, {ggufBf16Decisions.flipsTokenizerDivergent} fall on the six prompts already known to
              tokenize differently between the two engines, leaving {ggufBf16Decisions.flipsEngineNumerics} attributable to engine numerics.
            </P>
            <P>
              For scale, the {ggufRecommended} quantization this page recommends changed {q6Flips}. Moving between inference engines cost about as much per-example disagreement as the
              quantization OpenGrad spent a phase gating, which is why the comparison is reported here rather than folded into the ladder.
            </P>
            <P>
              The vLLM rerun reproduced the frozen reference within {ggufBf16Rerun.maxAbsDelta} call F1 at a parse-valid rate of {pct(ggufBf16Rerun.parseValidRate)}, so both engines were scored
              against a confirmed reference.
            </P>
          </div>
        </Figure>
      </Section>

      <Section id="method" title="How we ran it">
        <div id="conditions" className="scroll-mt-28 lg:scroll-mt-16">
          <Rows>
            <Row label="The model">
              A Qwen3.5-2B tool-calling <Go href={ggufLinks.model} className={link}>checkpoint</Go> from OpenGrad, the research repository of{" "}
              <Go href={sibling.url} className={link}>
                {sibling.name}
              </Go>
              . It was converted to BF16 GGUF and quantized {quant.length} ways with llama.cpp and one importance matrix.
            </Row>
            <Row label="Engine">{ggufConditions.engine}</Row>
            <Row label="Hardware">One {ggufConditions.gpu}, on Modal</Row>
            <Row label="Offload">{ggufConditions.offload}</Row>
            <Row label="Batching">{ggufConditions.batch}</Row>
            <Row label="KV cache">{ggufConditions.kvCache}</Row>
            <Row label="Repetitions">{ggufConditions.repetitions} per test</Row>
            <Row label="Run date">{ggufConditions.runDate}</Row>
            <Row label="The vLLM run">
              {ggufBf16Conditions.vllm.engine}, on one {ggufBf16Conditions.vllm.gpu}, {ggufBf16Conditions.vllm.gpuMemoryGib} GiB, on Modal. {ggufBf16Conditions.vllm.maxModelLen}-token context, up to{" "}
              {ggufBf16Conditions.vllm.maxNumSeqs} sequences{ggufBf16Conditions.vllm.prefixCaching ? "" : ", prefix caching off"}, {ggufBf16Conditions.vllm.dtype}. Run {ggufBf16Conditions.vllm.runDate}.
            </Row>
          </Rows>
        </div>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="Engines">
            The vLLM comparison is not like for like: the engine, the GPU and the kernels all differ. Read it as one engine against another, not as {ggufBf16Conditions.llamacpp.gpuShort} against{" "}
            {ggufBf16Conditions.vllm.gpuShort}.
          </Row>
          <Row label="Throughput">
            The throughput rows are single-stream llama-bench runs from an empty context. The vLLM run is a separate batching sweep on different hardware, so the two are not comparable row for
            row.
          </Row>
          <Row label="Not measured">Laptop, phone and CPU throughput for these files. On a phone, where memory bandwidth is the limit, the ranking can differ.</Row>
        </Rows>
      </Section>
    </Post>
  );
}
