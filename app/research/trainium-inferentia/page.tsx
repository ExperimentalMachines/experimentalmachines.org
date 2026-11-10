import FactsStrip from "@/components/asic/FactsStrip";
import ServingFigure from "@/components/asic/ServingFigure";
import SpecDecodeFigure from "@/components/asic/SpecDecodeFigure";
import TrainingFigure from "@/components/asic/TrainingFigure";
import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import Post, { Figure, Findings, P, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import { cost, decision, ladder, neuronLinks, serving, sustained } from "@/lib/neuron";

const href = "/research/trainium-inferentia/";

export const metadata = postMetadata(href, "Llama 3.1 8B trained on one AWS Trainium and served on one Inferentia, measured beside one MI300X and one H200.");

const costName = (device: string) => (device.startsWith("inf2") ? "Inferentia2" : `an ${device.split(",")[0]}`);
const costs = cost.map((c) => `$${c.matched.toFixed(2)} on ${costName(c.device)}`);
const listed = `${costs.slice(0, -1).join(", ")} and ${costs.at(-1)}`;
// How many times an Inferentia2 token cost a GPU token, at the 32 streams all three ran and at each GPU's best load.
const [inf2, ...gpus] = cost;
const span = (xs: number[]) => `${Math.min(...xs).toFixed(1)}× to ${Math.max(...xs).toFixed(1)}×`;
const atMatched = span(gpus.map((g) => inf2.matched / g.matched));
const atBest = span(gpus.map((g) => inf2.best / g.best));
const trn2Gain = Math.max(...ladder.filter((r) => r.trn1).map((r) => r.trn2.tok / r.trn1!.tok)).toFixed(1);

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
              headline: "A single GPU served tokens for less",
              line: `At 32 streams (requests served at once), the most Inferentia2 ran, a million output tokens, the pieces of words a model writes, cost ${listed} at on-demand list prices. A GPU was ${atMatched} cheaper there, and ${atBest} at its best load.`,
            },
            {
              headline: "Each reply kept its pace under load",
              line: `Decode, writing the reply one token at a time, held at ${Math.round(Math.min(...serving.inf2Tpot))} to ${Math.round(Math.max(...serving.inf2Tpot))} ms a token from 1 to 32 streams while total output grew ${Math.round(serving.inf2[4]! / serving.inf2[0]!)}×. It stops at 32 streams, the number it was compiled for; its 32 GB of memory holds no more than about 48 conversations of 2,048 tokens.`,
            },
            {
              headline: "Fine-tuning works; online RL did not run",
              line: "Fine-tuning a supported model on example replies works well, by LoRA, which trains a small add-on instead of every weight, or in full, as long as input sizes stay fixed. Online reinforcement learning (RL), where the model learns from scores on replies it writes during training, did not run: the training class tested could not generate replies.",
            },
            {
              headline: "Most of the walls were software, not the chips",
              line: "The export tool accepts only a fixed list of model types, every new input size needs its own compile, and the training class tested cannot have the model write replies, which is what blocked online RL.",
            },
            {
              headline: "Nothing drooped over 30 minutes",
              line: `At 8 streams, Inferentia2 kept ${sustained.retention}% of its first round's speed, ${sustained.first} to ${sustained.last} tokens a second (tok/s).`,
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="serving"
          title="The GPUs kept scaling past Inferentia2's 32 streams, and cost less per token"
          lede="Total output tok/s as streams are added, on log scales, and what a million output tokens cost at list prices."
        >
          <ServingFigure />
        </Figure>
        <Figure
          id="training"
          title={`Trainium2 fine-tuned up to ${trn2Gain}× faster, and only it fit 8,192-token examples`}
          lede="Training speed for one LoRA fine-tune of Llama 3.1 8B at three example lengths; MFU is the share of the chip's peak arithmetic the training used."
        >
          <TrainingFigure />
        </Figure>
        <Figure
          id="specdec"
          title="A 1B draft model made one stream about 2.5× faster"
          lede="In speculative decoding a small draft model proposes a few tokens and the big model checks them at once; here a Llama 3.2 1B drafts for the 8B."
        >
          <SpecDecodeFigure />
        </Figure>
        <Figure id="facts" title="The fine-tune needed no recompile and learned; serving held steady for 30 minutes">
          <FactsStrip />
        </Figure>
        <Figure id="fit" title="Fine-tuning fit well; serving at the lowest cost did not">
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
            , which used the same request shape and the same measures.
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
