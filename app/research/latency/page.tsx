import type { Metadata } from "next";
import { Fragment } from "react";
import Go from "@/components/home/Go";
import { h2, lede, link } from "@/components/home/ui";
import LatencyFigures from "@/components/openweights/LatencyFigures";
import { Facts } from "@/components/openweights/study";
import { latencyChips, latencyLinks, latencyModels } from "@/lib/openweights-latency";

const description =
  "Median time to first token and time per output token for five small models on five phone chips, in llama.cpp and ExecuTorch, from 60 to 90 benchmark prompts per cell.";

export const metadata: Metadata = {
  title: "Five chips, two runtimes: OpenWeights",
  description,
  openGraph: { title: "Five chips, two runtimes", description, url: "/research/latency/" },
};

function Section({ id, title, tint, children }: { id: string; title: string; tint?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-28 lg:scroll-mt-16 ${tint ? "bg-bench" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className={h2}>{title}</h2>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

const Item = ({ lead, children }: { lead: string; children: React.ReactNode }) => (
  <li>
    <span className="font-medium text-ink">{lead}</span> {children}
  </li>
);

// A table that scrolls sideways on narrow screens, focusable so the keyboard can scroll it. Relative, so
// the screen-reader-only labels inside stay in the scroll box instead of widening the page.
const Scroll = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div
    role="region"
    aria-label={`${label}, scrolls sideways on small screens`}
    tabIndex={0}
    className="relative overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
  >
    {children}
  </div>
);

const th = "pb-3 pr-4 text-left text-xs font-normal text-ink-soft";
const thNum = "pb-3 pr-4 text-right text-xs font-normal text-ink-soft";

// Prefill is a rate, so its winner is the higher number while the two times are won by the lower; a tie
// marks neither, so bold always means one runtime was faster.
const better = (a: number, b: number, higher = false) => (a === b ? [false, false] : higher ? [a > b, b > a] : [a < b, b < a]);

export default function Latency() {
  return (
    <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
      <section id="top">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <li>
                <a href="/research/" className="hover:text-ink">
                  Research
                </a>
              </li>
              <li aria-hidden>/</li>
              <li>
                <a href="/research/#openweights" className="hover:text-ink">
                  OpenWeights
                </a>
              </li>
            </ol>
          </nav>
          <h1 className="display mt-8 max-w-4xl text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">
            Five chips, two runtimes.
          </h1>
          <p className={`${lede} mt-6 max-w-3xl`}>
            Median time to first token (TTFT) and time per output token (TPOT) for five small models on five phone chips, in llama.cpp and ExecuTorch.
          </p>
          <Facts
            items={[
              ["Prompts", "60 to 90 per cell, 92 tokens long at the median"],
              ["Runs", "One pass per cell, 3 and 4 September 2026"],
              ["Phone time", "29 hours"],
            ]}
          />
        </div>
      </section>

      <Section id="figures" title="Every model on every chip" tint>
        <LatencyFigures />
      </Section>

      <Section id="limits" title="Limits">
        <ul className="max-w-3xl list-disc space-y-2 pl-5 leading-7 text-ink-soft marker:text-ink/30">
          <Item lead="What it is for.">
            Picking a model, and one of the two runtimes the app ships, for a given phone. Time to first token is what a user waits before the reply starts; time per output token is how
            fast it then streams.
          </Item>
          <Item lead="Timing only.">
            The same 90 prompts (30 GSM8K, 30 IFEval, 30 BFCL; Gemma 3 skips BFCL, having no tool syntax), 19 to 772 tokens long, ran greedy with thinking
            off. Their pass rates are in the repository&apos;s{" "}
            <Go href={latencyLinks.matrix} className={link}>
              benchmark matrix
            </Go>
            .
          </Item>
          <Item lead="How long it ran.">
            Generation time per cell ran from 6 minutes (LFM2.5-1.2B on ExecuTorch, 8 Elite) to about 100 minutes (SmolLM3 on llama.cpp, Tensor G5); 29
            hours of phone time in all, plus loading and Test Lab queueing.
          </Item>
          <Item lead="Not matched conditions.">
            The Dimensity 9400 ran in hand under a desk fan. The Snapdragon 8 Gen 3 ran on Qualcomm Device Cloud and the 8 Elite, Tensor G5 and Exynos 2400 on
            Firebase Test Lab, racked, where phones throttle within about 40 seconds.
          </Item>
          <Item lead="Two open gaps.">
            Tensor G5 and Exynos 2400 decode at about half speed on llama.cpp against ExecuTorch, cause unknown. SmolLM3 on ExecuTorch prefills at a third of
            llama.cpp&apos;s rate on every chip, which is the compiled model rather than the phones.
          </Item>
          <Item lead="Files.">
            llama.cpp ran Q4_K_M GGUFs, Qwen3 at Q8_0. ExecuTorch ran the published XNNPACK INT8/INT4 exports, LFM2.5 as 8da4w and Llama 3.2 as SpinQuant. Runs on
            2026-09-03 and 04, single pass, no repeats.
          </Item>
        </ul>
      </Section>

      <Section id="numbers" title="Every number" tint>
        <p className="mb-8 max-w-3xl leading-7 text-ink-soft">
          Medians per cell, llama.cpp beside ExecuTorch. Bold blue: the faster runtime on that chip. Prefill is the median rate behind the time to first token.
        </p>
        <div className="max-w-4xl">
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
                    const cells: [number, number, string, string, boolean][] = [
                      [l.ttft, e.ttft, l.ttft.toFixed(2), e.ttft.toFixed(2), false],
                      [l.prefill, e.prefill, String(l.prefill), String(e.prefill), true],
                      [l.tpot, e.tpot, String(l.tpot), String(e.tpot), false],
                    ];
                    return (
                      <tr key={c.name}>
                        <th scope="row" className="py-1.5 pr-4 text-left font-normal text-ink-soft">
                          {c.name}
                        </th>
                        {cells.map(([a, b, sa, sb, higher], k) => {
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
        </div>
        <p className="mt-12 flex flex-wrap gap-x-6 gap-y-3 text-base">
          <Go href="/research/" className={link}>
            All research
          </Go>
          <Go href="/openweights/" className={link}>
            OpenWeights
          </Go>
        </p>
      </Section>
    </main>
  );
}
