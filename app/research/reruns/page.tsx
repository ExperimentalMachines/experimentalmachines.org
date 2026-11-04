import { Fragment } from "react";
import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import RerunsFigures from "@/components/openweights/RerunsFigures";
import { Scroll, th, thNum } from "@/components/openweights/pd-parts";
import Post, { Figure, Findings, More, Note, postMetadata, Row, Rows, Section } from "@/components/research/Post";
import { rerunsCaps, rerunsControls, rerunsCuts, rerunsKills, rerunsLinks, rerunsOrder, rerunsPhones, rerunsTiming, type RerunsPhoneId } from "@/lib/openweights-reruns";

const href = "/research/reruns/";

export const metadata = postMetadata(
  href,
  "After the window matrix was published, every cell was checked for a failed or noisy run, and three things were rerun the same day: the 2.6B at a 2048-token reply cap, same-file repeats, and Qwen3 32k with a log.",
);

const td = "py-2 pr-4 text-right";
const tdText = "py-2 pr-4 text-left";
const warn = "text-[#b4452b]";

const Code = ({ children }: { children: React.ReactNode }) => <code className="font-mono text-[0.9em] text-ink">{children}</code>;

const name = (id: RerunsPhoneId) => rerunsPhones.find((p) => p.id === id)!.name;
const win = (s: string) => parseInt(s);
const byPhone = <T extends { phone: RerunsPhoneId; window: string }>(arr: T[]) =>
  [...arr].sort((a, b) => rerunsOrder.indexOf(a.phone) - rerunsOrder.indexOf(b.phone) || win(a.window) - win(b.window));

const wallClock = [
  ["Qwen3 32k with a log", "Poco", "2 min, killed"],
  ["2.6B 2k repeat, 90 prompts", "Poco", "48 min"],
  ["2.6B 2k at 2048, 60 prompts", "Poco", "80 min"],
  ["2.6B 32k at 2048, 60 prompts", "Poco", "66 min"],
  ["2.6B 4k and 32k at 2048, 1.2B 4k repeat", "Test Lab, 3 phones", "22 launches, 12:40 to 18:51"],
];

const verdicts = [
  {
    headline: "The 640-token cap held the 2.6B back",
    line: "At 2048 it scored 23 to 28 of 30 on GSM8K and 18 to 21 on IFEval, against 10 to 19 and 3 to 6.",
  },
  { headline: "At 2k, 14 of 60 replies hit the window", line: "At 4k and 32k none did; the long ones stopped at the 2048 reply cap instead." },
  { headline: "Repeats still disagree", line: "The Exynos 2400 repeat of the 1.2B matched its first run on 7 of 90 raw replies." },
  {
    headline: "Two memory guards, one 6 GB limit",
    line: "The stopped runs' logs, from MIUI and from Samsung's Heimdall, both report a 6 GB threshold. The Pixel, with no such guard, finished.",
  },
];

export default function Reruns() {
  return (
    <Post
      href={href}
      related={["/research/window/", "/research/latency/", "/research/prefill-decode/"]}
      sources={[
        { label: "The note", href: rerunsLinks.note },
        { label: "Raw and graded reports", href: rerunsLinks.results },
        { label: "Qwen3-1.7B exports on Hugging Face", href: rerunsLinks.qwen3 },
        { label: "Source on GitHub", href: "https://github.com/ExperimentalMachines/openweights" },
      ]}
      sourcesNote={
        <>
          Under the results folder, the capped rerun is in <Code>-cap2048</Code> files, continued sets are <Code>@n</Code>, second runs have a <Code>repeat-</Code> prefix, and the
          Poco kill evidence is under <Code>qwen3-32k-poco-rerun/</Code>. The LFM2.5-2.6B and LFM2.5-1.2B exports were also published on Hugging Face.
        </>
      }
    >
      <Section id="findings" title="What we found">
        <Findings items={verdicts} />
      </Section>

      <Section id="results" title="The results">
        <Figure id="figures" title="Grades, cuts, repeats, memory and timing">
          <RerunsFigures />
        </Figure>

        <Figure id="notes" title="What the reruns showed">
          <Rows>
            <Row label="What the cut replies mean">
              A reply cut by the window exceeded the export&apos;s prompt-plus-reply length in this test; a reply cut by the cap is one the benchmark chose not to wait for. In
              every cell 10 to 15 of 60 replies were cut. At 2k on the Poco all 14 reached the window limit and none the cap; in the seven other cells, at 4k and 32k on every
              phone, 10 to 15 reached the 2048 cap and none the window. Some prompts make this model reason past 2000 tokens.
            </Row>
            <Row label="The kill rule">
              Samsung&apos;s Heimdall wrote &quot;Trigger Global kill before GC, Usage 8.67 GB, Threshold 6 GB&quot; on the S25 Ultra and S24+. MIUI on the Poco wrote &quot;used
              too many pss resource, pss used 8653468kb, pss threshold 6291456kb&quot;. Different code, same number: on those two phones a process whose PSS passes 6 GB is stopped.
              The 32k Qwen3 export needs about 7 GB of KV cache before the first prompt; it measured 6.1 to 6.4 GB resident after load on the three runs that were stopped and 8.5
              GB on the Pixel run that finished.
            </Row>
          </Rows>
        </Figure>

        <Figure
          id="numbers"
          title="The rerun tables"
          lede={
            <>
              The rerun cells and controls. The full matrix, with the 640-cap rows and the fixed-prompt speed probe, is on the{" "}
              <Go href="/research/window/#numbers" className={link}>
                window page
              </Go>
              .
            </>
          }
        >
          <div className="space-y-4">
            <More
              title="LFM2.5-2.6B under two reply caps"
              summary="8 cells, GSM8K and IFEval. Passed out of 30 at the 640-token cap and at the 2048-token rerun, and how the 60 rerun replies ended."
              open
            >
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
            </More>
            <More title="Same file, run twice" summary="5 controls. Replies byte-identical between the two runs, and each set's grade in the first and the second run.">
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
            </More>
            <More title="Timing of every rerun cell" summary="TTFT, TPOT, throughput and memory, against the earlier run of the same cell">
              <div>
                <Note>
                  Medians over the prompts each run completed. Prefill ms is the runtime&apos;s prefill of the whole prompt; ms per token is decode time over generated tokens. RSS
                  is resident memory after load and at the end of the run.
                </Note>
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
              </div>
            </More>
            <More title="Qwen3-1.7B 32k on four phones" summary="The kill evidence">
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
            </More>
          </div>
        </Figure>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="What was rerun and why">
            After the{" "}
            <Go href="/research/window/" className={link}>
              window matrix
            </Go>{" "}
            was published, every cell was checked for a failed or noisy run, and the three things the first pass left in doubt were rerun the same day: the 2.6B&apos;s grades,
            which its 640-token cap had cut short; the Poco&apos;s Qwen3 32k run, which had died without a recorded cause; and whether a second run of the same file on another
            phone varies as much as it did on the Poco.
          </Row>
          <Row label="Grading">
            The matrix&apos;s prompts and graders: GSM8K by the last number in the reply, IFEval by the benchmark&apos;s instruction checkers, BFCL by one call to the right
            function with the right arguments. Greedy, thinking off. Every run also recorded prefill and decode time per prompt and resident memory. The 2.6B rerun raised only the
            reply cap, from 640 to 2048, on its 60 GSM8K and IFEval prompts; the repeats used all 90.
          </Row>
          <Row label="Why the 2.6B needed a rerun">
            Its chat template opens a thinking block before every answer, and the suite runs thinking off with a 640-token cap. Most of its GSM8K and IFEval replies were still
            reasoning when generation reached the cap, so those grades confound answer quality with the 640-token limit. The rerun keeps the same prompts, graders and thinking-off
            rule and only raises the cap to 2048. The 640-cap rows stay in the matrix as their own condition.
          </Row>
          <Row label="Cost">
            One day. The cloud reruns took 22 Test Lab launches, one set per launch and continued where the 38-minute budget cut them; 20 ran and 2 were refused when the Blaze
            plan&apos;s quota of 50 physical-device tests per day ran out at 13:19. They resumed at 15:05 after the reset and finished at 18:51. The Poco ran its four steps in 3 h
            20 min.
          </Row>
          <Row label="Where the numbers come from">
            Grades, controls and memory figures are the rendered matrix&apos;s. The cut reasons and the reply-length histogram come from the graded JSON reports, which record
            prompt and reply token counts per prompt; a reply is counted as cut by the window when prompt plus reply reached the window size, and as cut by the cap when the reply
            alone reached 2048. Phone RAM is the manufacturer&apos;s figure for each device. Launch times and counts are from the run logs.
          </Row>
        </Rows>
        <More title="How long each run took" summary="Wall clock per run. Generation time alone for the 2.6B at 2048: 130 to 213 minutes per phone.">
          <div>
            <Note>The Test Lab span includes a pause from 13:19 to 15:05 for the daily quota.</Note>
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
          </div>
        </More>
        <More title="Terms" summary="What a cell, an export, greedy, TTFT, TPOT, RSS and PSS mean here">
          <Rows>
            <Row label="Cell">One export on one phone over the prompt set.</Row>
            <Row label="Export">The model compiled for ExecuTorch at a fixed context window.</Row>
            <Row label="Greedy">The most likely token is always taken, so a run should repeat exactly.</Row>
            <Row label="Thinking off">The model is not given room to reason before answering, though the 2.6B&apos;s template does so anyway.</Row>
            <Row label="Benchmarks">GSM8K is grade-school maths, IFEval instruction following, BFCL tool calling.</Row>
            <Row label="Identity">
              Raw stream is every token generated, shown text is what a user would see after tool-call markup is removed, parsed tool calls are the function calls the app would act
              on.
            </Row>
            <Row label="TTFT and TPOT">
              TTFT is time to first token, measured here as the runtime&apos;s prefill of the prompt; TPOT is time per output token, decode time over generated tokens.
            </Row>
            <Row label="RSS and PSS">RSS is the process&apos;s resident memory; PSS is its proportional share, the figure the memory guards read.</Row>
            <Row label="KV cache">The memory a model keeps per token of window.</Row>
            <Row label="Heimdall">Samsung&apos;s memory guard.</Row>
            <Row label="Test Lab">Firebase&apos;s rented-phone service.</Row>
          </Rows>
        </More>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="What was not rerun">
            The cloud phones&apos; suite timings, which differed by up to threefold between two launches of the same Tensor G5 cell and may reflect different thermal states. A
            repeat would be as launch-dependent; a paired probe on those phones is required to compare their speed.
          </Row>
        </Rows>
      </Section>
    </Post>
  );
}
