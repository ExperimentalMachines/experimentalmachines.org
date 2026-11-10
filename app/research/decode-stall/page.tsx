import { grouped } from "@/components/openweights/pd-parts";
import { Aligned, PairBars, Stack, TimeLines } from "@/components/research/Compare";
import Post, { Figure, Findings, More, Note, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import { PhoneSpecs, SchedTrace, ThreadChoice, ThreadLife } from "@/components/research/ThreadFigures";
import { benchmarkHeat, forcedTrip, heldPause, longSession, schedTraces, sessionHeat, shortPause, threadMatrix, threadPlacement } from "@/lib/decode-stall-data";
import { pdFix, pdLinks, pdPhone, pdSpecs, pdStall, pdTrigger } from "@/lib/prefill-decode";

const href = "/research/decode-stall/";

export const metadata = postMetadata(
  href,
  "On a Snapdragon 8 Elite Gen 5 the hard throttle takes six of eight cores out of use, and llama.cpp with more threads than the two left nearly stops writing the reply. A profile of the cause, the guard OpenWeights now carries, a llama.cpp change that did not work both ways, chat sessions against the throttle, and the throttle forced by heat.",
);

// r49 on phone A: the app's engine at each thread count, decode medians normally and with six cores out of use.
const tm = (n: number) => threadMatrix.find((r) => r.threads === n)!;
const at = (n: number) => ({ threads: n, normal: tm(n).decode.normal!, paused: tm(n).decode.paused! });
const app = at(pdStall.app.normal);
const two = at(2);
const kept = (r: { normal: number; paused: number }) => (100 * r.paused) / r.normal;
const share = (x: number) => (x < 10 ? `${x.toFixed(1)}%` : `${Math.round(x)}%`);
const rate = (x: number) => (x < 0.1 ? x.toFixed(3) : x.toFixed(2));
const g = pdFix.guard;
const y = pdFix.yield;
const mid = (r: number[]) => (r[0] + r[1]) / 2;
const slower = (a: number[], b: number[]) => Math.round(100 * (1 - mid(a) / mid(b)));
const later = (a: number[], b: number[]) => Math.round(100 * (mid(a) / mid(b) - 1));
const hottest = Math.max(longSession.peak, ...sessionHeat.map((s) => s.peak));
const ft = forcedTrip;
const coolRange = `${Math.min(...ft.cool.map((c) => c.decode))} to ${Math.max(...ft.cool.map((c) => c.decode))}`;
const secs = (ms: number) => (ms / 1000).toFixed(1);
const heldFall = heldPause.with.guard[0];
const shortFall = shortPause.with.guard.find((e) => e.event === "fell back")!;
const shortBack = shortPause.with.guard.find((e) => e.event === "back")!;
const unguarded = heldPause.without.points.at(-1)![1];
const twoOfSix = Math.round((100 * mid(y.normal2)) / mid(y.normal6));
const range = (r: number[], d = 1) => `${r[0].toFixed(d)} to ${r[1].toFixed(d)}`;
const pf = pdFix.profile;
const tr = schedTraces;
// One row of the thread-count figure: a job's median normally and with cores out of use, and the share kept.
type Pair = { normal: number | null; paused: number | null };
// The app writes with 4 threads but reads prompts with as many as the performance cores, so only the decode
// figure marks its usual count.
const matrixRow = (t: number, x: Pair, show: (v: number) => string, usual?: number) => ({
  label: t === usual ? `${t} threads, the app's usual` : `${t} thread${t > 1 ? "s" : ""}`,
  on: t === 2,
  cells: [
    x.normal === null ? null : { value: x.normal, shown: `${x.normal.toFixed(1)} tok/s` },
    x.paused === null ? null : { value: x.paused, shown: `${show(x.paused)} tok/s` },
    x.normal === null || x.paused === null ? null : { value: (100 * x.paused) / x.normal, shown: share((100 * x.paused) / x.normal) },
  ],
});
const leftOut = threadMatrix.reduce((n, r) => n + r.left.length, 0);
const pct = (x: number) => Math.round(x * 100);
// The paused trace's cores, each with the threads that ran on it and their shares of it.
const pausedCores = [0, 1].map((cpu) => ({ cpu, shares: tr.paused.shares.filter((s) => s.cpus.length === 1 && s.cpus[0] === cpu).map((s) => s.share) }));
// A range of shares as whole percents, one figure when both ends round the same.
const pctSpan = (xs: number[]) => (pct(Math.min(...xs)) === pct(Math.max(...xs)) ? `about ${pct(xs[0])}%` : `${pct(Math.min(...xs))}% to ${pct(Math.max(...xs))}%`);
const coreLine = (c: { cpu: number; shares: number[] }) => `${c.shares.length} on core ${c.cpu} at ${pctSpan(c.shares)} of it each`;
const parkedCores = pdSpecs[0].parked!;
// How many times longer one token took at 6 threads with six cores parked.
const slowdown6 = Math.round(at(6).normal / at(6).paused);
export default function DecodeStall() {
  return (
    <Post
      href={href}
      sources={[
        { label: "The report", href: pdLinks.stallReport },
        { label: "The guard's source", href: pdLinks.guard },
        { label: "Raw results, Snapdragon", href: pdLinks.results },
        { label: "Raw results, MediaTek", href: pdLinks.pocoResults },
        { label: "OpenWeights", href: "/openweights/" },
      ]}
      sourcesNote="Every figure here is in the OpenWeights report. The time charts are generated from its raw logs at a pinned commit."
    >
      <Section id="findings" title="What we found">
        <Findings
          items={[
            {
              headline: "When six cores go out of use, the reply nearly stops",
              line: `With six of the eight cores out of use, as the phone does on its own at ${pdTrigger.onC} °C, the app's engine writing with ${app.threads} threads fell from ${app.normal.toFixed(1)} to ${rate(app.paused)} tokens a second (a token is a small piece of text); with 2 threads it kept ${Math.round(kept(two))}% of its speed.`,
            },
            {
              headline: "Waiting threads hold the cores the working ones need",
              line: `With six cores out of use, the engine's six threads all ran on cores 0 and 1 and none left a core to sleep: switched out ${grouped(tr.paused.left.taken)} times in 2 s, they were still runnable every time. In a profile, ${Math.round(pf.pausedWait)}% of the CPU time was in the function that contains llama.cpp's waiting loop, against ${Math.round(pf.normalWait)}% normally.`,
            },
            {
              headline: "The app's engine now drops to 2 threads when a step stalls",
              line: `In two runs where heat took six cores out of use on its own, the one with this guard wrote ${ft.on.afterFallback} tokens a second after falling back, the one without ${ft.off.inPause} (${coolRange} cool); one run each, from separate heats.`,
            },
            {
              headline: "Making waiting threads give up their core was a trade-off",
              line: `Giving it up early kept ${range(y.paused10k)} tokens a second with six cores out of use but cut some normal replies to as little as ${y.normal10kShare[0]}% of their usual speed; giving it up late cost nothing measurable but kept only ${range(y.paused1m)}.`,
            },
            {
              headline: "No chat session was seen to reach the hard throttle",
              line: `The heaviest, three sessions with no break between turns run back to back, peaked ${(pdTrigger.onC - hottest).toFixed(1)} °C below the ${pdTrigger.onC} °C trip point over ${Math.round(longSession.minutes)} minutes, and the guard never dropped in ${pdFix.sessionTurns} turns of chat.`,
            },
            {
              headline: "Four threads with the guard, not two all the time",
              line: `Normally, with no cores taken out of use and a 1,751-token prompt, 2 threads wrote ${slower(g.noPause2, g.noPause4)}% slower than 4 on the Snapdragon and ${slower(pdFix.poco.two, pdFix.poco.four)}% slower on a MediaTek phone.`,
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="phones"
          title="When it overheats, the Snapdragon stops using six of its eight cores"
          lede="The two kinds of phone in this study, as read from the phones themselves."
          note="A core is one of the CPU's eight processors; the app writes the reply with several threads, ideally one per core; when the board reaches 78 °C, the Snapdragon stops running work on six cores until it cools, which we call the hard throttle. Core types and top clocks come from each phone's CPU registers and clock limits; the Snapdragon phones are Qualcomm's reference design for the chip."
        >
          <PhoneSpecs phones={pdSpecs} />
        </Figure>

        <Figure
          id="choice"
          title="The app picks how many threads; the phone decides which cores are in use"
          lede="A thread is a worker helping write the reply; a core is a processor that runs it. The app chooses how many threads, the phone how many cores."
          note="Speeds from the app's own engine on Snapdragon phone A, six cores taken out of use by hand. The rules are from its heat policy (ThermalPolicy.kt) and its guard (stall_guard.h); the exact ones are under Every number."
        >
          <ThreadChoice
            panels={[
              {
                title: "Writing, normally",
                caption: `${pdStall.app.normal} threads, each on a core of its own: ${app.normal.toFixed(1)} tokens a second.`,
                off: [],
                threads: [{ core: 2 }, { core: 3 }, { core: 6 }, { core: 7 }],
              },
              {
                title: "Writing, hard throttle, the usual 4",
                caption: `Only cores 0 and 1 run work, so two threads wait at a time: the reply crawls at ${rate(at(4).paused)} tokens a second.`,
                off: parkedCores,
                threads: [{ core: 0 }, { core: 1 }, { core: 0, waiting: true }, { core: 1, waiting: true }],
              },
              {
                title: "Writing, hard throttle, the guard's 2",
                caption: `Two threads, two cores, each has one again: ${rate(two.paused)} tokens a second, about ${Math.round(two.paused / at(4).paused)} times as fast.`,
                off: parkedCores,
                threads: [{ core: 0 }, { core: 1 }],
              },
            ]}
            rules={[
              { when: "Before each reply", write: `${pdStall.app.normal}, half the cores`, read: "6 on the Snapdragon, 8 on the POCO" },
              { when: "Android says warm", write: `${pdStall.app.light}`, read: `${pdStall.app.normal}` },
              { when: "Android says hot", write: `${pdStall.app.severe}`, read: `${pdStall.app.severe}` },
              { when: "Android says very hot", write: "does not start the reply", read: "does not read the prompt" },
              { when: "A reply stalls", write: "2, trying the usual count after 30 s or more", read: "2 until a try works" },
            ]}
            notes={[
              [
                "Why the guard times each step.",
                "On the Snapdragon we checked, Android's list of usable cores still showed all eight while six were out of use, so the app cannot count the cores left.",
              ],
              ["Why threads are not tied to cores.", "Linux allows it, but OpenWeights lets Android place its threads on any core the app may use."],
            ]}
          />
        </Figure>

        <Figure
          id="pause"
          title="With six cores out of use, the guard keeps the reply going"
          lede="Tokens written after six cores were taken out of use by hand, 10 seconds into a reply, with an earlier build of the guard and without."
          note={`Snapdragon test phone D, Qwen3 4B, 4 threads, a ${grouped(1751)}-token prompt, the six cores kept out of use to the end. The guard fell back to 2 threads ${Math.round(heldFall.at)} s in; the run without it wrote ${unguarded} tokens before its watchdog stopped it.`}
        >
          <TimeLines
            series={[
              { name: "With the guard", points: heldPause.with.points },
              { name: "Without it", points: heldPause.without.points },
            ]}
            xMax={300}
            xStep={60}
            yMax={1000}
            yStep={250}
            unit="Tokens"
            xLabel="Seconds since six cores went out of use"
            hover="{x} s after the cores went out of use"
            hoverUnit="tokens written"
            summary={`Tokens written through a hard throttle set by hand: with the guard the count climbs to ${heldPause.with.points.at(-1)![1]}; without it, to ${unguarded}.`}
            band={{ from: 0, to: 300, label: "Six cores out of use" }}
            marker={{ series: "With the guard", x: heldFall.at, label: "Falls back to 2 threads" }}
            stops={[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300]}
          />
        </Figure>

        <Figure
          id="threads"
          title="Every thread past the two cores left costs nearly all the speed, writing and reading"
          lede="How fast the app's own engine writes the reply (decode) and reads the prompt (prefill), normally and with six cores taken out of use by hand, for each number of threads."
          note={`Snapdragon phone A, Qwen3 4B, a 19-token prompt and up to 32 tokens of reply, both jobs at the same thread count, the guard off. Medians of three runs in each state, run in a shuffled order, each after a cooling gate. A run its 300 s watchdog stopped counts up to its last progress line; with cores out of use a run counts only if, in every sample taken once a second, the switches read on and each busy thread was last seen on core 0 or 1; where threads ran between samples is not known.${leftOut ? ` ${leftOut} paused run${leftOut > 1 ? "s" : ""} where that did not hold ${leftOut > 1 ? "are" : "is"} left out.` : ""} The two speed columns share a scale. The app's heat policy was not in the loop.`}
        >
          <div className="space-y-4">
            <p className="text-sm font-medium">Writing the reply (decode)</p>
            <Aligned
              label="Threads"
              head={["Normally", "Only 2 cores left", "Speed kept"]}
              missing="not measured"
              scales={[0, 0, 1]}
              rows={threadMatrix.map((r) => matrixRow(r.threads, r.decode, rate, app.threads))}
            />
            <p className="pt-2 text-sm font-medium">Reading the prompt (prefill)</p>
            <Aligned
              label="Threads"
              head={["Normally", "Only 2 cores left", "Speed kept"]}
              missing="not measured"
              scales={[0, 0, 1]}
              rows={threadMatrix.map((r) => matrixRow(r.threads, r.prefill, (x) => (x < 10 ? x.toFixed(2) : x.toFixed(1))))}
            />
          </div>
        </Figure>

        <Figure
          id="placement"
          title="With six cores out of use, six threads share the two left"
          lede={`Which thread each core ran, recorded by the phone's kernel over ${tr.paused.windowMs} ms of the app's own engine writing a reply with 6 threads, normally and with six cores taken out of use by hand.`}
          note={`Snapdragon phone A, Qwen3 4B. The kernel's scheduler events (sched_switch) for 2 s of decode in each state; the lanes show ${tr.paused.windowMs} ms from ${tr.paused.fromMs} ms into each recording, every stretch at its true width, and the shares are over the whole 2 s. Grey is any other task: here mostly the lab's screen streaming, the graphics driver and USB. Each switch records whether the thread it took off could still run: a thread that waited by sleeping would leave blocked and need waking, and in both recordings no engine thread did either (${tr.paused.left.gaveUp + tr.normal.left.gaveUp} blocked, ${tr.paused.woken + tr.normal.woken} woken). A thread that gave its core up by yielding would also leave runnable, which the trace cannot tell apart.`}
        >
          <SchedTrace
            panels={[
              {
                title: "Normally",
                caption: `Each thread ran ${pctSpan(tr.normal.shares.map((x) => x.share))} of the 2 s, a full core's worth; ${tr.normal.shares.filter((x) => x.cpus.length === 1).length} stayed on one core and ${tr.normal.shares.filter((x) => x.cpus.length > 1).length} moved between cores now and then.`,
                parked: [],
                ...tr.normal,
              },
              {
                title: "Six cores out of use",
                caption: `All six on cores 0 and 1: ${coreLine(pausedCores[0])}, ${coreLine(pausedCores[1])}. In 2 s an engine thread was switched out ${grouped(tr.paused.left.taken)} times, against ${grouped(tr.normal.left.taken)} normally, still runnable every time: none left its core to sleep.`,
                parked: parkedCores,
                ...tr.paused,
              },
            ]}
          />
        </Figure>

        <Figure
          id="cause"
          title="A finished thread keeps its core while the others wait for one"
          lede={`A token is hundreds of small operations, whether written or read; between them, every thread waits at a checkpoint for the rest. The recording above shows no thread leaving its core to sleep, and in a profile most of the sampled CPU time with two cores left was in the function that contains that wait. At 6 threads a token took about ${slowdown6} times as long.`}
          note={`A 6-thread decode's CPU time, sampled 1,000 times a second with six cores out of use and normally: Snapdragon test phone E, llama.cpp's benchmark tool, ${pdFix.profile.normalCores} cores busy on average normally and ${pdFix.profile.pausedCores} with six out of use. The samples were kept by function, so how that function's time splits between the wait and its other work is not known.`}
        >
          <div className="space-y-4">
            <ThreadLife
              steps={[
                {
                  when: "When the model loads",
                  gist: "The app makes its threads once",
                  picture: "made",
                  detail: "Normally one set, kept and reused: as many as the larger of its two counts, for reading the prompt and writing the reply.",
                },
                {
                  when: "For each token",
                  gist: "Hundreds of small operations, one after another",
                  picture: "ops",
                  detail: `Llama 3.2 3B's plan for one token has ${pdStall.graphNodes} steps; some are skipped or combined when it runs. Reading a chunk of the prompt works the same way.`,
                },
                {
                  when: "For each operation",
                  gist: "Each thread does its slice, then waits at a checkpoint",
                  picture: "checkpoint",
                  detail: "Most operations are split one slice per thread, and the threads meet at a checkpoint between them. When every thread is done, all start the next.",
                },
                {
                  when: "Between tokens",
                  gist: "With no work, they check, then sleep",
                  picture: "sleep",
                  detail:
                    "In llama.cpp's code, a thread with no new work checks for a short while, then sleeps. In the normal recording, about 45 tokens long, no engine thread left its core to sleep or was woken. A new thread count only picks how many of the set work.",
                },
              ]}
              footnote="Writing the reply (decode) and reading the prompt (prefill) both work this way, and both slow down with more threads than cores: the thread-count figure above shows each."
            />
            <Stack
              parts={["The function holding the wait", "Matrix and attention kernels"]}
              colors={["#d9480f", "#2b44e6"]}
              unsplit="Everything else"
              rows={[
                {
                  label: "Normal",
                  shares: [pdFix.profile.normalWait, pdFix.profile.normalKernels],
                  unsplit: Math.round((100 - pdFix.profile.normalWait - pdFix.profile.normalKernels) * 10) / 10,
                },
                {
                  label: "Six cores out of use",
                  shares: [pdFix.profile.pausedWait, pdFix.profile.pausedKernels],
                  unsplit: Math.round((100 - pdFix.profile.pausedWait - pdFix.profile.pausedKernels) * 10) / 10,
                },
              ]}
            />
          </div>
        </Figure>

        <Figure
          id="benchmark"
          title={`Nonstop benchmark work did reach the hard throttle, ${Math.round(benchmarkHeat.firstThrottle)} minutes in`}
          lede="The board sensor through the benchmark run that logged the natural hard throttles: a warm-up, nine pairings of one model, then a second model, back to back with only 2-minute waits to cool."
          note={`Snapdragon test phone C, 3 November: Qwen3 1.7B's warm-up and its nine pairings of CPU, GPU and NPU, then Qwen3 4B, ${Math.round(benchmarkHeat.minutes)} minutes in all. The sensor read ${benchmarkHeat.startC} °C at the start and ${benchmarkHeat.warmup.c} °C after the ${benchmarkHeat.warmup.minutes}-minute warm-up, and was logged every 2 seconds only from minute ${Math.round(benchmarkHeat.denseFrom)}, so the line starts there. Mean of each 30 s.`}
        >
          <TimeLines
            series={[{ name: "Benchmark, nonstop", points: benchmarkHeat.points, color: 3 }]}
            xMin={60}
            xMax={160}
            xStep={20}
            yMin={40}
            yMax={80}
            yStep={10}
            unit="°C"
            xLabel="Minutes into the run"
            hover="Minute {x} of the run"
            hoverUnit="°C"
            summary={`The board sensor through a nonstop benchmark run: it reached ${pdTrigger.onC} °C ${Math.round(benchmarkHeat.firstThrottle)} minutes in, and the hard throttle came on ${benchmarkHeat.throttles.length} times.`}
            rule={{ y: pdTrigger.onC, label: `Hard throttle trips at ${pdTrigger.onC} °C` }}
            spans={{ at: benchmarkHeat.throttles, label: "Hard throttle on" }}
            stops={[70, 80, 90, 100, 110, 120, 130, 140, 150]}
            digits={1}
          />
        </Figure>

        <Figure
          id="use"
          title="No chat session was seen to reach the hard throttle"
          lede="The board sensor that trips the hard throttle, through three chat sessions on one Snapdragon phone and three more run back to back on another."
          note={`Mean of each 30 s. Phones D and A in the rack, screen on, Qwen3 4B, 4 threads, the guard on, the study's nine conversations with each reply kept in the history. On phone A each session started the moment the one before ended, at minutes ${longSession.starts[1]} and ${longSession.starts[2]}, so that line counts from the first session's start; none of the phone's eleven switches of this kind was seen on in any of its ${grouped(longSession.samples)} samples, about one a second, though a crossing shorter than the gap between samples would not show. The benchmark run above did reach the trip.`}
        >
          <TimeLines
            series={[
              ...sessionHeat.map((s) => ({ name: s.pause === "none" ? "No break" : `${s.pause} between turns`, points: s.points })),
              { name: "No break, 3 in a row", points: longSession.points },
            ]}
            xMax={100}
            xStep={20}
            yMin={30}
            yMax={80}
            yStep={10}
            unit="°C"
            xLabel="Minutes since the session began"
            hover="Minute {x}"
            hoverUnit="°C"
            summary={`The XO thermistor through chat sessions: with 30 s between turns it peaked at ${sessionHeat[0].peak} °C, with 5 s at ${sessionHeat[1].peak}, with none at ${sessionHeat[2].peak}, and through three with none back to back, ${Math.round(longSession.minutes)} minutes, at ${longSession.peak}; the hard throttle trips at ${pdTrigger.onC}.`}
            rule={{ y: pdTrigger.onC, label: `Hard throttle trips at ${pdTrigger.onC} °C` }}
            stops={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90]}
            digits={1}
          />
        </Figure>

        <Figure
          id="forced"
          title="In two throttles forced by heat, the run with the guard kept writing"
          lede="Tokens written after the phone took six cores out of use on its own, in two runs heated until it did: one without the guard, one with it."
          note={`Snapdragon phone A, Qwen3 4B, 4 threads, a 19-token prompt and up to 256 tokens. Heated with busy loops and memory-copy loops at full brightness: ${ft.off.heatMinutes} minutes from ${ft.off.heatFromC} °C for the run without the guard, ${ft.on.heatMinutes} from ${ft.on.heatFromC} for the one with it. The cores were first seen out of use at ${ft.off.onC.toFixed(2)} and ${ft.on.onC.toFixed(2)} °C and back below 70 °C, ${ft.off.pauseS} and ${ft.on.pauseS} s later. Reading the prompt took ${secs(ft.off.promptMs)} and ${secs(ft.on.promptMs)} s, against about 0.2 cool, where the same work ran at ${coolRange} tokens a second. One run each on one phone, from separate heats, stopped at 256 tokens; the heaters stopped when a switch was seen on, so these pause lengths say nothing of how long the model's own load would keep one going. The lines step to each logged progress count, about four a second.`}
        >
          <TimeLines
            series={[
              { name: "With the guard", points: ft.on.points },
              { name: "Without it", points: ft.off.points },
            ]}
            xMax={75}
            xStep={15}
            yMax={256}
            yStep={64}
            unit="Tokens"
            xLabel="Seconds since the cores went out of use"
            hover="{x} s after the cores went out of use"
            hoverUnit="tokens written"
            summary={`Tokens written after heat took six cores out of use, one run each: with the guard, ${ft.on.afterFallback} a second between progress records after it fell back to 2 threads; without it, ${ft.off.inPause} a second until the cores were seen back ${ft.off.pauseS} s in.`}
            band={{ from: 0, to: ft.off.pauseS, label: "Out of use in both runs" }}
            spans={{ at: [{ from: ft.off.pauseS, to: ft.on.pauseS }], label: "Still out of use in the run with the guard" }}
            marker={{ series: "With the guard", x: ft.on.guard[0], label: "Falls back to 2 threads" }}
            stops={[0, 10, 20, 30, 40, 50, 60, 70]}
          />
        </Figure>

        <Figure
          id="cost"
          title="A fixed 2 threads costs more on MediaTek"
          lede="2 threads against 4 with no cores taken out of use, at the same realistic reply length on both phones."
          note={`Medians of two runs each, a ${grouped(1751)}-token prompt and up to ${grouped(1024)} tokens of reply: Snapdragon phone D, and a POCO X8 Pro Max on USB power.`}
        >
          <PairBars
            a="Snapdragon 8 Elite Gen 5"
            b="MediaTek MT6991"
            shortA="Snapdragon"
            shortB="MediaTek"
            shared
            rows={[
              {
                label: "Writing the reply",
                detail: "How much slower 2 threads are than 4",
                a: { value: slower(g.noPause2, g.noPause4), shown: `${slower(g.noPause2, g.noPause4)}% slower` },
                b: { value: slower(pdFix.poco.two, pdFix.poco.four), shown: `${slower(pdFix.poco.two, pdFix.poco.four)}% slower` },
              },
              {
                label: "The first token of the reply",
                detail: "How much later it comes with 2 threads",
                a: { value: later(g.firstToken2S, g.firstToken4S), shown: `${later(g.firstToken2S, g.firstToken4S)}% later` },
                b: { value: later(pdFix.poco.firstToken2S, pdFix.poco.firstToken4S), shown: `${later(pdFix.poco.firstToken2S, pdFix.poco.firstToken4S)}% later` },
              },
            ]}
          />
        </Figure>

        <More
          id="numbers"
          title="Every number"
          summary="The guard's runs, the llama.cpp waits, where the threads ran, the app's rules, the six natural throttles, every chat session and the thread counts"
        >
          <Table
            label="The guard against six cores taken out of use by hand"
            head={["Six cores out of use", "With the guard", "Without it", "What the guard did"]}
            min="44rem"
            rows={[
              [
                "For the rest of the reply",
                `${g.pausedOn[0]} to ${g.pausedOn[1]} tok/s`,
                `${g.pausedOff[0]} to ${g.pausedOff[1]} tok/s`,
                `Fell back ${g.fellBackHeldS[0]} to ${g.fellBackHeldS[1]} s in; each try at 4 threads cost one stalled step of ${g.tryCostS[0]} to ${g.tryCostS[1]} s`,
              ],
              [
                "For 30 seconds, mid-reply",
                `Reply written in ${g.shortPauseOn[0]} to ${g.shortPauseOn[1]} s`,
                `${g.shortPauseOff[0]} to ${g.shortPauseOff[1]} s`,
                `Fell back ${g.fellBackShortS[0]} to ${g.fellBackShortS[1]} s in; back to 4 threads ${g.returnedAfterS[0]} to ${g.returnedAfterS[1]} s after it ended`,
              ],
              [
                "None logged",
                `${g.noPause4Guard} tok/s, and 8.90 in a run where it fell back`,
                `${g.noPause4[0]} and ${g.noPause4[1]} tok/s`,
                "Nothing in one run. In another, two steps of 3.9 and 4.8 s with no logged switch set, and it fell back for the last 10 s",
              ],
            ]}
          />
          <Note>
            Snapdragon test phone D, Qwen3 4B, a {grouped(1751)}-token prompt, up to {grouped(1024)} tokens; three runs with the guard and three without for cores out of use to the
            end, three and two for cores out of use for 30 seconds. In the latest 30-second run the guard fell back {Math.round(shortFall.at)} s in and was back{" "}
            {Math.round(shortBack.at - shortPause.pauseSeconds.with)} s after the cores came back, at its first try.
          </Note>
          <Table
            label="The wait inside llama.cpp"
            head={["The wait", "Decode with six cores out of use", "Decode normally"]}
            min="40rem"
            rows={[
              ["Stock: never gives up its core", "No turn finished in 300 s with 6 threads", "Stock"],
              [
                "Gives it up after 10,000 checks",
                `${range(y.paused10k)} tok/s with 6 or 4 threads`,
                `${y.normal10kShare[0]}% to ${y.normal10kShare[1]}% of stock on the turns it slowed; others unchanged`,
              ],
              ["Gives it up after 1,000,000 checks", `${range(y.paused1m)} tok/s with 6 and 4 threads`, "Within run-to-run variation of stock"],
              ["Stock, with 2 threads", `${y.stockPaused2} tok/s`, `${twoOfSix}% of 6 threads (${range(y.normal2)} against ${range(y.normal6)} tok/s)`],
            ]}
          />
          <Note>
            The benchmark on the same three turns of Qwen3 4B: the changed waits on phones E and D, stock 2 against 6 threads on phone B. A budget between the two was not tried.
          </Note>
          <Note>
            The scheduler traces (phone A, 2 s each): normally the six engine threads ran in {grouped(tr.normal.stretches.count)} stretches with a median of{" "}
            {tr.normal.stretches.medianMs} ms; with six cores out of use, in {grouped(tr.paused.stretches.count)} with a median of {tr.paused.stretches.medianMs} ms. Then cores 0
            and 1 ran engine threads {pct(tr.paused.cores[0].engine)}% and {pct(tr.paused.cores[1].engine)}% of the time and other tasks {pct(tr.paused.cores[0].other)}% and{" "}
            {pct(tr.paused.cores[1].other)}%, and cores 2 to 7 logged {tr.paused.cores.slice(2).every((c) => c.events === 0) ? "no switch at all" : "a few switches"}. An engine
            thread was switched out {grouped(tr.normal.left.taken)} times normally and {grouped(tr.paused.left.taken)} times with six cores out of use, still runnable every time;
            it left blocked {tr.normal.left.gaveUp + tr.paused.left.gaveUp} times and was woken {tr.normal.woken + tr.paused.woken} times. An earlier run on phone B, with
            llama.cpp&apos;s own benchmark and the phone&apos;s own throttles, sampled every 2 s, put the six on cores 0 and 1 at a median{" "}
            {Math.round(threadPlacement.paused.share * 100)}% of a core each.
          </Note>
          <Note>
            The app&apos;s rules. Before each reply, half the cores, never under 2 or over 6. Warm is Android&apos;s light or moderate heat status, hot is severe, very hot is
            critical or worse. A slow step takes over a quarter of a second and more than 8 times the recent normal step, or more than 2 s over it; before the guard has seen enough
            steps, any step over 1.5 s. A try comes after at least four steps at 2 threads, and keeps the planned count if its step is within 3 times the recent 2-thread step and
            within 2 s of it. A fallback carries over to later replies until a try works, which restores both counts.
          </Note>
          <Table
            label="Six natural hard throttles, logged every 2 seconds"
            head={["On", "Off", "Length", "Decoding", "Decode stuck"]}
            min="36rem"
            rows={pdStall.events.map((e) => [e.on, e.off, `${e.seconds} s`, `${e.decode}, ${e.model}`, e.stuck || "No"])}
          />
          <Note>
            3 November 2026, during the prefill and decode matrix: each time the CPU was writing the reply, it was stuck while the cores were out of use, to within a few seconds.
            The NPU kept writing through its throttle.
          </Note>
          <Note>
            An earlier run on phone B recorded where the threads ran: during hard throttles the busy ones were on cores 0 and 1 in 99.7% of samples, against all 8 cores the rest of
            the time. A sample shows only the last core a thread ran on.
          </Note>
          <Table
            label="The hard throttle forced by heat"
            head={["Run", "Heated", "Cores out of use", "Reading the 19-token prompt", "Writing while out of use", "The guard"]}
            min="52rem"
            rows={[
              [
                "Without the guard",
                `${ft.off.heatMinutes} min from ${ft.off.heatFromC} °C`,
                `First seen at ${ft.off.onC.toFixed(1)} °C, about ${ft.off.pauseS} s`,
                `${secs(ft.off.promptMs)} s`,
                `${ft.off.inPause} tok/s`,
                "Off",
              ],
              [
                "With the guard",
                `${ft.on.heatMinutes} min from ${ft.on.heatFromC} °C`,
                `First seen at ${ft.on.onC.toFixed(1)} °C, about ${ft.on.pauseS} s`,
                `${secs(ft.on.promptMs)} s`,
                `${ft.on.inPause} tok/s, ${ft.on.afterFallback} after the fall-back`,
                `Fell back ${ft.on.guard[0]} s in`,
              ],
              ["Cool, before heating", "", "", `${ft.cool.map((c) => c.promptMs).join(" and ")} ms`, `${ft.cool.map((c) => c.decode).join(" and ")} tok/s`, "Off, then on"],
            ]}
          />
          <Note>
            Snapdragon phone A, the build with the guard&apos;s final rules. The edges of each stretch come from a log read about once a second. In a third run with the guard,
            started after the cores had come back (board at {ft.afterTrip.xo} °C), a decode step took {(ft.afterTrip.stepMs / 1000).toFixed(1)} s against a normal{" "}
            {ft.afterTrip.normalMs} ms with none of the eleven switches seen on in the {ft.afterTrip.sampled} samples during the stall, while the hottest CPU sensor fell from{" "}
            {ft.afterTrip.cpuBefore} to {ft.afterTrip.cpuLow} °C; the guard fell back, and the cause is not known.
          </Note>
          <Table
            label="Chat sessions against the throttle"
            head={["Phone", "Between turns", "Turns", "Hottest", "Hard throttle (Snapdragon) or Android status (POCO)", "Decode, tok/s", "First token, s, median (longest)"]}
            min="52rem"
            rows={pdFix.sessions.map((r) => [r.phone, r.pause, `${r.turns} in ${r.minutes} min`, r.peak, r.hard, r.decode.toFixed(1), r.first])}
          />
          <Note>
            The POCO&apos;s rows give Android&apos;s thermal status, since an app cannot read its throttle; it was charging. The two-minute first tokens followed a cache miss of{" "}
            {pdFix.cacheMiss.tokens} tokens whose cause was not traced.
          </Note>
          <Table
            label="2 threads against 4, no cores taken out of use"
            head={["Phone", "Writing, tok/s, 4 then 2 threads", "First token, s, 4 then 2 threads"]}
            min="36rem"
            rows={[
              ["Snapdragon", `${g.noPause4.join(", ")}; ${g.noPause2.join(", ")}`, `${g.firstToken4S.join(" to ")}; ${g.firstToken2S.join(" to ")}`],
              ["MediaTek", `${pdFix.poco.four.join(", ")}; ${pdFix.poco.two.join(", ")}`, `${pdFix.poco.firstToken4S.join(" to ")}; ${pdFix.poco.firstToken2S.join(" to ")}`],
            ]}
          />
          <Note>
            The thread count also changes the text: 6 threads against 2 changed {pdFix.agreement.changed} of {pdFix.agreement.of} replies, while the same count gave identical
            replies on two phones.
          </Note>
        </More>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="Phones">
            {pdPhone.soc} phones A, B, C, D and E, Qualcomm&apos;s reference design, in Qualcomm Device Cloud&apos;s rack, root shell, AC power, 3 to 10 November 2026. A POCO X8
            Pro Max (MediaTek Dimensity 9500s) on USB power for two sessions and 2 threads against 4. Their specifications are in{" "}
            <a href="#phones" className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
              the first figure
            </a>
            .
          </Row>
          <Row label="Cores out of use">
            The phone does it on its own at 78 °C. For the tests we flipped the same two switches by hand after letting the phone cool, as root on the rack phones, which an app
            cannot do, and checked that work then ran only on cores 0 and 1. Twice, on phone A, we heated it with busy loops and memory-copy loops until the switches came on by
            themselves.
          </Row>
          <Row label="Runtime">
            llama.cpp {pdPhone.llamacpp}: its benchmark on B and C for the natural-heat runs, on B for the first runs by hand, and on E and D for the profile and the llama.cpp
            change; the app&apos;s own engine, every decode step timed, on A for the thread counts and the scheduler traces, on D for the guard and the sessions, and on A for the
            longest sessions and the forced throttle.
          </Row>
          <Row label="Model">Qwen3 4B in Q4_0 for every run set up for this post; the six logged throttles came from the matrix, on Qwen3 1.7B and 4B.</Row>
          <Row label="The guard">
            Two slow steps in a row (over a quarter of a second, and more than 8 times the recent normal step or more than 2 s over it) drop decode and prompt reading to 2 threads;
            after at least 30 s and four steps at 2 threads it tries its count again. Codex reviewed it seven times.
          </Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="One chip">
            Taking cores out of use is a Qualcomm mechanism, measured on the SM8850 only. The MediaTek phone checked what 2 threads cost and that the guard stays quiet.
          </Row>
          <Row label="Cores taken out by hand">
            The final rules have met cores out of use once, in a throttle forced by heat rather than by chat, on one phone, a 19-token prompt and 256 tokens, against one run
            without the guard from a separate heat; the runs with cores taken out by hand used earlier builds. One of {g.pausesSet} attempts by hand did not hold and two more
            probably did not; those runs are left out.
          </Row>
          <Row label="What the guard misses">
            Cores going out of use while the prompt is being read: in the forced throttle 19 tokens took {secs(ft.on.promptMs)} s with the guard on. And twice it fell back on steps
            of about 4 s with none of the logged switches on, once when the logger read three of the phone&apos;s eleven switches of this kind and once when it read all eleven; the
            cause is not known.
          </Row>
          <Row label="The sessions">
            Rack phones and a phone on a desk, not in a hand or a pocket. The longest, {Math.round(longSession.minutes)} minutes with no break on phone A, came within{" "}
            {(pdTrigger.onC - longSession.peak).toFixed(1)} °C of the trip with no switch seen on; gaps between samples could hide a brief crossing, and a longer session, a warmer
            room or a phone in a hand was not tested.
          </Row>
          <Row label="Not measured">Energy and battery; which version of a reply the thread count changed is better.</Row>
        </Rows>
      </Section>
    </Post>
  );
}
