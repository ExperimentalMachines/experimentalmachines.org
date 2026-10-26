import type { Metadata } from "next";
import { Fragment } from "react";
import Go from "@/components/home/Go";
import { h2, lede, link } from "@/components/home/ui";
import RerunsFigures from "@/components/openweights/RerunsFigures";
import {
  rerunsCaps,
  rerunsControls,
  rerunsCuts,
  rerunsKills,
  rerunsLinks,
  rerunsOrder,
  rerunsPhones,
  rerunsTiming,
  type RerunsPhoneId,
} from "@/lib/openweights-reruns";

const description =
  "After the window matrix was published, every cell was checked for a failed or noisy run, and three things were rerun the same day: the 2.6B at a 2048-token reply cap, same-file repeats, and Qwen3 32k with a log.";

export const metadata: Metadata = {
  title: "What the reruns changed: OpenWeights",
  description,
  openGraph: { title: "What the reruns changed", description, url: "/openweights/reruns/" },
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

const List = ({ children }: { children: React.ReactNode }) => (
  <ul className="max-w-3xl list-disc space-y-3 pl-5 text-lg leading-8 text-ink-soft marker:text-ink/30">{children}</ul>
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
const tdText = "py-2 pr-4 text-left";
const warn = "text-[#b4452b]";

const Code = ({ children }: { children: React.ReactNode }) => <code className="font-mono text-[0.9em] text-ink">{children}</code>;

const name = (id: RerunsPhoneId) => rerunsPhones.find((p) => p.id === id)!.name;
const win = (s: string) => parseInt(s);
const byPhone = <T extends { phone: RerunsPhoneId; window: string }>(arr: T[]) =>
  [...arr].sort((a, b) => rerunsOrder.indexOf(a.phone) - rerunsOrder.indexOf(b.phone) || win(a.window) - win(b.window));

const brief = [
  {
    title: "Purpose",
    body: "Settle the three cells the first pass left in doubt: the 2.6B's grades, which its 640-token cap had cut short; the Poco's Qwen3 32k run, which had died without a recorded cause; and whether a second run of the same file on another phone varies as much as it did on the Poco.",
  },
  {
    title: "How it was graded",
    body: "Same prompts and graders as the matrix: GSM8K by the last number in the reply, IFEval by the benchmark's instruction checkers, BFCL by one call to the right function with the right arguments. Greedy, thinking off. Every run also recorded prefill and decode time per prompt and resident memory, shown in the timing panel and table. The 2.6B rerun raised only the reply cap, from 640 to 2048, on its 60 GSM8K and IFEval prompts; the repeats used all 90.",
  },
];

const wallClock = [
  ["Qwen3 32k with a log", "Poco", "2 min, killed"],
  ["2.6B 2k repeat, 90 prompts", "Poco", "48 min"],
  ["2.6B 2k at 2048, 60 prompts", "Poco", "80 min"],
  ["2.6B 32k at 2048, 60 prompts", "Poco", "66 min"],
  ["2.6B 4k and 32k at 2048, 1.2B 4k repeat", "Test Lab, 3 phones", "22 launches, 12:40 to 18:51"],
];

const verdicts = [
  {
    k: "The 2.6B",
    v: "The 640-token cap suppressed its grades",
    p: "GSM8K 10 to 19 of 30 and IFEval 3 to 6 at the 640 cap; 23 to 28 and 18 to 21 at 2048, on every phone and window.",
  },
  {
    k: "The window",
    v: "At 2k, 14 of 60 replies reached the window limit",
    p: "Prompt plus reply stopped at the window size. At 4k and 32k no reply reached the window; the ones still cut reached the 2048 reply cap.",
  },
  {
    k: "Same file, twice",
    v: "One cloud repeat, the same low agreement",
    p: "The Exynos 2400 repeat of the 1.2B agreed with its first run on 7 of 90 raw replies, at least as variable as the Poco controls. The 2.6B repeat moved grades by 2 per set.",
  },
  {
    k: "Qwen3 32k",
    v: "Both memory guards report a 6 GB threshold",
    p: "MIUI stopped the Poco run at 8.65 GB against a 6 GB threshold, as Samsung's Heimdall stopped the two Galaxys. The Pixel, with no such guard, finished at 8.5 GB.",
  },
];

function Table({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-rule pt-6">
      <h3 className="display text-2xl">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{sub}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

const TableNote = ({ children }: { children: React.ReactNode }) => <p className="mb-4 max-w-3xl leading-7 text-ink-soft">{children}</p>;

export default function Reruns() {
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
            What the reruns changed.
          </h1>
          <p className="mt-4 text-ink-soft">A second pass over the window matrix. 7 September 2026.</p>
          <p className={`${lede} mt-6 max-w-3xl`}>
            After the{" "}
            <Go href="/openweights/window/" className={link}>
              window matrix
            </Go>{" "}
            was published, every cell was checked for a failed or noisy run, and three things were rerun the same day.
          </p>
          <dl className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr]">
            {brief.map((b) => (
              <div key={b.title} className="border-t-2 border-blue pt-4">
                <dt className="display text-xl">{b.title}</dt>
                <dd className="mt-2 leading-7 text-ink-soft">{b.body}</dd>
              </div>
            ))}
            <div className="min-w-0 border-t-2 border-blue pt-4">
              <dt className="display text-xl">How long it ran</dt>
              <dd className="mt-2 leading-7 text-ink-soft">
                <Scroll label="Wall clock per run">
                  <table className="w-full min-w-[24rem] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-rule">
                        <th className={`${th} pb-2`}>Run</th>
                        <th className={`${th} pb-2`}>Where</th>
                        <th className={`${thNum} pb-2`}>Wall clock</th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {wallClock.map((r) => (
                        <tr key={r[0]} className="border-b border-rule align-top">
                          <td className={`${tdText} text-ink`}>{r[0]}</td>
                          <td className={tdText}>{r[1]}</td>
                          <td className={td}>{r[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Scroll>
                <p className="mt-3">
                  The Test Lab span includes a pause from 13:19 to 15:05 for the daily quota. Generation time alone: 2.6B at 2048, 130 to 213 minutes per phone.
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <Section id="findings" title="Findings" tint>
        <div className="grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
          {verdicts.map((v) => (
            <div key={v.k} className="border-t-2 border-blue pt-4">
              <p className="text-sm text-ink-soft">{v.k}</p>
              <p className="display mt-2 text-balance text-2xl leading-tight">{v.v}</p>
              <p className="mt-3 leading-7 text-ink-soft">{v.p}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="figures" title="Grades, cuts, repeats, memory and timing">
        <RerunsFigures />
      </Section>

      <Section id="notes" title="Notes" tint>
        <List>
          <Item lead="Why the 2.6B needed a rerun.">
            Its chat template opens a thinking block before every answer, and the suite runs thinking off with a 640-token cap. Most of its GSM8K and IFEval
            replies were still reasoning when generation reached the cap, so those grades confound answer quality with the 640-token limit. The rerun keeps the
            same prompts, graders and thinking-off rule and only raises the cap to 2048. The 640-cap rows stay in the matrix as their own condition.
          </Item>
          <Item lead="What the cut replies mean.">
            A reply cut by the window exceeded the export&apos;s prompt-plus-reply length in this test; a reply cut by the cap is one the benchmark chose not to
            wait for. In every cell 10 to 15 of 60 replies were cut. At 2k on the Poco all 14 reached the window limit and none the cap; in the seven other
            cells, at 4k and 32k on every phone, 10 to 15 reached the 2048 cap and none the window. Some prompts make this model reason past 2000 tokens.
          </Item>
          <Item lead="The kill rule.">
            Samsung&apos;s Heimdall wrote &quot;Trigger Global kill before GC, Usage 8.67 GB, Threshold 6 GB&quot; on the S25 Ultra and S24+. MIUI on the Poco
            wrote &quot;used too many pss resource, pss used 8653468kb, pss threshold 6291456kb&quot;. Different code, same number: on those two phones a process
            whose PSS passes 6 GB is stopped. The 32k Qwen3 export needs about 7 GB of KV cache before the first prompt; it measured 6.1 to 6.4 GB resident
            after load on the three runs that were stopped and 8.5 GB on the Pixel run that finished.
          </Item>
          <Item lead="What was not rerun.">
            The cloud phones&apos; suite timings, which differed by up to threefold between two launches of the same Tensor G5 cell and may reflect different
            thermal states. A repeat would be as launch-dependent; a paired probe on those phones is required to compare their speed.
          </Item>
          <Item lead="Cost.">
            The cloud reruns took 22 Test Lab launches, one set per launch and continued where the 38-minute budget cut them; 20 ran and 2 were refused when the
            Blaze plan&apos;s quota of 50 physical-device tests per day ran out at 13:19. They resumed at 15:05 after the reset and finished at 18:51. The Poco
            ran its four steps in 3 h 20 min.
          </Item>
        </List>
      </Section>

      <Section id="numbers" title="The rerun tables">
        <p className="mb-10 max-w-3xl leading-7 text-ink-soft">
          The rerun cells and controls. The full matrix, with the 640-cap rows and the fixed-prompt speed probe, is on the{" "}
          <Go href="/openweights/window/#numbers" className={link}>
            window page
          </Go>
          .
        </p>
        <div className="space-y-14">
          <Table title="LFM2.5-2.6B under two reply caps" sub="8 cells, GSM8K and IFEval">
            <TableNote>Passed out of 30 at the suite&apos;s 640-token cap and at the 2048-token rerun, and how the 60 rerun replies ended.</TableNote>
            <Scroll label="The 2.6B under two reply caps">
              <table className="w-full min-w-[48rem] border-collapse text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-rule">
                    <th className={th}>Phone</th>
                    <th className={th}>Window</th>
                    {["GSM8K at 640", "GSM8K at 2048", "IFEval at 640", "IFEval at 2048", "Finished", "Cut by window", "Cut by cap"].map((h) => (
                      <th key={h} className={thNum}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byPhone(rerunsCaps).map((r) => {
                    const c = rerunsCuts.find((x) => x.phone === r.phone && x.window === r.window)!;
                    return (
                      <tr key={`${r.phone}-${r.window}`} className="border-b border-rule">
                        <td className={`${tdText} text-ink`}>{name(r.phone)}</td>
                        <td className={tdText}>{r.window}</td>
                        <td className={td}>{r.gsm8k_640}</td>
                        <td className={td}>{r.gsm8k_2048}</td>
                        <td className={td}>{r.ifeval_640}</td>
                        <td className={td}>{r.ifeval_2048}</td>
                        <td className={td}>{c.finished}</td>
                        <td className={`${td} ${c.edge ? warn : ""}`}>{c.edge}</td>
                        <td className={td}>{c.cap}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Scroll>
          </Table>

          <Table title="Same file, run twice" sub="5 controls">
            <TableNote>Replies byte-identical between the two runs, and each set&apos;s grade in the first and the second run.</TableNote>
            <Scroll label="Same file, run twice">
              <table className="w-full min-w-[52rem] border-collapse text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-rule">
                    <th className={th}>Model</th>
                    <th className={th}>Phone</th>
                    {["Window", "Raw identical", "Text identical", "Calls identical", "GSM8K", "IFEval", "BFCL"].map((h) => (
                      <th key={h} className={thNum}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rerunsControls.map((r) => (
                    <tr key={`${r.model}-${r.window}-${r.phone}`} className="border-b border-rule">
                      <td className={`${tdText} text-ink`}>{r.model}</td>
                      <td className={tdText}>{name(r.phone)}</td>
                      <td className={td}>{r.window}</td>
                      <td className={td}>
                        {r.raw}/{r.n}
                      </td>
                      <td className={td}>
                        {r.content}/{r.n}
                      </td>
                      <td className={td}>
                        {r.calls}/{r.nbfcl}
                      </td>
                      <td className={td}>
                        {r.first.gsm8k} then {r.second.gsm8k}
                      </td>
                      <td className={td}>
                        {r.first.ifeval} then {r.second.ifeval}
                      </td>
                      <td className={td}>
                        {r.first.bfcl} then {r.second.bfcl}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Scroll>
          </Table>

          <Table title="Timing of every rerun cell" sub="TTFT, TPOT, throughput and memory, against the earlier run of the same cell">
            <TableNote>
              Medians over the prompts each run completed. Prefill ms is the runtime&apos;s prefill of the whole prompt; ms per token is decode time over generated
              tokens. RSS is resident memory after load and at the end of the run.
            </TableNote>
            <Scroll label="Timing of every rerun cell">
              <table className="w-full min-w-[56rem] border-collapse text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-rule">
                    <th className={th}>Cell</th>
                    <th className={th}>Run</th>
                    {["Prefill ms", "ms per token", "Prefill tok/s", "Decode tok/s", "RSS after load MB", "RSS at end MB"].map((h) => (
                      <th key={h} className={thNum}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rerunsTiming.map((r) => (
                    <Fragment key={`${r.kind}-${r.label}-${r.phone}-${r.window}`}>
                      {[r.a, r.b].map((n, i) => (
                        <tr key={n.name} className={i ? "border-b border-rule" : ""}>
                          <td className={`${tdText} text-ink`}>{i ? "" : `${r.label} ${r.window}, ${name(r.phone)}`}</td>
                          <td className={tdText}>{n.name}</td>
                          <td className={td}>{n.ttft}</td>
                          <td className={td}>{n.tpot}</td>
                          <td className={td}>{n.pre}</td>
                          <td className={td}>{n.dec}</td>
                          <td className={td}>{n.rss}</td>
                          <td className={td}>{n.rss_end}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </Scroll>
          </Table>

          <Table title="Qwen3-1.7B 32k on four phones" sub="The kill evidence">
            <Scroll label="Qwen3-1.7B 32k on four phones">
              <table className="w-full min-w-[52rem] border-collapse text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-rule">
                    <th className={th}>Phone</th>
                    <th className={th}>Device</th>
                    <th className={thNum}>RAM</th>
                    <th className={thNum}>Resident after load</th>
                    <th className={thNum}>Prompts completed</th>
                    <th className={th}>What the log says</th>
                  </tr>
                </thead>
                <tbody>
                  {rerunsKills.map((r) => (
                    <tr key={r.phone} className="border-b border-rule">
                      <td className={`${tdText} text-ink`}>{name(r.phone)}</td>
                      <td className={tdText}>{r.device}</td>
                      <td className={td}>{r.ram} GB</td>
                      <td className={td}>{r.rss} MB</td>
                      <td className={`${td} ${r.prompts < 90 ? warn : ""}`}>{r.prompts} of 90</td>
                      <td className={tdText}>{r.cause}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Scroll>
          </Table>
        </div>
      </Section>

      <Section id="sources" title="Sources and terms" tint>
        <List>
          <Item lead="Where the numbers come from.">
            Grades, controls and memory figures are the rendered matrix&apos;s. The cut reasons and the reply-length histogram come from the graded JSON reports,
            which record prompt and reply token counts per prompt; a reply is counted as cut by the window when prompt plus reply reached the window size, and as
            cut by the cap when the reply alone reached 2048. Phone RAM is the manufacturer&apos;s figure for each device. Launch times and counts are from the run
            logs.
          </Item>
          <Item lead="Terms.">
            A cell is one export on one phone over the prompt set. An export is the model compiled for ExecuTorch at a fixed context window. Greedy means the most
            likely token is always taken, so a run should repeat exactly. Thinking off means the model is not given room to reason before answering, though the
            2.6B&apos;s template does so anyway. GSM8K is grade-school maths, IFEval instruction following, BFCL tool calling. Raw stream is every token generated,
            shown text is what a user would see after tool-call markup is removed, parsed tool calls are the function calls the app would act on. TTFT is time to
            first token, measured here as the runtime&apos;s prefill of the prompt; TPOT is time per output token, decode time over generated tokens. RSS is the
            process&apos;s resident memory; PSS is its proportional share, the figure the memory guards read. The KV cache is the memory a model keeps per token of
            window. Heimdall is Samsung&apos;s memory guard. Test Lab is Firebase&apos;s rented-phone service.
          </Item>
          <Item lead="Where things are.">
            Raw and graded reports under{" "}
            <Go href={rerunsLinks.results} className={link}>
              tools/eval/results
            </Go>
            : the capped rerun as <Code>-cap2048</Code> files, continued sets as <Code>@n</Code>, second runs under a <Code>repeat-</Code> prefix, the Poco kill
            evidence under <Code>qwen3-32k-poco-rerun/</Code>. The note:{" "}
            <Go href={rerunsLinks.note} className={link}>
              executorch-window-matrix.md
            </Go>
            . The exports on Hugging Face: LFM2.5-2.6B, LFM2.5-1.2B,{" "}
            <Go href={rerunsLinks.qwen3} className={link}>
              Qwen3-1.7B
            </Go>
            .
          </Item>
        </List>
        <p className="mt-12 flex flex-wrap gap-x-6 gap-y-3 text-base">
          <Go href="/openweights/" className={link}>
            OpenWeights
          </Go>
          <Go href="/openweights/window/" className={link}>
            Does the exported window matter?
          </Go>
          <Go href="/openweights/latency/" className={link}>
            Five chips, two runtimes
          </Go>
          <Go href="https://github.com/ExperimentalMachines/openweights" className={link}>
            Source on GitHub
          </Go>
        </p>
      </Section>
    </main>
  );
}
