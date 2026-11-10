import { PairBars, Picks } from "@/components/research/Compare";
import Post, { Figure, Findings, More, Note, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import { phoneBars, phoneLinks, phoneTable } from "@/lib/hardware-studies";

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
              line: "On a Qualcomm reference phone in the cloud against a retail POCO: about 3× on the NPU (the processor built for AI work), about 2.5× running a language model on the CPU, and about 7× on GPU matrix maths.",
            },
            {
              headline: "Both NPUs run inference, and neither one's public software can train",
              line: "Inference is running a trained model, and code with no special permissions did it on the NPU of both phones. Neither chip's public NPU software has the steps that update a model, and both fix the weights when the model is compiled.",
            },
            {
              headline: "They are open in opposite places",
              line: "Apps program a phone's GPU through Vulkan or OpenCL. On the Dimensity only Vulkan works, as OpenCL is walled off; on the Snapdragon OpenCL is public and tuned, while Vulkan fails on quantized models, ones stored in fewer bits to be smaller and faster at some cost in accuracy. The Snapdragon is the more open overall, with NPU libraries an app may ship.",
            },
            {
              headline: "The best split differs on each chip",
              line: "Prefill, reading the prompt, ran fastest on the Snapdragon's GPU but on the Dimensity's CPU. Decode, writing the reply one token (a piece of a word) at a time, ran fastest on the Snapdragon's CPU; on the Dimensity the GPU's about 27 tokens a second sits inside the CPU's 22 to 31, so neither clearly wins.",
            },
            {
              headline: "Cooling mattered more than a performance mode",
              line: "In HyperOS Ultimate mode while charging, the Dimensity's CPU prefill rose only from 74 to 79 tokens a second, and over 17 minutes of back-to-back tests its GPU matrix maths fell by a third, from 67 to 45 GFLOP/s.",
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="lead"
          title="The Snapdragon leads every test"
          lede="NPU, CPU and GPU, with the same workloads on both chips. Each row has its own scale."
          note="tok/s is tokens a second; GOPS and GFLOP/s are billions of calculations a second. Ranges come from benchmarks run twice: the bar is solid to the low end and faint to the high end, and multiples use the middle."
        >
          <PairBars
            a="Snapdragon 8 Elite"
            b="Dimensity 9500s"
            shortA="8 Elite"
            shortB="D9500s"
            rows={phoneBars.map((r) => {
              const mid = ([lo, hi]: [number, number]) => (lo + hi) / 2;
              const x = mid(r.elite) / mid(r.dimensity);
              const show = ([lo, hi]: [number, number], about?: boolean) =>
                `${about ? "about " : ""}${lo === hi ? lo.toLocaleString("en-US") : `${lo.toLocaleString("en-US")} to ${hi.toLocaleString("en-US")}`}`;
              return {
                label: r.label,
                detail: r.unit,
                lead: `About ${x < 3 ? x.toFixed(1) : Math.round(x)}×`,
                a: { value: r.elite[1], low: r.elite[0], shown: show(r.elite) },
                b: { value: r.dimensity[1], low: r.dimensity[0], shown: show(r.dimensity, r.aboutDimensity) },
              };
            })}
          />
        </Figure>

        <Figure
          id="gain"
          title="The Snapdragon's GPU adds far more over its own CPU"
          lede="This compares each chip with itself, so it shows how much the GPU is worth on that phone."
        >
          <PairBars
            a="Snapdragon 8 Elite"
            b="Dimensity 9500s"
            shortA="8 Elite"
            shortB="D9500s"
            rows={[
              { label: "Matrix multiplication", detail: "GPU as a multiple of the CPU", a: { value: 6.9, shown: "6.9×" }, b: { value: 1.69, shown: "1.69×" } },
              {
                label: "Training step for one model layer",
                detail: "GPU as a multiple of the CPU",
                a: { value: 6.5, shown: "6.5×" },
                b: { value: 1.4, low: 1.1, shown: "1.1× to 1.4×" },
              },
            ]}
          />
        </Figure>

        <Figure id="recipe" title="The best processor for each job differs by chip" lede="Gemma 3 1B in tokens per second; on the Dimensity, decode is too close to call.">
          {/* No pick on the Dimensity's decode: the GPU's single reading falls inside the CPU's two-run range. */}
          <Picks
            machines={[
              {
                name: "Snapdragon 8 Elite",
                first: true,
                jobs: [
                  {
                    job: "Prefill",
                    options: [
                      { name: "GPU, OpenCL", value: 720, shown: "717 to 723", pick: true },
                      { name: "CPU", value: 172, shown: "171 to 173" },
                    ],
                  },
                  {
                    job: "Decode",
                    options: [
                      { name: "GPU, OpenCL", value: 42, shown: "41.5 to 42.5" },
                      { name: "CPU", value: 63, shown: "62 to 64", pick: true },
                    ],
                  },
                ],
              },
              {
                name: "Dimensity 9500s",
                jobs: [
                  {
                    job: "Prefill",
                    options: [
                      { name: "GPU, Vulkan", value: 39, shown: "about 39" },
                      { name: "CPU", value: 66, shown: "58 to 74", pick: true },
                    ],
                  },
                  {
                    job: "Decode",
                    options: [
                      { name: "GPU, Vulkan", value: 27, shown: "about 27" },
                      { name: "CPU", value: 26.5, shown: "22 to 31" },
                    ],
                  },
                ],
              },
            ]}
          />
        </Figure>

        <More id="comparison" title="Every test, side by side" summary="The full comparison as a table, including APIs and training">
          <Table label="The comparison" head={["Test", "Snapdragon 8 Elite", "Dimensity 9500s"]} min="44rem" rows={phoneTable} />
          <Note>Ranges are from benchmarks run twice. LLM throughput is llama-bench with a 128-token prompt and 64 generated tokens.</Note>
        </More>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="Phones">Dimensity 9500s (mt6991) in a POCO X8 Pro Max. Snapdragon 8 Elite (SM8750) in a Qualcomm reference phone (QRD) on Qualcomm Device Cloud.</Row>
          <Row label="NPU workload">8 chained int8 fully connected layers, M=32 and K=N=2048, plus a single fp16 layer.</Row>
          <Row label="LLM workload">llama.cpp, Gemma 3 1B Q4_K_M.</Row>
          <Row label="GPU workload">ggml f32 mul_mat at 1024, 2048 and 4096 cubed.</Row>
          <Row label="Training">The same 385-parameter MLP, AdamW, MSE, 60 epochs.</Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="Access paths">
            The POCO ran the tests in Termux, a terminal app; the QRD ran them over adb, a debugging connection. Both ran as ordinary user code; the cloud shell had root, but
            nothing measured used it.
          </Row>
          <Row label="NPU drivers">
            MediaTek&apos;s NPU library was called directly. Qualcomm&apos;s QNN was driven through ONNX Runtime with CPU fallback off, because calling QNN directly needs headers
            from a gated SDK. Both measure a quantized model running wholly on the NPU.
          </Row>
          <Row label="llama.cpp builds">
            MediaTek numbers were taken on 2026-07-13 on the then-current llama.cpp, Snapdragon numbers on commit 8e8681e on 2026-07-27. Treat small differences between the chips
            accordingly.
          </Row>
          <Row label="Thermals">The POCO was tested warm and cold, and the ranges are reported. The QRD in the cloud idles cool and varied under 4% across runs.</Row>
        </Rows>
      </Section>
    </Post>
  );
}
