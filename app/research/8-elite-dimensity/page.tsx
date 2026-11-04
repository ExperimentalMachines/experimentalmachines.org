import Post, { Figure, Findings, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import { phoneLinks, phoneMatmul, phoneTable } from "@/lib/hardware-studies";

const href = "/research/8-elite-dimensity/";

export const metadata = postMetadata(href);

export default function Phones() {
  return (
    <Post
      href={href}
      sources={[
        { label: "Code and raw results", href: phoneLinks.repo },
        { label: "Snapdragon 8 Elite report", href: phoneLinks.qualcomm },
        { label: "Dimensity 9500s report", href: phoneLinks.mediatek },
      ]}
    >
      <Section id="findings" title="What we found">
        <Findings
          items={[
            {
              headline: "The Snapdragon leads every measured workload",
              line: `About 3× on NPU int8, about 2.5× on CPU LLM throughput and about 7× on GPU matmul, ${phoneMatmul.elite} against ${phoneMatmul.dimensity} GFLOP/s.`,
            },
            { headline: "The NPUs are real, reachable and inference-only", line: "On both chips the gaps are software. NPU training is architecturally impossible on either." },
            {
              headline: "They invert on openness",
              line: "On MediaTek the GPU compute door is Vulkan and OpenCL is walled off. On Qualcomm OpenCL is public and tuned while Vulkan quantized inference is broken. The Snapdragon platform is the more open of the two: public OpenCL, public FastRPC, redistributable QNN.",
            },
            {
              headline: "The best recipe is opposite on each",
              line: "GPU OpenCL prefill with CPU decode on the Snapdragon. CPU prefill with GPU Vulkan decode on the Dimensity.",
            },
            {
              headline: "Thermal headroom beats a performance mode",
              line: "Re-benchmarked in HyperOS Ultimate mode while charging, the Dimensity phone gained modestly on the CPU, prefill 74 to 79 tok/s, but GPU matmul fell from 67 to 45 GFLOP/s over a 17-minute back-to-back suite.",
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="comparison"
          title="Every test, side by side"
          note="Ranges are from benchmarks run twice. LLM throughput is llama-bench with a 128-token prompt and 64 generated tokens."
        >
          <Table label="The comparison" head={["Test", "Snapdragon 8 Elite", "Dimensity 9500s"]} min="44rem" rows={phoneTable} />
        </Figure>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="Phones">Dimensity 9500s (mt6991) in a POCO X8 Pro Max. Snapdragon 8 Elite (SM8750) in a QRD reference device on Qualcomm Device Cloud.</Row>
          <Row label="NPU workload">8 chained int8 fully connected layers, M=32 and K=N=2048, plus a single fp16 layer.</Row>
          <Row label="LLM workload">llama.cpp, Gemma 3 1B Q4_K_M.</Row>
          <Row label="GPU workload">ggml f32 mul_mat at 1024, 2048 and 4096 cubed.</Row>
          <Row label="Training">The same 385-parameter MLP, AdamW, MSE, 60 epochs.</Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="Access paths">
            A retail phone through Termux against a QRD through adb and the NDK. Both execute as unprivileged user code; the QDC shell happens to be root, but nothing measured uses
            root-only facilities.
          </Row>
          <Row label="NPU drivers">
            MediaTek&apos;s Neuron Adapter is called raw. Qualcomm&apos;s QNN is driven through ONNX Runtime&apos;s QNN provider with CPU fallback disabled, because raw QNN graph
            composition needs gated SDK headers. Both measure a quantized graph fully resident on the NPU.
          </Row>
          <Row label="llama.cpp builds">
            MediaTek numbers were taken on 2026-07-13 on the then-current llama.cpp, Snapdragon numbers on commit 8e8681e on 2026-07-27. Treat small differences between the chips
            accordingly.
          </Row>
          <Row label="Thermals">The phone was benched warm and cold, and the ranges are reported. The QDC QRD idles cool and varied under 4% across runs.</Row>
        </Rows>
      </Section>
    </Post>
  );
}
