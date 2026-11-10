import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import PairingViews from "@/components/openweights/PairingViews";
import { Scroll, grouped, label, slower, td, th, thNum } from "@/components/openweights/pd-parts";
import Post, { Figure, Findings, More, Note, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
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
  return {
    model: pdModels[k],
    decode: a.decode,
    tie,
    gap: 100 * (b.cell.seconds / a.cell.seconds - 1),
  };
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
  const ties = writers.filter((w) => w.tie);
  const stall = (text: string) => (
    <Go href="/research/decode-stall/" className={link}>
      {text}
    </Go>
  );
  return (
    <Post
      href={href}
      sources={[
        { label: "The report", href: pdLinks.report },
        { label: "Its raw results", href: pdLinks.results },
        { label: "OpenWeights", href: "/openweights/" },
      ]}
      sourcesNote="The tables are generated from the raw results in the OpenWeights repository; the heat readings come from the phone and are recorded in the report."
      related={["/research/decode-stall/", "/research/8-elite-dimensity/", "/research/latency/"]}
    >
      <Section id="findings" title="What we found">
        <Findings
          items={[
            {
              headline: "Prefill on the NPU, on every model",
              line: (
                <>
                  {range(npuVsCpu)} times as fast as the CPU and {range(npuVsGpu)} times as fast as the GPU, with the first token after a median {Math.round(Math.min(...npuFirst))}{" "}
                  to {Math.round(Math.max(...npuFirst))} ms against {range(cpuFirst)} s on the CPU.
                </>
              ),
            },
            {
              headline: "Decode on the NPU or the CPU, depending on the model",
              line: (
                <>
                  The NPU decoded in the fastest pairing of {writers.filter((w) => w.decode === "NPU" && !w.tie).length} models and the CPU in{" "}
                  {andList(writers.filter((w) => w.decode === "CPU" && !w.tie).map((w) => short(w.model)))}; on {andList(ties.map((w) => short(w.model)))} the two finished within{" "}
                  {andList(ties.map((w) => `${w.gap.toFixed(1)}%`))} of each other.
                </>
              ),
            },
            {
              headline: "Decode anywhere but the GPU",
              line: (
                <>
                  {gpuDecodeFastest === 0 ? "No model was" : `${gpuDecodeFastest} of ${pdModels.length} models were`} fastest with GPU decode: it was the slowest decoder on{" "}
                  {gpuSlowest.length} and within {andList(gpuLevel.map((m) => `${gpuGap(m).toFixed(1)}%`))} of the CPU on {andList(gpuLevel.map(short))}.
                </>
              ),
            },
            {
              headline: "Decode is most of the wait",
              line: (
                <>
                  Replies run {pdReplyTokens.median} tokens at the median, so decode took {Math.floor(Math.min(...shares))}% to over {Math.floor(Math.max(...shares))}% of each
                  pairing&apos;s time and the decoder matters more than the prefill processor.
                </>
              ),
            },
            {
              headline: "Heat shapes the results",
              line: (
                <>
                  The phone throttles itself in two steps, and in the second CPU decode gets stuck, which took up to {Math.round(Math.max(...stuckShares))}% of a CPU-decode
                  pairing&apos;s time.
                </>
              ),
            },
            {
              headline: "The stall has its own post",
              line: (
                <>Why CPU decode gets stuck, the guard the app now carries and whether ordinary chat gets there are in {stall("Why CPU decode stalls when a phone throttles")}.</>
              ),
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="fastest"
          title="The fastest pairing for each model"
          lede={`Total time for the same ${pdTurns} conversation turns, and how much longer the other pairings took.`}
          note={
            <>
              CPU → NPU means prefill on the CPU, decode on the NPU.
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
          title="The phone throttles itself in two steps"
          lede="The stages we saw as it warmed and cooled. Every pairing compared started under the first step, the soft throttle."
          note={
            <>
              Between {pdTrigger.offC} and {pdTrigger.onC} °C the hard throttle keeps its last state, so it does not flicker. The processors share heat, so the XO thermistor warms
              whichever one works.
            </>
          }
        >
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
                "CPU cores paused and the NPU slowed, on top of the soft throttle. The GPU's cap stayed at 578 MHz",
                `XO thermistor reaches ${pdTrigger.onC} °C`,
              ],
              ["Hard throttle off, usually about a minute later", "Back to the soft throttle", `XO thermistor below ${pdTrigger.offC} °C`],
              ["Idle again", "Soft throttle off within about 10 minutes, the one time this was timed", ""],
            ]}
          />
        </Figure>

        <Figure
          id="throttle"
          title="What each step does to each processor"
          lede="Most figures compare the same work with the throttle on and off; the CPU's hard-throttle figures are what its stuck turns did."
          note="Which turns, phones and models each figure compares is under Every number."
        >
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
        </Figure>

        <Figure
          id="stuck"
          title="What the stuck CPU decode cost each pairing"
          lede={`Time in decode steps over half a second, against a median CPU step of ${Math.min(...cpuStep)} to ${Math.max(...cpuStep)} ms.`}
          note={
            <>
              The stuck time stays in the totals, because a user would wait through it.{" "}
              {couldFlip.length === 0
                ? "Even with all of it won back, no model's fastest pairing would change."
                : `If a fix won back the same fraction of its stuck time in every pairing, the fastest would change only ${andList(
                    couldFlip.map((x) => `on ${short(x.m)}, from ${name(ranked(x.m)[0])} to ${name(x.p)}, once that fraction passed about ${Math.round(100 * x.share)}%`),
                  )}.`}{" "}
              Why it happens and the app&apos;s fix are in {stall("the stall's own post")}.
            </>
          }
        >
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
        </Figure>

        <More
          id="numbers"
          title="Every number"
          summary="How the stuck turns went, the six logged hard throttles, where each throttle figure comes from, and the readings behind them"
        >
          <Note>
            {pdStuck.turns} of the CPU-decode turns got stuck.{" "}
            {pdStuck.single.length > 0
              ? `In ${pdStuck.turns - pdStuck.single.length} of them decode crawled through one unbroken stretch`
              : "In each, decode crawled through one unbroken stretch"}{" "}
            of {Math.round(pdStuck.stretchSeconds[0])} to {Math.round(pdStuck.stretchSeconds[1])} seconds, producing {pdStuck.tokensInStretch[0]} to {pdStuck.tokensInStretch[1]}{" "}
            tokens, then went back to normal.
            {pdStuck.single.length === 1 && ` The other had one slow step of ${pdStuck.single[0]} s.`}
            {pdStuck.single.length > 1 && ` The other ${pdStuck.single.length} each had one slow step, of ${pdStuck.single.join(" and ")} s.`} No NPU decode step took over half a
            second, and the GPU&apos;s slow steps late in long conversations are its normal pace.
          </Note>
          <div>
            <Table
              label="Six hard throttles, logged every 2 seconds"
              head={["On", "Off", "Length", "Decoding", "Decode stuck"]}
              min="38rem"
              rows={pdStall.events.map((e) => [e.on, e.off, `${e.seconds} s`, `${e.decode}, ${e.model}`, e.stuck || "No"])}
            />
            <Note>
              Local time, 3 November 2026: each time the CPU was decoding, it was stuck for that same minute, to within a few seconds, and the NPU kept going. A fourth phone (D)
              logged {pdStall.phoneD.events} more at the same switch points ({pdStall.phoneD.onC[0].toFixed(1)} to {pdStall.phoneD.onC[1].toFixed(1)} °C on,{" "}
              {pdStall.phoneD.offC[0].toFixed(1)} to {pdStall.phoneD.offC[1].toFixed(1)} °C off). Earlier runs, logged every 10 seconds, agree: on Qwen3 4B and Llama 3.2 3B every
              stuck step fell in a turn with the hard throttle on. Hard throttles lasted {pdThermal.stretchMinutes[0]} to {pdThermal.stretchMinutes[1]} minutes, most of them about
              one.
            </Note>
          </div>
          <Note>
            Where the throttle figures come from. The soft throttle&apos;s first CPU decode figure and its GPU prefill figure compare nine matched Qwen3 4B turns on phone C. Its
            second CPU figure, its GPU decode figure and the GPU&apos;s hard-throttle figure come from three repeated Qwen3 4B turn positions on phone B on 8 and 9 November, each
            cap or pause set by hand after a cooling gate, against the same turns without it; the hand-set pause left the throttle&apos;s other switches, kgsl and cdsp, off. The
            NPU&apos;s hard-throttle figures compare the same turns run with and without it: two thirds on Qwen3 4B and Llama 3.2 3B, about half on Qwen3 1.7B.
          </Note>
          <Note>
            The heat the processors share, Llama 3.2 3B: with only the CPU working, the NPU&apos;s sensors read {pdSpread.cpuOnlyNpuC} °C; with the NPU doing nearly all the work,
            the CPU&apos;s read {pdSpread.npuOnlyCpuC} °C. At every compared turn&apos;s start and end the GPU cap read 578 MHz, and the CPU ceilings read 1.90 and 2.23 GHz on{" "}
            {grouped(pdWarm.cpuCeilingTurns)} of {grouped(pdWarm.turns)} turns (lower still on the rest).
          </Note>
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
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="Phones">
            Five {pdPhone.soc} phones of the same kind (A to E), Android 16, root shell, on AC power in Qualcomm Device Cloud&apos;s rack, {pdPhone.dates}. Each model ran all nine
            pairings on one phone, in one run, except Qwen3 4B&apos;s GPU → CPU, run again on phone D.
          </Row>
          <Row label="Runtime">
            llama.cpp {pdPhone.llamacpp} with its CPU, OpenCL (GPU) and Hexagon (NPU) backends in one process, 6 CPU threads. When prefill and decode run on different processors,
            the conversation state is copied across every turn.
          </Row>
          <Row label="Models">
            Qwen3 0.6B, 1.7B and 4B; Gemma 3 1B; Llama 3.2 1B and 3B; LFM2.5 1.2B and 2.6B, all in Q4_0, the 4-bit format all three backends speed up, and Qwen3 1.7B also in Q8_0.
            The LFM2.5 models are hybrids, in Liquid AI&apos;s own builds.
          </Row>
          <Row label="Conversations">
            Nine from WildChat-1M, UltraChat 200k and Daring-Anteater, {pdTurns} turns in all. Each turn&apos;s prefill covers only its new tokens, {pdNewTokens[0]} to{" "}
            {grouped(pdNewTokens[1])} depending on the model.
          </Row>
          <Row label="Same work everywhere">
            Each turn decodes as many tokens as the dataset&apos;s reply ({pdReplyTokens.median} at the median, up to {grouped(pdReplyTokens.max)}, counted by Qwen3) and the next
            continues from the dataset&apos;s history, so all nine pairings do the same work.
          </Row>
          <Row label="Warm starts only">
            Before each pairing the benchmark waited up to {pdGate.maxS / 60} minutes for all three processors to read {pdGate.limitC} °C or less and the soft throttle to lift.
            Pairings that got there started cool and are not compared.
          </Row>
          <Row label="Cool starts rerun">
            LFM2.5 1.2B and Qwen3 1.7B were run again after a warm-up pass, and Qwen3 4B&apos;s GPU → CPU again on phone D, marked D in its matrices.
            {coolCells.length > 0 && ` ${andList(coolCells.map(({ m, p }) => `${short(m)}'s ${name(p)}`))} started cool; it is shown with a dashed border.`}
          </Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <div id="tilt" className="scroll-mt-28 lg:scroll-mt-16">
          <Rows>
            <Row label="One order">
              Each pairing inherits the heat of the ones before it, and the hard throttle lands on whichever is running. These are one shuffled order, so small gaps, such as LFM2.5
              2.6B&apos;s 0.4%, are within it.
            </Row>
            <Row label="Within a model">Models ran on different phones and do different work per token, so seconds do not compare across models.</Row>
            <Row label="Against the CPU">
              6 threads in every pairing; the matrix was not rerun at another count. With the hard throttle set by hand, 2 threads did not get stuck where 6 and 4 did.
            </Row>
            <Row label="Against the GPU">
              One backend, OpenCL, capped at 578 MHz in every pairing compared. On Qwen3 4B the GPU&apos;s median decode step rose from {pdThermal.gpuStep4b.before} ms at 1,024 to
              1,535 tokens of context to {pdThermal.gpuStep4b.after} ms at 2,048 to 2,559; an uncapped probe slowed at later turns too, and the cause was not identified.
            </Row>
            <Row label="The NPU">
              One llama.cpp build; newer builds change its NPU backend. NPU decode also uses the CPU for the output layer and the embedding lookup, for a share not measured.
            </Row>
            <Row label="One format">Q4_0 for all but one model, the format all three backends speed up. Other CPU formats were not tried.</Row>
            <Row label="Not measured">
              Energy, since the rack phones bypass their battery; a phone in a hand; a cold start; contexts past about 4,000 tokens; replies of the model&apos;s own length, or
              continuing from what it wrote; answer quality; memory for a split that keeps two copies of the model.
            </Row>
          </Rows>
        </div>
      </Section>
    </Post>
  );
}
