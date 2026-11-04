import FactsStrip from "@/components/asic/FactsStrip";
import ServingFigure from "@/components/asic/ServingFigure";
import SpecDecodeFigure from "@/components/asic/SpecDecodeFigure";
import TrainingFigure from "@/components/asic/TrainingFigure";
import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import Post, { Figure, Findings, P, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import { cost, decision, neuronLinks, sustained } from "@/lib/neuron";

const href = "/research/trainium-inferentia/";

export const metadata = postMetadata(href, "Llama 3.1 8B trained on one AWS Trainium and served on one Inferentia, measured beside one MI300X and one H200.");

const costName = (device: string) => (device.startsWith("inf2") ? "Inferentia2" : device.split(",")[0]);
const costs = cost.map((c) => `$${c.matched.toFixed(2)} on ${costName(c.device)}`);
const listed = `${costs.slice(0, -1).join(", ")} and ${costs.at(-1)}`;

export default function Asic() {
  return (
    <Post
      href={href}
      sources={[
        { label: "Code and logs", href: neuronLinks.repo },
        { label: "The GPU study", href: "/research/mi300x-h200/" },
        { label: "The talk", href: neuronLinks.deck },
      ]}
    >
      <Section id="findings" title="What we found">
        <Findings
          items={[
            {
              headline: "A single GPU was cheaper per token",
              line: `1.8× to 4.6× cheaper here. At 32 concurrent streams, the highest load all three chips ran, at on-demand list prices, a million output tokens cost ${listed}.`,
            },
            {
              headline: "Decode stayed flat under load",
              line: "Inferentia2 held 63 to 71 ms per token across the sweep while aggregate throughput grew 26×. It stops at 32 streams because 32 GB of device memory holds about 48 resident sequences at 2048 context.",
            },
            {
              headline: "Fine-tuning fits, and some training does not",
              line: "LoRA or full SFT on a supported architecture with static shapes is a strong fit. Online RL of any kind is blocked.",
            },
            {
              headline: "Most of the walls were toolchain, not silicon",
              line: "An exporter allowlist, ahead-of-time compilation per tensor shape, and a training class without generate().",
            },
            {
              headline: "Nothing drooped over 30 minutes",
              line: `At concurrency 8, Inferentia2 kept ${sustained.retention}% of its first iteration's throughput, ${sustained.first} to ${sustained.last} tok/s.`,
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure id="serving" title="Serving one 8B model, and what a token costs">
          <ServingFigure />
        </Figure>
        <Figure id="training" title="Training on one Trainium1 and one Trainium2">
          <TrainingFigure />
        </Figure>
        <Figure id="specdec" title="Speculative decoding on one Trainium1">
          <SpecDecodeFigure />
        </Figure>
        <Figure id="facts" title="Compile cost, quality and stability">
          <FactsStrip />
        </Figure>
        <Figure id="fit" title="Where it fit, on this evidence">
          <Table label="Where it fit" head={["Workload", "Verdict"]} rows={decision.map((d) => [d[0], d[1]])} />
        </Figure>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="Machines">One trn1.2xlarge fine-tunes the model, one inf2.xlarge serves it, and one trn2.3xlarge repeats the fine-tune.</Row>
          <Row label="GPU points">
            They come from the{" "}
            <Go href="/research/mi300x-h200/" className={link}>
              MI300X and H200 study
            </Go>
            , which used the same request shape and metric schema.
          </Row>
          <Row label="Evidence">
            Every number has a committed log in{" "}
            <Go href={neuronLinks.repo} className={link}>
              torchneuronx
            </Go>
            . The instances were terminated on 2026-08-26, and the analysis re-runs from the committed results with no AWS account.
          </Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="Not matched conditions">
            The Neuron study and the GPU study differ in the ways listed in the table under the{" "}
            <a href="#serving" className={link}>
              first figure
            </a>
            .
          </Row>
          <Row label="Prices">Cost per token is the hourly rate divided by tokens per hour, at on-demand list prices.</Row>
        </Rows>
        <P>
          The{" "}
          <Go href={neuronLinks.deck} className={link}>
            talk
          </Go>{" "}
          covers the same material.
        </P>
      </Section>
    </Post>
  );
}
