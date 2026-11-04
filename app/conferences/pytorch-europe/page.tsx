import { StudyFeature } from "@/components/home/StudyCards";
import Post, { P, postMetadata, Row, Rows, Section, Speakers } from "@/components/research/Post";
import { studies } from "@/lib/studies";
import { talkLinks, talks } from "@/lib/talks";

const href = "/conferences/pytorch-europe/";
const talk = talks.find((t) => t.href === href)!;
const links = talkLinks.europe;
const study = studies.find((s) => s.href === "/research/trainium-inferentia/")!;

export const metadata = postMetadata(href);

export default function Europe() {
  return (
    <Post
      href={href}
      primary={{ label: "Watch the recording", href: links.recording }}
      sourcesTitle="Watch and read"
      sources={[
        { label: "The recording", href: links.recording },
        { label: "The conference listing", href: links.listing },
        { label: "The talk's code and assets", href: links.code },
        { label: "Fine-tuning pipeline code", href: links.pipeline },
        { label: "The talk again, at Data Engineering Pilipinas", href: links.rerun },
      ]}
    >
      <Section id="talk" title="The talk">
        <P>
          GPU availability and cost are squeezing ML teams, making ASICs like Google TPUs and AWS Trainium attractive alternatives. But does the software stack hold up? The session
          compares the PyTorch/XLA and TorchNeuron compiler stacks through side-by-side code diffs and benchmarks, fine-tuning Llama 4, Gemma 3 and Qwen 3 and training CNNs and
          ViTs, and answers three questions.
        </P>
        <Rows>
          <Row label="The code">How much rewriting is actually required?</Row>
          <Row label="The performance">Which model architectures thrive on ASICs, and which ones fail due to dynamic shapes?</Row>
          <Row label="The debugging">What happens when you hit an out-of-memory error or a compilation hang?</Row>
        </Rows>
        <P>Attendees leave with a Migration Decision Matrix, to judge whether their own workload is ready.</P>
      </Section>

      <Section id="evidence" title="The evidence">
        <P>
          The talk&apos;s code and assets run from infrastructure and setup through models, training, fine-tuning and inference. Its companion repository fine-tunes three models,
          SFT then DPO with LoRA, on both GPU and TPU. For a later measurement of serving and training on AWS&apos;s chips, read the study below.
        </P>
        <StudyFeature s={study} label={`${study.project}, ${study.date}`} />
      </Section>

      <Section id="where" title="Where and when">
        <Rows>
          <Row label="Conference">PyTorch Conference Europe, Paris</Row>
          <Row label="Date">Wednesday 8 April 2026, 16:25 to 16:50 CEST</Row>
          <Row label="Room">Central Room</Row>
          <Row label="Track">Frameworks &amp; Compilers, intermediate level</Row>
          <Row label="Speaker">
            <Speakers names={talk.speakers!} />
          </Row>
        </Rows>
      </Section>
    </Post>
  );
}
