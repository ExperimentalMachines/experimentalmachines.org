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
  pdReplyMean,
  pdSummary,
  pdTurns,
  processors,
  type PdModel,
} from "@/lib/prefill-decode";

export const metadata: Metadata = {
  title: "Prefill and decode on CPU, GPU and NPU: OpenWeights",
  description:
    "Nine models, each run through all nine pairings of the processor that reads the prompt and the one that writes the reply, in one llama.cpp build on a Snapdragon 8 Elite Gen 5, with 64-token replies; then the likeliest pairings at the conversations' own reply lengths.",
  openGraph: {
    title: "Read on the NPU. Where to write depends on the reply.",
    description: "Every prefill and decode pairing of CPU, GPU and NPU on a Snapdragon 8 Elite Gen 5, for nine models in one llama.cpp build, and the likeliest at full reply length.",
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

const n = (x: number) => Math.round(x).toLocaleString("en-US");
const f1 = (x: number) => x.toFixed(1);
// Seconds at reply length, which run past a thousand: rounded as f1 rounds, then grouped.
const s1 = (x: number) => {
  const [whole, tenth] = f1(x).split(".");
  return `${Number(whole).toLocaleString("en-US")}.${tenth} s`;
};
// A signed percentage, with a real minus sign.
const pct = (x: number) => `${x < 0 ? "−" : x > 0 ? "+" : ""}${Math.abs(x).toFixed(1)}%`;
const pairing = (p: { prefillOn: string; decodeOn: string }) => `${p.prefillOn} + ${p.decodeOn}`;
const named = ([p, d]: readonly [string, string]) => (p === d ? `${p} only` : `${p} + ${d}`);
// Decode rates to one decimal, or two where one would hide which of CPU and NPU is faster.
const rates = (xs: number[]) => {
  const dp = Math.abs(xs[0] - xs[2]) <= 0.1 ? 2 : 1;
  return xs.map((x) => x.toFixed(dp)).join(" / ");
};

const summaries = pdModels.map(pdSummary);
const shares = summaries.map((s) => Math.round((100 * s.fastest.seconds) / s.cpuOnly.seconds));
const npuVsCpu = summaries.map((s) => s.prefill[2] / s.prefill[0]);
const npuVsGpu = summaries.map((s) => s.prefill[2] / s.prefill[1]);
const range = (xs: number[]) => `${f1(Math.min(...xs))} to ${f1(Math.max(...xs))}`;

// The hero draws one model's three main pairings at both reply lengths.
const hero = pdModels.find((m) => m.name === "Qwen3 1.7B" && m.quant === "Q4_0")!;
const heroPairings = [
  { label: "NPU + CPU", short: hero.cells[2][0], long: pdReplyMean(hero, "npuCpu")! },
  { label: "NPU only", short: hero.cells[2][2], long: pdReplyMean(hero, "npuOnly")! },
  { label: "CPU only", short: hero.cells[0][0], long: pdReplyMean(hero, "cpuOnly")! },
];
const heroRows = (pick: (p: (typeof heroPairings)[number]) => number, shown: (x: number) => string) =>
  heroPairings.map((p) => ({ label: p.label, value: pick(p), shown: shown(pick(p)) })).sort((a, b) => a.value - b.value);

function Matrix({ m }: { m: PdModel }) {
  const { fastest } = pdSummary(m);
  const all = m.cells.flat().map((c) => c.seconds);
  const [lo, hi] = [Math.min(...all), Math.max(...all)];
  const fastestNow = named([fastest.prefillOn, fastest.decodeOn]);
  return (
    <div className="min-w-0 max-w-xl">
      <h3 className="display text-xl">
        {m.name} <span className="text-ink-soft">{m.quant}</span>
      </h3>
      <p className="mt-1 text-sm text-ink-soft">
        {m.session === "first" ? "First" : "Second"} session ({m.run}), {m.hexagonSessions} Hexagon session{m.hexagonSessions > 1 ? "s" : ""}
        {m.secondPass && (
          <>
            . Second pass: cells within {m.secondPass.largest}%,{" "}
            {named(m.secondPass.fastest) === fastestNow ? "same fastest" : `${named(m.secondPass.fastest)} fastest`}
          </>
        )}
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

// A pairing's time at reply length: the mean of its complete runs, which they were and how far
// apart, or how far its only run got.
function ReplyTime({ m, k }: { m: PdModel; k: "npuOnly" | "npuCpu" | "cpuOnly" }) {
  const x = pdReplyMean(m, k);
  if (!x) {
    const part = m.reply.find((r) => r[k]);
    return <span className="text-ink-soft">{part ? `cut short, ${part[k]!.turns} of ${pdTurns} turns` : "not run"}</span>;
  }
  return (
    <>
      {s1(x.seconds)}
      {x.runs.length > 1 && (
        <span className="block text-xs text-ink-soft">
          {x.runs.join(", ")}: {f1(100 * x.apart)}% apart
        </span>
      )}
    </>
  );
}

// NPU + CPU against NPU only within each reply-length run, one line per run, named where the
// model ran more than once. The mark is for cells whose cooling gates ended differently.
function ReplyAgainst({ m }: { m: PdModel }) {
  return m.reply
    .filter((r) => r.pair)
    .map((r) => {
      const p = r.pair!;
      const sameGate = r.npuCpu!.gate === r.npuOnly!.gate;
      return (
        <span key={r.run} className="block">
          {m.reply.length > 1 && <span className="text-ink-soft">{r.run} </span>}
          {pct(p.against)}
          {!sameGate && "*"}
          {p.turns !== pdTurns && <span className="text-ink-soft">, {p.turns} turns</span>}
          {p.withoutStalls !== undefined && <span className="block text-xs text-ink-soft">{pct(p.withoutStalls)} without stalls</span>}
        </span>
      );
    });
}

// The model's reply-length runs, by the report's labels, and the units they ran on.
const runsLine = (m: PdModel) => {
  const runs = m.reply.map((r) => r.run);
  if (runs.length === 1) return runs[0];
  const units = new Set(m.reply.map((r) => r.unit)).size;
  return `${runs.slice(0, -1).join(", ")} and ${runs.at(-1)}, on ${units} unit${units > 1 ? "s" : ""}`;
};

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
              Read on the NPU. Where to write depends on the reply.
            </h1>
            <p className={`${lede} mt-6 max-w-xl`}>
              On a Snapdragon 8 Elite Gen 5 the NPU read prompts {range(npuVsCpu)} times faster than the CPU, on all nine models we ran. With 64-token
              replies, reading on the NPU and writing on the CPU was the fastest of the nine pairings, at {Math.min(...shares)}% to {Math.max(...shares)}% of
              the CPU&apos;s time alone; on Qwen3 4B it ties with the NPU alone. At the conversations&apos; own reply lengths, about six times longer, the
              phone throttled and the NPU alone was faster on most of the transformers.
            </p>
            <p className="mt-4 max-w-xl leading-7 text-ink-soft">
              Each model ran through every combination of where the prompt is read (prefill) and where the reply is written (decode), in one llama.cpp
              build, on real multi-turn conversations. Measured on 24 and 25 October 2026, on phones in Qualcomm Device Cloud.
            </p>
          </div>
          <div className="self-end rounded-[1.75rem] bg-bench p-6 sm:p-8">
            <p className="mb-4 text-sm font-medium">64-token replies</p>
            <Bars rows={heroRows((p) => p.short.seconds, (x) => `${f1(x)} s`)} caption={`${hero.name} ${hero.quant}: total time for the ${pdTurns} conversation turns.`} />
            <p className="mb-4 mt-10 text-sm font-medium">The conversations&apos; own reply lengths</p>
            <Bars
              rows={heroRows((p) => p.long.seconds, s1)}
              caption="The same turns, the mean of two runs, on a scale of their own. A pairing is named prefill processor first. Shorter is faster."
            />
          </div>
        </div>
      </section>

      <Section id="findings" title="Findings" tint>
        <List>
          <Item lead="Prefill:">
            the NPU is fastest on every model, {range(npuVsCpu)} times the CPU and {range(npuVsGpu)} times the GPU.
          </Item>
          <Item lead="Decode:">
            the CPU is fastest on eight models and level with the NPU on Qwen3 4B (15.27 against 15.35 tok/s). On the transformers its lead over the NPU
            shrinks with size, from 1.27 to 1.37 times at 0.6B and 1B to 1.08 times on Llama 3.2 3B. The two LFM2.5 hybrids keep a wider lead: 1.48 times at
            1.2B, 1.34 times at 2.6B.
          </Item>
          <Item lead="Long context:">
            past 2,048 tokens of context the NPU decoded faster than the CPU on five transformers (Qwen3 4B: 12.6 against 10.6 tok/s). Four or five turns
            each, late in replay and so also the hottest: a tendency, not a rule.
          </Item>
          <Item lead="Fastest pairing at 64 tokens:">
            NPU prefill with CPU decode on all nine models, at {Math.min(...shares)}% to {Math.max(...shares)}% of CPU-only time. On Qwen3 4B it ties with
            NPU only: 0.2% ahead in the first pass, 0.3% behind in the second. On Llama 3.2 3B, NPU only is 7.4% slower. At the conversations&apos; own
            reply lengths this changes;{" "}
            <a href="#reply-length" className={link}>
              see below
            </a>
            .
          </Item>
          <Item lead="GPU:">
            never the fastest at either phase. On the two LFM2.5 hybrids it decodes faster than the NPU (46.7 against 42.7, 21.6 against 20.7 tok/s); on the
            seven transformers it decodes slowest.
          </Item>
          <Item lead="Handoff:">copying the conversation state from one processor to another took a median 0.6 to 11 ms per turn.</Item>
          <Item lead="Second pass:">
            five models ran again with every cell in another order. Each kept its slowest pairing, and the four smaller ones their fastest; cells moved a
            median 1.2% to 2.9%, at most 6.4%. Qwen3 4B&apos;s top two swapped, NPU only taking 149.6 s and NPU + CPU 150.1 s: over both passes, a tie.
          </Item>
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
                      <td className="py-3 pr-4 text-right">{f1(npuVsCpu[k])}×</td>
                      <td className="py-3 pr-4 text-right">{f1(npuVsGpu[k])}×</td>
                      <td className="py-3 pr-4 text-right">{rates(s.decode)}</td>
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
          64-token replies, first pass. Ratios and decode rates are the mean of the three cells that use each processor. A pairing is named prefill
          processor first, so NPU + CPU reads the prompt on the NPU and writes the reply on the CPU.
        </Note>
      </Section>

      <Section id="matrices" title="Every pairing, model by model">
        <p className="max-w-3xl leading-7 text-ink-soft">
          Rows are the processor that reads the prompt, columns the one that writes the reply. Each cell gives prefill and decode in tokens per second, then
          the total time for the {pdTurns} turns, with 64-token replies, in the first pass. The more cobalt a cell carries, the faster it was for that model;
          the solid cell is the fastest. Five models ran a second pass in another cell order; under each of them, the largest change in a cell&apos;s time.
        </p>
        <div className="mt-12 grid gap-x-12 gap-y-14 lg:grid-cols-2 xl:grid-cols-3">
          {pdModels.map((m) => (
            <Matrix key={`${m.name}${m.quant}`} m={m} />
          ))}
        </div>
      </Section>

      <Section id="reply-length" title="At the conversations' own reply lengths" tint>
        <List>
          <Item lead="Why:">
            every turn above writes 64 tokens. The datasets&apos; replies to those turns are about six times longer: 401 tokens median by Qwen3&apos;s
            tokenizer, up to 1,141 by Gemma&apos;s. At that length writing the reply is 84% to 99% of each pairing&apos;s time.
          </Item>
          <Item lead="Run:">
            each turn decodes its own reply&apos;s length, every step timed, in up to four pairings per model chosen from the 64-token ranking, on three
            units of the phone. The cooling gate before each cell waits, up to 120 s here (300 s for Qwen3 0.6B in r9), without cooling anything, and after the first cell the phone rarely
            got back under 55 °C in that time: 32 of the 40 cells started with the CPU&apos;s clock ceilings lowered, most of them to 1.90 and 2.23 GHz with
            the GPU capped.
          </Item>
          <Item lead="Throttled, the decoder decides, and it depends on the model.">
            Where both NPU-prefill cells started throttled, NPU + CPU took 10% to 20% longer than NPU only on Qwen3 1.7B (in two orders), its Q8_0 and Llama
            3.2 3B even without the CPU&apos;s stalls. The two tied on the two smallest transformers, and on Qwen3 4B, over its 33 turns, NPU only led only
            through the stalls. On the hybrid LFM2.5 1.2B the throttled CPU slowed but stayed ahead, and NPU + CPU won every turn; on LFM2.5 2.6B the two
            were level in one run, and in another NPU + CPU lost with the CPU&apos;s stalls and won without them. Gemma 3 1B&apos;s CPU decoded faster than
            its NPU even capped (51.5 against 46.5 tok/s on matched capped turns, one schedule).
          </Item>
          <Item lead="CPU stalls:">
            on the four models with the largest weights, Qwen3 4B, Llama 3.2 3B, Qwen3 1.7B Q8_0 and, in one of its three runs, LFM2.5 2.6B, cells decoding
            on the CPU had single steps of 0.5 to 15.9 s, 54 to 291 s per cell. Each of those cells reached about 107 °C at some turn&apos;s end (the stalled
            turns themselves ended at 94.6 to 106.6 °C); nothing recorded shows the cause. No NPU-only cell stalled, nor any cell of the five smaller models.
          </Item>
          <Item lead="When NPU + CPU started after a passed gate">
            (Qwen3 0.6B, Gemma 3 1B), it was fastest, at 75% and 76% of CPU-only time, as at 64 tokens. Qwen3 0.6B&apos;s same pairing, started throttled
            on another unit, took 87%.
          </Item>
          <Item lead="The NPU keeps its pace:">
            its 64-token decode rate predicted its time at reply length within about 5% on seven models (Qwen3 4B over the 20 turns all its cells
            completed), and where it ran more than once its totals came within 3% of each other. Cells decoding on the CPU took 3% to 61% longer than
            predicted, and their totals differed by up to 25% between runs.
          </Item>
        </List>
        <div className="mt-12">
          <Scroll label="Reply-length results per model">
            <table className="w-full min-w-[50rem] text-sm tabular-nums">
              {/* The last two columns share a heading, so they are a column group of their own. */}
              <colgroup span={4} />
              <colgroup span={2} />
              <thead>
                <tr className="align-bottom">
                  <th rowSpan={2} scope="col" className={th}>
                    Model
                  </th>
                  <th rowSpan={2} scope="col" className={thNum}>
                    NPU only
                  </th>
                  <th rowSpan={2} scope="col" className={thNum}>
                    NPU + CPU
                  </th>
                  <th rowSpan={2} scope="col" className={thNum}>
                    CPU only
                  </th>
                  <th colSpan={2} scope="colgroup" className={`${thNum} pb-1 pr-0`}>
                    NPU + CPU against NPU only
                  </th>
                </tr>
                <tr className="align-bottom">
                  <th scope="col" className={thNum}>
                    64-token replies
                  </th>
                  <th scope="col" className={`${thNum} pr-0`}>
                    Their own lengths
                  </th>
                </tr>
              </thead>
              <tbody>
                {pdModels.map((m) => (
                  <tr key={`${m.name}${m.quant}`} className="border-t border-rule align-top">
                    <th scope="row" className="py-3 pr-4 text-left font-medium">
                      {m.name} <span className="font-normal text-ink-soft">{m.quant}</span>
                      <span className="block text-xs font-normal text-ink-soft">{runsLine(m)}</span>
                    </th>
                    <td className="py-3 pr-4 text-right">
                      <ReplyTime m={m} k="npuOnly" />
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <ReplyTime m={m} k="npuCpu" />
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <ReplyTime m={m} k="cpuOnly" />
                    </td>
                    <td className="py-3 pr-4 text-right">{pct(100 * (m.cells[2][0].seconds / m.cells[2][2].seconds - 1))}</td>
                    <td className="py-3 text-right">
                      <ReplyAgainst m={m} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroll>
        </div>
        <Note>
          r8 to r11 are the report&apos;s labels for the runs, each one order on one unit. Seconds are summed over the {pdTurns} turns; where a pairing
          completed them in more than one run, they are the mean of the runs named under it, with how far apart those were. LFM2.5 2.6B&apos;s NPU only in
          r9, cut at 29 turns, is left out of its mean, and r10 has no NPU + CPU: the phone stopped answering before it finished. The last two columns
          give how much longer NPU + CPU took than NPU only (minus: less): with 64-token replies in the first pass, and at reply length within each run,
          on the turns both cells completed. * NPU + CPU started after a passed cooling gate and NPU only after a timed-out one. Matching gate results are
          not matched thermal histories either: a gate that timed out covers a range of temperatures and caps. &ldquo;Without stalls&rdquo; deletes the
          stalled steps&apos; time: it measures their share, not what the cell would have taken without whatever caused them. GPU + CPU ran on Qwen3 0.6B
          and 1.7B only, at 94% to 100% of CPU-only time.
        </Note>
      </Section>

      <Section id="executorch" title="ExecuTorch on the NPU">
        <List>
          <li>Qwen3 0.6B through ExecuTorch 1.5.1&apos;s QNN runner (QNN 2.39, a 2,048-token SM8850 export), the app&apos;s other runtime.</li>
          <li>
            NPU only: ExecuTorch cannot move a conversation between its CPU, GPU and NPU programs, so it can fill only the diagonal, and only its NPU
            cell ran here.
          </li>
          <li>
            The 27 of 33 turns whose whole history fits its window, each run twice; 54 of 54 runs succeeded. The llama.cpp column is its NPU-only cell from
            the first session.
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
        <Note>
          Same timed decode length and, on first turns, the same prompt tokens; different exports and quantisation, so this compares the two configurations
          as tested, not the runtimes in general. Same-session control: llama.cpp&apos;s NPU-only cell, rerun in the second session starting 29 minutes after
          ExecuTorch ended, gave 50.3 tok/s decode, 2,242 tok/s first-turn prefill and a 70 ms median first token on the same 27 turns, so the gap persists
          within one session.
        </Note>
      </Section>

      <Section id="method" title="How it was run" tint>
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
                The reply-length runs decode the length of the dataset&apos;s reply instead, every step timed.
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
              Android 16, root shell, on AC power in Qualcomm&apos;s rack. The 64-token runs used two reservations; the reply-length runs four more, on three
              units.
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

      <Section id="limits" title="Limits">
        <List>
          <Item lead="One or two passes.">
            At 64 tokens five models ran twice and four once. At reply length each run is one order on one unit, and three models ran more than once. The 33
            turns of a cell are not independent repeats.
          </Item>
          <Item lead="Throttled.">
            Each cell waits until CPU, GPU and NPU are at or under 55 °C (at 64 tokens up to 300 s; 12 of the first pass&apos;s 81 cells and 6 of the
            second&apos;s 45 started without passing), but most
            turns end with the GPU capped or a CPU ceiling lowered, and at reply length 32 of the 40 cells started with the CPU&apos;s ceilings lowered. The
            rankings describe this phone in its rack, not a hand-held phone.
          </Item>
          <Item lead="NPU cells include CPU work.">
            These models share their output layer with the embedding table, and llama.cpp keeps it on the CPU: about 13% of each decode step&apos;s weight
            bytes on Qwen3 4B, up to 45% on Gemma 3 1B.
          </Item>
          <Item lead="Six reservations.">
            The 64-token runs used two reservations of the same phone and the reply-length runs four more, on three units. Unit, order and heat were not
            varied apart.
          </Item>
          <Item lead="Not measured:">
            an unprivileged app, cold start, prompts past 3,303 tokens, memory, energy and answer quality; at reply length, GPU decode, CPU or GPU prefill
            into NPU decode, and GPU prefill on any model but Qwen3 0.6B and 1.7B.
          </Item>
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
