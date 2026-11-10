import Post, { Figure, P, postMetadata, Row, Rows, Section, Speakers, Table } from "@/components/research/Post";
import { talkLinks, talks } from "@/lib/talks";

const href = "/conferences/pytorch-day-korea/";
const talk = talks.find((t) => t.href === href)!;
const links = talkLinks.korea;

export const metadata = postMetadata(href);

export default function Korea() {
  return (
    <Post
      href={href}
      primary={{ label: "See it on the PyTorch Day Korea site", href: links.listing }}
      sourcesTitle="Watch and read"
      sources={[
        { label: "The conference site", href: links.listing },
        { label: "The measurement", href: links.decision },
        { label: "Why the compiled model narrates a search", href: links.toolCalling },
        { label: "Which runtime we recommend, and why", href: links.runtime },
        { label: "OpenWeights", href: "/openweights/" },
      ]}
    >
      <Section id="talk" title="The talk">
        <div className="space-y-4">
          <P>
            In a model-driven agent loop, a small model on a phone decides whether to search the web or answer from its weights. A wrong call costs either a fabricated fact or
            several seconds and a network round trip.
          </P>
          <P>
            The talk puts that decision to 160 public questions from RetrievalQA, PopQA and FreshQA, through a shipping open source Android assistant on four phones, with the same
            LFM2.5 1.2B weights as a compiled ExecuTorch export and as a GGUF. The two builds did not decide alike.
          </P>
        </div>
      </Section>

      <Section id="evidence" title="The evidence">
        <Figure
          title="The same weights, two builds"
          note="160 rows an arm, seed 7, on the Dimensity 9500s, Tensor G5, Exynos 2400 and Snapdragon 8 Elite, with web search the only tool offered. Correct answers are left out here: their grading was later revised, and the notes below carry both versions."
        >
          <Table
            label="The same weights, two builds"
            head={["LFM2.5 1.2B, web search the only tool", "Compiled, 8da4w ExecuTorch", "GGUF, Q4_K_M llama.cpp"]}
            right={[1, 2]}
            min="38rem"
            rows={[
              ["Searched on the 75 questions that need it", "1 to 3 of 75", "33 or 34 of 75"],
              ["Cited a search it never made", "32 to 35 of 160", "0 of 160, on each of four phones"],
            ]}
          />
        </Figure>
        <Rows>
          <Row label="A standing note">
            These are not clean measures of the model&apos;s own judgment. On 21 of the 75 questions, the app&apos;s prompt note asks for a lookup. The GGUF obeyed it on all 21,
            which is two thirds of its 33 calls, and called on 12 of the other 54. The compiled model obeyed it on none.
          </Row>
          <Row label="A second test set">
            On a second set of rows, on one phone, the GGUF did narrate a search it had not made, twice in 160 replies in each arm. So its zero holds for the first set only.
          </Row>
          <Row label="A later correction">
            The follow-up note on why the compiled model narrates is corrected too: ExecuTorch&apos;s LFM2 graph carried state between prompts in a reused runner.
          </Row>
        </Rows>
      </Section>

      <Section id="where" title="Where and when">
        <Rows>
          <Row label="Conference">PyTorch Day Korea, hosted by the PyTorch Korea User Group</Row>
          <Row label="Date">Saturday 21 November 2026. The session&apos;s time is not published yet.</Row>
          <Row label="Room">Centerfield East 18F, AWS Korea, 231 Teheran-ro, Gangnam-gu, Seoul</Row>
          <Row label="Track">Run</Row>
          <Row label="Speaker">
            <Speakers names={talk.speakers!} />
          </Row>
        </Rows>
      </Section>
    </Post>
  );
}
