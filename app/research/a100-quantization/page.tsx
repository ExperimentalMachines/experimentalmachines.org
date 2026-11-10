import EngineComparisonFigure from "@/components/gguf/EngineComparisonFigure";
import ThroughputFigure from "@/components/gguf/ThroughputFigure";
import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import { Scroll, th, thNum } from "@/components/openweights/pd-parts";
import Post, { Figure, Findings, More, P, postMetadata, Row, Rows, Section } from "@/components/research/Post";
import { sibling } from "@/lib/content";
import { ggufConditions, ggufLinks, ggufRecommended, ggufRows } from "@/lib/gguf";
import { ggufBf16Conditions, ggufBf16Decisions, ggufBf16Links, ggufBf16QuantFlips, ggufBf16Rerun, ggufBf16Sweep } from "@/lib/gguf-bf16";

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
const peakRow = ggufBf16Sweep.reduce((a, b) => (b.requestsPerSecond > a.requestsPerSecond ? b : a));
const topRow = ggufBf16Sweep.reduce((a, b) => (b.concurrency > a.concurrency ? b : a));
// Each load level sent one request per concurrent slot (perf_run.json records requests equal to
// concurrency), so prompt tokens over concurrency is the prompt each request carried. The mixed shape's
// prompts grow with load, and that, not the engine, is where most of the later rise in total tokens comes from.
const promptPerRequest = (r: typeof peakRow) => Math.round(r.promptTokens / r.concurrency);
const grouped = (x: number) => Math.round(x).toLocaleString("en-US");

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
                  GGUF is the model file llama.cpp runs, and its quantized formats store the model&apos;s numbers in fewer bits, smaller and faster at some cost in accuracy.
                  OpenGrad&apos;s gate, set before any format existed, requires every tool-use score to stay within about 1% of the unquantized BF16 model&apos;s. {ggufRecommended}{" "}
                  passes by one example, which{" "}
                  <Go href={ggufLinks.errata} className={link}>
                    OpenGrad&apos;s errata
                  </Go>{" "}
                  put within rerun noise.
                </>
              ),
            },
            {
              headline: "On this GPU, quantization mainly saves memory",
              line: `Against BF16, the quantized formats generate the reply (decode) ${pct(Math.min(...genGain))} to ${pct(Math.max(...genGain))} faster, but read a long prompt (prefill) at ${pct(Math.min(...ppShare))} to ${pct(Math.max(...ppShare))} of its speed.`,
            },
            {
              headline: `Changing engine and GPU moved about as many decisions as ${ggufRecommended}`,
              line: `On ${ggufBf16Decisions.examples.toLocaleString("en-US")} tool-use prompts, moving the BF16 model from llama.cpp on an ${ggufBf16Conditions.llamacpp.gpuShort} to vLLM, a serving engine, on an ${ggufBf16Conditions.vllm.gpuShort} changed ${ggufBf16Decisions.flips} decisions, such as whether to call a tool. ${ggufRecommended} changed ${q6Flips}.`,
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="throughput"
          title="Every quantized format generated faster than BF16 and read prompts slower"
          lede="Speed in tokens a second (tok/s), a token being a small piece of text, the unit a model reads and writes."
          note={`Mean of ${ggufConditions.repetitions} llama-bench repetitions; whiskers are one standard deviation. The dashed line is BF16. Prompt throughput is shown at 2,048 tokens because the 512-token runs had a standard deviation of up to ${Math.round(ggufConditions.pp512MaxRelSd * 100)}% of their mean.`}
        >
          <ThroughputFigure />
        </Figure>

        <Figure
          id="formats"
          title={`Every format smaller than ${ggufRecommended} fails the gate`}
          note={
            <>
              Bits per weight is the file size over {(ggufConditions.params / 1e9).toFixed(2)}B parameters, metadata included. Decisions kept is the share of{" "}
              {ggufConditions.examples.toLocaleString("en-US")} tool-use test prompts where the format decided the same thing as BF16. The quality gate is a separate test of
              tool-use scores, not a cut-off on this column.
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
                      {r.format === ggufRecommended && <span className="ml-2 text-xs text-blue-deep">smallest to pass</span>}
                    </td>
                    <td className={Cell}>{r.gib.toFixed(2)} GiB</td>
                    <td className={Cell}>{r.bitsPerWeight.toFixed(2)}</td>
                    <td className={Cell}>{r.tg.toFixed(1)}</td>
                    <td className={Cell}>{r.format === "BF16" ? "reference" : signed(r.tg / bf16.tg - 1)}</td>
                    <td className={Cell}>{r.pp.toLocaleString("en-US")}</td>
                    <td className={Cell}>{r.agreement === null ? "reference" : `${(r.agreement * 100).toFixed(1)}%`}</td>
                    <td className={`py-2.5 ${r.passes ? "" : "text-ink-soft"}`}>{r.passes ? (r.format === ggufRecommended ? "passes by one example" : "passes") : "fails"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroll>
        </Figure>

        <Figure
          id="engines"
          title={`On vLLM the model changed ${ggufBf16Decisions.flips} decisions, between Q8_0 and ${ggufRecommended}`}
          lede={`The same BF16 weights also ran on vLLM, set to serve up to ${ggufBf16Conditions.vllm.maxNumSeqs} requests at once, on an ${ggufBf16Conditions.vllm.gpu}: a separate serving test, not a like-for-like speed comparison with the ${ggufBf16Conditions.llamacpp.gpuShort}.`}
          note={`Top: vLLM's output tok/s as more requests run at once, on a mix of request lengths. The dashed line is the BF16 GGUF on the ${ggufBf16Conditions.llamacpp.gpuShort} serving one request, ${ggufBf16Conditions.llamacpp.tg} tok/s. Bottom: decisions changed out of ${ggufBf16Conditions.examples.toLocaleString("en-US")} test prompts, each counted against the llama.cpp BF16 GGUF.`}
        >
          <EngineComparisonFigure />
        </Figure>

        <More title="The vLLM serving sweep" summary="Requests and tokens a second at each load">
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
            Shape is the kind of request sent: short, median-length or long prompts, or a mix whose prompts grow with load. Requests a second peak at {peakRow.concurrency} at once
            and dip slightly at {topRow.concurrency}. Output tokens a second still rise, {grouped(peakRow.outputTps)} to {grouped(topRow.outputTps)}, while total tokens a second
            rise {pct(topRow.totalTps / peakRow.totalTps - 1)} mostly because the mix sent at {topRow.concurrency} carried about twice the prompt per request,{" "}
            {promptPerRequest(topRow)} tokens against {promptPerRequest(peakRow)}. One request of each shape was also run alone: {singleStream} output tokens a second. Loading the
            checkpoint into vLLM took {ggufBf16Conditions.vllm.coldStartSeconds} seconds.
          </P>
        </More>

        <Figure id="engine-changed" title="The unquantized model, rerun, falls just short of the gate">
          <div className="space-y-4">
            <P>
              Changing the engine, the GPU and the low-level maths code (kernels) together changed {ggufBf16Decisions.flips} of {ggufBf16Decisions.examples.toLocaleString("en-US")}{" "}
              decisions, and {pct(ggufBf16Decisions.exactOutputAgreement)} of replies came out word for word the same. {ggufBf16Decisions.flipsTokenizerDivergent} of the{" "}
              {ggufBf16Decisions.flips} fall on six prompts the two engines split into tokens differently; the other {ggufBf16Decisions.flipsEngineNumerics} could come from the
              engine, the GPU or the kernels.
            </P>
            <P>
              For scale, {ggufRecommended} changed {q6Flips}. Moving the model to another engine and GPU disturbed its decisions about as much as the quantization OpenGrad spent a
              whole study phase gating.
            </P>
            <P>
              Rerun on vLLM, the unquantized model scored within {ggufBf16Rerun.maxAbsDelta} of OpenGrad&apos;s original reference on every measure, yet{" "}
              <Go href={ggufLinks.errata} className={link}>
                the errata
              </Go>{" "}
              show that rerun falls just short of the gate on recall, the share of needed tool calls the model made. A one-example pass is inside that noise.
            </P>
          </div>
        </Figure>
      </Section>

      <Section id="method" title="How we ran it">
        <div id="conditions" className="scroll-mt-28 lg:scroll-mt-16">
          <Rows>
            <Row label="The model">
              A Qwen3.5-2B tool-calling{" "}
              <Go href={ggufLinks.model} className={link}>
                checkpoint
              </Go>{" "}
              from OpenGrad, the research repository of{" "}
              <Go href={sibling.url} className={link}>
                {sibling.name}
              </Go>
              . It was converted to BF16 GGUF and quantized {quant.length} ways with llama.cpp, all from one importance matrix, a calibration file of which numbers matter most.
            </Row>
            <Row label="Engine">{ggufConditions.engine}</Row>
            <Row label="Hardware">One {ggufConditions.gpu}, on Modal</Row>
            <Row label="Offload">{ggufConditions.offload}</Row>
            <Row label="Batching">{ggufConditions.batch}</Row>
            <Row label="KV cache">The memory a model keeps of the conversation so far: {ggufConditions.kvCache}</Row>
            <Row label="Repetitions">{ggufConditions.repetitions} per test</Row>
            <Row label="Run date">{ggufConditions.runDate}</Row>
            <Row label="The vLLM run">
              {ggufBf16Conditions.vllm.engine}, on one {ggufBf16Conditions.vllm.gpu}, {ggufBf16Conditions.vllm.gpuMemoryGib} GiB, on Modal. {ggufBf16Conditions.vllm.maxModelLen}
              -token context, up to {ggufBf16Conditions.vllm.maxNumSeqs} sequences{ggufBf16Conditions.vllm.prefixCaching ? "" : ", prefix caching off"},{" "}
              {ggufBf16Conditions.vllm.dtype}. Run {ggufBf16Conditions.vllm.runDate}.
            </Row>
          </Rows>
        </div>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="Engines">
            The vLLM comparison is not like for like: the engine, the GPU and the kernels all differ. Read it as one whole setup against another, not as engine against engine or{" "}
            {ggufBf16Conditions.llamacpp.gpuShort} against {ggufBf16Conditions.vllm.gpuShort}.
          </Row>
          <Row label="Throughput">
            The throughput rows are single-stream llama-bench runs from an empty context. The vLLM run is a separate batching sweep on different hardware, so the two are not
            comparable row for row.
          </Row>
          <Row label="Not measured">Laptop, phone and CPU throughput for these files. On a phone, where memory bandwidth is the limit, the ranking can differ.</Row>
        </Rows>
      </Section>
    </Post>
  );
}
