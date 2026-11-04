import type { Metadata } from "next";
import Go from "@/components/home/Go";
import { h2, lede, link } from "@/components/home/ui";
import PairingViews from "@/components/openweights/PairingViews";
import { Item, List, Note, Scroll, Sub, grouped, label, slower, td, th, thNum } from "@/components/openweights/pd-parts";
import {
  name,
  pairs,
  pdGate,
  pdLinks,
  pdModels,
  pdNewTokens,
  pdPhone,
  pdReplyTokens,
  pdSensors,
  pdSpread,
  pdStall,
  pdStuck,
  pdThermal,
  pdThrottle,
  pdTrigger,
  pdTurns,
  pdWarm,
  processors,
  ranked,
  type PdModel,
} from "@/lib/prefill-decode";

export const metadata: Metadata = {
  title: "Prefill and decode on CPU, GPU and NPU: OpenWeights",
  description:
    "Nine models on a warm Snapdragon 8 Elite Gen 5, each through every pairing of the processor that does prefill and the one that does decode, at the conversations' own reply lengths, with the phone's throttling measured beside them.",
  openGraph: {
    title: "Prefill on the NPU. Decode anywhere but the GPU.",
    description:
      "Every prefill and decode pairing of CPU, GPU and NPU on a warm Snapdragon 8 Elite Gen 5, for nine models in one llama.cpp build: one matrix per model.",
    url: "/research/prefill-decode/",
  },
};

function Section({ id, title, tint, children }: { id: string; title: string; tint?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-28 lg:scroll-mt-16 ${tint ? "bg-bench" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className={h2}>{title}</h2>
        <div className="mt-10 space-y-12">{children}</div>
      </div>
    </section>
  );
}

// A plain table: a header row, then rows whose first cell names the row.
function Table({ label, head, rows, min = "36rem" }: { label: string; head: string[]; rows: React.ReactNode[][]; min?: string }) {
  return (
    <div className="max-w-4xl">
      <Scroll label={label}>
        <table className="w-full text-sm leading-6" style={{ minWidth: min }}>
          <thead>
            <tr className="align-bottom">
              {head.map((h, i) => (
                <th key={i} className={`pb-3 text-left text-xs font-normal text-ink-soft ${i < head.length - 1 ? "pr-4" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, k) => (
              <tr key={k} className="border-t border-rule align-top">
                {r.map((c, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="py-3 pr-4 text-left font-medium">
                      {c}
                    </th>
                  ) : (
                    <td key={i} className={`py-3 text-ink-soft ${i < r.length - 1 ? "pr-4" : ""}`}>
                      {c}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Scroll>
    </div>
  );
}

const short = (m: PdModel) => `${m.name}${m.quant === "Q8_0" ? " Q8_0" : ""}`;
const range = (xs: number[], d = 1) => `${Math.min(...xs).toFixed(d)} to ${Math.max(...xs).toFixed(d)}`;
const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

const best = pdModels.map((m) => ranked(m));
const npuPrefillFastest = best.filter((r) => r[0].prefill === "NPU").length;
const gpuDecodeFastest = best.filter((r) => r[0].decode === "GPU").length;
const npuVsCpu = pdModels.map((m) => m.prefill[2].tokS / m.prefill[0].tokS);
const npuVsGpu = pdModels.map((m) => m.prefill[2].tokS / m.prefill[1].tokS);
const npuFirst = pdModels.map((m) => m.prefill[2].firstTokenMs);
const cpuFirst = pdModels.map((m) => m.prefill[0].firstTokenMs / 1000);
const coolCells = pdModels.flatMap((m) =>
  pairs(m)
    .filter((p) => p.cell.coolStart)
    .map((p) => ({ m, p })),
);
const shares = pdModels.flatMap((m) =>
  pairs(m)
    .filter((p) => !p.cell.coolStart)
    .map((p) => 100 * p.cell.decodeShare),
);
const cpuStep = pdModels.map((m) => m.cpuStepMs);

// The GPU's pooled decode rate against the slower of the other two, in percent below it; within 5%
// is called level.
const gpuGap = (m: PdModel) => 100 * (1 - m.decode[1].tokS / Math.min(m.decode[0].tokS, m.decode[2].tokS));
const gpuSlowest = pdModels.filter((m) => gpuGap(m) >= 5);
const gpuLevel = pdModels.filter((m) => gpuGap(m) < 5);

// Which processor decoded in each model's fastest pairing, and where the next pairing with the same
// prefill is within 1%.
const writers = best.map((r, k) => {
  const [a, b] = r;
  const tie = b.prefill === a.prefill && b.cell.seconds / a.cell.seconds < 1.01;
  return { model: pdModels[k], decode: a.decode, tie, gap: 100 * (b.cell.seconds / a.cell.seconds - 1) };
});

// Every compared pairing in which CPU decode got stuck, model by model.
const stops = pdModels.flatMap((m) =>
  pairs(m)
    .filter((p) => !p.cell.coolStart && p.cell.frozenSeconds > 0)
    .map((p) => ({ m, p })),
);
const stuckShares = stops.map(({ p }) => (100 * p.cell.frozenSeconds) / p.cell.seconds);
const pct = (x: number) => (x < 0.5 ? "under 1%" : `${Math.round(x)}%`);

// If a fix won back the same share of stuck time in every pairing, would a model's fastest change?
const couldFlip = pdModels.flatMap((m, k) => {
  const top = best[k][0];
  const same = (p: { prefill: string; decode: string }) => p.prefill === top.prefill && p.decode === top.decode;
  const need = pairs(m)
    .filter((p) => !p.cell.coolStart && !same(p) && p.cell.frozenSeconds > top.cell.frozenSeconds)
    .map((p) => ({
      p,
      share: (p.cell.seconds - top.cell.seconds) / (p.cell.frozenSeconds - top.cell.frozenSeconds),
    }))
    .filter((x) => x.share < 1)
    .sort((a, b) => a.share - b.share);
  return need.length ? [{ m, ...need[0] }] : [];
});

export default function PrefillDecode() {
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
            Prefill on the NPU. Decode anywhere but the GPU.
          </h1>
          <p className={`${lede} mt-6 max-w-2xl`}>
            Nine models on a {pdPhone.soc}. Each ran every pairing of the processor that does prefill and the one that does decode, and every pairing
            started with the phone warm. The phone throttles itself as it heats, so we measured that too.
          </p>
          <ul className="mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
            {[
              [`${npuPrefillFastest} of ${pdModels.length}`, "models were fastest with NPU prefill"],
              [`${gpuDecodeFastest} of ${pdModels.length}`, "models were fastest with GPU decode"],
              [`Up to ${Math.round(Math.max(...stuckShares))}%`, "of a CPU-decode pairing's time went to decode steps that took over half a second"],
            ].map(([big, small]) => (
              <li key={small} className="border-t-2 border-blue pt-4">
                <p className="display text-3xl">{big}</p>
                <p className="mt-1 leading-6 text-ink-soft">{small}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Section id="findings" title="What we found" tint>
        <List>
          <Item lead="Prefill: the NPU, on every model.">
            {range(npuVsCpu)} times as fast as the CPU and {range(npuVsGpu)} times as fast as the GPU. The first token came after a median{" "}
            {Math.round(Math.min(...npuFirst))} to {Math.round(Math.max(...npuFirst))} ms, against {range(cpuFirst)} s on the CPU.
          </Item>
          <Item lead="Decode: the NPU or the CPU, depending on the model.">
            The NPU decoded in the fastest pairing of {writers.filter((w) => w.decode === "NPU" && !w.tie).length} models and the CPU in{" "}
            {andList(writers.filter((w) => w.decode === "CPU" && !w.tie).map((w) => short(w.model)))}. On{" "}
            {andList(writers.filter((w) => w.tie).map((w) => short(w.model)))}, NPU prefill with CPU decode and with NPU decode finished within{" "}
            {andList(writers.filter((w) => w.tie).map((w) => `${w.gap.toFixed(1)}%`))} of each other.
          </Item>
          <Item lead="The GPU: never in the fastest pairing.">
            It was the slowest decoder on {gpuSlowest.length} models and within {andList(gpuLevel.map((m) => `${gpuGap(m).toFixed(1)}%`))} of the CPU
            on {andList(gpuLevel.map(short))}. On Qwen3 4B its median decode step rose from {pdThermal.gpuStep4b.before} ms at 1,024 to 1,535 tokens
            of context to {pdThermal.gpuStep4b.after} ms at 2,048 to 2,559.
          </Item>
          <Item lead="Decode is most of the wait.">
            The replies run {pdReplyTokens.median} tokens at the median, and decode took {Math.floor(Math.min(...shares))}% to over{" "}
            {Math.floor(Math.max(...shares))}% of each pairing&apos;s time, so the decoder decides more than the prefill processor.
          </Item>
          <Item lead="Heat shapes the results.">
            The phone throttles itself in two steps as it heats. Every pairing compared ran under the first; the second comes and goes, and CPU decode
            gets stuck while it is on. Both are described under{" "}
            <a href="#heat" className={link}>
              Heat
            </a>
            , below.
          </Item>
        </List>
        <div>
          <Sub>The fastest pairing for each model</Sub>
          <Scroll label="The fastest pairing for each model">
            <table className="w-full min-w-[44rem] text-sm tabular-nums">
              <thead>
                <tr className="align-bottom">
                  <th className={th}>Model</th>
                  <th className={th}>Fastest</th>
                  <th className={thNum}>Its time</th>
                  <th className={thNum}>Next best</th>
                  <th className={thNum}>CPU only</th>
                  <th className={`${thNum} pr-0`}>Slowest</th>
                </tr>
              </thead>
              <tbody>
                {pdModels.map((m, k) => {
                  const r = best[k];
                  const top = r[0].cell.seconds;
                  const cpu = m.cells[0][0];
                  const last = r.at(-1)!;
                  return (
                    <tr key={`${m.name}${m.quant}`} className="border-t border-rule align-top">
                      <th scope="row" className="py-3 pr-4 text-left font-medium">
                        {label(m)}
                      </th>
                      <td className="py-3 pr-4 font-medium text-blue-deep">{name(r[0])}</td>
                      <td className={td}>{grouped(top)} s</td>
                      <td className={td}>
                        {name(r[1])}, {slower(r[1].cell.seconds, top)}
                      </td>
                      <td className={td}>{slower(cpu.seconds, top)}</td>
                      <td className="py-3 text-right">
                        {name(last)}, {slower(last.cell.seconds, top)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Scroll>
          <Note>
            CPU → NPU means prefill on the CPU, decode on the NPU. Times are the total for the same {pdTurns} conversation turns; percentages are how
            much longer than the fastest.
            {coolCells.length > 0 && ` ${andList(coolCells.map(({ m, p }) => `${short(m)}'s ${name(p)}`))}, which started cool, is left out.`}
          </Note>
        </div>
      </Section>

      <Section id="matrices" title="Every pairing, model by model">
        {/* The rates section used to have its own anchor; links to it land here. */}
        <div id="processors" className="scroll-mt-28 lg:scroll-mt-16">
          <PairingViews />
        </div>
      </Section>

      <Section id="method" title="How it was run" tint>
        <List>
          <Item lead="Phones:">
            four {pdPhone.soc} phones of the same kind (A to D), Android 16, root shell, on AC power in Qualcomm Device Cloud&apos;s rack,{" "}
            {pdPhone.dates}. Each model ran all nine of its pairings on one phone, in one run, except Qwen3 4B&apos;s GPU → CPU, run again on phone D
            because it had started cool.
          </Item>
          <Item lead="Runtime:">
            llama.cpp {pdPhone.llamacpp} with its CPU, OpenCL (GPU) and Hexagon (NPU) backends in one process. When prefill and decode run on
            different processors, the conversation state is copied across every turn. The CPU used 6 threads.
          </Item>
          <Item lead="Models:">
            Qwen3 0.6B, 1.7B and 4B; Gemma 3 1B; Llama 3.2 1B and 3B; LFM2.5 1.2B and 2.6B. All in Q4_0, the 4-bit format all three backends speed up,
            and Qwen3 1.7B also in Q8_0, an 8-bit format. The LFM2.5 models are hybrids, mixing attention with other layer types, in Liquid AI&apos;s
            own Q4_0 builds.
          </Item>
          <Item lead="Conversations:">
            nine from WildChat-1M, UltraChat 200k and Daring-Anteater, {pdTurns} turns in all. Each turn&apos;s prefill covers only its new tokens,{" "}
            {pdNewTokens[0]} to {grouped(pdNewTokens[1])} depending on the model; earlier turns are already in the cache.
          </Item>
          <Item lead="Same work in every pairing:">
            each turn decodes as many tokens as the dataset&apos;s own reply has ({pdReplyTokens.median} at the median, up to{" "}
            {grouped(pdReplyTokens.max)}, counted by Qwen3), and the next turn continues from the dataset&apos;s history, not from what the model
            wrote. So all nine pairings do exactly the same amount of work, even where their outputs differ.
          </Item>
        </List>
      </Section>

      <Section id="heat" title="Heat: what we read and what the phone does">
        <div>
          <Sub>What we read</Sub>
          <Table
            label="What we read"
            head={["Reading", "What it is", "What it tells us"]}
            rows={pdSensors.map((s) => [s.sensor, s.what, s.use])}
            min="40rem"
          />
          <div className="mt-4 max-w-3xl text-sm leading-6 text-ink-soft [&_code]:text-[0.9em]">
            <p>In the phone&apos;s own names:</p>
            <ul className="mt-1 list-disc pl-5">
              <li>
                CPU: temperature zones <code>cpu-0-*</code> and <code>cpu-1-*</code>, clock ceiling <code>scaling_max_freq</code>, core pauses{" "}
                <code>thermal-pause-C0</code> and <code>thermal-pause-3C</code>
              </li>
              <li>
                GPU: temperature zones <code>gpuss-*</code>, clock cap <code>thermal_pwrlevel</code>, further slowdown <code>kgsl</code>
              </li>
              <li>
                NPU: temperature zones <code>nsphvx-*</code> and <code>nsphmx-*</code>, slowdown <code>cdsp</code>
              </li>
              <li>
                Board: the XO thermistor <code>sys-therm-0</code>, named <code>pmk8850_xo_therm</code> in the device tree
              </li>
            </ul>
          </div>
        </div>

        <div>
          <Sub>Warming up and cooling down, as observed</Sub>
          <Table
            label="Warming up and cooling down, as observed"
            head={["Stage", "What the phone does", "Temperature"]}
            min="44rem"
            rows={[
              ["Idle", "No caps on the CPU or GPU", "Hottest processor 40 to 55 °C"],
              [
                "Within 1 to 7 minutes of heavy work",
                "Soft throttle on: CPU and GPU clocks capped at about half. It can flicker on and off before it settles",
                "No single trigger found: the CPU's sensors read anywhere from about 70 to 105 °C when it appeared",
              ],
              [
                "Warm",
                "Soft throttle stays on. Every pairing compared here started in this state",
                `Hottest processor ${Math.round(pdWarm.gateC[0])} to ${Math.round(pdWarm.gateC[1])} °C as each pairing started; the CPU up to ${Math.round(pdWarm.maxC.cpu)} °C during`,
              ],
              [
                "Hard throttle on",
                "CPU cores paused, GPU and NPU slowed further, on top of the soft throttle",
                `XO thermistor reaches ${pdTrigger.onC} °C`,
              ],
              ["Hard throttle off, usually about a minute later", "Back to the soft throttle", `XO thermistor below ${pdTrigger.offC} °C`],
              ["Idle again", "Soft throttle off within about 10 minutes, the one time this was timed", ""],
            ]}
          />
          <List>
            <li>
              Between {pdTrigger.offC} and {pdTrigger.onC} °C the hard throttle stays as it was: on if the sensor last reached {pdTrigger.onC} °C, off
              if it last fell below {pdTrigger.offC} °C. The gap keeps it from flickering.
            </li>
            <li>
              The processors share heat: with only the CPU working, the NPU&apos;s sensors read {pdSpread.cpuOnlyNpuC} °C; with the NPU doing nearly
              all the work, the CPU&apos;s read {pdSpread.npuOnlyCpuC} °C (Llama 3.2 3B). The XO thermistor warms whichever processor works, so the
              hard throttle hits all three.
            </li>
          </List>
        </div>

        <div>
          <Sub>How each processor is throttled</Sub>
          <Table
            label="How each processor is throttled"
            head={["", "Soft throttle", "Hard throttle"]}
            min="48rem"
            rows={processors.map((k) => [
              k,
              <>
                <span className="text-ink">{pdThrottle.soft[k].what}</span>
                <span className="mt-1 block">{pdThrottle.soft[k].seen}</span>
              </>,
              <>
                <span className="text-ink">{pdThrottle.hard[k].what}</span>
                <span className="mt-1 block">
                  {k === "CPU"
                    ? `Decode stuck: ${pdStuck.tokensPerMinute[0]} to ${pdStuck.tokensPerMinute[1]} tokens a minute, single steps up to ${Math.round(pdStuck.tokenSeconds[1])} s`
                    : pdThrottle.hard[k].seen}
                </span>
              </>,
            ])}
          />
          <Note>
            The soft throttle&apos;s CPU and GPU figures compare the same 9 turns of Qwen3 4B on one phone, once with nothing capped and once capped.
            The NPU&apos;s hard-throttle figures compare the same turns run with and without it: two thirds on Qwen3 4B and Llama 3.2 3B, about half
            on Qwen3 1.7B.
          </Note>
        </div>

        <div>
          <Sub>What this means for the comparison</Sub>
          <List>
            <Item lead="Every pairing compared started warm.">
              Before each pairing the benchmark waited, checking every {pdGate.pollS} seconds for up to {pdGate.maxS / 60} minutes, for all three
              processors to read {pdGate.limitC} °C or less and the soft throttle to lift. If they did, the pairing started cool; if time ran out, it
              started warm. Only warm starts are compared. At every compared turn&apos;s start and end the GPU cap read 578 MHz, and the CPU ceilings
              read 1.90 and 2.23 GHz on {grouped(pdWarm.cpuCeilingTurns)} of {grouped(pdWarm.turns)} turns (lower still on the rest).
            </Item>
            <Item lead="Cool starts were run again.">
              After the phone sits idle, a run&apos;s first pairings can start cool. LFM2.5 1.2B and Qwen3 1.7B were run again, all nine pairings,
              after a throwaway warm-up pass of the model on the CPU. Qwen3 4B&apos;s GPU → CPU was run again on its own, warm, on a fourth phone (D);
              its matrices mark that cell with a D instead of the order it ran in.
              {coolCells.length > 0 &&
                ` ${andList(coolCells.map(({ m, p }) => `${short(m)}'s ${name(p)}`))} started cool; it is shown with a dashed border and not compared.`}
            </Item>
            <Item lead="Order still matters.">
              Each pairing inherits the heat of the ones before it, and the hard throttle lands on whichever pairing is running: CPU decode gets
              stuck, NPU decode slows. So the total-time matrices show the order each model&apos;s pairings ran in, and these are the results of one
              shuffled order. Small gaps, such as LFM2.5 2.6B&apos;s 0.4%, are within that.
            </Item>
            <Item lead="Compare within a model.">
              Models ran on different phones and do different work per token, so seconds do not compare across models.
            </Item>
          </List>
        </div>
      </Section>

      <section id="stuck" className="scroll-mt-28 bg-bench lg:scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <details className="group max-w-4xl">
            <summary className="flex cursor-pointer list-none items-start gap-4 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue [&::-webkit-details-marker]:hidden">
              <span aria-hidden className="mt-2 text-2xl text-blue transition-transform group-open:rotate-90">
                ▸
              </span>
              <span>
                <h2 className={h2}>When CPU decode gets stuck</h2>
                <span className="mt-3 block leading-7 text-ink-soft">
                  What happens during the hard throttle, what it cost each pairing, why we think it happens, whether the OpenWeights app hits it, and
                  what could fix it.
                </span>
              </span>
            </summary>

            <div className="mt-12 space-y-14">
              <div>
                <Sub>What happens</Sub>
                <List>
                  <li>
                    The models&apos; median CPU decode steps took {Math.min(...cpuStep)} to {Math.max(...cpuStep)} ms. We call a step stuck when it
                    takes over half a second.
                  </li>
                  <li>
                    {pdStuck.turns} of the CPU-decode turns got stuck.{" "}
                    {pdStuck.single.length > 0
                      ? `In ${pdStuck.turns - pdStuck.single.length} of them decode crawled through one unbroken stretch`
                      : "In each, decode crawled through one unbroken stretch"}{" "}
                    of {Math.round(pdStuck.stretchSeconds[0])} to {Math.round(pdStuck.stretchSeconds[1])} seconds, producing{" "}
                    {pdStuck.tokensInStretch[0]} to {pdStuck.tokensInStretch[1]} tokens (single steps up to {Math.round(pdStuck.tokenSeconds[1])} s),
                    then went back to normal.
                    {pdStuck.single.length > 0 && ` The other had one slow step of ${pdStuck.single.join(" and ")} s.`}
                  </li>
                  <li>No NPU decode step took over half a second, and the GPU&apos;s slow steps late in long conversations are its normal pace.</li>
                </List>
                <Scroll label="What it cost each pairing">
                  <table className="w-full min-w-[44rem] text-sm tabular-nums">
                    <thead>
                      <tr className="align-bottom">
                        <th className={th}>Model</th>
                        <th className={th}>Pairing</th>
                        <th className={thNum}>Total time</th>
                        <th className={thNum}>Of which stuck</th>
                        <th className={thNum}>Longest step</th>
                        <th className={`${thNum} pr-0`}>Turns stuck</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stops.map(({ m, p }) => (
                        <tr key={`${m.name}${m.quant}${name(p)}`} className="border-t border-rule">
                          <th scope="row" className="py-3 pr-4 text-left font-medium">
                            {label(m)}
                          </th>
                          <td className="py-3 pr-4">{name(p)}</td>
                          <td className={td}>{grouped(p.cell.seconds, 1)} s</td>
                          <td className={td}>
                            {p.cell.frozenSeconds.toFixed(1)} s{" "}
                            <span className="text-ink-soft">({pct((100 * p.cell.frozenSeconds) / p.cell.seconds)})</span>
                          </td>
                          <td className={td}>{p.cell.longestStopSeconds.toFixed(1)} s</td>
                          <td className="py-3 text-right">
                            {p.cell.stopTurns} of {pdTurns}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Scroll>
                <Note>
                  The stuck time stays in the totals, because a user would wait through it. A fix would win back less than that share, since the hard
                  throttle would still slow the CPU.{" "}
                  {couldFlip.length === 0
                    ? "Even with all of it won back, no model's fastest pairing would change."
                    : `If a fix won back the same fraction of its stuck time in every pairing, the fastest would change only ${andList(
                        couldFlip.map(
                          (x) =>
                            `on ${short(x.m)}, from ${name(ranked(x.m)[0])} to ${name(x.p)}, once that fraction passed about ${Math.round(100 * x.share)}%`,
                        ),
                      )}.`}
                </Note>
              </div>

              <div>
                <Sub>It happens during the hard throttle</Sub>
                <List>
                  <li>
                    A log of the XO thermistor and the throttle switches every 2 seconds caught six hard throttles in a row. Each time the CPU was
                    decoding, it was stuck for that same minute, to within a few seconds. The time the NPU was decoding, it kept going.
                  </li>
                </List>
                <Table
                  label="Six hard throttles, logged"
                  head={["On", "Off", "Length", "Decoding", "CPU decode stuck"]}
                  min="38rem"
                  rows={pdStall.events.map((e) => [e.on, e.off, `${e.seconds} s`, `${e.decode}, ${e.model}`, e.stuck || "No; the NPU kept going"])}
                />
                <Note>
                  Local time, 3 November 2026. A fourth phone (D) logged {pdStall.phoneD.events} more at the same switch points (
                  {pdStall.phoneD.onC[0].toFixed(1)} to {pdStall.phoneD.onC[1].toFixed(1)} °C on, {pdStall.phoneD.offC[0].toFixed(1)} to{" "}
                  {pdStall.phoneD.offC[1].toFixed(1)} °C off). Earlier runs, logged every 10 seconds, agree: on Qwen3 4B and Llama 3.2 3B every stuck
                  step fell in a turn with the hard throttle on. Hard throttles lasted {pdThermal.stretchMinutes[0]} to {pdThermal.stretchMinutes[1]}{" "}
                  minutes, most of them about one.
                </Note>
              </div>

              <div>
                <Sub>Why we think it happens</Sub>
                <List>
                  <li>The CPU decodes with 6 threads. Normally each has a core of its own.</li>
                  <li>
                    llama.cpp computes each token as a chain of operations ({grouped(pdStall.graphNodes)} in Llama 3.2 3B&apos;s plan). Many are split
                    across the threads, and the threads wait for each other before the next one starts: hundreds of times per token.
                  </li>
                  <li>The hard throttle leaves 2 cores, so only 2 of the 6 threads can run at a time.</li>
                  <li>
                    A thread that has finished its part does not give up its core. Unlike a Python thread waiting for the global interpreter lock
                    (GIL), which sleeps, it keeps checking whether the others are done until the scheduler moves it off, while the threads with work
                    left wait for a core.
                  </li>
                  <li>Each wait can then cost milliseconds, hundreds of times per token: enough to turn milliseconds per token into seconds.</li>
                  <li>This fits the code and the timings, but it has not been proven.</li>
                </List>
              </div>

              <div>
                <Sub>Does the OpenWeights app hit it?</Sub>
                <List>
                  <li>
                    The app sets its decode threads once before each reply, from Android&apos;s heat signal: {pdStall.app.normal} on this phone,{" "}
                    {pdStall.app.light} when Android reports light or moderate heat, {pdStall.app.severe} at severe, and at critical or above it does
                    not start the reply.
                  </li>
                  <li>
                    On this phone Android reported {andList(pdStall.android.map((r) => `${r.status} (skin ${r.skinC} °C)`))}, about 20 minutes apart;
                    skin is Android&apos;s estimate of the phone&apos;s surface temperature.
                  </li>
                  <li>
                    A reply already running keeps its threads, so a hard throttle that starts mid-reply can still meet {pdStall.app.normal}. On a
                    phone whose Android signal lags the heat, the app would keep {pdStall.app.normal} threads throughout.
                  </li>
                </List>
              </div>

              <div>
                <Sub>What could fix it</Sub>
                <Table
                  label="What could fix it"
                  head={["Change", "Where", "Status"]}
                  min="36rem"
                  rows={[
                    ["Drop to 2 threads as soon as one decode step takes over half a second, then step back up", "App", "Not measured"],
                    [
                      "Make a waiting thread give up its core after a short check, instead of holding it",
                      "llama.cpp",
                      "Not measured; must not slow normal decode",
                    ],
                    ["Decode on the NPU during the hard throttle", "App", "Not measured; the NPU is slower then too"],
                    [
                      "Read how many cores the app may use, before each step",
                      "App",
                      "Ruled out on this phone: the count stayed at 8 through a logged hard throttle",
                    ],
                  ]}
                />
              </div>
            </div>
          </details>
        </div>
      </section>

      <Section id="tilt" title="What could tilt this">
        <List>
          <Item lead="Against the CPU:">
            6 threads throughout. Fewer threads might avoid getting stuck in the hard throttle; that is not tested here.
          </Item>
          <Item lead="Against the GPU:">
            one GPU backend, llama.cpp&apos;s OpenCL. Its slowdown on long conversations may be the backend, not the chip.
          </Item>
          <Item lead="The NPU:">
            one llama.cpp build; newer builds change its NPU backend. NPU decode also uses the CPU for the output layer and the embedding lookup; how
            much of its time that takes was not measured.
          </Item>
          <Item lead="One format:">Q4_0 for all but one model, the format all three backends speed up. Other CPU formats were not tried.</Item>
        </List>
      </Section>

      <Section id="limits" title="Not measured" tint>
        <List>
          <li>Energy, battery drain and memory.</li>
          <li>A phone in a hand, rather than in a rack on AC power.</li>
          <li>An ordinary app without root, and a cold start.</li>
          <li>Contexts past about 4,000 tokens, replies of the model&apos;s own length, and continuing a conversation from what the model wrote.</li>
          <li>Answer quality.</li>
        </List>
        <p className="max-w-3xl text-sm leading-6 text-ink-soft">
          Source:{" "}
          <Go href={pdLinks.report} className={link}>
            the report
          </Go>{" "}
          and{" "}
          <Go href={pdLinks.results} className={link}>
            its raw results
          </Go>{" "}
          in the OpenWeights repository. The tables are generated from the raw results; the heat readings come from the phone and are recorded in the
          report.
        </p>
        <p className="flex flex-wrap gap-x-6 gap-y-3 text-base">
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
