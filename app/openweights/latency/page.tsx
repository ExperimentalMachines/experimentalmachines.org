import type { Metadata } from "next";
import { Fragment } from "react";
import Go from "@/components/home/Go";
import { h2, lede, link } from "@/components/home/ui";
import LatencyFigures from "@/components/openweights/LatencyFigures";
import { latencyChips, latencyLinks, latencyModels } from "@/lib/openweights-latency";

const description =
  "Median time to first token and time per output token for five small models on five phone chips, in llama.cpp and ExecuTorch, from 60 to 90 benchmark prompts per cell.";

export const metadata: Metadata = {
  title: "Five chips, two runtimes: OpenWeights",
  description,
  openGraph: { title: "Five chips, two runtimes", description, url: "/openweights/latency/" },
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

// A table that scrolls sideways on narrow screens, focusable so the keyboard can scroll it.
const Scroll = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div
    role="region"
    aria-label={`${label}, scrolls sideways on small screens`}
    tabIndex={0}
    className="overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
  >
    {children}
  </div>
);

const th = "pb-3 pr-4 text-left text-xs font-normal text-ink-soft";
const thNum = "pb-3 pr-4 text-right text-xs font-normal text-ink-soft";
const td = "py-2 pr-4 text-right";

const brief = [
  {
    title: "Purpose",
    body: "Show how fast five small models answer on five phone chips, on the two runtimes the app ships, so a reader can pick a model and runtime for a given phone. Time to first token is what a user waits before the reply starts; time per output token is how fast it then streams.",
  },
  {
    title: "How it was graded",
    body: "Not graded here: this page is timing only. The same 90 prompts (30 GSM8K, 30 IFEval, 30 BFCL; Gemma 3 skips BFCL, having no tool syntax) ran greedy with thinking off, and the median prefill and decode time of each cell is plotted.",
  },
  {
    title: "How long it ran",
    body: "One pass per cell on 2026-09-03 and 04. Generation time per cell ran from 6 minutes (LFM2.5-1.2B on ExecuTorch, 8 Elite) to about 100 minutes (SmolLM3 on llama.cpp, Tensor G5); 29 hours of phone time in all, plus loading and Test Lab queueing.",
  },
];

export default function Latency() {
  return (
    <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
      <section id="top">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <li>
                <a href="/openweights/" className="hover:text-ink">
                  OpenWeights
                </a>
              </li>
              <li aria-hidden>/</li>
              <li>
                <a href="/openweights/#research" className="hover:text-ink">
                  Research
                </a>
              </li>
            </ol>
          </nav>
          <h1 className="display mt-8 max-w-4xl text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">
            Five chips, two runtimes.
          </h1>
          <p className={`${lede} mt-6 max-w-3xl`}>
            Median time to first token (TTFT) and time per output token (TPOT), from 60 to 90 benchmark prompts per cell (GSM8K, IFEval, BFCL). Prompts run 19
            to 772 tokens, median 92.
          </p>
          <dl className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-3">
            {brief.map((b) => (
              <div key={b.title} className="border-t-2 border-blue pt-4">
                <dt className="display text-xl">{b.title}</dt>
                <dd className="mt-2 leading-7 text-ink-soft">
                  {b.body}
                  {b.title === "How it was graded" && (
                    <>
                      {" "}
                      The pass rates for these runs are in the repository&apos;s{" "}
                      <Go href={latencyLinks.matrix} className={link}>
                        benchmark matrix
                      </Go>
                      .
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Section id="figures" title="Every model on every chip" tint>
        <LatencyFigures />
      </Section>

      <Section id="limits" title="Limits">
        <ul className="max-w-3xl list-disc space-y-3 pl-5 text-lg leading-8 text-ink-soft marker:text-ink/30">
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
          Medians per cell. Time to first token is shown with the median prefill rate behind it, and time per output token with the decode rate it amounts to.
        </p>
        <Scroll label="Latency table">
          <table className="w-full min-w-[44rem] border-collapse text-sm tabular-nums">
            <thead>
              <tr>
                <th className={th} rowSpan={2}>
                  Chip
                </th>
                <th className={`${th} border-b border-rule`} colSpan={3}>
                  llama.cpp, GGUF
                </th>
                <th className={`${th} border-b border-rule`} colSpan={3}>
                  ExecuTorch
                </th>
              </tr>
              <tr>
                {[0, 1].map((k) => (
                  <Fragment key={k}>
                    <th className={`${thNum} pt-2`}>TTFT, s</th>
                    <th className={`${thNum} pt-2`}>Prefill, tok/s</th>
                    <th className={`${thNum} pt-2`}>TPOT, ms</th>
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
                {latencyChips.map((c, i) => (
                  <tr key={c.name}>
                    <th scope="row" className="py-2 pr-4 text-left font-normal text-ink-soft">
                      {c.name}
                    </th>
                    {[m.llama[i], m.et[i]].map((p, k) => (
                      <Fragment key={k}>
                        <td className={td}>{p.ttft.toFixed(2)}</td>
                        <td className={td}>{p.prefill}</td>
                        <td className={td}>{p.tpot}</td>
                      </Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </Scroll>
      </Section>
    </main>
  );
}
