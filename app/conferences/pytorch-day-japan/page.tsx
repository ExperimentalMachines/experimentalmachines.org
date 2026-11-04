import Post, { Figure, P, postMetadata, Row, Rows, Section, Speakers, Table } from "@/components/research/Post";
import { talkLinks, talks } from "@/lib/talks";

const href = "/conferences/pytorch-day-japan/";
const talk = talks.find((t) => t.href === href)!;
const links = talkLinks.japan;

export const metadata = postMetadata(href);

export default function Japan() {
  return (
    <Post
      href={href}
      primary={{ label: "See it on the PyTorch Day Japan schedule", href: links.listing }}
      sourcesTitle="Watch and read"
      sources={[
        { label: "The conference listing", href: links.listing },
        { label: "First-turn latency note", href: links.firstTurn },
        { label: "ExecuTorch note", href: links.executorch },
        { label: "Why prompt bytes must not move", href: links.prompt },
        { label: "OpenWeights", href: "/openweights/" },
      ]}
    >
      <Section id="talk" title="The talk">
        <div className="space-y-4">
          <P>
            An agent prompt on a phone can open with about 2,050 tokens of harness, 1,700 of them tool definitions. On a Dimensity 9500s, a 1,036-token prefix takes 9.3 s to prefill
            on LFM2.5-1.2B and 45 s on SmolLM3-3B; faster decode does nothing to that wait. We solved it with prefix reuse, built twice because our open source app ships two
            runtimes with different cache constraints.
          </P>
          <P>
            ExecuTorch&apos;s Android API exposes prefill and full reset, but no partial rollback. We prefill the shared head at model load, then feed only the unmatched suffix
            while the prompt is an exact extension. On our llama.cpp path, LFM2.5&apos;s recurrent state cannot rewind without per-token snapshots, so we snapshot the warmed 12 MB
            state and restore it.
          </P>
          <P>
            Correctness depends on byte identity. The date is pinned per conversation, history replays the engine&apos;s own bytes, changing reasoning mode invalidates the prefix,
            and truncated replies are never reused. The talk shows the cache rules, the failures and the regression tests; measurements and logs are public.
          </P>
        </div>
      </Section>

      <Section id="evidence" title="The evidence">
        <Figure
          title="What prefix reuse saves"
          note="ExecuTorch ran Qwen3-1.7B q8da4w on 2026-08-31, feeding 903 tokens on the first turn and 20 new ones on the second. llama.cpp ran LFM2.5-1.2B Q4_K_M on 2026-09-03 on a synthetic 1,036-token prefix, restoring a 12 MB snapshot. The two rows measure different things and do not compare with each other. Both ran on the same POCO X8 Pro Max."
        >
          <Table
            label="What prefix reuse saves"
            head={["Runtime and model", "What was compared", "Before", "After"]}
            right={[2, 3]}
            min="40rem"
            rows={[
              ["ExecuTorch, Qwen3-1.7B", "Prefill on the first turn against the second, which reused 1,192 tokens", "5,852 ms", "215 ms"],
              ["llama.cpp, LFM2.5-1.2B", "Cold prefill of the head against a fresh chat's first token", "9,326 ms", "235 ms"],
            ]}
          />
        </Figure>
      </Section>

      <Section id="where" title="Where and when">
        <Rows>
          <Row label="Conference">PyTorch Day Japan, hosted by the PyTorch Foundation, Hugging Face, IBM and Mitsubishi Electric</Row>
          <Row label="Date">Thursday 10 December 2026, 5:15 PM to 5:35 PM JST</Row>
          <Row label="Room">2F Hall, Bellesalle Akihabara, Tokyo</Row>
          <Row label="Track">Physical AI/Edge AI</Row>
          <Row label="Speakers">
            <Speakers names={talk.speakers!} />
          </Row>
        </Rows>
      </Section>
    </Post>
  );
}
