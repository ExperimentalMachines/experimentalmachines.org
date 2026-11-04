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
            { headline: "There is no single winner", line: "The result splits by whether the model plus its KV cache fits in 141 GB." },
            {
              headline: "The H200 wins from the lower paper specification",
              line: "The MI300X leads on paper on every axis. Measured, the H200 sustains 1.25× the BF16 GEMM, 1.22× the FP8 GEMM and 1.11× the memory bandwidth. The cause is achieved efficiency.",
            },
            {
              headline: "Memory turns it around at 70B",
              line: `Both hold 70 GB of FP8 weights. Weights are a fixed subtraction, so a ${gpuKv.memory}× memory advantage becomes a ${gpuKv.advantage}× KV cache advantage. Beyond roughly 11 concurrent full-length requests the H200 is oversubscribed: requests queue and preempt, throughput falls and time to first token rises.`,
            },
            {
              headline: "The largest model does not run on the H200",
              line: "Llama 3.3 70B in BF16 is 141 GB of weights. The weights fit on the H200. Allocating KV cache afterwards does not.",
            },
            { headline: "Neither GPU throttles", line: "Over 30 minutes of continuous load, 8B at concurrency 64, the MI300X held 99.2% of its peak and the H200 99.7%." },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="winners"
          title="Who won what"
          lede="Neither wins outright. The H200 leads on smaller work and at low load; the MI300X takes over when the 70B model and its cache crowd the H200's memory."
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

        <Figure id="paper" title="On paper, and measured" lede="The MI300X leads every line of the data sheet. Measured, the lead flips to the H200 on all three that were tested.">
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

        <Figure id="load" title="Throughput as the load rises" lede="Level at one stream, then the gap opens. Llama 3.1 8B, 1k tokens in and 1k out.">
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
          title="How many long requests fit"
          lede="Both hold 70 GB of FP8 weights, and what is left is cache. Past its count a GPU queues and preempts."
          note="From the vLLM server logs on each machine, at identical settings: --max-model-len 16384 and --gpu-memory-utilization 0.90. A production H200 deployment would reduce context length to compensate, at a cost in capability rather than throughput."
        >
          <Seats
            caption="Concurrent requests of 16k tokens that the KV cache can hold, on Llama 3.3 70B FP8."
            rows={[
              { name: "MI300X", count: Number(gpuKv.mi300x.concurrency), shown: `${gpuKv.mi300x.concurrency}, from ${gpuKv.mi300x.gib} GiB of cache`, first: true },
              { name: "H200", count: Number(gpuKv.h200.concurrency), shown: `${gpuKv.h200.concurrency}, from ${gpuKv.h200.gib.toFixed(2)} GiB of cache` },
            ]}
          />
        </Figure>

        <Figure
          id="tail"
          title="First-token wait, training and energy"
          lede="The MI300X's widest measured lead is the wait for a first token on the 70B at concurrency 256. Training and energy go to the H200."
        >
          <PairBars
            a="MI300X"
            b="H200"
            shortA="MI300X"
            shortB="H200"
            rows={[
              ...gpuTail.map((r) => ({
                label: `First token at p99, ${r.label}`,
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
                detail: "8B, 1k in and 1k out, concurrency 256",
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
            The MI300X is an SR-IOV virtual function, not bare metal. It presents 304 CUs, 192 GB, SPX/NPS1 and the full 750 W limit, and sustains 100% utilization at 750 W, so it
            behaves as a whole GPU. Virtualization overhead cannot be excluded, and the H200 is not virtualized the same way. This is the largest caveat.
          </Row>
          <Row label="Different providers">So different host CPUs, RAM, kernels (Ubuntu 26.04 against 24.04) and storage.</Row>
          <Row label="One of each">One sample of each GPU. Unit-to-unit variation is not characterised.</Row>
          <Row label="Software">
            Holding vLLM and PyTorch constant removes the framework variable but not the compiler, kernel-library and driver variable. That difference is part of what is measured.
          </Row>
          <Row label="FP8 is not bit-identical">
            Both GPUs load one shared BF16 checkpoint and derive their own native FP8, because they implement different encodings. On 16 fixed prompts, 3 matched exactly at FP8
            against 10 at BF16, and FP8 diverges 4.7× further on mean logprob.
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
