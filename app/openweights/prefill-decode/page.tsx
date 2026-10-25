import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import {
  pdConversations,
  pdExecutorch,
  pdLinks,
  pdModels,
  pdPhone,
  pdSummary,
  pdTurns,
  processors,
  type PdModel,
} from "@/lib/prefill-decode";

export const metadata: Metadata = {
  title: "Prefill and decode on CPU, GPU and NPU: OpenWeights",
  description:
    "Nine models, each run through all nine pairings of the processor that reads the prompt and the one that writes the reply, in one llama.cpp build on a Snapdragon 8 Elite Gen 5.",
  openGraph: {
    title: "Prefill and decode on CPU, GPU and NPU",
    description: "Every pairing on a Snapdragon 8 Elite Gen 5, for nine models in one llama.cpp build.",
    url: "/openweights/prefill-decode/",
  },
};

function Section({ id, title, plate, children }: { id: string; title: string; plate?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-14 border-t border-rule ${plate ? "bg-plate" : ""}`}>
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
        <h2 className="wide text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="text-blue hover:text-blue-deep">
    {children}
  </a>
);

const Item = ({ lead, children }: { lead: string; children: React.ReactNode }) => (
  <li>
    <span className="font-semibold text-ink">{lead}</span> {children}
  </li>
);

const Note = ({ children }: { children: React.ReactNode }) => <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft">{children}</p>;

const Model = ({ m }: { m: PdModel }) => (
  <>
    {m.name} <span className="font-normal text-ink-soft">{m.quant}</span>
  </>
);

const n = (x: number) => x.toLocaleString("en-US");
const f1 = (x: number) => x.toFixed(1);

function Matrix({ m }: { m: PdModel }) {
  const { fastest } = pdSummary(m);
  const label = `${m.name} ${m.quant}`;
  return (
    <div className="min-w-0">
      <h3 className="font-bold">
        <Model m={m} />
      </h3>
      <p className="mt-1 text-sm text-ink-soft">
        {m.session} session ({m.run}) · {m.hexagonSessions} Hexagon session{m.hexagonSessions > 1 ? "s" : ""} · {pdTurns} turns per cell
      </p>
      <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label={`${label} matrix, scrolls sideways on small screens`}>
        <table className="w-full min-w-[20rem] table-fixed border-collapse text-sm">
          <thead className="text-left text-ink-soft">
            <tr className="border-b border-ink">
              <th className="w-[22%] py-2 pr-2 text-xs font-normal">
                prefill <span aria-hidden>↓</span> decode <span aria-hidden>→</span>
              </th>
              {processors.map((p) => (
                <th key={p} scope="col" className="px-2 py-2 font-normal">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {m.cells.map((row, i) => (
              <tr key={processors[i]} className="border-b border-rule align-top">
                <th scope="row" className="py-2.5 pr-2 text-left font-medium">
                  {processors[i]}
                </th>
                {row.map((c, j) => {
                  const best = fastest.prefillOn === processors[i] && fastest.decodeOn === processors[j];
                  return (
                    <td key={processors[j]} className={`px-2 py-2.5 ${best ? "bg-blue/10 font-medium text-blue-deep" : ""}`}>
                      <span className="block">
                        {n(c.prefill)} <span className={best ? "" : "text-ink-soft"}>/</span> {f1(c.decode)}
                      </span>
                      <span className={`block text-xs ${best ? "" : "text-ink-soft"}`}>
                        {f1(c.seconds)} s{best && <span className="sr-only">, the fastest pairing</span>}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PrefillDecode() {
  return (
    <>
      <Nav />
      <main>
        <section id="top" className="scroll-mt-14">
          <div className="mx-auto max-w-6xl px-6 pb-14 pt-14 sm:pt-20">
            <p className="text-sm text-ink-soft">
              <a href="/openweights/" className="text-blue hover:text-blue-deep">
                OpenWeights
              </a>{" "}
              · Measured 24 October 2026 · Qualcomm Device Cloud
            </p>
            <h1 className="wide mt-3 max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Prefill and decode on CPU, GPU and NPU: every pairing on a Snapdragon 8 Elite Gen 5
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-7 text-ink-soft">
              {pdModels.length} models, each run through all nine combinations of where the prompt is read (prefill) and where the reply is written (decode), in
              one llama.cpp build, on real multi-turn conversations.
            </p>
          </div>
        </section>

        <Section id="dataset" title="Dataset" plate>
          <ul className="max-w-3xl list-disc space-y-3 pl-5 leading-7 text-ink-soft">
            <Item lead="Three public conversation sets,">
              the first conversation in each length bucket (short, medium, long, by characters) with at least two user turns:
              <ul className="mt-2 list-[circle] space-y-1 pl-5">
                <Item lead="WildChat-1M">(allenai): real users talking to a deployed assistant.</Item>
                <Item lead="UltraChat 200k">
                  (HuggingFaceH4, <code className="text-ink">train_sft</code>): generated multi-turn dialogues.
                </Item>
                <Item lead="Daring-Anteater">(NVIDIA): mostly generated instruction dialogues.</Item>
              </ul>
            </Item>
            <Item lead="Replay:">
              teacher forced, so every earlier assistant turn is the dataset&apos;s own reply and all nine cells read exactly the same tokens. Up to six turns
              per conversation, 8,192-token window, greedy.
            </Item>
            <Item lead="Output:">
              64 tokens per turn in every cell (the first from the prefill side, then 63 timed decode steps), past an end of turn if the model writes one.
            </Item>
            <Item lead="Not used:">
              ShareGPT52K (the Hugging Face datasets server cannot read it) and MT-Bench (user turns only; the replay needs the dataset&apos;s replies).
            </Item>
          </ul>
          <div className="mt-8 overflow-x-auto" tabIndex={0} role="region" aria-label="Conversations, scrolls sideways on small screens">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead className="text-left text-ink-soft">
                <tr className="border-b border-rule">
                  <th className="py-2 pr-4 font-normal">Conversation</th>
                  <th className="py-2 pr-4 font-normal">Length</th>
                  <th className="py-2 pr-4 text-right font-normal">Characters</th>
                  <th className="py-2 pr-4 text-right font-normal">Turns replayed</th>
                  <th className="py-2 pr-4 text-right font-normal">New tokens per turn</th>
                  <th className="py-2 text-right font-normal">Context at last turn</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {pdConversations.map((c) => (
                  <tr key={`${c.set}${c.index}`} className="border-b border-rule">
                    <td className="py-2.5 pr-4">
                      {c.set} #{c.index}
                    </td>
                    <td className="py-2.5 pr-4">{c.length}</td>
                    <td className="py-2.5 pr-4 text-right">{n(c.characters)}</td>
                    <td className="py-2.5 pr-4 text-right">{c.turns}</td>
                    <td className="py-2.5 pr-4 text-right">
                      {n(c.newTokens[0])} to {n(c.newTokens[1])}
                    </td>
                    <td className="py-2.5 text-right">{n(c.context)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>{pdTurns} turns in all. Token counts are from Qwen3&apos;s tokenizer; other models tokenize slightly differently.</Note>
        </Section>

        <Section id="phone" title="The phone">
          <p className="max-w-3xl leading-7 text-ink-soft">
            <span className="font-semibold text-ink">Snapdragon 8 Elite Gen 5</span> (SM8850, board <code className="text-ink">canoe</code>), 23 GB RAM,
            Android 16, root shell, on AC power in Qualcomm&apos;s rack.
          </p>
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div className="min-w-0">
              <h3 className="font-bold">CPU: Qualcomm Oryon, 8 cores in two clusters</h3>
              <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="CPU clusters, scrolls sideways on small screens">
                <table className="w-full min-w-[24rem] border-collapse text-sm">
                  <thead className="text-left text-ink-soft">
                    <tr className="border-b border-rule">
                      <th className="py-2 pr-4 font-normal">Cores</th>
                      <th className="py-2 pr-4 font-normal">Type</th>
                      <th className="py-2 pr-4 text-right font-normal">Max clock</th>
                      <th className="py-2 text-right font-normal">Min clock</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {pdPhone.cores.map((c) => (
                      <tr key={c.cores} className="border-b border-rule">
                        <td className="py-2.5 pr-4 font-mono text-[13px]">{c.cores}</td>
                        <td className="py-2.5 pr-4">{c.type}</td>
                        <td className="py-2.5 pr-4 text-right">{c.max}</td>
                        <td className="py-2.5 text-right">{c.min}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note>All eight report implementer 0x51 (Qualcomm), part 0x002. No efficiency cores. The benchmark used 6 threads.</Note>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold">GPU and NPU</h3>
              <dl className="mt-3 border-t border-rule text-sm">
                <div className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-rule py-2.5">
                  <dt className="text-ink-soft">GPU</dt>
                  <dd>{pdPhone.gpu}</dd>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-rule py-2.5">
                  <dt className="text-ink-soft">NPU</dt>
                  <dd>{pdPhone.npu}</dd>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-rule py-2.5">
                  <dt className="text-ink-soft">Runtime</dt>
                  <dd>
                    llama.cpp <code>{pdPhone.llamacpp}</code> with <code>ggml-cpu</code>, <code>ggml-opencl</code> and <code>ggml-hexagon</code>, built with
                    Qualcomm&apos;s toolchain image.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Section>

        <Section id="findings" title="Findings" plate>
          <ul className="max-w-3xl list-disc space-y-3 pl-5 leading-7 text-ink-soft">
            <Item lead="Prefill:">the NPU is fastest on every model, 10.5 to 15.8 times the CPU and 5.1 to 8.2 times the GPU.</Item>
            <Item lead="Decode:">
              the CPU is fastest on eight models and level with the NPU on Qwen3 4B (15.3 against 15.4 tok/s). On the transformers its lead over the NPU
              shrinks with size, from 1.27 to 1.37 times at 0.6B and 1B to 1.08 times on Llama 3.2 3B. The two LFM2.5 hybrids keep a wider lead: 1.48 times
              at 1.2B, 1.34 times at 2.6B.
            </Item>
            <Item lead="Fastest pairing:">
              NPU prefill with CPU decode on all nine models, at 41% to 52% of CPU-only time. On Qwen3 4B it ties with NPU only (149.5 s against 149.9 s).
            </Item>
            <Item lead="GPU:">
              never the fastest at either phase. On the two LFM2.5 hybrids it decodes faster than the NPU (46.7 against 42.7, 21.6 against 20.7 tok/s); on
              the seven transformers it decodes slowest.
            </Item>
            <Item lead="Handoff:">copying the conversation state from one processor to another took a median 0.6 to 11 ms per turn.</Item>
          </ul>
          <div className="mt-8 overflow-x-auto" tabIndex={0} role="region" aria-label="Findings per model, scrolls sideways on small screens">
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead className="text-left text-ink-soft">
                <tr className="border-b border-rule">
                  <th className="py-2 pr-4 font-normal">Model</th>
                  <th className="py-2 pr-4 text-right font-normal">NPU prefill vs CPU</th>
                  <th className="py-2 pr-4 text-right font-normal">NPU prefill vs GPU</th>
                  <th className="py-2 pr-4 text-right font-normal">Decode tok/s, CPU / GPU / NPU</th>
                  <th className="py-2 pr-4 text-right font-normal">Fastest</th>
                  <th className="py-2 pr-4 text-right font-normal">Fastest vs CPU only</th>
                  <th className="py-2 text-right font-normal">Slowest</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {pdModels.map((m) => {
                  const s = pdSummary(m);
                  return (
                    <tr key={`${m.name}${m.quant}`} className="border-b border-rule align-top">
                      <th scope="row" className="py-2.5 pr-4 text-left font-medium">
                        <Model m={m} />
                      </th>
                      <td className="py-2.5 pr-4 text-right">{f1(s.prefill[2] / s.prefill[0])}×</td>
                      <td className="py-2.5 pr-4 text-right">{f1(s.prefill[2] / s.prefill[1])}×</td>
                      <td className="py-2.5 pr-4 text-right">{s.decode.map(f1).join(" / ")}</td>
                      <td className="py-2.5 pr-4 text-right">
                        {s.fastest.prefillOn} + {s.fastest.decodeOn}
                      </td>
                      <td className="py-2.5 pr-4 text-right">{Math.round((100 * s.fastest.seconds) / s.cpuOnly.seconds)}%</td>
                      <td className="py-2.5 text-right">
                        {s.slowest.prefillOn} + {s.slowest.decodeOn}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Note>
            Ratios and decode rates are the mean of the three cells that use each processor. A pairing is named prefill processor first, so NPU + CPU reads
            the prompt on the NPU and writes the reply on the CPU.
          </Note>
        </Section>

        <Section id="matrices" title="Matrices">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink-soft">
            <span>
              Rows: <span className="font-medium text-ink">prefill</span> processor. Columns: <span className="font-medium text-ink">decode</span> processor.
            </span>
            <span>
              Each cell: <span className="font-medium text-ink">prefill tok/s / decode tok/s</span>, then total time for the {pdTurns} turns.
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="inline-block h-3 w-3 border border-blue bg-blue/10" />
              Fastest pairing for that model.
            </span>
          </div>
          <div className="mt-10 grid gap-x-12 gap-y-12 lg:grid-cols-2">
            {pdModels.map((m) => (
              <Matrix key={`${m.name}${m.quant}`} m={m} />
            ))}
          </div>
        </Section>

        <Section id="executorch" title="ExecuTorch on the NPU" plate>
          <ul className="max-w-3xl list-disc space-y-3 pl-5 leading-7 text-ink-soft">
            <li>Qwen3 0.6B through ExecuTorch 1.5.1&apos;s QNN runner (QNN 2.39, a 2,048-token SM8850 export), the app&apos;s other runtime.</li>
            <li>NPU only: ExecuTorch cannot move a conversation between its CPU, GPU and NPU programs, so only that cell can run.</li>
            <li>
              The same 27 turns that fit its window, each run twice; 54 of 54 runs succeeded. The llama.cpp column is its NPU-only cell from the first
              session.
            </li>
          </ul>
          <div className="mt-8 overflow-x-auto" tabIndex={0} role="region" aria-label="ExecuTorch against llama.cpp, scrolls sideways on small screens">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead className="text-left text-ink-soft">
                <tr className="border-b border-rule">
                  <th className="py-2 pr-4 font-normal">Qwen3 0.6B, NPU only</th>
                  <th className="py-2 pr-4 text-right font-normal">ExecuTorch QNN (run 1 / run 2)</th>
                  <th className="py-2 text-right font-normal">llama.cpp Hexagon</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {pdExecutorch.map((r) => (
                  <tr key={r.measure} className="border-b border-rule align-top">
                    <th scope="row" className="py-2.5 pr-4 text-left font-medium">
                      {r.measure}
                    </th>
                    <td className="py-2.5 pr-4 text-right">{r.executorch}</td>
                    <td className="py-2.5 text-right">{r.llamacpp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>Different exports and quantisation, so this compares the two runtimes as shipped, not the NPU alone.</Note>
        </Section>

        <Section id="limits" title="Limits">
          <ul className="max-w-3xl list-disc space-y-3 pl-5 leading-7 text-ink-soft">
            <Item lead="One pass per cell.">A second pass of five models in a different cell order is running and will be added.</Item>
            <Item lead="Throttled.">
              Each cell waits until CPU, GPU and NPU are at or under 55 °C (up to 300 s), but most turns end with the GPU capped. The rankings describe this
              phone in its rack, not a hand-held phone.
            </Item>
            <Item lead="NPU cells include CPU work.">
              These models share their output layer with the embedding table, and llama.cpp keeps it on the CPU: about 13% of each decode step&apos;s weight
              bytes on Qwen3 4B, up to 45% on Gemma 3 1B.
            </Item>
            <Item lead="Two sessions.">The first-session and second-session models ran on two reservations of the same phone.</Item>
            <Item lead="Not measured:">an unprivileged app, cold start, prompts past 3,303 tokens, memory, energy and answer quality.</Item>
          </ul>
          <p className="mt-10 max-w-3xl text-sm leading-6 text-ink-soft">
            Source: <A href={pdLinks.report}>the report</A> (<code>docs/research/snapdragon-pd-matrix.md</code>) and{" "}
            <A href={pdLinks.results}>its results</A> (<code>tools/snapdragon/results/2026-10-24-sm8850/</code>) in the OpenWeights repository.
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
