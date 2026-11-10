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
  {
    headline: "Answers: no consistent effect",
    line: "From 2k to 32k tokens (a token is a piece of a word), grades moved about as much as between two runs of the same file.",
  },
  {
    headline: "Speed: close, except Qwen3 at 32k",
    line: "Timed turn against turn on the Dimensity 9500s, LFM2.5's windows were within 2.4% of each other. Qwen3 at 32k read the prompt 5.9% slower and wrote the reply 4.7% slower than at 2k.",
  },
  { headline: "Memory: the one real cost", line: "Qwen3-1.7B at 32k takes over 6 GB as soon as it loads, and the memory guards on all three 12 GB phones stopped it." },
  {
    headline: "2k is tight for a model that reasons first",
    line: "With a 2048-token reply cap on the Dimensity 9500s at 2k, 14 of LFM2.5-2.6B's 60 maths and instruction replies ran out of room, yet it graded within 2 of its 32k scores.",
  },
  {
    headline: "Test the two ends first",
    line: "Work out each window's memory first, run the smallest and largest window per model and chip, and add the middle ones only where those two differ or fail.",
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
            <Row label="A missing start marker">
              The app never gave these compiled models the marker that opens a text; the ExecuTorch 1.4.0 runtime adds it only when asked. Without it LFM2.5-2.6B scored 0 of 30 on
              maths on every chip, so its results here come from a build that adds the marker. LFM2.5-1.2B coped without it and ran as the app then shipped.
            </Row>
            <Row label="A sleeping phone skews timings">
              With its screen off, the Dimensity 9500s phone, a POCO X8 Pro Max, slowed test runs two to five times, unevenly, so the runner now wakes it and keeps it awake.
            </Row>
            <Row label="The 2.6B under two reply caps">
              Its template makes it reason before answering, so at the suite&apos;s 640-token cap it was cut off before the answer on 16 of 30 maths and 26 of 30 instruction
              replies (Dimensity 9500s, 2k). Those rows are kept for its BFCL calls, which reached their own 384-token cap at most once in 30, and for memory and speed. Rerun at a
              2048-token cap, maths and instructions only, it scored 23 to 28 and 18 to 21 of 30 on every phone and window.
            </Row>
            <Row label="Qwen3 32k on 12 GB phones">
              The memory guards of the Galaxy S25 Ultra, the Galaxy S24+ and the POCO stopped the test process after 6 to 12 prompts, and both kinds of log name a 6 GB threshold
              (the{" "}
              <Go href="/research/reruns/" className={link}>
                reruns
              </Go>{" "}
              quote them). Only the 16 GB Pixel 10 Pro XL finished. Those cells are marked incomplete and carry no grade or timing.
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
          note="Prefill ms is the time the engine took to read the whole prompt: its part of the time to first token, not the user's whole wait. ms/token is the time to write each reply token; replies differ per cell, so it is not a paired comparison. tok/s is tokens a second. Capped counts replies that stopped at the reply cap (640 tokens, 384 for BFCL, 2048 in the rerun) or at the edge of the window. Ran at is the window the file was loaded with; RSS is the memory the process held right after load and at the end of the run."
        >
          <div className="grid gap-4">
            {windowConditions.map((c, i) => (
              <ConditionTables key={c.model} model={c.model} label={c.label} open={i === 0} />
            ))}
            <More title="Fixed-prompt speed probe" summary="Dimensity 9500s, 12 files, 929-token prompt, 160-token cap, three turns per load, two interleaved passes">
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
            To decide whether a full sweep of five windows, five models and four chips (about 50 device hours) was worth running. Five windows of LFM2.5-1.2B ran on the Dimensity
            9500s; the other model and phone pairs ran the smallest and largest window.
          </Row>
          <Row label="The size of it">The same weights exported, compiled for ExecuTorch, once per window from 2k to 32k. 3 models, 4 phones, 23.7 hours of generation.</Row>
          <Row label="Grading">
            90 prompts per cell, one model at one window on one phone: 30 GSM8K maths problems (the last number in the reply must equal the reference), 30 IFEval
            instruction-following prompts (every instruction must be met, checked by the benchmark&apos;s own code), 30 BFCL function-calling prompts (exactly one call to the right
            function with the right arguments). Always the likeliest next token, thinking off, replies capped at 640 tokens and BFCL&apos;s at 384. The 2.6B was also rerun at a
            2048 cap.
          </Row>
          <Row label="Memory per token">
            The memory a model keeps of the conversation so far is reserved for the whole window at load. LFM2.5, where only 6 or 8 layers keep it, pays 25 to 33 KB per token of
            window; Qwen3-1.7B, where all 28 do, pays 224 KB, so its 32k export needs over 6 GB before the first prompt.
          </Row>
          <Row label="Review">
            Codex reviewed the method before and after the data. What it asked for is all here: same-file repeats, a speed test paired turn by turn, memory after load, a second
            model family, incomplete runs shown as such, and conclusions no stronger than the run-to-run variation allows.
          </Row>
        </Rows>
        <More title="What was run, cell by cell" summary="Windows and repeats per model, the export recipe, and how long each took">
          <Rows>
            <Row label="LFM2.5-1.2B">Five windows on the Dimensity 9500s, 16k and 32k twice; 4k and 32k on the cloud chips, 4k twice on the Exynos.</Row>
            <Row label="LFM2.5-2.6B">
              2k and 32k on the Dimensity, 2k twice; 4k and 32k on the cloud chips; then GSM8K and IFEval again at a 2048 cap on every one of those cells. BFCL was not rerun.
            </Row>
            <Row label="Qwen3-1.7B">2k and 32k everywhere, 2k twice on the Dimensity, 32k twice on the Dimensity to catch the kill.</Row>
            <Row label="Exports">
              Every file loaded at its own exported window. Exports use ExecuTorch 1.4.0&apos;s recipes, the 8da4w in the file names: 8-bit dynamic activations, 4-bit weights in
              groups of 32, 8-bit embeddings, fp32 KV cache, prefill chunk 2048.
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
            The Dimensity 9500s ran in hand, cooled below 42 C before each probe load. The 8 Elite, Tensor G5 and Exynos 2400 ran racked on Firebase Test Lab, Google&apos;s rented
            phones, which throttle within about 40 seconds, and had no paired probe: their timings are medians over different replies and do not support a speed claim either way.
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
