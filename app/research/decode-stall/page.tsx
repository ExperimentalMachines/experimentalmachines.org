import { grouped } from "@/components/openweights/pd-parts";
import { Aligned, PairBars, Stack, TimeLines } from "@/components/research/Compare";
import Post, { Figure, Findings, More, Note, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import { PhoneSpecs, ThreadChoice, ThreadPlacement, WaitLanes } from "@/components/research/ThreadFigures";
import { heldPause, sessionHeat, shortPause, threadPlacement } from "@/lib/decode-stall-data";
import { pdFix, pdLinks, pdPhone, pdSpecs, pdStall, pdTrigger } from "@/lib/prefill-decode";

const href = "/research/decode-stall/";

export const metadata = postMetadata(
  href,
  "On a Snapdragon 8 Elite Gen 5 the hard throttle parks six of eight cores, and llama.cpp with more decode threads than the two left nearly stops. A profile of the cause, the guard OpenWeights now carries, a llama.cpp change that did not work both ways, and chat sessions against the throttle.",
);

const at = (n: number) => pdFix.byThreads.find((r) => r.threads === n)!;
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
const hottest = Math.max(...sessionHeat.map((s) => s.peak));
const heldFall = heldPause.with.guard[0];
const shortFall = shortPause.with.guard.find((e) => e.event === "fell back")!;
const shortBack = shortPause.with.guard.find((e) => e.event === "back")!;
const unguarded = heldPause.without.points.at(-1)![1];
const twoOfSix = Math.round((100 * mid(y.normal2)) / mid(y.normal6));
const range = (r: number[], d = 1) => `${r[0].toFixed(d)} to ${r[1].toFixed(d)}`;
const pf = pdFix.profile;
const placed = threadPlacement;
const parkedCores = pdSpecs[0].parked!;
// How many times longer one token took at 6 threads with six cores parked.
const slowdown6 = Math.round(at(6).normal / at(6).paused);
// One token's work as lanes, drawn to the profile: normally each of six threads has a core; parked, three take
// turns on each of the two cores left, each turn split between work and waiting as the profile splits it.
const lanes = {
  normal: [0, 1, 2, 3, 4, 5].map((core) => ({
    core,
    segs: [
      { w: pf.normalKernels, kind: "work" as const, label: `T${core + 1}` },
      { w: pf.normalWait, kind: "wait" as const },
      { w: 100 - pf.normalKernels - pf.normalWait, kind: "other" as const },
    ],
  })),
  parked: [0, 1].map((core) => ({
    core,
    segs: [
      ...[0, 1, 2].flatMap((k) => [
        { w: pf.pausedKernels / 3, kind: "work" as const, label: `T${core + 1 + 2 * k}` },
        { w: pf.pausedWait / 3, kind: "wait" as const },
      ]),
      { w: 100 - pf.pausedKernels - pf.pausedWait, kind: "other" as const },
    ],
  })),
};

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
      sourcesNote="Every figure here is in the OpenWeights report. The two time charts are generated from its raw logs at a pinned commit."
    >
      <Section id="findings" title="What we found">
        <Findings
          items={[
            {
              headline: "When six cores go out of use, the reply nearly stops",
              line: `With six of the eight cores out of use, as the phone does on its own at ${pdTrigger.onC} °C, the app's engine writing with ${app.threads} threads fell from ${app.normal.toFixed(1)} to ${app.paused} tokens a second; with 2 threads it kept ${Math.round(kept(two))}% of its speed.`,
            },
            {
              headline: "Waiting threads hold the cores the working ones need",
              line: `With six cores out of use, six threads shared the two cores left at a median ${Math.round(placed.paused.share * 100)}% of a core per thread, and ${Math.round(pf.pausedWait)}% of the CPU time was in the function that contains llama.cpp's waiting loop, against ${Math.round(pf.normalWait)}% normally.`,
            },
            {
              headline: "The app's engine now drops to 2 threads when a step stalls",
              line: `With six cores taken out of use by hand, earlier builds of this guard wrote ${g.pausedOn[0]} to ${g.pausedOn[1]} tokens a second against ${g.pausedOff[0]} to ${g.pausedOff[1]} without it, and it never dropped in ${pdFix.sessionTurns} turns of ordinary chat.`,
            },
            {
              headline: "Making waiting threads give up their core was a trade-off",
              line: `Giving it up early kept ${range(y.paused10k)} tokens a second with six cores out of use but cut some normal replies to as little as ${y.normal10kShare[0]}% of their usual speed; giving it up late cost nothing measurable but kept only ${range(y.paused1m)}.`,
            },
            {
              headline: "Our chat sessions never reached the hard throttle",
              line: `The heaviest, with no break between turns, peaked ${(pdTrigger.onC - hottest).toFixed(1)} °C below the ${pdTrigger.onC} °C trip point after ${sessionHeat.find((x) => x.pause === "none")!.minutes} minutes on the Snapdragon.`,
            },
            {
              headline: "Four threads with the guard, not two all the time",
              line: `Normally, with no cores taken out of use, 2 threads wrote ${slower(g.noPause2, g.noPause4)}% slower than 4 on the Snapdragon and ${slower(pdFix.poco.two, pdFix.poco.four)}% slower on a MediaTek phone.`,
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
          title="Every thread past the two cores left costs nearly all the speed"
          lede="How fast the app's own engine writes normally and with six cores taken out of use by hand, for each number of threads."
          note="Phone E, Qwen3 4B, a 19-token prompt and a 64-token reply. Medians of four runs in each state, two with 6 threads, whose runs with cores out of use a watchdog stopped. The app's heat policy was not in the loop."
        >
          <Aligned
            label="Threads"
            head={["Normally", "Only 2 cores left", "Speed kept"]}
            rows={pdFix.byThreads.map((r) => ({
              label: r.threads === app.threads ? `${r.threads} threads, the app's usual` : `${r.threads} threads`,
              on: r.threads === 2,
              cells: [
                { value: r.normal, shown: `${r.normal.toFixed(1)} tok/s` },
                { value: r.paused, shown: `${rate(r.paused)} tok/s` },
                { value: kept(r), shown: share(kept(r)) },
              ],
            }))}
          />
        </Figure>

        <Figure
          id="placement"
          title="With six cores out of use, six threads share the two left"
          lede="Where each of six decode threads ran in one 2-second sample, and how much of a core it got, on a Snapdragon phone in its own hard throttles."
          note={`Snapdragon test phone B, llama.cpp's benchmark tool, Qwen3 4B, 6 threads, each thread's last core and CPU time read every 2 s; whether cores were out of use came from a log read every 5 s, so a sample at the edge may be misfiled. In all ${placed.paused.intervals} samples with the six busy and cores out of use, their last cores numbered ${placed.paused.cores[0]} or ${placed.paused.cores[1]} and a thread got a median ${Math.round(placed.paused.share * 100)}% of a core; in the ${placed.normal.intervals} with no switch logged, ${placed.normal.cores[0]} or ${placed.normal.cores[1]}, about a whole core each. The two samples drawn are examples: the first that spread over six cores, and one well inside a stretch with cores out of use, near the median. Shares over a whole core, from whole-second timestamps, show as 100%.`}
        >
          <ThreadPlacement
            panels={[
              { title: "Normally", caption: "Each thread on a core of its own, about a whole core each.", threads: placed.normal.sample.threads, parked: [] },
              {
                title: "Six cores out of use",
                caption: `All six on cores 0 and 1, a median ${Math.round(placed.paused.share * 100)}% of a core per thread across every sample.`,
                threads: placed.paused.sample.threads,
                parked: parkedCores,
              },
            ]}
          />
        </Figure>

        <Figure
          id="cause"
          title="A finished thread keeps its core while the others wait for one"
          lede="llama.cpp's threads wait for each other hundreds of times per token, and a waiting thread keeps checking on its core instead of giving it up, so with more threads than cores the waiters hold the cores the working threads need."
          note={`A 6-thread decode's CPU time, sampled 1,000 times a second with six cores out of use and normally: Snapdragon test phone E, llama.cpp's benchmark tool, ${pdFix.profile.normalCores} cores busy on average normally and ${pdFix.profile.pausedCores} with six out of use. The samples were kept by function, so how that function's time splits between the wait and its other work is not known.`}
        >
          <div className="space-y-4">
            <WaitLanes
              caption={`An illustration of one token's work: which thread runs when, and each thread's share, are invented; each panel's split between work, the wait function and other work is the measured profile's below, which cannot separate the wait from that function's other work. Not to one time scale: with six cores out of use, a token took about ${slowdown6} times as long at 6 threads.`}
              panels={[
                { title: "Normally", note: "Each thread has a core of its own: it works, waits a moment for the slowest, and moves on.", lanes: lanes.normal },
                {
                  title: "Six cores out of use",
                  note: "Three threads take turns on each core. One that has finished keeps its core in the wait function, checking in a loop, so the threads with work left wait for a turn.",
                  lanes: lanes.parked,
                },
              ]}
            />
            <Stack
              parts={["The wait function", "Matrix and attention kernels"]}
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
          id="choice"
          title={`The app starts at ${pdStall.app.normal} threads and drops to ${pdStall.app.severe} when the phone is hot or a reply stalls`}
          lede="How OpenWeights picks the number of threads that write each reply, in three steps from its code."
          note="Steps 1 and 2 are the app's heat policy (ThermalPolicy.kt): warm is Android's light or moderate heat status, hot is severe, very hot is critical or worse. Step 3 is the guard (stall_guard.h): a slow step takes over a quarter of a second and more than 8 times the recent normal step, or more than 2 s over it, and before it has seen enough steps, any step over 1.5 s. A try comes after at least four steps at 2 threads, and keeps the planned count if its step is within 3 times the recent 2-thread step and within 2 s of it."
        >
          <ThreadChoice normal={pdStall.app.normal} warm={pdStall.app.light} hot={pdStall.app.severe} fallback={2} retrySeconds={30} />
        </Figure>

        <Figure
          id="use"
          title="Our chat sessions never reached the hard throttle"
          lede="The board sensor that trips the hard throttle, through three chat sessions on the Snapdragon."
          note="Mean of each 30 s. Phone D in the rack, screen on, Qwen3 4B, 4 threads, the guard on, the study's nine conversations with each reply kept in the history. The heaviest was still warming slowly when its conversations ran out."
        >
          <TimeLines
            series={sessionHeat.map((s) => ({ name: s.pause === "none" ? "No break" : `${s.pause} between turns`, points: s.points }))}
            xMax={42}
            xStep={10}
            yMin={40}
            yMax={80}
            yStep={10}
            unit="°C"
            xLabel="Minutes into the session"
            hover="Minute {x} of the session"
            hoverUnit="°C"
            summary={`The XO thermistor through three chat sessions: with 30 s between turns it peaked at ${sessionHeat[0].peak} °C, with 5 s at ${sessionHeat[1].peak}, with none at ${sessionHeat[2].peak}; the hard throttle trips at ${pdTrigger.onC}.`}
            rule={{ y: pdTrigger.onC, label: `Hard throttle trips at ${pdTrigger.onC} °C` }}
            stops={[0, 5, 10, 15, 20, 25, 30, 35, 40]}
            digits={1}
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
                label: "The first word",
                detail: "How much later it comes with 2 threads",
                a: { value: later(g.firstToken2S, g.firstToken4S), shown: `${later(g.firstToken2S, g.firstToken4S)}% later` },
                b: { value: later(pdFix.poco.firstToken2S, pdFix.poco.firstToken4S), shown: `${later(pdFix.poco.firstToken2S, pdFix.poco.firstToken4S)}% later` },
              },
            ]}
          />
        </Figure>

        <More id="numbers" title="Every number" summary="The guard's runs, the llama.cpp waits, the six natural throttles, every chat session and the thread counts">
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
            head={["Phone", "Writing, tok/s, 4 then 2 threads", "First word, s, 4 then 2 threads"]}
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
            {pdPhone.soc} phones B, D and E, Qualcomm&apos;s reference design, in Qualcomm Device Cloud&apos;s rack, root shell, AC power, 3 to 10 November 2026. A POCO X8 Pro Max
            (MediaTek Dimensity 9500s) on USB power for two sessions and 2 threads against 4. Their specifications are in{" "}
            <a href="#phones" className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
              the first figure
            </a>
            .
          </Row>
          <Row label="Cores out of use">
            The phone does it on its own at 78 °C. For the tests we flipped the same two switches by hand after letting the phone cool, as root on the rack phones, which an app
            cannot do, and checked that work then ran only on cores 0 and 1.
          </Row>
          <Row label="Runtime">
            llama.cpp {pdPhone.llamacpp}: its benchmark on B for the natural-heat runs and the first runs by hand, and on E and D for the profile and the llama.cpp change; the
            app&apos;s own engine, every decode step timed, on E for the thread counts and on D for the guard and the sessions.
          </Row>
          <Row label="Model">Qwen3 4B in Q4_0 for every run set up for this post; the six logged throttles came from the matrix, on Qwen3 1.7B and 4B.</Row>
          <Row label="The guard">
            Two slow steps in a row (over a quarter of a second, and more than 8 times the recent normal step or more than 2 s over it) drop decode and prompt reading to 2 threads;
            every 30 s it tries its count again. Codex reviewed it seven times.
          </Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="One chip">
            Taking cores out of use is a Qualcomm mechanism, measured on the SM8850 only. The MediaTek phone checked what 2 threads cost and that the guard stays quiet.
          </Row>
          <Row label="Cores taken out by hand">
            No natural hard throttle came while the guard ran, and those runs used earlier builds: the final rules have not yet run with cores out of use. One of {g.pausesSet}{" "}
            attempts by hand did not hold and two more probably did not; those runs are left out.
          </Row>
          <Row label="What the guard misses">
            Cores going out of use while the prompt is being read. And in one run with none of the logged switches set it fell back after two steps of about 4 s whose cause is not
            known: the logger read three of the phone&apos;s eleven switches of this kind.
          </Row>
          <Row label="The sessions">A rack phone and a phone on a desk, not in a hand or a pocket. A longer session than the heaviest might have reached the trip.</Row>
          <Row label="Not measured">Energy and battery; which version of a reply the thread count changed is better.</Row>
        </Rows>
      </Section>
    </Post>
  );
}
