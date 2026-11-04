import Post, { Figure, Findings, More, Note, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import { gpuBalanced, gpuKv, gpuLinks, gpuMeasured, gpuPaper, gpuWinners } from "@/lib/hardware-studies";

const href = "/research/mi300x-h200/";

export const metadata = postMetadata(href);

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
        <Figure id="winners" title="Who won what">
          <Table label="Who won what" head={["Workload", "Winner", "Margin"]} rows={gpuWinners} />
        </Figure>

        <Figure id="paper" title="On paper, and measured">
          <div className="space-y-8">
            <Table label="Paper specification" head={["Specification", "MI300X", "H200", "Paper advantage"]} rows={gpuPaper} right={[1, 2]} />
            <Table label="Measured best sustained" head={["Measured best sustained", "MI300X", "H200", "Actual result"]} rows={gpuMeasured} right={[1, 2]} />
          </div>
        </Figure>

        <Figure
          id="kv"
          title="KV cache capacity"
          note="From the vLLM server logs on each machine, at identical settings: --max-model-len 16384 and --gpu-memory-utilization 0.90. A production H200 deployment would reduce context length to compensate, at a cost in capability rather than throughput."
        >
          <Table
            label="KV cache capacity"
            head={["", "Available KV cache", "KV cache tokens", "Max concurrency at 16k tokens"]}
            right={[1, 2, 3]}
            rows={[
              ["MI300X", `${gpuKv.mi300x.gib} GiB`, gpuKv.mi300x.tokens.toLocaleString("en-US"), `${gpuKv.mi300x.concurrency}×`],
              ["H200", `${gpuKv.h200.gib.toFixed(2)} GiB`, gpuKv.h200.tokens.toLocaleString("en-US"), `${gpuKv.h200.concurrency}×`],
            ]}
          />
        </Figure>

        <More id="numbers" title="More numbers" summary="Llama 3.1 8B under rising load, tail latency on the 70B, and energy">
          <Figure
            title="Llama 3.1 8B BF16, 1k in and 1k out"
            note="At concurrency 1 all three request shapes are within 2%, so on this model the gaps are throughput-under-load gaps."
          >
            <Table
              label="Llama 3.1 8B balanced serving"
              head={["Concurrency", "MI300X, tok/s", "H200, tok/s", "H200 ratio", "MI300X, ms per token", "H200, ms per token"]}
              right={[1, 2, 3, 4, 5]}
              rows={gpuBalanced.map(([c, a, b, r, ma, mb]) => [c, Number(a).toLocaleString("en-US"), Number(b).toLocaleString("en-US"), r, ma, mb])}
            />
          </Figure>
          <Figure title="Llama 3.3 70B FP8, time to first token at p99">
            <Table
              label="Tail latency"
              head={["Shape", "Concurrency", "MI300X", "H200", "Ratio"]}
              right={[1, 2, 3, 4]}
              rows={[
                ["1k in, 1k out", 256, "26.3 s", "145.6 s", "5.5×"],
                ["1k in, 8k out", 256, "35.0 s", "2,200.5 s", "62.9×"],
              ]}
            />
          </Figure>
          <Figure title="Energy">
            <Table
              label="Energy"
              head={["8B, 1k in and 1k out, concurrency 256", "Tokens per joule", "Busy-window power"]}
              right={[1, 2]}
              rows={[
                ["MI300X", "10.78", "750.3 W"],
                ["H200", "16.37", "692.7 W"],
              ]}
            />
          </Figure>
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
