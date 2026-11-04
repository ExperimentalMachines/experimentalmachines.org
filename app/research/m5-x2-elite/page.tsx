import { Dots, Duel, PairBars } from "@/components/research/Compare";
import Post, { Figure, Findings, More, Note, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import { laptopDuel, laptopLinks, laptopLlm, laptopNpu, laptopNpuBars, laptopPenalty, laptopQuality, laptopSustained, laptopTraining } from "@/lib/hardware-studies";

const href = "/research/m5-x2-elite/";

export const metadata = postMetadata(href);

const n = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: x < 1000 ? 1 : 0 });

export default function Laptops() {
  return (
    <Post
      href={href}
      sources={[
        { label: "The full report", href: laptopLinks.report },
        { label: "Methodology", href: laptopLinks.method },
        { label: "Code and raw results", href: laptopLinks.repo },
      ]}
    >
      <Section id="findings" title="What we found">
        <Findings
          items={[
            {
              headline: "The M5 wins every llama.cpp GPU test",
              line: "With the same llama.cpp release and byte-identical Q4_0 weights, the M5's Metal path runs 2.1× to 3.1× the Adreno X2-90's prefill and 1.4× to 1.9× its decode.",
            },
            {
              headline: "The X2 Elite wins every llama.cpp CPU test",
              line: "Its 18 Oryon cores beat the M5's 10 on the same llama.cpp CPU build: 1.9× to 3.2× on prefill and 1.1× to 1.4× on decode, so the margins are similar in both directions.",
            },
            {
              headline: "The NPUs nearly tie on fp16",
              line: "Hexagon does 15.2 TFLOP/s and the Neural Engine 14.1, 8% apart on the same graph and weights. They diverge on int8, where quantise and dequantise nodes cost Hexagon more than the int8 matmul saves at this shape.",
            },
            {
              headline: "Training on the X2 is a software story",
              line: "PyTorch on Windows on Arm delivers 0.11 to 0.12 TFLOP/s at any thread count, against 1.25 on the M5's CPU. llama.cpp shows the X2's CPU is the faster one, so the 10× deficit is PyTorch's ARM64 Windows kernels, not the processor.",
            },
            {
              headline: "Q4_0's speed is not free",
              line: "It costs about 17% higher perplexity than Q4_K_M on both machines, in exchange for up to 2.5× CPU prefill. It is the headline format because it is the only one fairly optimised everywhere, not because it is the one to use.",
            },
            {
              headline: "The fanless Air held up",
              line: "With a desk fan pointed at it, over a 10-minute loop, it held 98.8% of peak prefill, against 99.1% on the cooled X2 board, giving ground only on decode: 89.4% against 98.2%.",
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="llm"
          title="The GPU goes to the M5, the CPU to the X2 Elite"
          lede="Same llama.cpp release and byte-identical Q4_0 files. Every llama.cpp GPU test leans one way and every CPU test the other."
          note="Tokens per second, with the best thread count per machine on the CPU."
        >
          <Duel
            a="Apple M5"
            b="X2 Elite"
            max={4}
            groups={laptopDuel.map((g) => ({
              title: g.title,
              rows: g.rows.map((r) => {
                const m5Leads = r.m5 > r.x2;
                const ratio = m5Leads ? r.m5 / r.x2 : r.x2 / r.m5;
                return { label: r.label, who: m5Leads ? ("a" as const) : ("b" as const), ratio, shown: `${ratio.toFixed(1)}×`, detail: `M5 ${n(r.m5)}, X2 ${n(r.x2)}` };
              }),
            }))}
          />
        </Figure>

        <Figure
          id="npu"
          title="The NPUs: level on fp16, apart on int8"
          lede="One model exported to both runtimes, with identical GEMMs and weights."
          note="The M5 also runs a language model on its NPU: Anemll gives the Neural Engine 2,616 tok/s prefill and 47 tok/s decode on Llama 3.2 1B. The Hexagon has no publicly installable generative runtime."
        >
          <PairBars
            a="Apple M5, Neural Engine"
            b="X2 Elite, Hexagon"
            shortA="M5"
            shortB="X2"
            shared
            rows={laptopNpuBars.map((r) => ({
              label: r.label,
              detail: "GFLOP/s",
              a: { value: r.m5, shown: r.m5.toLocaleString("en-US") },
              b: { value: r.x2, shown: r.x2.toLocaleString("en-US") },
            }))}
          />
        </Figure>

        <Figure
          id="training"
          title="Training"
          lede="PyTorch 2.8.0 and an identical script. The X2's number is PyTorch on Windows on Arm, since llama.cpp shows its CPU is the faster one."
          note="X2 GPU training is blocked: ggml's OpenCL backend lacks memset_tensor, and the identical binary trains on CPU."
        >
          <PairBars
            a="Apple M5"
            b="X2 Elite"
            shortA="M5"
            shortB="X2"
            shared
            rows={[
              { label: "CPU", detail: "TFLOP/s", a: { value: 1.254, shown: "1.25" }, b: { value: 0.117, shown: "0.11 to 0.12, at 4, 12 or 18 threads" } },
              { label: "GPU", detail: "TFLOP/s", a: { value: 2.295, shown: "2.30, MPS" }, b: null, missing: "no Adreno backend exists" },
            ]}
          />
        </Figure>

        <Figure
          id="quant"
          title="What the usual format costs in speed"
          lede="Moving Gemma 3 1B from Q4_0 to Q4_K_M. A longer bar is a bigger loss, and the two machines lose in different places."
        >
          <PairBars
            a="Apple M5"
            b="X2 Elite"
            shortA="M5"
            shortB="X2"
            shared
            rows={laptopPenalty.map((r) => ({
              label: r.label,
              a: { value: r.m5, shown: `−${r.m5}%` },
              b: { value: r.x2, shown: `−${r.x2}%` },
            }))}
          />
        </Figure>

        <Figure
          id="sustained"
          title="Ten minutes under load"
          lede="The fanless Air, with a desk fan pointed at it, holds prefill as well as the cooled board and gives ground only on decode. The scale starts at 85%."
          note="Qwen3 8B Q4_0 on the GPU, the same loop on both. Retention is the steady rate as a share of peak."
        >
          <Dots a="Apple M5" b="X2 Elite" from={85} to={100} rows={laptopSustained} />
        </Figure>

        <More id="numbers" title="Every number" summary="The llama.cpp, NPU and training results as tables, and perplexity">
          <Table label="llama.cpp results" head={["Model", "Test", "Apple M5", "Snapdragon X2 Elite", "Winner"]} right={[2, 3]} min="44rem" rows={laptopLlm} />
          <Table label="NPU GEMM" head={["Weights", "Apple M5", "Snapdragon X2 Elite"]} right={[1, 2]} rows={laptopNpu} />
          <Table label="Training" head={["", "Apple M5", "Snapdragon X2 Elite"]} right={[1, 2]} rows={laptopTraining} />
          <Figure
            title="Perplexity on an identical corpus"
            note="llama-perplexity on a byte-identical wikitext-2 corpus, 40 chunks, GPU backend. Lower is better. The two backends agree to 0.005% on Q4_K_M, so both platforms compute the same answers."
          >
            <Table label="Perplexity" head={["", "Apple M5", "Snapdragon X2 Elite", "Agreement"]} right={[1, 2, 3]} rows={laptopQuality} />
          </Figure>
        </More>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="Apple M5">
            MacBook Air (Mac17,3), 4 performance and 6 efficiency cores, 10-core GPU, 16-core Neural Engine, 24 GB at about 153 GB/s, macOS 26.5.2. An external fan was pointed at
            it during runs.
          </Row>
          <Row label="Snapdragon X2 Elite">
            X2E88100 on a Qualcomm reference board reached over Qualcomm Device Cloud: 18-core Oryon Gen 3 at 4.03 GHz, Adreno X2-90, Hexagon HTP v81, 32 GB at about 152 GB/s,
            Windows 11 ARM64.
          </Row>
          <Row label="LLM">
            llama.cpp b10152, the official prebuilt release on each OS, with GGUF files SHA-256 verified identical and the same arguments. Thread sweeps instead of one fixed count,
            so neither core layout is favoured.
          </Row>
          <Row label="NPU">One PyTorch source model exported to Core ML and to ONNX Runtime&apos;s QNN provider: identical GEMMs, identical weights.</Row>
          <Row label="Training">PyTorch 2.8.0 and an identical script. Adreno has no PyTorch backend, so its missing lane is reported as a capability gap.</Row>
          <Row label="Sustained">The same 10-minute loop on both, to expose the difference between a fanless Air with a desk fan on it and an actively cooled board.</Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="18 cores against 10">An actively cooled reference board against a fanless ultrabook is not a per-core or per-watt comparison.</Row>
          <Row label="No efficiency claims">There is no equal-quality power measurement on Windows.</Row>
          <Row label="The NPU lane">It is a controlled GEMM microbenchmark, not an end-to-end comparison of a language model on each NPU.</Row>
          <Row label="One board">Retail X2 laptops will perform below this reference board under sustained load.</Row>
        </Rows>
        <Note>Read the methodology before quoting these numbers.</Note>
      </Section>
    </Post>
  );
}
