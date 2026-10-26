import type { Metadata } from "next";
import Go from "@/components/home/Go";
import { h2, lede, link } from "@/components/home/ui";
import WindowFigures from "@/components/openweights/WindowFigures";
import {
  windowCells,
  windowConditions,
  windowControl,
  windowIdent,
  windowLinks,
  windowProbe,
  windowRatio,
  type WindowCell,
} from "@/lib/openweights-window";

const description =
  "ExecuTorch fixes a model's context window when the model is exported. The same weights exported at 2k to 32k, on the same prompts and four phone chips: whether that choice changes anything but memory.";

export const metadata: Metadata = {
  title: "Does the exported window matter? OpenWeights",
  description,
  openGraph: { title: "Does the exported window matter?", description, url: "/openweights/window/" },
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
const tdL = "py-2 pr-4 text-left";
const WARN = "text-[#b4452b]";

const win = (s: string) => parseInt(s);
const complete = (c: WindowCell) => !c.gsm8k.startsWith("INCOMPLETE");
const winsOf = (cells: WindowCell[]) => [...new Set(cells.map((c) => win(c.window)))].sort((a, b) => a - b);

// Minutes the model spent generating, per condition and phone.
const minutes = [
  ["LFM2.5-1.2B", 63, 12, 43, 35],
  ["LFM2.5-2.6B, 640 cap", 129, 75, 128, 117],
  ["LFM2.5-2.6B, 2048 cap", 146, 130, 213, 195],
  ["Qwen3-1.7B", 33, 19, 57, 25],
] as const;

const verdicts = [
  {
    k: "Answers and tool calls",
    v: "No consistent directional effect found",
    p: "Two windows agree on 12 to 19 of 90 replies; the same file run twice agrees on 7 to 15. Grades move both ways between windows by about as much as between repeats.",
  },
  {
    k: "Speed",
    v: "Paired medians close; Qwen3 32k slower",
    p: "Same prompt, same turn, Dimensity 9400: LFM2.5 windows within 2.4% of each other. Qwen3 32k was 5.9% slower on prefill and 4.7% on decode than 2k.",
  },
  {
    k: "Memory",
    v: "The one thing the window buys, at load",
    p: "LFM2.5 pays 25 to 33 KB per token of window; Qwen3-1.7B pays 224 KB, so its 32k export needs over 6 GB before the first prompt and 12 GB phones kill it.",
  },
  {
    k: "Where the window did matter",
    v: "At 2k, 14 of 60 long replies hit the window",
    p: "The 2.6B reasons before it answers. At 2k, prompt plus reply reached the window and was cut; at 4k and above only the reply cap cut them. Grades barely moved.",
  },
  {
    k: "The full sweep",
    v: "Screen the endpoints before any full sweep",
    p: "Compute the KV cost, run the smallest and largest window per model and chip, and add middle windows only where those two diverge or fail.",
  },
];

// One collapsible card per table group, as on the original page. A condition's
// card carries its model, so picking that condition above the charts opens it.
function Card({ title, detail, open, model, children }: { title: string; detail: string; open?: boolean; model?: string; children: React.ReactNode }) {
  return (
    <details open={open} data-model={model} className="group min-w-0 rounded-[1.5rem] bg-bench">
      <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-[1.5rem] px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="font-medium">
          {title} <span className="text-sm font-normal text-ink-soft">{detail}</span>
        </span>
        <span className="text-sm text-ink-soft">
          <span className="group-open:hidden">Show</span>
          <span className="hidden group-open:inline">Hide</span>
        </span>
      </summary>
      <div className="space-y-4 px-5 pb-6 sm:px-6">{children}</div>
    </details>
  );
}

const Hint = ({ children }: { children: React.ReactNode }) => <p className="max-w-3xl text-sm leading-6 text-ink-soft">{children}</p>;

function ConditionTables({ model, label, open }: { model: string; label: string; open: boolean }) {
  const cells = windowCells.filter((c) => c.model === model);
  const wins = winsOf(cells);
  const largest = wins[wins.length - 1];
  const others = wins.slice(0, -1);
  const ctrl = windowControl.filter((r) => r.model === model);
  const id = windowIdent.filter((r) => r.model === model);
  return (
    <Card title={label} detail={`${cells.length} cells, ${model}`} open={open} model={model}>
      <p className="text-xs text-ink-soft">Scrolls sideways; the phone and window column stays put.</p>
      <Scroll label={`${label} cells`}>
        <table className="w-full min-w-[64rem] border-collapse whitespace-nowrap text-sm tabular-nums">
          <thead>
            <tr>
              <th className={`${th} sticky left-0 bg-bench`}>Phone and window</th>
              <th className={th}>File</th>
              {["GSM8K", "IFEval", "BFCL", "Capped", "Prefill ms", "ms/token", "Prefill tok/s", "Decode tok/s", "Ran at", "RSS after load MB", "RSS at end MB"].map(
                (h) => (
                  <th key={h} className={thNum}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {cells.map((c, i) => {
              const first = i === 0 || cells[i - 1].window !== c.window;
              const lead = (
                <>
                  <td className={`${tdL} sticky left-0 bg-bench`}>
                    {c.phone}, {c.window}
                  </td>
                  <td className={tdL}>{c.file}</td>
                </>
              );
              return (
                <tr key={`${c.phone} ${c.window}`} className={`border-rule ${first ? "border-t-2" : "border-t"}`}>
                  {lead}
                  {complete(c) ? (
                    <>
                      <td className={td}>{c.gsm8k}</td>
                      <td className={td}>{c.ifeval}</td>
                      <td className={td}>{c.bfcl}</td>
                      <td className={td}>{c.capped}</td>
                      <td className={td}>{c.prefill_ms}</td>
                      <td className={td}>{c.ms_tok}</td>
                      <td className={td}>{c.prefill_tps}</td>
                      <td className={td}>{c.decode_tps}</td>
                      <td className={td}>{c.ran_at}</td>
                      <td className={`${td} ${c.rss_load === "-" ? "text-ink-soft" : ""}`}>{c.rss_load === "-" ? "not logged" : c.rss_load}</td>
                      <td className={td}>{c.rss_end}</td>
                    </>
                  ) : (
                    <>
                      <td colSpan={8} className={`${tdL} ${WARN}`}>
                        {c.gsm8k}
                      </td>
                      <td className={td}>{c.ran_at}</td>
                      <td className={td}>{c.rss_load}</td>
                      <td className={`${td} text-ink-soft`}>{c.rss_end}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Scroll>
      {ctrl.length > 0 && (
        <>
          <Hint>Run-to-run control: the same file run twice on the same phone, replies byte-identical.</Hint>
          <Scroll label={`${label} run-to-run control`}>
            <table className="w-full min-w-[30rem] border-collapse whitespace-nowrap text-sm tabular-nums">
              <thead>
                <tr>
                  <th className={th}>Window</th>
                  <th className={th}>Phone</th>
                  <th className={th}>Identical replies</th>
                </tr>
              </thead>
              <tbody>
                {ctrl.map((c) => (
                  <tr key={`${c.window} ${c.phone}`} className="border-t border-rule">
                    <td className={tdL}>{c.window}</td>
                    <td className={tdL}>{c.phone}</td>
                    <td className={tdL}>{c.identity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroll>
        </>
      )}
      {id.length > 0 && others.length > 0 && (
        <>
          <Hint>
            Replies identical to the {largest}k export, per window: raw stream and shown content over the prompts both runs completed, parsed tool calls over
            the BFCL prompts among them.
          </Hint>
          <Scroll label={`${label} identical replies`}>
            <table className="w-full min-w-[40rem] border-collapse whitespace-nowrap text-sm tabular-nums">
              <thead>
                <tr>
                  <th className={th}>Phone</th>
                  {others.map((w) => (
                    <th key={w} className={th}>
                      {w}k
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {id.map((r) => (
                  <tr key={r.phone} className="border-t border-rule">
                    <td className={tdL}>{r.phone}</td>
                    {r.values.map((v, j) => (
                      <td key={j} className={`${tdL} ${v === "-" ? "text-ink-soft" : ""}`}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroll>
        </>
      )}
    </Card>
  );
}

export default function Window() {
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
          <p className="mt-8 text-sm text-ink-soft">7 September 2026</p>
          <h1 className="display mt-2 max-w-4xl text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">
            Does the exported window matter?
          </h1>
          <p className="display mt-4 text-2xl leading-tight text-ink-soft sm:text-3xl">ExecuTorch, 2k to 32k</p>
          <p className={`${lede} mt-6 max-w-3xl`}>
            ExecuTorch fixes a model&apos;s context window when the model is exported. This page asks whether that choice changes anything but memory.
          </p>
          <dl className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr]">
            <div className="border-t-2 border-blue pt-4">
              <dt className="display text-xl">Purpose</dt>
              <dd className="mt-2 leading-7 text-ink-soft">
                Decide whether a full sweep of five windows, five models and four chips (about 50 device hours) was worth running, by measuring the same
                weights exported at 2k, 4k, 8k, 16k and 32k on the same prompts. Five windows of LFM2.5-1.2B ran on the Dimensity 9400; the other model and
                phone pairs ran the smallest and largest window.
              </dd>
            </div>
            <div className="border-t-2 border-blue pt-4">
              <dt className="display text-xl">How it was graded</dt>
              <dd className="mt-2 leading-7 text-ink-soft">
                90 prompts per cell: 30 GSM8K (the last number in the reply must equal the reference), 30 IFEval (every instruction in the prompt must be
                satisfied, checked by the benchmark&apos;s own code), 30 BFCL (exactly one call to the right function with the right arguments). Greedy
                decoding, thinking off, replies capped at 640 tokens (384 for BFCL). The 2.6B was also rerun at a 2048 cap.
              </dd>
            </div>
            <div className="min-w-0 border-t-2 border-blue pt-4 md:col-span-2 lg:col-span-1">
              <dt className="display text-xl">How long it ran</dt>
              <dd className="mt-3">
                <Scroll label="Minutes per cell">
                  <table className="w-full min-w-[22rem] border-collapse whitespace-nowrap text-sm tabular-nums">
                    <thead>
                      <tr>
                        <th className={th}>Model</th>
                        {["Dimensity", "8 Elite", "Tensor G5", "Exynos"].map((h) => (
                          <th key={h} className={thNum}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {minutes.map(([m, ...n]) => (
                        <tr key={m} className="border-t border-rule">
                          <td className={tdL}>{m}</td>
                          {n.map((x, j) => (
                            <td key={j} className={td}>
                              {x}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Scroll>
                <p className="mt-3 leading-7 text-ink-soft">
                  Minutes the model spent generating, summed over every run in that cell; 23.7 hours in all. Loading, cooling and Test Lab queueing came on
                  top. Run on 2026-09-07.
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <Section id="findings" title="Findings" tint>
        <dl className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {verdicts.map((v) => (
            <div key={v.k} className="border-t-2 border-blue pt-4">
              <dt className="text-sm text-ink-soft">{v.k}</dt>
              <dd className="display mt-2 text-2xl leading-tight">{v.v}</dd>
              <dd className="mt-3 leading-7 text-ink-soft">{v.p}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="figures" title="Every chart, one condition at a time">
        <p className="mb-8 max-w-3xl leading-7 text-ink-soft">Pick a model or condition; every chart follows.</p>
        <WindowFigures />
      </Section>

      <Section id="notes" title="Notes" tint>
        <List>
          <Item lead="Two things the matrix found that it was not looking for.">
            Every compiled model this app had ever run was fed no start-of-text token: the ExecuTorch 1.4.0 runtime adds one only when asked and the app never
            asked. LFM2.5-1.2B shrugs it off; LFM2.5-2.6B scored 0 of 30 on GSM8K on every chip until the engine wrote the token itself, and every 2.6B cell
            here is from the fixed build. The 1.2B cells remain BOS-less as measured: comparable among themselves, and a description of that deployed
            configuration. And a phone that has dozed throttles instrumentation two to five times with wild variance, so the local runner now wakes the phone
            and holds it awake.
          </Item>
          <Item lead="Two 2.6B conditions.">
            Its own template makes it reason before answering, so under the suite&apos;s 640-token cap 16 of 30 GSM8K and 26 of 30 IFEval replies never
            reached an answer: those rows are cap-censored and kept for their BFCL calls, memory and speed. The rerun at a 2048 cap, GSM8K and IFEval only, is
            the model&apos;s real score: 23 to 28 of 30 and 18 to 21 of 30 on every phone and window, with its same-file repeat moving grades by 2 and its BFCL
            calls unchanged.
          </Item>
          <Item lead="Qwen3 32k on 12 GB phones.">
            Samsung&apos;s Heimdall memory guard killed the test process on the Galaxy S25 Ultra and S24+ after 7 to 12 prompts (&quot;Trigger Global kill
            before GC, Usage 8.67 GB, Threshold 6 GB&quot; in the logcats). A rerun on the Poco with logcat attached died the same way after 7: MIUI&apos;s
            ActivityManager force-stopped it for &quot;used too many pss resource, pss used 8.65 GB, threshold 6 GB&quot;. Only the 16 GB Pixel 10 Pro XL
            finished. Those cells are marked incomplete and carry no grade or timing.
          </Item>
          <Item lead="Not matched conditions.">
            The Dimensity 9400 ran in hand, cooled below 42 C before each probe load. The 8 Elite, Tensor G5 and Exynos 2400 ran racked on Firebase Test Lab,
            where phones throttle within about 40 seconds, and had no paired probe: their suite timings are per-cell medians over different replies and do not
            support a speed claim either way.
          </Item>
        </List>
      </Section>

      <Section id="numbers" title="Every number">
        <p className="mb-8 max-w-3xl leading-7 text-ink-soft">
          The full matrix, as rendered from the graded reports by <code className="text-[0.9em]">window_report.py</code>. Prefill ms is the runtime&apos;s
          prefill of the whole prompt, the engine-side part of time to first token. ms/token is decode time over generated tokens; replies differ per cell, so
          it is not a paired comparison. Capped counts replies that ran to the token cap (640, or 384 for BFCL). RSS is resident memory right after load and at
          the end of the run.
        </p>
        <div className="grid gap-4">
          {windowConditions.map((c, i) => (
            <ConditionTables key={c.model} model={c.model} label={c.label} open={i === 0} />
          ))}
          <Card
            title="Fixed-prompt speed probe"
            detail="Dimensity 9400, 12 files, 929-token prompt, 160-token cap, three turns per load, two interleaved passes"
          >
            <Hint>
              Phone cooled below 42 C and awake before each load. The second table pairs each turn with the same turn of the model&apos;s smallest window in
              the same pass.
            </Hint>
            <Scroll label="Speed probe">
              <table className="w-full min-w-[56rem] border-collapse whitespace-nowrap text-sm tabular-nums">
                <thead>
                  <tr>
                    <th className={th}>File</th>
                    <th className={thNum}>Turns</th>
                    <th className={th}>Prefill tok/s (median, min to max)</th>
                    <th className={th}>Decode tok/s (median, min to max)</th>
                    <th className={thNum}>Prefill ms, 929 tokens</th>
                    <th className={thNum}>Resident after load MB</th>
                  </tr>
                </thead>
                <tbody>
                  {windowProbe.map((p) => (
                    <tr key={p.file} className="border-t border-rule">
                      <td className={tdL}>{p.file}</td>
                      <td className={td}>{p.turns}</td>
                      <td className={tdL}>{p.prefill}</td>
                      <td className={tdL}>{p.decode}</td>
                      <td className={td}>{p.prefill_ms}</td>
                      <td className={td}>{p.rss}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Scroll>
            <Scroll label="Speed probe against the smallest window">
              <table className="w-full min-w-[56rem] border-collapse whitespace-nowrap text-sm tabular-nums">
                <thead>
                  <tr>
                    <th className={th}>File</th>
                    <th className={th}>Prefill vs smallest window (median ratio, min to max)</th>
                    <th className={th}>Decode vs smallest window</th>
                    <th className={thNum}>Paired turns</th>
                  </tr>
                </thead>
                <tbody>
                  {windowRatio.map((p) => (
                    <tr key={p.file} className="border-t border-rule">
                      <td className={tdL}>{p.file}</td>
                      <td className={tdL}>{p.prefill}</td>
                      <td className={tdL}>{p.decode}</td>
                      <td className={td}>{p.turns}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Scroll>
          </Card>
        </div>
      </Section>

      <Section id="method" title="How it was run" tint>
        <List>
          <Item lead="What was run.">
            LFM2.5-1.2B: five windows on the Dimensity 9400, 16k and 32k twice; 4k and 32k on the cloud chips, 4k twice on the Exynos. LFM2.5-2.6B: 2k and 32k
            on the Dimensity, 2k twice; 4k and 32k on the cloud chips; then GSM8K and IFEval again at a 2048 cap on every one of those cells. Qwen3-1.7B: 2k and
            32k everywhere, 2k twice on the Dimensity, 32k twice on the Dimensity to catch the kill. Every file loaded at its own exported window. Exports use
            ExecuTorch 1.4.0&apos;s recipes: 8-bit dynamic activations, 4-bit weights in groups of 32, 8-bit embeddings, fp32 KV cache, prefill chunk 2048.
          </Item>
          <Item lead="Review.">
            Codex reviewed the method twice, before and after the data: same-file repeats, a paired speed probe separate from the task eval, a three-way
            identity metric counted over BFCL only, memory after load, a second architecture, incomplete cells shown as such, and conclusions bounded by the
            observed run variation. All are in what you see here.
          </Item>
          <Item lead="Where things are.">
            The note:{" "}
            <Go href={windowLinks.note} className={link}>
              executorch-window-matrix.md
            </Go>
            . The tables:{" "}
            <Go href={windowLinks.tables} className={link}>
              window-matrix.md
            </Go>
            . Raw and graded reports:{" "}
            <Go href={windowLinks.results} className={link}>
              tools/eval/results
            </Go>
            . The exports, each window a file: LFM2.5-1.2B, LFM2.5-2.6B,{" "}
            <Go href={windowLinks.qwen} className={link}>
              Qwen3-1.7B
            </Go>{" "}
            on Hugging Face.
          </Item>
        </List>
        <p className="mt-12 flex flex-wrap gap-x-6 gap-y-3">
          <Go href="/openweights/" className={link}>
            OpenWeights
          </Go>
          <Go href="/openweights/latency/" className={link}>
            Five chips, two runtimes
          </Go>
          <Go href="/openweights/reruns/" className={link}>
            What the reruns changed
          </Go>
          <Go href="https://github.com/ExperimentalMachines/openweights" className={link}>
            Source on GitHub
          </Go>
        </p>
      </Section>
    </main>
  );
}
