import type { Metadata } from "next";
import Bars from "@/components/home/Bars";
import Go from "@/components/home/Go";
import { h2, lede, link } from "@/components/home/ui";
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
    title: "Read on the NPU, write on the CPU",
    description: "Every prefill and decode pairing of CPU, GPU and NPU on a Snapdragon 8 Elite Gen 5, for nine models in one llama.cpp build.",
    url: "/openweights/prefill-decode/",
  },
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

const Note = ({ children }: { children: React.ReactNode }) => <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-soft">{children}</p>;

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

const n = (x: number) => x.toLocaleString("en-US");
const f1 = (x: number) => x.toFixed(1);
const pairing = (p: { prefillOn: string; decodeOn: string }) => `${p.prefillOn} + ${p.decodeOn}`;

const summaries = pdModels.map(pdSummary);
const shares = summaries.map((s) => Math.round((100 * s.fastest.seconds) / s.cpuOnly.seconds));

// The hero draws one model's nine pairings, fastest first.
const hero = pdModels.find((m) => m.name === "Qwen3 1.7B" && m.quant === "Q4_0")!;
const heroRows = hero.cells
  .flatMap((row, i) => row.map((c, j) => ({ label: `${processors[i]} + ${processors[j]}`, value: c.seconds, shown: `${f1(c.seconds)} s` })))
  .sort((a, b) => a.value - b.value);

function Matrix({ m }: { m: PdModel }) {
  const { fastest } = pdSummary(m);
  const all = m.cells.flat().map((c) => c.seconds);
  const [lo, hi] = [Math.min(...all), Math.max(...all)];
  return (
    <div className="min-w-0 max-w-xl">
      <h3 className="display text-xl">
        {m.name} <span className="text-ink-soft">{m.quant}</span>
      </h3>
      <p className="mt-1 text-sm text-ink-soft">
        {m.session === "first" ? "First" : "Second"} session ({m.run}), {m.hexagonSessions} Hexagon session{m.hexagonSessions > 1 ? "s" : ""}
      </p>
      <div className="mt-4">
        <Scroll label={`${m.name} ${m.quant} matrix`}>
          <table className="w-full min-w-[19rem] table-fixed border-separate border-spacing-1 text-[13px] tabular-nums sm:text-sm">
            <thead>
              <tr>
                <th className="w-[19%] pb-1 text-left align-bottom text-[0.7rem] font-normal leading-4 text-ink-soft">
                  prefill <span aria-hidden>↓</span>
                  <br />
                  decode <span aria-hidden>→</span>
                </th>
                {processors.map((p) => (
                  <th key={p} scope="col" className="pb-1 text-left text-xs font-medium">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.cells.map((row, i) => (
                <tr key={processors[i]}>
                  <th scope="row" className="text-left text-xs font-medium">
                    {processors[i]}
                  </th>
                  {row.map((c, j) => {
                    const best = fastest.prefillOn === processors[i] && fastest.decodeOn === processors[j];
                    // Faster cells carry more of the cobalt; the fastest is solid.
                    const t = hi === lo ? 1 : (hi - c.seconds) / (hi - lo);
                    return (
                      <td
                        key={processors[j]}
                        className={`rounded-md px-1.5 py-2 align-top sm:px-2 ${best ? "bg-blue text-white" : ""}`}
                        style={best ? undefined : { backgroundColor: `color-mix(in srgb, var(--color-blue) ${Math.round(4 + 20 * t)}%, white)` }}
                      >
                        <span className="block whitespace-nowrap">
                          {n(c.prefill)} <span className={best ? "text-white/70" : "text-ink-soft"}>/</span> {f1(c.decode)}
                        </span>
                        <span className={`block text-xs ${best ? "text-white/85" : "text-ink-soft"}`}>
                          {f1(c.seconds)} s{best && <span className="sr-only">, the fastest pairing</span>}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Scroll>
      </div>
    </div>
  );
}

export default function PrefillDecode() {
  return (
    <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
      <section id="top">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
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
            <h1 className="display mt-8 text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">
              Read on the NPU, write on the CPU.
            </h1>
            <p className={`${lede} mt-6 max-w-xl`}>
              On a Snapdragon 8 Elite Gen 5, reading the prompt on the NPU and writing the reply on the CPU was the fastest of the nine pairings for every model we
              ran, taking {Math.min(...shares)}% to {Math.max(...shares)}% of the time the CPU takes alone. On Qwen3 4B it ties
              with the NPU alone.
            </p>
            <p className="mt-4 max-w-xl leading-7 text-ink-soft">
              Each model ran through every combination of where the prompt is read (prefill) and where the reply is written (decode), in one llama.cpp
              build, on real multi-turn conversations. Measured on 24 October 2026, on a phone in Qualcomm Device Cloud.
            </p>
          </div>
          <div className="self-end rounded-[1.75rem] bg-bench p-6 sm:p-8">
            <Bars
              rows={heroRows}
              caption={`${hero.name} ${hero.quant}: total time for ${pdTurns} conversation turns in each pairing, prefill processor first. Shorter is faster.`}
            />
          </div>
        </div>
      </section>

      <Section id="findings" title="Findings" tint>
        <List>
          <Item lead="Prefill:">the NPU is fastest on every model, 10.5 to 15.8 times the CPU and 5.1 to 8.2 times the GPU.</Item>
          <Item lead="Decode:">
            the CPU is fastest on eight models and level with the NPU on Qwen3 4B (15.3 against 15.4 tok/s). On the transformers its lead over the NPU shrinks
            with size, from 1.27 to 1.37 times at 0.6B and 1B to 1.08 times on Llama 3.2 3B. The two LFM2.5 hybrids keep a wider lead: 1.48 times at 1.2B,
            1.34 times at 2.6B.
          </Item>
          <Item lead="Fastest pairing:">
            NPU prefill with CPU decode on all nine models, at 41% to 52% of CPU-only time. On Qwen3 4B it ties with NPU only (149.5 s against 149.9 s).
          </Item>
          <Item lead="GPU:">
            never the fastest at either phase. On the two LFM2.5 hybrids it decodes faster than the NPU (46.7 against 42.7, 21.6 against 20.7 tok/s); on the
            seven transformers it decodes slowest.
          </Item>
          <Item lead="Handoff:">copying the conversation state from one processor to another took a median 0.6 to 11 ms per turn.</Item>
        </List>
        <div className="mt-12">
          <Scroll label="Findings per model">
            <table className="w-full min-w-[52rem] text-sm tabular-nums">
              <thead>
                <tr className="align-bottom">
                  <th className={th}>Model</th>
                  <th className={thNum}>NPU prefill vs CPU</th>
                  <th className={thNum}>NPU prefill vs GPU</th>
                  <th className={thNum}>Decode tok/s, CPU / GPU / NPU</th>
                  <th className={thNum}>Fastest</th>
                  <th className={thNum}>Fastest vs CPU only</th>
                  <th className={`${thNum} pr-0`}>Slowest</th>
                </tr>
              </thead>
              <tbody>
                {pdModels.map((m, k) => {
                  const s = summaries[k];
                  return (
                    <tr key={`${m.name}${m.quant}`} className="border-t border-rule">
                      <th scope="row" className="py-3 pr-4 text-left font-medium">
                        {m.name} <span className="font-normal text-ink-soft">{m.quant}</span>
                      </th>
                      <td className="py-3 pr-4 text-right">{f1(s.prefill[2] / s.prefill[0])}×</td>
                      <td className="py-3 pr-4 text-right">{f1(s.prefill[2] / s.prefill[1])}×</td>
                      <td className="py-3 pr-4 text-right">{s.decode.map(f1).join(" / ")}</td>
                      <td className="py-3 pr-4 text-right font-medium text-blue-deep">{pairing(s.fastest)}</td>
                      <td className="py-3 pr-4 text-right">{shares[k]}%</td>
                      <td className="py-3 text-right">{pairing(s.slowest)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Scroll>
        </div>
        <Note>
          Ratios and decode rates are the mean of the three cells that use each processor. A pairing is named prefill processor first, so NPU + CPU reads the
          prompt on the NPU and writes the reply on the CPU.
        </Note>
      </Section>

      <Section id="matrices" title="Every pairing, model by model">
        <p className="max-w-3xl leading-7 text-ink-soft">
          Rows are the processor that reads the prompt, columns the one that writes the reply. Each cell gives prefill and decode in tokens per second, then
          the total time for the {pdTurns} turns. The more cobalt a cell carries, the faster it was for that model; the solid cell is the fastest.
        </p>
        <div className="mt-12 grid gap-x-12 gap-y-14 lg:grid-cols-2 xl:grid-cols-3">
          {pdModels.map((m) => (
            <Matrix key={`${m.name}${m.quant}`} m={m} />
          ))}
        </div>
      </Section>

      <Section id="executorch" title="ExecuTorch on the NPU" tint>
        <List>
          <li>Qwen3 0.6B through ExecuTorch 1.5.1&apos;s QNN runner (QNN 2.39, a 2,048-token SM8850 export), the app&apos;s other runtime.</li>
          <li>NPU only: ExecuTorch cannot move a conversation between its CPU, GPU and NPU programs, so only that cell can run.</li>
          <li>
            The same 27 turns that fit its window, each run twice; 54 of 54 runs succeeded. The llama.cpp column is its NPU-only cell from the first session.
          </li>
        </List>
        <div className="mt-12">
          <Scroll label="ExecuTorch against llama.cpp">
            <table className="w-full min-w-[40rem] text-sm tabular-nums">
              <thead>
                <tr className="align-bottom">
                  <th className={th}>Qwen3 0.6B, NPU only</th>
                  <th className={thNum}>ExecuTorch QNN (run 1 / run 2)</th>
                  <th className={`${thNum} pr-0`}>llama.cpp Hexagon</th>
                </tr>
              </thead>
              <tbody>
                {pdExecutorch.map((r) => (
                  <tr key={r.measure} className="border-t border-rule">
                    <th scope="row" className="py-3 pr-4 text-left font-medium">
                      {r.measure}
                    </th>
                    <td className="py-3 pr-4 text-right">{r.executorch}</td>
                    <td className="py-3 text-right">{r.llamacpp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroll>
        </div>
        <Note>Different exports and quantisation, so this compares the two runtimes as shipped, not the NPU alone.</Note>
      </Section>

      <Section id="method" title="How it was run">
        <div className="grid gap-16 lg:grid-cols-2">
          <div className="min-w-0">
            <h3 className="display text-2xl">The conversations</h3>
            <ul className="mt-5 list-disc space-y-3 pl-5 leading-7 text-ink-soft marker:text-ink/30">
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
            <div className="mt-8">
              <Scroll label="Conversations">
                <table className="w-full min-w-[36rem] text-sm tabular-nums">
                  <thead>
                    <tr className="align-bottom">
                      <th className={th}>Conversation</th>
                      <th className={th}>Length</th>
                      <th className={thNum}>Characters</th>
                      <th className={thNum}>Turns replayed</th>
                      <th className={thNum}>New tokens per turn</th>
                      <th className={`${thNum} pr-0`}>Context at last turn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pdConversations.map((c) => (
                      <tr key={`${c.set}${c.index}`} className="border-t border-rule">
                        <td className="py-3 pr-4">
                          {c.set} #{c.index}
                        </td>
                        <td className="py-3 pr-4 text-ink-soft">{c.length}</td>
                        <td className="py-3 pr-4 text-right">{n(c.characters)}</td>
                        <td className="py-3 pr-4 text-right">{c.turns}</td>
                        <td className="py-3 pr-4 text-right">
                          {n(c.newTokens[0])} to {n(c.newTokens[1])}
                        </td>
                        <td className="py-3 text-right">{n(c.context)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Scroll>
            </div>
            <Note>{pdTurns} turns in all. Token counts are from Qwen3&apos;s tokenizer; other models tokenize slightly differently.</Note>
          </div>

          <div className="min-w-0">
            <h3 className="display text-2xl">The phone</h3>
            <p className="mt-5 leading-7 text-ink-soft">
              <span className="font-medium text-ink">Snapdragon 8 Elite Gen 5</span> (SM8850, board <code className="text-ink">canoe</code>), 23 GB RAM,
              Android 16, root shell, on AC power in Qualcomm&apos;s rack.
            </p>
            <h4 className="mt-8 font-medium">CPU: Qualcomm Oryon, 8 cores in two clusters</h4>
            <div className="mt-3">
              <Scroll label="CPU clusters">
                <table className="w-full min-w-[22rem] text-sm tabular-nums">
                  <thead>
                    <tr className="align-bottom">
                      <th className={th}>Cores</th>
                      <th className={th}>Type</th>
                      <th className={thNum}>Max clock</th>
                      <th className={`${thNum} pr-0`}>Min clock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pdPhone.cores.map((c) => (
                      <tr key={c.cores} className="border-t border-rule">
                        <td className="py-3 pr-4">{c.cores}</td>
                        <td className="py-3 pr-4">{c.type}</td>
                        <td className="py-3 pr-4 text-right">{c.max}</td>
                        <td className="py-3 text-right">{c.min}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Scroll>
            </div>
            <Note>All eight report implementer 0x51 (Qualcomm), part 0x002. No efficiency cores. The benchmark used 6 threads.</Note>
            <h4 className="mt-8 font-medium">GPU, NPU and runtime</h4>
            <dl className="mt-3 text-sm leading-6">
              {[
                ["GPU", pdPhone.gpu],
                ["NPU", pdPhone.npu],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[5.5rem_1fr] gap-4 border-t border-rule py-3">
                  <dt className="text-ink-soft">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <div className="grid grid-cols-[5.5rem_1fr] gap-4 border-t border-rule py-3">
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

      <Section id="limits" title="Limits" tint>
        <List>
          <Item lead="One pass per cell.">A second pass of five models in a different cell order is running and will be added.</Item>
          <Item lead="Throttled.">
            Each cell waits until CPU, GPU and NPU are at or under 55 °C (up to 300 s), but most turns end with the GPU capped. The rankings describe this phone
            in its rack, not a hand-held phone.
          </Item>
          <Item lead="NPU cells include CPU work.">
            These models share their output layer with the embedding table, and llama.cpp keeps it on the CPU: about 13% of each decode step&apos;s weight
            bytes on Qwen3 4B, up to 45% on Gemma 3 1B.
          </Item>
          <Item lead="Two sessions.">The first-session and second-session models ran on two reservations of the same phone.</Item>
          <Item lead="Not measured:">an unprivileged app, cold start, prompts past 3,303 tokens, memory, energy and answer quality.</Item>
        </List>
        <p className="mt-12 max-w-3xl text-sm leading-6 text-ink-soft">
          Source: <Go href={pdLinks.report} className={link}>the report</Go> (<code>docs/research/snapdragon-pd-matrix.md</code>) and{" "}
          <Go href={pdLinks.results} className={link}>its results</Go> (<code>tools/snapdragon/results/2026-10-24-sm8850/</code>) in the OpenWeights
          repository.
        </p>
      </Section>
    </main>
  );
}
