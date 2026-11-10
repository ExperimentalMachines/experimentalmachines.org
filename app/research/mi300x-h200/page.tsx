import { Duel, Lines, PairBars, Seats } from "@/components/research/Compare";
import Post, { Figure, Findings, More, Note, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import { gpuBalanced, gpuEnergy, gpuKv, gpuLinks, gpuMeasured, gpuPaper, gpuTail, gpuTraining, gpuWinners } from "@/lib/hardware-studies";

const href = "/research/mi300x-h200/";

export const metadata = postMetadata(href);

// A data-sheet row: its name, the two readings, and "MI300X 1.32×" naming the leader.
const duelRow = ([label, a, b, lead]: string[]) => ({
  label,
  who: lead.startsWith("MI300X") ? ("a" as const) : ("b" as const),
  ratio: parseFloat(lead.split(" ")[1]),
  shown: lead.split(" ")[1],
  detail: `${a} against ${b}`,
});

export default function Gpus() {
  return (
    <Post
      href={href}
      sources={[
        { label: "The full report", href: gpuLinks.report },
        { label: "Methodology", href: gpuLinks.method },
        { label: "Code and raw results", href: gpuLinks.repo },
      ]}
    >
      <Section id="findings" title="What we found">
        <Findings
          items={[
            {
              headline: "There is no single winner",
              line: "The result splits on whether the model and its KV cache, the memory a model keeps of the conversation so far, fit in the H200's 141 GB.",
            },
            {
              headline: "The H200 measures faster despite a weaker data sheet",
              line: "The MI300X leads every line of the data sheet. Measured, the H200 did 1.25× the matrix maths in 16-bit numbers (BF16), 1.22× in 8-bit (FP8) and 1.11× the memory bandwidth, because it reaches far more of its listed peak in practice.",
            },
            {
              headline: "Memory turns it around at 70B",
              line: `On the 70B model both GPUs hold the same 70 GB of FP8 weights, so the MI300X, with ${gpuKv.memory}× the memory, has ${gpuKv.advantage}× the room left for KV cache. Past about 11 full-length requests at once the H200 runs out: requests wait or are paused, total output falls and replies take longer to start.`,
            },
            {
              headline: "The largest model does not run on the H200",
              line: "Llama 3.3 70B in BF16 is 141 GB of weights. They fit on the H200 but leave no room for the KV cache, so it cannot serve the model.",
            },
            {
              headline: "Neither GPU throttles",
              line: "Over 30 minutes of steady load, the 8B model serving 64 requests at once, the MI300X held 99.2% of its peak and the H200 99.7%.",
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="winners"
          title="The H200 wins smaller work; the MI300X wins the 70B under load"
          lede="The MI300X takes over when the 70B model and its KV cache crowd the H200's memory."
          note="Concurrency is how many requests run at once. Prefill is reading the prompt; decode is writing the reply, one token (a piece of a word) at a time. A dense model uses all its weights for every token; a mixture-of-experts model uses only some."
        >
          <Duel
            a="MI300X"
            b="H200"
            max={3}
            groups={[
              {
                rows: gpuWinners.map(([label, winner, margin]) => {
                  const ratio = parseFloat(margin);
                  if (winner === "Tie") return { label, who: "tie" as const, shown: `Tie, ${margin}` };
                  const who = winner === "MI300X" ? ("a" as const) : ("b" as const);
                  if (Number.isNaN(ratio)) return { label, who, blocked: true, shown: "only one", detail: margin };
                  return margin.includes(" to ") ? { label, who, ratio: 1.4, shown: "1.40×", detail: margin } : { label, who, ratio, shown: margin };
                }),
              },
            ]}
          />
        </Figure>

        <Figure
          id="paper"
          title="The MI300X leads on paper; the H200 leads when measured"
          lede="The MI300X leads every line of the data sheet. Measured, the lead flips to the H200 on all three that were tested."
          note="GEMM is matrix multiplication, the core maths of AI models. HBM is the GPU's own memory. TFLOP/s is trillions of calculations a second."
        >
          <Duel
            a="MI300X"
            b="H200"
            max={1.6}
            groups={[
              { title: "On paper", rows: gpuPaper.map(duelRow) },
              { title: "Measured, best sustained", rows: gpuMeasured.map(duelRow) },
            ]}
          />
        </Figure>

        <Figure id="load" title="The H200 pulls ahead as the load rises" lede="Level at one request, then the gap opens to about 1.4×. Llama 3.1 8B, 1k tokens in and 1k out.">
          {/* about 1.4×: the sweep's ratio is 1.37× to 1.42× from 64 requests up. */}
          <Lines
            series={[
              { name: "MI300X", ys: gpuBalanced.map((r) => Number(r[1])) },
              { name: "H200", ys: gpuBalanced.map((r) => Number(r[2])) },
            ]}
            x={gpuBalanced.map((r) => Number(r[0]))}
            step={2000}
            unit="tok/s"
            xLabel="Concurrent requests, on a log scale"
            summary="Output tokens per second as concurrency rises from 1 to 256. The two are level at 1; at 256 the H200 reaches 11,337 and the MI300X 8,085."
          />
        </Figure>

        <Figure
          id="kv"
          title="The MI300X fits 20 long requests at once to the H200's 11"
          lede="Both hold 70 GB of FP8 weights, and the rest is KV cache. Past its count a GPU makes requests wait."
          note="From the vLLM server logs, at identical settings: --max-model-len 16384 and --gpu-memory-utilization 0.90. An H200 could fit more requests with a smaller context window (how much text, prompt and reply together, each request can hold), which limits every request; that was not measured."
        >
          <Seats
            caption="Full 16k-token requests the KV cache can hold at once on Llama 3.3 70B FP8, in theory. Only whole requests run."
            rows={[
              { name: "MI300X", count: Number(gpuKv.mi300x.concurrency), shown: `${gpuKv.mi300x.concurrency}, from ${gpuKv.mi300x.gib} GiB of cache`, first: true },
              { name: "H200", count: Number(gpuKv.h200.concurrency), shown: `${gpuKv.h200.concurrency}, from ${gpuKv.h200.gib.toFixed(2)} GiB of cache` },
            ]}
          />
        </Figure>

        <Figure
          id="tail"
          title="The MI300X starts the slowest replies far sooner; training and energy go to the H200"
          lede="The MI300X's widest lead is on the 70B with 256 requests at once, where the H200's KV cache runs out."
        >
          <PairBars
            a="MI300X"
            b="H200"
            shortA="MI300X"
            shortB="H200"
            rows={[
              ...gpuTail.map((r) => ({
                label: `Slowest 1% of first-token waits, ${r.label}`,
                detail: "Llama 3.3 70B FP8, concurrency 256. Shorter is better.",
                lead: `MI300X ${r.ratio} sooner`,
                a: { value: r.mi300x, shown: `${r.mi300x.toFixed(1)} s` },
                b: { value: r.h200, shown: `${r.h200.toLocaleString("en-US")} s` },
              })),
              ...gpuTraining.map((r) => ({
                label: `Training, ${r.label.toLowerCase()}`,
                detail: "8B, BF16, tokens per second",
                lead: `H200 ${r.ratio} faster`,
                a: { value: r.mi300x, shown: r.mi300x.toLocaleString("en-US") },
                b: { value: r.h200, shown: r.h200.toLocaleString("en-US") },
              })),
              {
                label: "Tokens per joule",
                detail: "8B, 1k in and 1k out, concurrency 256. More is better.",
                a: { value: gpuEnergy.mi300x, shown: String(gpuEnergy.mi300x) },
                b: { value: gpuEnergy.h200, shown: String(gpuEnergy.h200) },
              },
            ]}
          />
        </Figure>

        <More id="numbers" title="Every number" summary="The winners, the data sheets, the KV cache and the full load sweep as tables">
          <Table label="Who won what" head={["Workload", "Winner", "Margin"]} rows={gpuWinners} />
          <Table label="Paper specification" head={["Specification", "MI300X", "H200", "Paper advantage"]} rows={gpuPaper} right={[1, 2]} />
          <Table label="Measured best sustained" head={["Measured best sustained", "MI300X", "H200", "Actual result"]} rows={gpuMeasured} right={[1, 2]} />
          <Table
            label="KV cache capacity"
            head={["", "Available KV cache", "KV cache tokens", "Max concurrency at 16k tokens"]}
            right={[1, 2, 3]}
            rows={[
              ["MI300X", `${gpuKv.mi300x.gib} GiB`, gpuKv.mi300x.tokens.toLocaleString("en-US"), `${gpuKv.mi300x.concurrency}×`],
              ["H200", `${gpuKv.h200.gib.toFixed(2)} GiB`, gpuKv.h200.tokens.toLocaleString("en-US"), `${gpuKv.h200.concurrency}×`],
            ]}
          />
          <Table
            label="Llama 3.1 8B balanced serving"
            head={["Concurrency", "MI300X, tok/s", "H200, tok/s", "H200 ratio", "MI300X, ms per token", "H200, ms per token"]}
            right={[1, 2, 3, 4, 5]}
            rows={gpuBalanced.map(([c, a, b, r, ma, mb]) => [c, Number(a).toLocaleString("en-US"), Number(b).toLocaleString("en-US"), r, ma, mb])}
          />
          <Note>
            At concurrency 1 all three 8B request shapes are within 2%, so on this model the gaps are throughput-under-load gaps. Busy-window power at concurrency 256 was 750.3 W
            on the MI300X and 692.7 W on the H200.
          </Note>
        </More>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="Machines">One MI300X on a DigitalOcean GPU droplet, 191.7 GiB HBM3, 750 W limit. One H200 on Nebius, 140.4 GiB HBM3e, 700 W limit, MIG disabled.</Row>
          <Row label="Software">vLLM 0.26.0 and PyTorch 2.11.0 on both sides. The intended difference is ROCm against CUDA.</Row>
          <Row label="Numbers">
            164 serving data points, 0 dropped for missing telemetry. All figures are medians or percentiles over a fixed grid with 1 Hz telemetry attached. None are best-of-N.
          </Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="A virtual function">
            The MI300X was reached through virtualization (an SR-IOV virtual function), not bare metal. It presented the whole chip, 304 compute units, 192 GB and the full 750 W
            limit, and sustained 100% use at 750 W, so it behaves as a whole GPU. Virtualization overhead cannot be excluded, and the H200 is not virtualized the same way. This is
            the largest caveat.
          </Row>
          <Row label="Different providers">So different host CPUs, RAM, kernels (Ubuntu 26.04 against 24.04) and storage.</Row>
          <Row label="One of each">One sample of each GPU. Unit-to-unit variation is not characterised.</Row>
          <Row label="Software">
            Holding vLLM and PyTorch constant removes the framework variable but not the compiler, kernel-library and driver variable. That difference is part of what is measured.
          </Row>
          <Row label="FP8 is not bit-identical">
            Both GPUs load one shared BF16 checkpoint and derive their own native FP8, because they implement different encodings. On 16 fixed prompts, 3 replies matched exactly at
            FP8 against 10 at BF16, and at FP8 the two GPUs&apos; average confidence in each token (mean log-probability) differed 4.7× more.
          </Row>
          <Row label="Reduced grids">Concurrency grids are reduced for the large models. Every sweep records the grid it used.</Row>
          <Row label="Training">Throughput is not time to convergence. A stack can be fast per step and converge worse.</Row>
          <Row label="Not measured">Several GPUs. Nothing here speaks to scaling, collectives or interconnect.</Row>
        </Rows>
        <Note>
          Read the methodology before quoting these numbers. The full report has the microbenchmarks, the mixture-of-experts model, vendor tuning, training and the corrections made
          during the study.
        </Note>
      </Section>
    </Post>
  );
}
