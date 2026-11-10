import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import { grouped } from "@/components/openweights/pd-parts";
import Post, { Figure, Findings, Note, P, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import { pdFix, pdLinks, pdPhone, pdStall, pdThermal, pdTrigger } from "@/lib/prefill-decode";

const href = "/research/decode-stall/";

export const metadata = postMetadata(
  href,
  "On a Snapdragon 8 Elite Gen 5 the hard throttle parks six of eight cores, and llama.cpp with more decode threads than the two left nearly stops. A profile of the cause, the guard OpenWeights now carries, a llama.cpp change that did not work both ways, and chat sessions against the throttle.",
);

const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const at = (n: number) => pdFix.byThreads.find((r) => r.threads === n)!;
const app = at(pdStall.app.normal);
const two = at(2);
const kept = (r: { normal: number; paused: number }) => (100 * r.paused) / r.normal;
const g = pdFix.guard;

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
      sourcesNote="Every figure here is in the OpenWeights report, with the scripts, logs and result files it was computed from beside it."
    >
      <Section id="findings" title="What we found">
        <Findings
          items={[
            {
              headline: "Six cores pause, and decode nearly stops",
              line: (
                <>
                  At {pdTrigger.onC} °C on one board sensor the phone parks six of its eight CPU cores until it cools to {pdTrigger.offC} °C. With the pause set by hand, the
                  app&apos;s own engine at its usual {app.threads} threads decoded at {app.paused} tokens a second against {app.normal}: about a hundredth. With 2 threads it kept{" "}
                  {Math.round(kept(two))}% of its rate.
                </>
              ),
            },
            {
              headline: "The cause: threads that spin while they wait",
              line: (
                <>
                  llama.cpp&apos;s threads wait for each other hundreds of times per token, and a waiting thread holds its core. A profile put {pdFix.profile.pausedWait}% of a paused
                  6-thread run&apos;s CPU time in the function that holds that wait, against {pdFix.profile.normalWait}% unpaused.
                </>
              ),
            },
            {
              headline: "A guard in the app brings most of it back",
              line: (
                <>
                  The engine now drops to 2 threads after two stalled steps and tries its count again every 30 seconds. Through a pause that stayed it wrote {g.pausedOn[0]} to{" "}
                  {g.pausedOn[1]} tokens a second against {g.pausedOff[0]} to {g.pausedOff[1]} without it, and it never fell back in {pdFix.sessionTurns} turns of chat on two phones.
                </>
              ),
            },
            {
              headline: "Fixing the wait inside llama.cpp did not work both ways",
              line: (
                <>
                  A wait that gives up its core early kept {pdFix.yield.paused10k[0]} to {pdFix.yield.paused10k[1]} tokens a second in the pause but slowed normal decode on some
                  turns; one that gives it up late cost nothing measurable and saved little. Two threads beat both.
                </>
              ),
            },
            {
              headline: "Chat did not reach the hard throttle",
              line: (
                <>
                  Three sessions of 30 to 41 minutes on the Snapdragon, the heaviest with no pause between turns, held the soft throttle and peaked 1.6 °C under the trip. A phone
                  in a hand was not measured.
                </>
              ),
            },
            {
              headline: "Four threads with the guard, not two all the time",
              line: (
                <>
                  Without a pause, 2 threads decoded {g.twoThreadsCostPct}% slower than 4 on the Snapdragon and {pdFix.poco.decodeCostPct}% slower on a MediaTek phone. The guard
                  pays that only during a stall.
                </>
              ),
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="stuck"
          title="What happens"
          lede="The phone throttles itself in two steps as it heats. The second, the hard throttle, is the one that stops CPU decode."
        >
          <div className="space-y-4">
            <P>
              The soft throttle caps the CPU and GPU clocks at about half and stays on through heavy work. The hard throttle comes and goes: when the XO thermistor, a sensor on
              the board, reaches {pdTrigger.onC} °C, the phone parks cores 2 to 7 and leaves two, until it reads under {pdTrigger.offC} °C. Hard throttles lasted{" "}
              {pdThermal.stretchMinutes[0]} to {pdThermal.stretchMinutes[1]} minutes, most of them about one.
            </P>
            <P>
              A log of the thermistor and the throttle switches every 2 seconds caught six hard throttles in a row. Each time the CPU was decoding, it was stuck for that same
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
            Local time, 3 November 2026, during the{" "}
            <Go href="/research/prefill-decode/" className={link}>
              prefill and decode matrix
            </Go>
            , which has what the stalls cost each pairing. A fourth phone (D) logged {pdStall.phoneD.events} more at the same switch points ({pdStall.phoneD.onC[0].toFixed(1)}{" "}
            to {pdStall.phoneD.onC[1].toFixed(1)} °C on, {pdStall.phoneD.offC[0].toFixed(1)} to {pdStall.phoneD.offC[1].toFixed(1)} °C off).
          </Note>
        </Figure>

        <Figure id="cause" title="Why it happens" lede="More threads than cores, and a wait that does not let go of its core.">
          <div className="space-y-4">
            <P>
              llama.cpp computes each token as a chain of operations ({grouped(pdStall.graphNodes)} in Llama 3.2 3B&apos;s plan). Many are split across the threads, and the
              threads wait for each other before the next one starts: hundreds of times per token.
            </P>
            <P>
              The hard throttle leaves 2 cores, so only 2 of the threads can run at a time. A thread that has finished its part does not give up its core. Unlike a Python
              thread waiting for the global interpreter lock (GIL), which sleeps, it keeps checking whether the others are done until the scheduler moves it off, while the
              threads with work left wait for a core.
            </P>
            <P>
              A profile on phone E shows it. With the pause set by hand, {pdFix.profile.pausedWait}% of a 6-thread decode&apos;s CPU time was in the function that holds that
              wait, against {pdFix.profile.normalWait}% unpaused, while the matrix and attention kernels&apos; share fell from about {pdFix.profile.normalKernels}% to{" "}
              {pdFix.profile.pausedKernels}%, on {pdFix.profile.pausedCores} cores busy on average against {pdFix.profile.normalCores}. The profile is by function, so the split
              inside that function between the wait and its other work is not in it.
            </P>
            <P>
              An earlier run on phone B recorded where the threads ran. During hard throttles the busy threads were on cores 0 and 1 in 99.7% of samples, against all 8 cores
              the rest of the time: consistent with this account, though a sample shows only the last core a thread ran on.
            </P>
            <P>
              The pause alone does it, without the heat. Paused by hand after a cooling gate, with the switches the phone&apos;s own throttle uses, the benchmark with 6 threads
              finished no turn within 20 minutes in three tries, against about 6 seconds unpaused; with 4 threads no turn within 10 minutes; with 3 under half a token a second;
              with 2 it ran at 6.9 tokens a second, with no step over half a second.
            </P>
          </div>
        </Figure>

        <Figure
          id="app"
          title="Does the OpenWeights app hit it?"
          lede="Yes. Its engine keeps its threads in a pool for the life of the model, and the pool stalls the same way."
        >
          <Table
            label="The app's engine in a hard throttle set by hand"
            head={["Decode threads", "Not paused, tok/s", "Paused, tok/s", "Paused against not"]}
            min="34rem"
            right={[1, 2, 3]}
            rows={pdFix.byThreads.map((r) => [
              r.threads === pdStall.app.normal ? `${r.threads}, the app's usual count` : `${r.threads}`,
              r.normal.toFixed(1),
              r.paused < 0.1 ? r.paused.toFixed(3) : r.paused.toFixed(2),
              kept(r) < 1 ? `${kept(r).toFixed(1)}%` : `${Math.round(kept(r))}%`,
            ])}
          />
          <Note>
            Phone E, Qwen3 4B, a 19-token prompt and a 64-token reply, the pause held through each paused run; medians of four runs in each state, two with 6 threads. A
            watchdog stopped both paused 6-thread runs. The app&apos;s heat policy, which picks the thread count before each reply, was not in the loop.
          </Note>
          <div className="mt-6 space-y-4">
            <P>
              Before the guard below, the app set its decode threads once before each reply, from Android&apos;s heat signal: {pdStall.app.normal} on this phone,{" "}
              {pdStall.app.light} when Android reports light or moderate heat, {pdStall.app.severe} at severe, and at critical or above it does not start the reply. A reply
              already running kept its threads, so a hard throttle that started mid-reply met {pdStall.app.normal}. On this phone Android reported{" "}
              {andList(pdStall.android.map((r) => `${r.status} (skin ${r.skinC} °C)`))} about 20 minutes apart during the matrix runs.
            </P>
            <P>
              Could the app read the throttle switches itself? On these rack phones its test process could read all eleven; on a retail MediaTek phone it could not even list
              the thermal devices. So a fix cannot rely on them.
            </P>
          </div>
        </Figure>

        <Figure id="guard" title="What the app now does" lede="It watches how long its own decode steps take, which every app can do.">
          <div className="space-y-4">
            <P>
              Two steps in a row that are slow, over a quarter of a second and more than 8 times the recent normal step or more than 2 seconds over it (or over 1.5 seconds with
              no history yet), drop decode and prompt reading to 2 threads. Every 30 seconds it tries one step at its planned count and keeps it if that step is close to its
              2-thread steps. The normal step is the median of the last eight, so one odd step moves nothing.
            </P>
            <P>
              Measured on phone D with the pause set by hand 10 seconds into decode, on a {grouped(1751)}-token prompt and replies of up to {grouped(1024)} tokens, Qwen3 4B, 4
              threads.
            </P>
          </div>
          <Table
            label="The guard against a hard throttle set by hand"
            head={["The pause", "With the guard", "Without it", "What the guard did"]}
            min="46rem"
            rows={[
              [
                "Stays to the end of the reply",
                `${g.pausedOn[0]} to ${g.pausedOn[1]} tok/s`,
                `${g.pausedOff[0]} to ${g.pausedOff[1]} tok/s`,
                `Fell back ${g.fellBackHeldS[0]} to ${g.fellBackHeldS[1]} s after the pause began; each try at 4 threads cost one stalled step of ${g.tryCostS[0]} to ${g.tryCostS[1]} s`,
              ],
              [
                "30 seconds, mid-reply",
                `Decoded in ${g.shortPauseOn[0]} to ${g.shortPauseOn[1]} s`,
                `${g.shortPauseOff[0]} to ${g.shortPauseOff[1]} s`,
                `Fell back ${g.fellBackShortS[0]} to ${g.fellBackShortS[1]} s in; back to 4 threads ${g.returnedAfterS[0]} to ${g.returnedAfterS[1]} s after it ended`,
              ],
              ["None", `${g.noPause4Guard} tok/s`, `${g.noPause4[0]} and ${g.noPause4[1]} tok/s`, "Nothing in that run; one run cannot measure what its bookkeeping costs"],
            ]}
          />
          <Note>
            Three runs with the guard and three without for the pause that stays, three and two for the 30-second pause. The pause runs used earlier builds of the guard, which
            differ in how the normal step is kept; every stalled step they met was 37 to 127 times the normal one, which every version judges alike. The final rules have run on
            a MediaTek phone without a pause and not yet through one. Codex reviewed the guard seven times; the bugs those rounds found are listed in the report.
          </Note>
        </Figure>

        <Figure
          id="llamacpp"
          title="The same fix inside llama.cpp"
          lede="Making a waiting thread give up its core would fix it for every app. No setting we tried did that without a cost."
        >
          <Table
            label="A wait that gives up its core after a number of checks"
            head={["The wait", "In the pause", "Not paused"]}
            min="40rem"
            rows={[
              ["Stock: never gives up its core", "No turn finished with 6 threads", "The baseline"],
              [
                "Gives it up after 10,000 checks",
                `${pdFix.yield.paused10k[0]} to ${pdFix.yield.paused10k[1]} tok/s with 6 or 4 threads`,
                `Slowed on some turns, to ${pdFix.yield.normal10kShare[0]}% to ${pdFix.yield.normal10kShare[1]}% of stock, and not predictably`,
              ],
              [
                "Gives it up after 1,000,000 checks",
                `${pdFix.yield.paused1m[0]} tok/s with 6 threads, ${pdFix.yield.paused1m[1]} with 4`,
                "Within run-to-run variation of stock",
              ],
              ["Stock, with 2 threads", `${pdFix.yield.stockPaused2} tok/s`, "Slower than 6 at this length"],
            ]}
          />
          <Note>
            The benchmark on the same three turns of Qwen3 4B, phones E and D. A budget between the two, or a wait that starts late and then yields sooner, was not tried.
          </Note>
        </Figure>

        <Figure id="others" title="What else was tried or ruled out">
          <Table
            label="What else was tried or ruled out"
            head={["Change", "Where", "Status"]}
            min="40rem"
            rows={[
              [
                "Switch from 6 threads to 2 whenever the throttle switches read on",
                "App, as root",
                "Measured before the guard, with the throttle turned on and off every 15 s: 4.3 to 6.3 tokens a second during the throttle against 0.3 to 0.9 without switching, and the same work in 21% less time (median decode times). The rates split each step by how much of it the throttle covered, and the CPU's ceilings differed between the two. It read the switches as root, which an app cannot count on",
              ],
              ["Decode on the NPU during the hard throttle", "App", "Not measured; the NPU is slower then too"],
              ["Read how many cores the app may use, before each step", "App", "Ruled out on this phone: the count stayed at 8 through a logged hard throttle"],
            ]}
          />
        </Figure>

        <Figure
          id="use"
          title="Does ordinary use reach it?"
          lede="Not in these sessions. The conversations were chatted through turn by turn on one loaded engine, the model's own replies kept in the history, with a pause before each next message as a person reads."
        >
          <Table
            label="Chat sessions against the throttle"
            head={["Phone", "Pause between turns", "Turns", "Hottest reading", "Hard throttle (Snapdragon) or Android's thermal status (POCO)", "Decode tok/s", "First token s, median (longest)"]}
            min="52rem"
            rows={pdFix.sessions.map((r) => [r.phone, r.pause, `${r.turns} in ${r.minutes} min`, r.peak, r.hard, r.decode.toFixed(1), r.first])}
          />
          <Note>
            Qwen3 4B, 4 threads, the guard on, replies of up to 512 tokens. The hard throttle trips at {pdTrigger.onC} °C on the XO thermistor; the POCO has no such switch an
            app or a shell can read, so its rows give Android&apos;s thermal status, which never left 0. The soft throttle held almost throughout every Snapdragon session.
            Decode slowed within each conversation as its context grew and recovered with each new one. On both phones one turn waited about two minutes for its first word (
            {pdFix.cacheMiss.snapdragonS} and {pdFix.cacheMiss.pocoS} s) after the engine&apos;s cache stopped matching {pdFix.cacheMiss.tokens} tokens from the end of the
            prompt and it re-read them; why the cache did not match, and whether heat added to the wait, were not traced. The POCO was charging, which adds heat, and its power
            service read the screen as dozing for most of its longer session.
          </Note>
        </Figure>

        <Figure id="threads" title="How many threads, then" lede="Four for decode, half the cores, with the guard.">
          <div className="space-y-4">
            <P>
              At a realistic length and without a pause, 2 threads decoded {g.twoThreadsCostPct}% slower than 4 on the Snapdragon ({g.noPause2[0]} and {g.noPause2[1]} against{" "}
              {g.noPause4[0]} and {g.noPause4[1]} tokens a second), and the first word came after {g.firstToken2S[0]} to {g.firstToken2S[1]} seconds against {g.firstToken4S[0]}{" "}
              to {g.firstToken4S[1]}. On the MediaTek POCO, same prompt and length, 2 threads cost far more: decode {pdFix.poco.two[0]} and {pdFix.poco.two[1]} against{" "}
              {pdFix.poco.four[0]} and {pdFix.poco.four[1]} tokens a second ({pdFix.poco.decodeCostPct}% slower), prompt reading {pdFix.poco.prefillCostPct}% slower, the first
              word after {pdFix.poco.firstToken2S[0]} to {pdFix.poco.firstToken2S[1]} seconds against {pdFix.poco.firstToken4S[0]} to {pdFix.poco.firstToken4S[1]}. A fixed 2
              would pay that on every reply to insure against a throttle no Snapdragon session reached; the guard pays it only on a stall.
            </P>
            <P>
              In natural heat, with the benchmark&apos;s GPU prefill and CPU decode on Qwen3 4B, 2 threads against 6 went both ways. On phone B, after a discarded 6-thread
              warm-up, the pairing completed once with 6 threads and once with 2. With 6 it hit the hard throttle 7 times, and its 36 steps over half a second added 372 s
              beyond that threshold. With 2 the XO thermistor peaked at 76.3 °C, under the trip, so there was no hard throttle and no step over half a second, but decoding took
              13.6% longer, the 6-thread run&apos;s stalls included. That is one pair, and the 2-thread run started with a cooler CPU.
            </P>
            <P>
              A rerun on phone E started every run after the same cooling gate, in the order 6, 2, 2, 6. The 6-thread run whose first turn began at a similar temperature to the
              2-thread runs&apos; hit the hard throttle 3 times, with 189 s beyond the half-second threshold; the 2-thread runs stayed under the trip but still took 24% longer to
              decode than it, stalls included. The first 6-thread run, the day&apos;s first and cooler, stayed under the trip and decoded 61% faster than the 2-thread runs. So
              fewer threads avoided the throttle and still lost on time, and more threads won outright when the throttle did not come.
            </P>
            <P>
              The thread count also changes the text. The same count gave identical replies on two phones, token for token; 6 threads against 2 changed{" "}
              {pdFix.agreement.changed} of {pdFix.agreement.of} replies, first diverging between the {pdFix.agreement.firstDiverge[0]}th and{" "}
              {pdFix.agreement.firstDiverge[1]}th token, because the sums come out in a different order and a close greedy choice flips. Whether a switch part-way through a reply
              changes the rest of it was not compared, and neither version was graded.
            </P>
          </div>
        </Figure>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="Phones">
            {pdPhone.soc} phones of one kind in Qualcomm Device Cloud&apos;s rack, Android 16, root shell, on AC power, 3 to 10 November 2026: the logged hard throttles
            during the matrix runs on 3 November; phone B for 2 threads against 6 in natural heat, the thread placement, and the benchmark with the pause set by hand; phone E
            for the rerun of 2 against 6, the app&apos;s engine in the pause, the profile and the first runs of the llama.cpp change; phone D for the rest of the llama.cpp
            change, the guard and the Snapdragon chat sessions. One MediaTek phone, a POCO X8 Pro Max (MT6991, HyperOS, Android 16) on USB power, for two chat sessions and 2
            threads against 4.
          </Row>
          <Row label="The pause, set by hand">
            After a cooling gate, the two switches the phone&apos;s own hard throttle sets were written by hand, and each chain first checked that six busy loops then ran only on
            cores 0 and 1. That separates the pause from the heat that normally brings it.
          </Row>
          <Row label="Runtime">
            llama.cpp {pdPhone.llamacpp}. The benchmark, which leaves llama.cpp to make a new thread pool for every graph, for the natural-heat runs, the first thread counts in the pause, the
            profile and the llama.cpp change; the app&apos;s own engine and its device tests, with every decode step timed, for the thread table above, the guard, 2 threads
            against 4 and the chat sessions.
          </Row>
          <Row label="Model and work">
            Qwen3 4B in Q4_0 for every run set up for this post (the logged hard throttles came from the matrix, on Qwen3 1.7B and 4B). A 19-token prompt with 64 tokens of
            reply for the engine&apos;s stall; a {grouped(1751)}-token prompt with up to {grouped(1024)} tokens for the
            guard and the thread comparison; nine conversations from WildChat-1M, UltraChat 200k and Daring-Anteater for the chat sessions.
          </Row>
          <Row label="Review">Codex reviewed each chain before it ran, the guard seven times, and this page against the report.</Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="One chip">The pause is a Qualcomm mechanism, measured on the SM8850 only. The MediaTek phone checked what 2 threads cost and that the guard stays quiet.</Row>
          <Row label="Pauses set by hand">
            No natural hard throttle came while the guard ran. One of {g.pausesSet} pauses set by hand did not hold (threads kept running on two cores it should have parked),
            and two more probably did not; those runs are left out.
          </Row>
          <Row label="Prompt reading">A pause that begins while the prompt is being read is not caught, since the guard reads decode steps.</Row>
          <Row label="One model">Qwen3 4B for the engine, the guard, the llama.cpp change, the thread counts and the chat sessions; one prompt for the guard&apos;s runs.</Row>
          <Row label="Not measured">
            Energy and battery drain: the rack phones bypass their battery, and the retail phone stayed on its charger. A phone in a hand, rather than in a rack or on a desk.
            Whether either version of a reply the thread count changed is better.
          </Row>
        </Rows>
      </Section>
    </Post>
  );
}
