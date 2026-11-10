import { link } from "@/components/home/ui";
import PairingViews from "@/components/openweights/PairingViews";
import { Scroll, grouped, label, slower, td, th, thNum } from "@/components/openweights/pd-parts";
import Post, { Figure, Findings, H4, More, Note, P, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import {
  name,
  pairs,
  pdFix,
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

const href = "/research/prefill-decode/";

export const metadata = postMetadata(
  href,
  "Nine models on a warm Snapdragon 8 Elite Gen 5, each through every pairing of the processor that does prefill and the one that does decode, at the conversations' own reply lengths, with the phone's throttling measured beside them.",
);

const short = (m: PdModel) => `${m.name}${m.quant === "Q8_0" ? " Q8_0" : ""}`;
const range = (xs: number[], d = 1) => `${Math.min(...xs).toFixed(d)} to ${Math.max(...xs).toFixed(d)}`;
const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

const best = pdModels.map((m) => ranked(m));
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
    <Post
      href={href}
      sources={[
        { label: "The report", href: pdLinks.report },
        { label: "Its raw results", href: pdLinks.results },
        { label: "OpenWeights", href: "/openweights/" },
      ]}
      sourcesNote="The tables are generated from the raw results in the OpenWeights repository; the heat readings come from the phone and are recorded in the report."
    >
      <Section id="findings" title="What we found">
        <Findings
          items={[
            {
              headline: "Prefill on the NPU, on every model",
              line: (
                <>
                  {range(npuVsCpu)} times as fast as the CPU and {range(npuVsGpu)} times as fast as the GPU. The first token came after a median {Math.round(Math.min(...npuFirst))}{" "}
                  to {Math.round(Math.max(...npuFirst))} ms, against {range(cpuFirst)} s on the CPU.
                </>
              ),
            },
            {
              headline: "Decode on the NPU or the CPU, depending on the model",
              line: (
                <>
                  The NPU decoded in the fastest pairing of {writers.filter((w) => w.decode === "NPU" && !w.tie).length} models and the CPU in{" "}
                  {andList(writers.filter((w) => w.decode === "CPU" && !w.tie).map((w) => short(w.model)))}. On {andList(writers.filter((w) => w.tie).map((w) => short(w.model)))},
                  NPU prefill with CPU decode and with NPU decode finished within {andList(writers.filter((w) => w.tie).map((w) => `${w.gap.toFixed(1)}%`))} of each other.
                </>
              ),
            },
            {
              headline: "Decode anywhere but the GPU",
              line: (
                <>
                  {gpuDecodeFastest} of {pdModels.length} models were fastest with GPU decode. It was the slowest decoder on {gpuSlowest.length} models and within{" "}
                  {andList(gpuLevel.map((m) => `${gpuGap(m).toFixed(1)}%`))} of the CPU on {andList(gpuLevel.map(short))}. On Qwen3 4B its median decode step rose from{" "}
                  {pdThermal.gpuStep4b.before} ms at 1,024 to 1,535 tokens of context to {pdThermal.gpuStep4b.after} ms at 2,048 to 2,559.
                </>
              ),
            },
            {
              headline: "Decode is most of the wait",
              line: (
                <>
                  The replies run {pdReplyTokens.median} tokens at the median, and decode took {Math.floor(Math.min(...shares))}% to over {Math.floor(Math.max(...shares))}% of each
                  pairing&apos;s time, so the decoder decides more than the prefill processor.
                </>
              ),
            },
            {
              headline: "Heat shapes the results",
              line: (
                <>
                  The phone throttles itself in two steps as it heats. Every pairing compared ran under the first; the second comes and goes, and CPU decode gets stuck while it is
                  on. Up to {Math.round(Math.max(...stuckShares))}% of a CPU-decode pairing&apos;s time went to decode steps that took over half a second. Both steps are described
                  under{" "}
                  <a href="#heat" className={link}>
                    Heat
                  </a>
                  .
                </>
              ),
            },
            {
              headline: "The stall has a cause, and the app now has a guard",
              line: (
                <>
                  A profile put {pdFix.profile.pausedWait}% of a paused 6-thread run&apos;s CPU time in the function that holds llama.cpp&apos;s spinning wait, against{" "}
                  {pdFix.profile.normalWait}% unpaused. The app&apos;s engine now drops to 2 threads when steps stall and tries its count again every 30 s: through a hard
                  throttle set by hand it wrote {pdFix.guard.pausedOn[0]} to {pdFix.guard.pausedOn[1]} tokens a second against {pdFix.guard.pausedOff[0]} to{" "}
                  {pdFix.guard.pausedOff[1]} without it. Chat paced like a person, even with no pause between turns, did not reach the hard throttle in 30 to 41 minutes on the
                  Snapdragon. Under{" "}
                  <a href="#heat" className={link}>
                    Heat
                  </a>
                  .
                </>
              ),
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="fastest"
          title="The fastest pairing for each model"
          note={
            <>
              CPU → NPU means prefill on the CPU, decode on the NPU. Times are the total for the same {pdTurns} conversation turns; percentages are how much longer than the
              fastest.
              {coolCells.length > 0 && ` ${andList(coolCells.map(({ m, p }) => `${short(m)}'s ${name(p)}`))}, which started cool, is left out.`}
            </>
          }
        >
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
        </Figure>

        <Figure id="matrices" title="Every pairing, model by model">
          {/* The rates section used to have its own anchor; links to it land here. */}
          <div id="processors" className="scroll-mt-28 lg:scroll-mt-16">
            <PairingViews />
          </div>
        </Figure>

        <Figure
          id="heat"
          title="Heat: what the phone does"
          lede="The phone throttles itself in two steps as it heats. These are the stages we saw, what each does to each processor, and what that means for the comparison."
        >
          <div className="space-y-10">
            <div>
              <H4>Warming up and cooling down, as observed</H4>
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
                  ["Hard throttle on", "CPU cores paused and the NPU slowed, on top of the soft throttle. The GPU's cap stayed at 578 MHz", `XO thermistor reaches ${pdTrigger.onC} °C`],
                  ["Hard throttle off, usually about a minute later", "Back to the soft throttle", `XO thermistor below ${pdTrigger.offC} °C`],
                  ["Idle again", "Soft throttle off within about 10 minutes, the one time this was timed", ""],
                ]}
              />
              <div className="mt-6 space-y-4">
                <P>
                  Between {pdTrigger.offC} and {pdTrigger.onC} °C the hard throttle stays as it was: on if the sensor last reached {pdTrigger.onC} °C, off if it last fell below{" "}
                  {pdTrigger.offC} °C. The gap keeps it from flickering.
                </P>
                <P>
                  The processors share heat: with only the CPU working, the NPU&apos;s sensors read {pdSpread.cpuOnlyNpuC} °C; with the NPU doing nearly all the work, the
                  CPU&apos;s read {pdSpread.npuOnlyCpuC} °C (Llama 3.2 3B). The XO thermistor warms whichever processor works. At the hard throttle, CPU cores pause and the NPU
                  slows. Natural hard throttles showed no extra GPU decode slowdown; pausing the cores by hand cut GPU decode by at most 1.6% among the turn medians.
                </P>
              </div>
            </div>

            <div>
              <H4>How each processor is throttled</H4>
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
                The soft throttle&apos;s first CPU decode figure and its GPU prefill figure compare nine matched Qwen3 4B turns on phone C. Its second CPU figure, its GPU decode
                figure and the GPU&apos;s hard-throttle figure come from three repeated Qwen3 4B turn positions on phone B, each cap or pause set by hand after a cooling gate,
                against the same turns without it. The hand-set pause left the throttle&apos;s other switches, kgsl and cdsp, off. The NPU&apos;s
                hard-throttle figures compare the same turns run with and without it: two thirds on Qwen3 4B and Llama 3.2 3B, about half on Qwen3 1.7B.
              </Note>
            </div>

            <div>
              <H4>What this means for the comparison</H4>
              <div className="mt-4">
                <Rows>
                  <Row label="Every pairing compared started warm">
                    Before each pairing the benchmark waited, checking every {pdGate.pollS} seconds for up to {pdGate.maxS / 60} minutes, for all three processors to read{" "}
                    {pdGate.limitC} °C or less and the soft throttle to lift. If they did, the pairing started cool; if time ran out, it started warm. Only warm starts are
                    compared. At every compared turn&apos;s start and end the GPU cap read 578 MHz, and the CPU ceilings read 1.90 and 2.23 GHz on {grouped(pdWarm.cpuCeilingTurns)}{" "}
                    of {grouped(pdWarm.turns)} turns (lower still on the rest).
                  </Row>
                  <Row label="Cool starts were run again">
                    After the phone sits idle, a run&apos;s first pairings can start cool. LFM2.5 1.2B and Qwen3 1.7B were run again, all nine pairings, after a throwaway warm-up
                    pass of the model on the CPU. Qwen3 4B&apos;s GPU → CPU was run again on its own, warm, on a fourth phone (D); its matrices mark that cell with a D instead of
                    the order it ran in.
                    {coolCells.length > 0 &&
                      ` ${andList(coolCells.map(({ m, p }) => `${short(m)}'s ${name(p)}`))} started cool; it is shown with a dashed border and not compared.`}
                  </Row>
                  <Row label="Order still matters">
                    Each pairing inherits the heat of the ones before it, and the hard throttle lands on whichever pairing is running: CPU decode gets stuck, NPU decode slows. So
                    the total-time matrices show the order each model&apos;s pairings ran in, and these are the results of one shuffled order. Small gaps, such as LFM2.5
                    2.6B&apos;s 0.4%, are within that.
                  </Row>
                  <Row label="Compare within a model">Models ran on different phones and do different work per token, so seconds do not compare across models.</Row>
                </Rows>
              </div>
            </div>

            <More title="What we read" summary="The temperature, clock and throttle readings behind this, in the phone's own names">
              <div>
                <Table label="What we read" head={["Reading", "What it is", "What it tells us"]} rows={pdSensors.map((s) => [s.sensor, s.what, s.use])} min="40rem" />
                <div className="mt-6 [&_code]:text-[0.9em]">
                  <Rows>
                    <Row label="CPU">
                      Temperature zones <code>cpu-0-*</code> and <code>cpu-1-*</code>, clock ceiling <code>scaling_max_freq</code>, core pauses <code>thermal-pause-C0</code> and{" "}
                      <code>thermal-pause-3C</code>
                    </Row>
                    <Row label="GPU">
                      Temperature zones <code>gpuss-*</code>, clock cap <code>thermal_pwrlevel</code>, throttle switch <code>kgsl</code>
                    </Row>
                    <Row label="NPU">
                      Temperature zones <code>nsphvx-*</code> and <code>nsphmx-*</code>, slowdown <code>cdsp</code>
                    </Row>
                    <Row label="Board">
                      The XO thermistor <code>sys-therm-0</code>, named <code>pmk8850_xo_therm</code> in the device tree
                    </Row>
                  </Rows>
                </div>
              </div>
            </More>
          </div>
        </Figure>

        <More
          id="stuck"
          title="When CPU decode gets stuck"
          summary="What happens during the hard throttle, what it cost each pairing, why it happens, whether the OpenWeights app hits it, what now guards against it, and whether ordinary use gets there."
        >
          <div>
            <H4>What happens</H4>
            <div className="mt-3 space-y-4">
              <P>
                The models&apos; median CPU decode steps took {Math.min(...cpuStep)} to {Math.max(...cpuStep)} ms. We call a step stuck when it takes over half a second.
              </P>
              <P>
                {pdStuck.turns} of the CPU-decode turns got stuck.{" "}
                {pdStuck.single.length > 0
                  ? `In ${pdStuck.turns - pdStuck.single.length} of them decode crawled through one unbroken stretch`
                  : "In each, decode crawled through one unbroken stretch"}{" "}
                of {Math.round(pdStuck.stretchSeconds[0])} to {Math.round(pdStuck.stretchSeconds[1])} seconds, producing {pdStuck.tokensInStretch[0]} to{" "}
                {pdStuck.tokensInStretch[1]} tokens (single steps up to {Math.round(pdStuck.tokenSeconds[1])} s), then went back to normal.
                {pdStuck.single.length === 1 && ` The other had one slow step of ${pdStuck.single[0]} s.`}
                {pdStuck.single.length > 1 && ` The other ${pdStuck.single.length} each had one slow step, of ${pdStuck.single.join(" and ")} s.`}
              </P>
              <P>No NPU decode step took over half a second, and the GPU&apos;s slow steps late in long conversations are its normal pace.</P>
            </div>
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
                        {p.cell.frozenSeconds.toFixed(1)} s <span className="text-ink-soft">({pct((100 * p.cell.frozenSeconds) / p.cell.seconds)})</span>
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
              The stuck time stays in the totals, because a user would wait through it. A fix would win back less than that share, since the hard throttle would still slow the CPU.{" "}
              {couldFlip.length === 0
                ? "Even with all of it won back, no model's fastest pairing would change."
                : `If a fix won back the same fraction of its stuck time in every pairing, the fastest would change only ${andList(
                    couldFlip.map((x) => `on ${short(x.m)}, from ${name(ranked(x.m)[0])} to ${name(x.p)}, once that fraction passed about ${Math.round(100 * x.share)}%`),
                  )}.`}
            </Note>
          </div>

          <div>
            <H4>It happens during the hard throttle</H4>
            <div className="mt-3">
              <P>
                A log of the XO thermistor and the throttle switches every 2 seconds caught six hard throttles in a row. Each time the CPU was decoding, it was stuck for that same
                minute, to within a few seconds. The time the NPU was decoding, it kept going.
              </P>
            </div>
            <Table
              label="Six hard throttles, logged"
              head={["On", "Off", "Length", "Decoding", "CPU decode stuck"]}
              min="38rem"
              rows={pdStall.events.map((e) => [e.on, e.off, `${e.seconds} s`, `${e.decode}, ${e.model}`, e.stuck || "No; the NPU kept going"])}
            />
            <Note>
              Local time, 3 November 2026. A fourth phone (D) logged {pdStall.phoneD.events} more at the same switch points ({pdStall.phoneD.onC[0].toFixed(1)} to{" "}
              {pdStall.phoneD.onC[1].toFixed(1)} °C on, {pdStall.phoneD.offC[0].toFixed(1)} to {pdStall.phoneD.offC[1].toFixed(1)} °C off). Earlier runs, logged every 10 seconds,
              agree: on Qwen3 4B and Llama 3.2 3B every stuck step fell in a turn with the hard throttle on. Hard throttles lasted {pdThermal.stretchMinutes[0]} to{" "}
              {pdThermal.stretchMinutes[1]} minutes, most of them about one.
            </Note>
          </div>

          <div>
            <H4>Why it happens</H4>
            <div className="mt-3 space-y-4">
              <P>
                The CPU decodes with 6 threads, and normally each has a core of its own. llama.cpp computes each token as a chain of operations ({grouped(pdStall.graphNodes)} in
                Llama 3.2 3B&apos;s plan). Many are split across the threads, and the threads wait for each other before the next one starts: hundreds of times per token.
              </P>
              <P>
                The hard throttle leaves 2 cores, so only 2 of the 6 threads can run at a time. A thread that has finished its part does not give up its core. Unlike a Python
                thread waiting for the global interpreter lock (GIL), which sleeps, it keeps checking whether the others are done until the scheduler moves it off, while the
                threads with work left wait for a core.
              </P>
              <P>
                Each wait can then cost milliseconds, hundreds of times per token: enough to turn milliseconds per token into seconds. A profile on phone E shows it: with the pause
                set by hand, {pdFix.profile.pausedWait}% of a 6-thread decode&apos;s CPU time was in the function that holds that wait, against {pdFix.profile.normalWait}% unpaused,
                while the matrix and attention kernels&apos; share fell from about {pdFix.profile.normalKernels}% to {pdFix.profile.pausedKernels}%, on {pdFix.profile.pausedCores} cores
                busy on average against {pdFix.profile.normalCores}. The profile is by function, so the split inside that function between the wait and its other work is not in it.
              </P>
              <P>
                A later run on phone B recorded where the threads ran. During hard throttles the busy threads were on cores 0 and 1 in 99.7% of samples, against all 8 cores the
                rest of the time: consistent with this account, though a sample shows only the last core a thread ran on.
              </P>
              <P>
                A run on 9 November paused the same 6 cores by hand after a cooling gate, with the switches the phone&apos;s own throttle uses. With 6 threads, none of three tries
                finished its first turn within 20 minutes, against about 6 seconds unpaused, while the threads kept the two remaining cores busy. The one paused run with 4
                threads finished no turn within 10 minutes; with 3 decode ran at under half a token a second; with 2 at 6.9 tokens a second, with no step over half a second.
                With the pause switches set, this benchmark got stuck at 6 and 4 threads and slowed badly at 3, and 2 did not get stuck.
              </P>
            </div>
          </div>

          <div>
            <H4>Does the OpenWeights app hit it?</H4>
            <div className="mt-3 space-y-4">
              <P>
                The app sets its decode threads once before each reply, from Android&apos;s heat signal: {pdStall.app.normal} on this phone, {pdStall.app.light} when Android
                reports light or moderate heat, {pdStall.app.severe} at severe, and at critical or above it does not start the reply.
              </P>
              <P>
                On this phone Android reported {andList(pdStall.android.map((r) => `${r.status} (skin ${r.skinC} °C)`))}, about 20 minutes apart; skin is Android&apos;s estimate of
                the phone&apos;s surface temperature.
              </P>
              <P>
                Before the guard below, a reply already running kept its threads, so a hard throttle that started mid-reply met {pdStall.app.normal}. On a phone whose Android
                signal lags the heat, the app kept {pdStall.app.normal} threads throughout.
              </P>
              <P>
                With the pause set by hand on a fifth phone of the same kind (E), the app&apos;s own engine, which keeps its threads in a pool for the life of the model,
                had its median decode rate fall to about a hundredth with {pdStall.app.normal} threads: 0.24 tokens a second against 23.1, in four
                runs each, a token every 4.1 seconds on average. With 3 it decoded at 0.51; with 2 at 10.6, 46% of its unpaused rate with 2 threads. With the pause held
                through a whole run, the engine at its usual {pdStall.app.normal} threads decoded about 95 times slower. These runs used Qwen3 4B, a 19-token prompt and a 64-token
                reply; the thread pool was the app&apos;s, but its heat policy, which picks the thread count before each reply, was not in the loop.
              </P>
              <P>
                Could the app read the throttle switches itself? On these rack phones its test process could read all eleven; on a retail MediaTek phone (the POCO below) it could
                not even list the thermal devices. So a fix cannot rely on them.
              </P>
            </div>
          </div>

          <div>
            <H4>What the app now does</H4>
            <div className="mt-3 space-y-4">
              <P>
                The engine now watches its own decode steps. Two steps in a row that are slow, over a quarter of a second and more than 8 times the recent normal step or more
                than 2 seconds over it (or over 1.5 seconds with no history yet), drop decode and prompt reading to 2 threads; every 30 seconds it tries one step at its planned
                count and keeps it if that step is close to its 2-thread steps. The normal step is the median of the last eight, so one odd step moves nothing. Codex reviewed
                it seven times before and after it reached a phone; the bugs those rounds found are listed in the report. The pause runs below used earlier builds of the guard,
                which differ in how the normal step is kept; every stalled step they met was 37 to 127 times the normal one, which every version judges alike. The final rules
                have run on the POCO without a pause and not yet through one.
              </P>
              <P>
                Measured on phone D with the pause set by hand 10 seconds into decode, on a {grouped(1751)}-token prompt and replies of up to {grouped(1024)} tokens, 4 threads.
                Through a pause that stayed, the engine wrote {pdFix.guard.pausedOn[0]} to {pdFix.guard.pausedOn[1]} tokens a second with the guard against{" "}
                {pdFix.guard.pausedOff[0]} to {pdFix.guard.pausedOff[1]} without it, falling back {pdFix.guard.fellBackHeldS[0]} to {pdFix.guard.fellBackHeldS[1]} seconds
                after the pause began; each try at 4 threads inside the pause cost one stalled step of {pdFix.guard.tryCostS[0]} to {pdFix.guard.tryCostS[1]} seconds. Through a
                30-second pause it fell back {pdFix.guard.fellBackShortS[0]} to {pdFix.guard.fellBackShortS[1]} seconds in, decoded in {pdFix.guard.shortPauseOn[0]} to{" "}
                {pdFix.guard.shortPauseOn[1]} seconds against {pdFix.guard.shortPauseOff[0]} to {pdFix.guard.shortPauseOff[1]} without it, and returned to 4 threads{" "}
                {pdFix.guard.returnedAfterS[0]} to {pdFix.guard.returnedAfterS[1]} seconds after the pause ended. With no pause the guarded run decoded at {pdFix.guard.noPause4Guard} tokens a second, between the two unguarded runs ({pdFix.guard.noPause4[0]} and{" "}
                {pdFix.guard.noPause4[1]}); it never fell back in {pdFix.sessionTurns} turns of chat on two phones.
              </P>
              <P>
                Three things it does not show. The pause was set by hand: no natural hard throttle came while the guard ran. One of {pdFix.guard.pausesSet} pauses set by hand did
                not hold (threads kept running on two cores it should have parked), and two more probably did not; those runs are left out. And a pause that begins while the
                prompt is being read is not caught, since the guard reads decode steps.
              </P>
            </div>
          </div>

          <div>
            <H4>Does ordinary use reach it?</H4>
            <div className="mt-3 space-y-4">
              <P>
                The study&apos;s conversations, chatted through turn by turn on one loaded engine with the model&apos;s own replies kept in the history and a pause before each next
                message, as a person reads. Qwen3 4B, 4 threads, the guard on.
              </P>
            </div>
            <Table
              label="Chat sessions against the throttle"
              head={["Phone", "Pause between turns", "Turns", "Hottest reading", "Hard throttle (Snapdragon) or Android's thermal status (POCO)", "Decode tok/s", "First token s, median (longest)"]}
              min="52rem"
              rows={pdFix.sessions.map((r) => [r.phone, r.pause, `${r.turns} in ${r.minutes} min`, r.peak, r.hard, r.decode.toFixed(1), r.first])}
            />
            <Note>
              The hard throttle trips at {pdTrigger.onC} °C on the XO thermistor; the POCO has no such switch an app or a shell can read, so its rows give Android&apos;s thermal
              status, which never left 0. The soft throttle held almost throughout every Snapdragon session, with the CPU clocks capped at about half. Decode slowed within
              each conversation as its context grew and recovered with each new one. On both phones one turn waited about two minutes for its first word (
              {pdFix.cacheMiss.snapdragonS} and {pdFix.cacheMiss.pocoS} s) after the engine&apos;s cache stopped matching {pdFix.cacheMiss.tokens} tokens from the end of the
              prompt and it re-read them; why the cache did not match, and whether heat added to the wait, were not traced. The POCO was charging, which adds heat, and its
              power service read the screen as dozing for most of its longer session; a phone in a hand was still not measured.
            </Note>
          </div>

          <div>
            <H4>How many threads, then</H4>
            <div className="mt-3 space-y-4">
              <P>
                Four for decode, half the cores, with the guard. At this length and without a pause, 2 threads decoded {pdFix.guard.twoThreadsCostPct}% slower than 4 on the
                Snapdragon ({pdFix.guard.noPause2[0]} and {pdFix.guard.noPause2[1]} against {pdFix.guard.noPause4[0]} and {pdFix.guard.noPause4[1]} tokens a second), and
                the first word came after {pdFix.guard.firstToken2S[0]} to {pdFix.guard.firstToken2S[1]} seconds against {pdFix.guard.firstToken4S[0]} to{" "}
                {pdFix.guard.firstToken4S[1]}. On the MediaTek POCO, same prompt and length, 2 threads cost far more: decode {pdFix.poco.two[0]} and {pdFix.poco.two[1]}{" "}
                against {pdFix.poco.four[0]} and {pdFix.poco.four[1]} tokens a second ({pdFix.poco.decodeCostPct}% slower), prompt reading {pdFix.poco.prefillCostPct}% slower, the first
                word after {pdFix.poco.firstToken2S[0]} to {pdFix.poco.firstToken2S[1]} seconds against {pdFix.poco.firstToken4S[0]} to {pdFix.poco.firstToken4S[1]}. A fixed 2 would
                pay that on every reply to insure against a throttle no Snapdragon session reached; the guard pays it only on a stall.
              </P>
              <P>
                The thread count also changes the text. The same count gave identical replies on two phones, token for token; 6 threads against 2 changed{" "}
                {pdFix.agreement.changed} of {pdFix.agreement.of} replies, first diverging between the {pdFix.agreement.firstDiverge[0]}th and{" "}
                {pdFix.agreement.firstDiverge[1]}th token, because the sums come out in a different order and a close greedy choice flips. Neither version was graded.
              </P>
            </div>
          </div>

          <div>
            <H4>With 2 threads instead of 6</H4>
            <div className="mt-3 space-y-4">
              <P>
                On phone B, after a discarded 6-thread warm-up, Qwen3 4B&apos;s GPU → CPU pairing completed once with 6 threads and once with 2. With 6 it hit the hard throttle 7
                times. Its 36 steps over half a second added 372 s beyond that threshold, all in or at the edge of a hard throttle. With 2 the XO thermistor peaked at 76.3 °C,
                under the 78 °C trip, so there was no hard throttle and no step over half a second, but decoding took 13.6% longer, the 6-thread run&apos;s stalls included.
              </P>
              <P>
                This is one pair, and the 2-thread run started with a cooler CPU. A rerun on phone E started every run after the same cooling gate, in the order 6, 2, 2, 6.
                The 6-thread run whose first turn began at a similar temperature to the 2-thread runs&apos; (48.0 against 48.4 and 48.6 °C on
                the XO thermistor) hit the hard throttle 3 times, with 189 s beyond the half-second threshold; the
                2-thread runs stayed under the trip but still took 24% longer to decode than it, stalls included. The first 6-thread run, the day&apos;s first and cooler, stayed
                under the trip and decoded 61% faster than the 2-thread runs. Inside a hard throttle set by hand, 2 threads did not get stuck (above). Switching from 6 threads
                to 2 whenever the throttle switches read on, with the throttle turned on and off every 15 seconds, decoded at 4.3 to 6.3 tokens a second during the throttle,
                against 0.3 to 0.9 without switching, and finished the same work in 21% less time (median decode times). The rates during the throttle split each step by how much
                of it the throttle covered, and the CPU&apos;s ceilings also differed between the two. It read the switches as root; the app&apos;s own guard, above, reads none.
              </P>
            </div>
          </div>

          <div>
            <H4>What could fix it</H4>
            <Table
              label="What could fix it"
              head={["Change", "Where", "Status"]}
              rows={[
                ["Drop to 2 threads after two stalled decode steps, then try the planned count every 30 s", "App", `Built into the engine and measured above: ${pdFix.guard.pausedOn[0]} to ${pdFix.guard.pausedOn[1]} tokens a second through a pause set by hand against ${pdFix.guard.pausedOff[0]} to ${pdFix.guard.pausedOff[1]}. Not yet seen in a natural hard throttle`],
                ["Make a waiting thread give up its core after a short check, instead of holding it", "llama.cpp", `Measured, and no setting tried does both: yielding after 10,000 spins kept ${pdFix.yield.paused10k[0]} to ${pdFix.yield.paused10k[1]} tokens a second in the pause but slowed unpaused decode on some turns to ${pdFix.yield.normal10kShare[0]}% to ${pdFix.yield.normal10kShare[1]}% of the stock wait; after 1,000,000 spins the unpaused cost was within run-to-run variation and the pause got ${pdFix.yield.paused1m[0]} to ${pdFix.yield.paused1m[1]}. Both lose to 2 threads (${pdFix.yield.stockPaused2} in the same pause)`],
                ["Decode on the NPU during the hard throttle", "App", "Not measured; the NPU is slower then too"],
                ["Read how many cores the app may use, before each step", "App", "Ruled out on this phone: the count stayed at 8 through a logged hard throttle"],
              ]}
            />
          </div>
        </More>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="Phones">
            Five {pdPhone.soc} phones of the same kind (A to E), Android 16, root shell, on AC power in Qualcomm Device Cloud&apos;s rack, {pdPhone.dates}. Each model ran all nine
            of its pairings on one phone, in one run, except Qwen3 4B&apos;s GPU → CPU, run again on phone D because it had started cool. The 2-thread run and the GPU&apos;s
            throttle costs ran on phone B on 8 and 9 November, and the throttles set by hand on phone B on 9 November; the 2-thread rerun, the app&apos;s own engine and the
            profile on phone E the same day; the guard, the barrier change and the chat sessions on phone D on 9 and 10 November. One MediaTek phone, a POCO X8 Pro Max
            (MT6991, HyperOS, Android 16) on USB power, ran the chat sessions and the thread comparison on 9 and 10 November.
          </Row>
          <Row label="Runtime">
            llama.cpp {pdPhone.llamacpp} with its CPU, OpenCL (GPU) and Hexagon (NPU) backends in one process. When prefill and decode run on different processors, the conversation
            state is copied across every turn. The matrix runs used 6 CPU threads; later tests compared 6 with 2 in natural heat, and 6, 4, 3 and 2 with the hard throttle
            set by hand, in the benchmark and in the app&apos;s own engine. The guard&apos;s runs used the engine&apos;s own device tests, with every step&apos;s time logged.
          </Row>
          <Row label="Models">
            Qwen3 0.6B, 1.7B and 4B; Gemma 3 1B; Llama 3.2 1B and 3B; LFM2.5 1.2B and 2.6B. All in Q4_0, the 4-bit format all three backends speed up, and Qwen3 1.7B also in Q8_0,
            an 8-bit format. The LFM2.5 models are hybrids, mixing attention with other layer types, in Liquid AI&apos;s own Q4_0 builds.
          </Row>
          <Row label="Conversations">
            Nine from WildChat-1M, UltraChat 200k and Daring-Anteater, {pdTurns} turns in all. Each turn&apos;s prefill covers only its new tokens, {pdNewTokens[0]} to{" "}
            {grouped(pdNewTokens[1])} depending on the model; earlier turns are already in the cache.
          </Row>
          <Row label="Same work in every pairing">
            Each turn decodes as many tokens as the dataset&apos;s own reply has ({pdReplyTokens.median} at the median, up to {grouped(pdReplyTokens.max)}, counted by Qwen3), and
            the next turn continues from the dataset&apos;s history, not from what the model wrote. So all nine pairings do exactly the same amount of work, even where their
            outputs differ.
          </Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <div id="tilt" className="scroll-mt-28 lg:scroll-mt-16">
          <Rows>
            <Row label="Against the CPU">
              The matrix uses 6 threads in every pairing. With the hard throttle set by hand, 6 and 4 threads got stuck and 2 did not, in the benchmark and in the app&apos;s
              own engine; in natural heat, 2 threads against 6 is one pair on phone B and one balanced set of four runs on phone E, and 2 against 4 at a realistic length is two
              runs each on phone D and on the POCO. The guard was measured against pauses set by hand, one model, one prompt.
            </Row>
            <Row label="Against the GPU">
              One GPU backend, llama.cpp&apos;s OpenCL, capped at 578 MHz in every matrix pairing compared. In one uncapped three-turn probe, GPU decode also slowed at later
              turns, so the logged cap and CPU pauses cannot fully explain it. This probe does not separate context length from other turn effects or identify the cause.
            </Row>
            <Row label="The NPU">
              One llama.cpp build; newer builds change its NPU backend. NPU decode also uses the CPU for the output layer and the embedding lookup; how much of its time that takes
              was not measured.
            </Row>
            <Row label="One format">Q4_0 for all but one model, the format all three backends speed up. Other CPU formats were not tried.</Row>
            <Row label="Not measured">
              Energy and battery drain: the rack phones bypass their battery, and the one retail phone stayed on its charger. A phone in a hand, rather than in a rack or on
              a desk. A cold start. Contexts past about 4,000 tokens in the matrix. Answer quality, beyond whether the tokens match. Memory was measured for one instance of
              Qwen3 4B in the app&apos;s engine, {pdFix.memoryGb[0]} to {pdFix.memoryGb[1]} GB across windows and phones, not for a split that keeps two. The guard has not
              been seen in a natural hard throttle.
            </Row>
          </Rows>
        </div>
      </Section>
    </Post>
  );
}
