import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import WindowFigures from "@/components/openweights/WindowFigures";
import { Scroll, th, thNum } from "@/components/openweights/pd-parts";
import Post, { Figure, Findings, More, Note, postMetadata, Row, Rows, Section } from "@/components/research/Post";
import { windowCells, windowConditions, windowControl, windowIdent, windowLinks, windowProbe, windowRatio, type WindowCell } from "@/lib/openweights-window";

const href = "/research/window/";

export const metadata = postMetadata(
  href,
  "ExecuTorch fixes a model's context window when the model is exported. The same weights exported at 2k to 32k, on the same prompts and four phone chips: whether that choice changes anything but memory.",
);

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
  { headline: "Answers: no consistent effect", line: "Grades moved between windows about as much as between two runs of the same file." },
  {
    headline: "Speed: close, except Qwen3 at 32k",
    line: "Paired on the Dimensitys, LFM2.5's windows were within 2.4% of each other. Qwen3 at 32k was 5.9% slower to prefill and 4.7% to decode than at 2k.",
  },
  { headline: "Memory: the one real cost", line: "Qwen3-1.7B at 32k needs over 6 GB at load, and 12 GB phones kill it." },
  {
    headline: "2k is tight for a model that reasons",
    line: "At 2k, 14 of LFM2.5-2.6B's 60 GSM8K and IFEval replies ran into the window. Grades barely moved.",
  },
  {
    headline: "Test the two ends first",
    line: "Compute the KV cost first, run the smallest and largest window per model and chip, and add the middle ones only where those two differ or fail.",
  },
];

function ConditionTables({ model, label, open }: { model: string; label: string; open: boolean }) {
  const cells = windowCells.filter((c) => c.model === model);
  const wins = winsOf(cells);
  const largest = wins[wins.length - 1];
  const others = wins.slice(0, -1);
  const ctrl = windowControl.filter((r) => r.model === model);
  const id = windowIdent.filter((r) => r.model === model);
  return (
    <More title={label} summary={`${cells.length} cells, ${model}`} open={open} model={model}>
      <div>
        <p className="text-xs text-ink-soft">Scrolls sideways; the phone and window column stays put.</p>
        <Scroll label={`${label} cells`}>
          <table className="w-full min-w-[64rem] border-collapse whitespace-nowrap text-sm tabular-nums">
            <thead>
              <tr>
                <th className={`${th} sticky left-0 bg-white`}>Phone and window</th>
                <th className={th}>File</th>
                {["GSM8K", "IFEval", "BFCL", "Capped", "Prefill ms", "ms/token", "Prefill tok/s", "Decode tok/s", "Ran at", "RSS after load MB", "RSS at end MB"].map((h) => (
                  <th key={h} className={thNum}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cells.map((c, i) => {
                const first = i === 0 || cells[i - 1].window !== c.window;
                const lead = (
                  <>
                    <td className={`${tdL} sticky left-0 bg-white`}>
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
      </div>
      {ctrl.length > 0 && (
        <div>
          <Note>Run-to-run control: the same file run twice on the same phone, replies byte-identical.</Note>
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
        </div>
      )}
      {id.length > 0 && others.length > 0 && (
        <div>
          <Note>
            Replies identical to the {largest}k export, per window: raw stream and shown content over the prompts both runs completed, parsed tool calls over the BFCL prompts among
            them.
          </Note>
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
        </div>
      )}
    </More>
  );
}

export default function Window() {
  return (
    <Post
      href={href}
      related={["/research/reruns/", "/research/latency/", "/research/prefill-decode/"]}
      sources={[
        { label: "The note", href: windowLinks.note },
        { label: "The tables", href: windowLinks.tables },
        { label: "Raw and graded reports", href: windowLinks.results },
        { label: "Qwen3-1.7B exports on Hugging Face", href: windowLinks.qwen },
        { label: "Source on GitHub", href: "https://github.com/ExperimentalMachines/openweights" },
      ]}
      sourcesNote="The LFM2.5-1.2B and LFM2.5-2.6B exports were also published on Hugging Face, each window a file."
    >
      <Section id="findings" title="What we found">
        <Findings items={verdicts} />
      </Section>

      <Section id="results" title="The results">
        <Figure id="figures" title="Every chart, one condition at a time" lede="Pick a model or condition; every chart follows.">
          <WindowFigures />
        </Figure>

        <Figure id="notes" title="What else the matrix found">
          <Rows>
            <Row label="A missing start token">
              Every compiled model this app had ever run was fed no start-of-text token: the ExecuTorch 1.4.0 runtime adds one only when asked and the app never asked. LFM2.5-1.2B
              shrugs it off; LFM2.5-2.6B scored 0 of 30 on GSM8K on every chip until the engine wrote the token itself, and every 2.6B cell here is from the fixed build. The 1.2B
              cells remain BOS-less as measured: comparable among themselves, and a description of that deployed configuration.
            </Row>
            <Row label="A phone that dozes">It throttles instrumentation two to five times with wild variance, so the local runner now wakes the phone and holds it awake.</Row>
            <Row label="Two 2.6B conditions">
              Its own template makes it reason before answering, so under the suite&apos;s 640-token cap 16 of 30 GSM8K and 26 of 30 IFEval replies never reached an answer: those
              rows are cap-censored and kept for their BFCL calls, memory and speed. The rerun at a 2048 cap, GSM8K and IFEval only, is the model&apos;s real score: 23 to 28 of 30
              and 18 to 21 of 30 on every phone and window, with its same-file repeat moving grades by 2 and its BFCL calls unchanged.
            </Row>
            <Row label="Qwen3 32k on 12 GB phones">
              Samsung&apos;s Heimdall memory guard killed the test process on the Galaxy S25 Ultra and S24+ after 7 to 12 prompts (&quot;Trigger Global kill before GC, Usage 8.67
              GB, Threshold 6 GB&quot; in the logcats). A rerun on the Poco with logcat attached died the same way after 7: MIUI&apos;s ActivityManager force-stopped it for
              &quot;used too many pss resource, pss used 8.65 GB, threshold 6 GB&quot;. Only the 16 GB Pixel 10 Pro XL finished. Those cells are marked incomplete and carry no
              grade or timing.
            </Row>
          </Rows>
        </Figure>

        <Figure
          id="numbers"
          title="Every number"
          lede={
            <>
              The full matrix, as rendered from the graded reports by <code className="text-[0.9em]">window_report.py</code>.
            </>
          }
          note="Prefill ms is the runtime's prefill of the whole prompt, the engine-side part of time to first token. ms/token is decode time over generated tokens; replies differ per cell, so it is not a paired comparison. Capped counts replies that ran to the token cap (640, or 384 for BFCL). RSS is resident memory right after load and at the end of the run."
        >
          <div className="grid gap-4">
            {windowConditions.map((c, i) => (
              <ConditionTables key={c.model} model={c.model} label={c.label} open={i === 0} />
            ))}
            <More title="Fixed-prompt speed probe" summary="Dimensitys, 12 files, 929-token prompt, 160-token cap, three turns per load, two interleaved passes">
              <Note>
                Phone cooled below 42 C and awake before each load. The second table pairs each turn with the same turn of the model&apos;s smallest window in the same pass.
              </Note>
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
            </More>
          </div>
        </Figure>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="Why">
            To decide whether a full sweep of five windows, five models and four chips (about 50 device hours) was worth running. Five windows of LFM2.5-1.2B ran on the Dimensitys; the other model and phone pairs ran the smallest and largest window.
          </Row>
          <Row label="The size of it">The same weights exported at 2k to 32k. 3 models, 4 phones, 23.7 hours.</Row>
          <Row label="Grading">
            90 prompts per cell: 30 GSM8K (the last number in the reply must equal the reference), 30 IFEval (every instruction in the prompt must be satisfied, checked by the
            benchmark&apos;s own code), 30 BFCL (exactly one call to the right function with the right arguments). Greedy decoding, thinking off, replies capped at 640 tokens (384
            for BFCL). The 2.6B was also rerun at a 2048 cap.
          </Row>
          <Row label="Memory per token">LFM2.5 pays 25 to 33 KB per token of window; Qwen3-1.7B pays 224 KB, so its 32k export needs over 6 GB before the first prompt.</Row>
          <Row label="Review">
            Codex reviewed the method twice, before and after the data: same-file repeats, a paired speed probe separate from the task eval, a three-way identity metric counted
            over BFCL only, memory after load, a second architecture, incomplete cells shown as such, and conclusions bounded by the observed run variation. All are in what you see
            here.
          </Row>
        </Rows>
        <More title="What was run, cell by cell" summary="Windows and repeats per model, the export recipe, and how long each took">
          <Rows>
            <Row label="LFM2.5-1.2B">Five windows on the Dimensitys, 16k and 32k twice; 4k and 32k on the cloud chips, 4k twice on the Exynos.</Row>
            <Row label="LFM2.5-2.6B">
              2k and 32k on the Dimensity, 2k twice; 4k and 32k on the cloud chips; then GSM8K and IFEval again at a 2048 cap on every one of those cells.
            </Row>
            <Row label="Qwen3-1.7B">2k and 32k everywhere, 2k twice on the Dimensity, 32k twice on the Dimensity to catch the kill.</Row>
            <Row label="Exports">
              Every file loaded at its own exported window. Exports use ExecuTorch 1.4.0&apos;s recipes: 8-bit dynamic activations, 4-bit weights in groups of 32, 8-bit embeddings,
              fp32 KV cache, prefill chunk 2048.
            </Row>
          </Rows>
          <Figure
            title="How long it ran"
            lede="Minutes the model spent generating, summed over every run in that cell; 23.7 hours in all. Loading, cooling and Test Lab queueing came on top. Run on 2026-09-07."
          >
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
          </Figure>
        </More>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="Not matched conditions">
            The Dimensitys ran in hand, cooled below 42 C before each probe load. The 8 Elite, Tensor G5 and Exynos 2400 ran racked on Firebase Test Lab, where phones throttle
            within about 40 seconds, and had no paired probe: their suite timings are per-cell medians over different replies and do not support a speed claim either way.
          </Row>
          <Row label="Follow-up">
            The{" "}
            <Go href="/research/reruns/" className={link}>
              reruns
            </Go>{" "}
            checked every cell of this matrix the same day.
          </Row>
        </Rows>
      </Section>
    </Post>
  );
}
