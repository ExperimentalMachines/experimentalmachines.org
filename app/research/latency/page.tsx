import { Fragment } from "react";
import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import LatencyFigures from "@/components/openweights/LatencyFigures";
import { Scroll, th, thNum } from "@/components/openweights/pd-parts";
import Post, { Figure, Findings, postMetadata, Row, Rows, Section } from "@/components/research/Post";
import { latencyChips, latencyLinks, latencyModels } from "@/lib/openweights-latency";

const href = "/research/latency/";

export const metadata = postMetadata(
  href,
  "Median time to first token and time per output token for five small models on five phone chips, in llama.cpp and ExecuTorch, from 60 to 90 benchmark prompts per cell.",
);

// Prefill is a rate, so its winner is the higher number while the two times are won by the lower; a tie
// marks neither, so bold always means one runtime was faster.
const better = (a: number, b: number, higher = false) => (a === b ? [false, false] : higher ? [a > b, b > a] : [a < b, b < a]);

const cells = latencyModels.flatMap((m) => m.et.map((et, i) => ({ et, llama: m.llama[i] })));
const sooner = cells.filter((c) => c.et.ttft < c.llama.ttft).length;
const fasterDecode = cells.filter((c) => c.et.tpot < c.llama.tpot).length;
const firstTokens = cells.flatMap((c) => [c.et.ttft, c.llama.ttft]);
// The original said Tensor G5 and Exynos 2400 both decode at about half speed on llama.cpp, but on the Exynos llama.cpp
// keeps 64 to 92% of ExecuTorch's speed. The Tensor G5 has the widest gap: 43 to 51% for four models, 69% for Llama 3.2.
// Under 60% counts as about half.
const tensor = latencyChips.findIndex((c) => c.name === "Tensor G5");
const tensorHalf = latencyModels.filter((m) => m.et[tensor].tpot / m.llama[tensor].tpot < 0.6).length;
// SmolLM3's ExecuTorch prefill rate as a share of llama.cpp's, lowest and highest across the chips.
const smol = latencyModels.find((m) => m.name === "SmolLM3 3B")!;
const smolShares = smol.et.map((e, i) => Math.round((100 * e.prefill) / smol.llama[i].prefill));
const smolShare = [Math.min(...smolShares), Math.max(...smolShares)];

export default function Latency() {
  return (
    <Post
      href={href}
      sources={[
        { label: "Benchmark matrix, with pass rates", href: latencyLinks.matrix },
        { label: "OpenWeights", href: "/openweights/" },
      ]}
    >
      <Section id="findings" title="What we found">
        <Findings
          items={[
            {
              headline: `${sooner} of ${cells.length} model and chip pairs read the prompt sooner on ExecuTorch`,
              line: `Time to first token here is the time the engine took to read the prompt, its part of the wait before a reply starts, not the whole wait: ${Math.min(...firstTokens).toFixed(2)} s to ${Math.max(...firstTokens).toFixed(2)} s across both runtimes.`,
            },
            {
              headline: `${fasterDecode} of ${cells.length} wrote the reply faster on ExecuTorch`,
              line: `Time per output token is how fast the reply streams once it starts. The gap is widest on the Tensor G5, where llama.cpp wrote at about half ExecuTorch's speed for ${tensorHalf} of ${latencyModels.length} models, cause unknown.`,
            },
            {
              headline: "SmolLM3 is the exception when reading the prompt",
              line: `On ExecuTorch it read prompts at ${smolShare[0]} to ${smolShare[1]}% of llama.cpp's speed on every chip, which points to the compiled model or its runtime, not the phones.`,
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure id="figures" title="Every model on every chip">
          <LatencyFigures />
        </Figure>
        <Figure
          id="numbers"
          title="Every number"
          lede="Medians per model and chip, llama.cpp beside ExecuTorch; bold blue marks the faster runtime. Prefill is how fast the engine read the prompt, in tokens a second; time per token is how long each reply token took to write."
        >
          <Scroll label="Latency table">
            <table className="w-full min-w-[40rem] border-collapse text-sm tabular-nums">
              <colgroup>
                <col />
              </colgroup>
              <colgroup span={2} />
              <colgroup span={2} />
              <colgroup span={2} />
              <thead>
                <tr>
                  <th scope="col" className={`${th} align-bottom`} rowSpan={2}>
                    Chip
                  </th>
                  {["Time to first token, s", "Prefill, tok/s", "Time per token, ms"].map((h) => (
                    <th key={h} scope="colgroup" colSpan={2} className="border-b border-rule pb-2 pl-6 text-right text-xs font-medium text-ink">
                      {h}
                    </th>
                  ))}
                </tr>
                <tr>
                  {[0, 1, 2].map((k) => (
                    <Fragment key={k}>
                      <th scope="col" className={`${thNum} pl-6 pt-2`}>
                        llama.cpp
                      </th>
                      <th scope="col" className={`${thNum} pt-2`}>
                        ExecuTorch
                      </th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              {latencyModels.map((m) => (
                <tbody key={m.name} className="border-t border-rule">
                  <tr>
                    <th scope="rowgroup" colSpan={7} className="pb-1 pt-4 text-left text-sm font-medium">
                      {m.name}
                    </th>
                  </tr>
                  {latencyChips.map((c, i) => {
                    const [l, e] = [m.llama[i], m.et[i]];
                    const row: [number, number, string, string, boolean][] = [
                      [l.ttft, e.ttft, l.ttft.toFixed(2), e.ttft.toFixed(2), false],
                      [l.prefill, e.prefill, String(l.prefill), String(e.prefill), true],
                      [l.tpot, e.tpot, String(l.tpot), String(e.tpot), false],
                    ];
                    return (
                      <tr key={c.name}>
                        <th scope="row" className="py-1.5 pr-4 text-left font-normal text-ink-soft">
                          {c.name}
                        </th>
                        {row.map(([a, b, sa, sb, higher], k) => {
                          const [wa, wb] = better(a, b, higher);
                          return (
                            <Fragment key={k}>
                              <td className={`py-1.5 pl-6 pr-4 text-right ${wa ? "font-medium text-blue-deep" : ""}`}>
                                {sa}
                                {wa && <span className="sr-only">, faster</span>}
                              </td>
                              <td className={`py-1.5 pr-4 text-right ${wb ? "font-medium text-blue-deep" : ""}`}>
                                {sb}
                                {wb && <span className="sr-only">, faster</span>}
                              </td>
                            </Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </Scroll>
        </Figure>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="Prompts">
            The same 90 prompts: 30 GSM8K maths problems, 30 IFEval instruction-following prompts and 30 BFCL function-calling prompts, except that Gemma 3 skips BFCL, having no
            tool syntax. So 60 to 90 per model and chip, 19 to 772 tokens long and 92 at the median, with the likeliest next token always taken, thinking off, and replies capped at
            640 tokens, BFCL&apos;s at 384.
          </Row>
          <Row label="Files">
            Each runtime ran its own file format, quantized differently (its numbers stored in fewer bits, smaller and faster at some cost in accuracy): llama.cpp GGUF files at
            Q4_K_M, Qwen3 at Q8_0; ExecuTorch the published exports for its CPU backend, XNNPACK, with 8-bit activations and 4-bit weights, LFM2.5 as 8da4w and Llama 3.2 as
            SpinQuant. So each pair compares a whole setup, file and runtime, not the runtime alone.
          </Row>
          <Row label="Runs">One pass per model, chip and runtime with no repeats, on 3 and 4 September 2026.</Row>
          <Row label="Phone time">
            29 hours in all, plus loading and Test Lab queueing. Generation time per run ran from 6 minutes (LFM2.5-1.2B on ExecuTorch, 8 Elite) to about 100 minutes (SmolLM3 on
            llama.cpp, Tensor G5).
          </Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="What it is for">Picking a model, and one of the two runtimes the app ships, for a given phone.</Row>
          <Row label="Timing only">
            This page has no quality numbers. The pass rates on the same prompts are in the repository&apos;s{" "}
            <Go href={latencyLinks.matrix} className={link}>
              benchmark matrix
            </Go>
            .
          </Row>
          <Row label="Not matched conditions">
            The Dimensity 9500s ran in hand under a desk fan. The Snapdragon 8 Gen 3 ran on Qualcomm Device Cloud and the 8 Elite, Tensor G5 and Exynos 2400 on Firebase Test Lab,
            racked, where phones throttle within about 40 seconds.
          </Row>
        </Rows>
      </Section>
    </Post>
  );
}
