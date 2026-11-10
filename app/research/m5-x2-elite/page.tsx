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
              line: "With the same llama.cpp release and identical model files, the M5's GPU ran prefill, reading the prompt, 2.1× to 3.1× as fast as the X2 Elite's GPU, and decode, writing the reply one token (a small piece of text) at a time, 1.4× to 1.9× as fast.",
            },
            {
              headline: "The X2 Elite wins every llama.cpp CPU test",
              line: "Its 18 Oryon cores beat the M5's 10 on the same llama.cpp CPU build: 1.9× to 3.2× on prefill, but only 1.1× to 1.4× on decode.",
            },
            {
              headline: "The NPUs nearly tie in 16-bit numbers",
              line: "On identical matrix maths in 16-bit numbers (fp16), Qualcomm's Hexagon NPU (the processor built for AI work) did 15.2 TFLOP/s (trillions of calculations a second) and Apple's Neural Engine 14.1. In 8-bit numbers (int8) the Neural Engine rose to 15.6 and Hexagon fell to 8.6, as converting to and from 8 bits cost it more than it saved at this size.",
            },
            {
              headline: "Training on the X2 looks held back by software",
              line: "PyTorch on the X2's Windows on Arm did 0.11 to 0.12 TFLOP/s at any thread count, against 1.25 on the M5's CPU. The X2's CPU is the faster one in llama.cpp and extra threads changed nothing, which points to PyTorch's Windows on Arm build rather than the processor.",
            },
            {
              headline: "Q4_0's speed costs some accuracy",
              line: "Q4_0 and Q4_K_M are quantized formats: ways of storing a model's numbers in fewer bits, smaller and faster at some cost in accuracy. Q4_0 bought up to 2.5× the CPU prefill, but scored about 17% higher perplexity (how surprised a model is by real text; lower is better) on both machines.",
            },
            {
              headline: "The fanless Air held up, with a desk fan on it",
              line: "Over a 10-minute loop it kept 98.8% of its peak prefill speed, against 99.1% on the cooled X2 board, and gave ground only on decode: 89.4% against 98.2%.",
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
          title="The NPUs are level in 16-bit numbers and apart in 8-bit"
          lede="One model exported to both NPUs' software, with identical matrix maths and weights."
          note="The M5 also runs a language model on its NPU: Anemll gives the Neural Engine 2,616 tok/s prefill and 47 tok/s decode on Llama 3.2 1B. The Hexagon has no publicly installable generative runtime."
        >
          <PairBars
            a="Apple M5, Neural Engine"
            b="X2 Elite, Hexagon"
            shortA="M5"
            shortB="X2"
            shared
            // Shown in TFLOP/s, the unit the findings and the table use, so one reading never appears in two units.
            rows={laptopNpuBars.map((r) => ({
              label: r.label,
              detail: "TFLOP/s",
              a: { value: r.m5, shown: (r.m5 / 1000).toFixed(1) },
              b: { value: r.x2, shown: (r.x2 / 1000).toFixed(1) },
            }))}
          />
        </Figure>

        <Figure
          id="training"
          title="The M5 trained about 10× faster on its CPU, and the X2's GPU could not train"
          lede="PyTorch 2.8.0 and an identical script on both; on the X2 it runs on Windows on Arm."
          note="Nor could the X2's GPU train through ggml, the library under llama.cpp: its OpenCL backend lacks a needed function, memset_tensor, while the same program trains on the CPU."
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
          title="Switching to Q4_K_M costs 6% to 60% of the speed"
          lede="Gemma 3 1B moved from Q4_0, the one format fairly optimised everywhere and so the one these tables use, to Q4_K_M. A longer bar is a bigger loss, and the two machines lose in different places."
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
          title="Over ten minutes the Air kept its prefill speed and lost some decode"
          lede="The fanless Air had a desk fan pointed at it; the X2 board is actively cooled. The scale starts at 85%."
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
          <Row label="NPU">One PyTorch source model exported to Core ML and to ONNX Runtime&apos;s QNN provider: identical matrix multiplications (GEMMs) and weights.</Row>
          <Row label="Training">PyTorch 2.8.0 and an identical script. Adreno has no PyTorch backend, so its missing lane is reported as a capability gap.</Row>
          <Row label="Sustained">The same 10-minute loop on both, to expose the difference between a fanless Air with a desk fan on it and an actively cooled board.</Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="18 cores against 10">An actively cooled reference board against a fanless ultrabook is not a per-core or per-watt comparison.</Row>
          <Row label="No efficiency claims">There is no equal-quality power measurement on Windows.</Row>
          <Row label="The NPU lane">It is a controlled test of matrix maths, not a comparison of a language model running on each NPU.</Row>
          <Row label="One board">No retail X2 laptop was tested. With less cooling than this board, one may slow more under sustained load.</Row>
        </Rows>
        <Note>Read the methodology before quoting these numbers.</Note>
      </Section>
    </Post>
  );
}
