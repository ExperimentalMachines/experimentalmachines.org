import { StudyFeature } from "@/components/home/StudyCards";
import Post, { P, postMetadata, Row, Rows, Section, Speakers } from "@/components/research/Post";
import { copilotLinks } from "@/lib/hardware-studies";
import { studies } from "@/lib/studies";
import { talkLinks, talks } from "@/lib/talks";

const href = "/conferences/github-universe/";
const talk = talks.find((t) => t.href === href)!;
const study = studies.find((s) => s.href === "/research/local-copilot/")!;

export const metadata = postMetadata(href);

export default function Universe() {
  return (
    <Post
      href={href}
      primary={{ label: "See it in the GitHub Universe catalog", href: talkLinks.universe.listing }}
      sourcesTitle="Watch and read"
      sources={[
        { label: "The conference listing", href: talkLinks.universe.listing },
        { label: "The full study", href: study.href },
        { label: "Every result", href: copilotLinks.results },
        { label: "Code, traces and patches", href: copilotLinks.repo },
      ]}
    >
      <Section id="talk" title="The talk">
        <div className="space-y-4">
          <P>
            Bring your own key for GitHub Copilot is now generally available, and open-weight coding models keep landing on Hugging Face every few weeks. But it does not cover code
            completions, embeddings or repository indexing. So when does running a local model actually pay off?
          </P>
          <P>
            The session compares three open-weight coders on a single RTX 4090 and an Apple M5 against Copilot&apos;s default agent mode on real repository tasks, and shows how to
            run the same comparison on your own repositories.
          </P>
        </div>
      </Section>

      <Section id="evidence" title="The evidence">
        <P>
          On 24 paired tasks, Qwen3.6 on the RTX 4090 finished 42% and Copilot Pro+ on Auto finished 92%. Qwen3.6 ran with reasoning off while the hosted models ran as GitHub
          serves them, which may understate it. The study compares whole configurations from one run per task, and it supports no plan ranking or buying rule.
        </P>
        <StudyFeature s={study} label={`${study.project}, ${study.date}`} />
      </Section>

      <Section id="where" title="Where and when">
        <Rows>
          <Row label="Conference">GitHub Universe, San Francisco</Row>
          <Row label="Date">Wednesday 28 October 2026, 4:25 PM to 4:40 PM PDT</Row>
          <Row label="Room">Demos &amp; Donuts, Gateway Pavilion, Level 2</Row>
          <Row label="Session">BLD1241D, a product demo, in person</Row>
          <Row label="Speaker">
            <Speakers names={talk.speakers!} />
          </Row>
        </Rows>
      </Section>
    </Post>
  );
}
