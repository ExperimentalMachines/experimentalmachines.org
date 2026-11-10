import { Aligned, Lines, PairBars, Ranges } from "@/components/research/Compare";
import Go from "@/components/home/Go";
import { link } from "@/components/home/ui";
import Post, { Figure, Findings, More, Note, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import { rtxAgentWait, rtxCapacity, rtxDecode, rtxEngines, rtxIdle, rtxLinks, rtxModels, rtxMtp, rtxOssEngines, rtxPi, rtxPools, rtxPrefill } from "@/lib/hardware-studies";

const href = "/research/one-rtx-4090/";

export const metadata = postMetadata(href);

const n = (x: number) => x.toLocaleString("en-US");
const users = rtxDecode.map((r) => r.users);
const lines = (cell: number) => rtxEngines.map((name, e) => ({ name, ys: rtxDecode.map((r) => r.cells[e][cell]) }));
const recommended = rtxEngines.length - 1;

export default function OneRtx() {
  return (
    <Post
      href={href}
      sources={[
        { label: "The full report", href: rtxLinks.report },
        { label: "Every config, in tables", href: rtxLinks.findings },
        { label: "Raw results", href: rtxLinks.raw },
        { label: "Review notes", href: rtxLinks.review },
        { label: "The local Copilot study", href: "/research/local-copilot/" },
      ]}
    >
      <Section id="findings" title="What we found">
        <Findings
          items={[
            {
              headline: "An eight-agent workload fit on one card",
              line: "With simulated turns of the pi coding agent, vLLM served 8 agents at once with a median wait of 4.9 s before each reply began, and no errors. At 16 there were still no errors, but the wait reached 16.5 s and each agent got 6.4 tok/s (tokens, pieces of words, a second).",
            },
            {
              headline: "vLLM held up best under load",
              line: "In a separate test of 16 users each sending a 1k-token prompt, it wrote 368 tok/s in total and began replies in about 2 s, where the next best engine wrote 141. It queues extra requests instead of failing them.",
            },
            {
              headline: "Each other engine hit a different wall",
              line: "Ollama is the fastest for one request at 102 tok/s, but runs this model one at a time, so replies took 49 s to start at 16 users. SGLang had the shortest median wait up to about 4 agents, then 18.7 s at 8. llama.cpp failed 8 of 54 requests at 8 agents.",
            },
            {
              headline: "gpt-oss-20b was far quicker on the same card",
              line: "With the same size of KV cache, the memory a model keeps of each conversation so far, gpt-oss-20b waited 0.26 s per turn at 8 agents where Qwen3.8 waited 4.9 s. The cause is not isolated, since replies and cache hits also differed, and their quality was not compared.",
            },
            {
              headline: "Speculative decoding helped one person chatting and hurt a team",
              line: "A small draft proposes a few tokens and the big model checks them at once. On vLLM it lifted one user's decode, writing the reply, from 52.5 to 82.3 tok/s, but one agent's session stayed level, 36 s against 37 s, and 8 agents' sessions went from 101 s to 236 s.",
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="wait"
          title="By eight agents, the recommended vLLM setup waits least"
          lede="Simulated agents with pi's real system prompt and four tools, 8 turns each; the wait is the time until each reply's first token. At one agent every engine is close."
          note="p90: 9 in 10 waits were shorter. llama.cpp failed 8 of 54 requests at 8 agents: 5 too long for its context and 3 cut off mid-stream. Ollama's replies were shorter, so only its waits compare. The two vLLM setups keep the KV cache in 8 or 4 bits (fp8, int4), and ran on different hosts."
        >
          <Ranges
            solid="the median"
            faint="p90"
            groups={rtxAgentWait.map((g) => ({
              title: `${g.agents} ${g.agents === 1 ? "agent" : "agents"} at once`,
              rows: rtxEngines.map((label, e) => ({
                label,
                low: g.waits[e][0],
                high: g.waits[e][1],
                shown: `${g.waits[e][0]} s, ${g.waits[e][1]} s at p90`,
                on: e === recommended,
                note: g.agents === 8 && label === "llama.cpp" ? "with failures" : undefined,
              })),
            }))}
          />
        </Figure>

        <Figure
          id="throughput"
          title="vLLM's total output keeps rising with users; the others level off"
          lede="A 1k prompt and 256 tokens out. Ollama stays flat at about 78 tok/s because it serves this model one request at a time. SGLang stops rising once its 4 running slots are full."
        >
          <Lines
            series={lines(1)}
            x={users}
            step={100}
            unit="tok/s"
            xLabel="Users at once, on a log scale"
            summary="Total tokens per second as users rise from 1 to 16. At 16, vLLM fp8 reaches 368, vLLM int4 pinned 357, llama.cpp 141, SGLang 122 and Ollama 78."
          />
        </Figure>

        <Figure
          id="first-token"
          title="vLLM starts replies within about 2 s at 16 users; the others climb"
          lede="The same runs. The engines that hold requests in a queue climb quickly."
        >
          <Lines
            series={lines(2)}
            x={users}
            step={10}
            digits={1}
            unit="seconds"
            xLabel="Users at once, on a log scale"
            summary="Seconds to first token as users rise from 1 to 16. At 16, Ollama takes 49.4, SGLang 26.1, llama.cpp 16.8, vLLM fp8 2.2 and vLLM int4 pinned 1.8."
          />
        </Figure>

        <Figure
          id="capacity"
          title="On the recommended setup, the wait more than triples from 8 agents to 16"
          lede="Simulated agent turns, with no errors at any load: the median wait rose from 4.9 s at 8 agents to 7.4 s at 12 and 16.5 s at 16."
          note="vLLM 0.30 with int4 KV and a pinned 246,094-token pool. Up to 13 requests waited at once under 12 to 16 agents. Real pi agents, up to 8 at once, passed 34 of 34 runs; they are under Every number."
        >
          <Aligned
            label="Agents at once"
            head={["Wait per turn, median and p90", "tok/s per agent", "Input served from cache"]}
            rows={rtxCapacity.map((r) => ({
              label: `${r.agents} ${r.agents === 1 ? "agent" : "agents"}`,
              on: r.agents === 8,
              cells: [
                { value: r.p90, low: r.p50, shown: `${r.p50} s, ${r.p90} s` },
                { value: r.perUser, shown: String(r.perUser) },
                { value: r.cached, shown: `${r.cached}%` },
              ],
            }))}
          />
        </Figure>

        <Figure
          id="pool"
          title="Among the int4 pools, size showed at twelve agents"
          lede="On this agent workload, the three int4 pools waited the same at 8 agents. At 12, a bigger pool served more from cache and waited less."
          note="0.95 and 0.97 are the share of GPU memory vLLM was given; pinned sets the pool size directly. A likely reason for the shorter waits, not isolated: each cache miss means re-reading the whole conversation, about 12k tokens."
        >
          <Aligned
            label="vLLM setup"
            head={["Pool, tokens", "Wait at 8 agents", "Wait at 12, median and p90", "From cache at 12"]}
            rows={rtxPools.map((r) => ({
              label: r.name,
              on: r.name.includes("pinned"),
              cells: [
                { value: r.pool, shown: n(r.pool) },
                { value: r.at8, shown: `${r.at8} s` },
                r.at12 ? { value: r.at12[1], low: r.at12[0], shown: `${r.at12[0]} s, ${r.at12[1]} s` } : null,
                r.cached12 === null ? null : { value: r.cached12, shown: `${r.cached12}%` },
              ],
            }))}
          />
        </Figure>

        <Figure
          id="models"
          title="gpt-oss-20b answered far sooner on the same card"
          lede="Both on vLLM with the same size of pool, each row on its own scale. A probable reason, not isolated: gpt-oss-20b uses 3.6B of its parameters per token, Qwen3.8 all 27B."
          note="gpt-oss-20b's agent replies stopped naturally at 64 to 74 tokens instead of a forced 150, so compare turn waits, not session times."
        >
          <PairBars
            a="Qwen3.8-27B"
            b="gpt-oss-20b"
            shortA="Qwen3.8"
            shortB="gpt-oss"
            rows={rtxModels.map((r) => ({
              label: r.label,
              detail: r.detail,
              a: { value: r.qwen, shown: `${n(r.qwen)}${r.unit ? ` ${r.unit}` : ""}` },
              b: { value: r.oss, shown: `${n(r.oss)}${r.unit ? ` ${r.unit}` : ""}` },
            }))}
          />
        </Figure>

        <Figure
          id="mtp"
          title="Speculative decoding speeds one chat and slows a team"
          lede="vLLM's speculative decoding (MTP), drafting 2 tokens at a time, shrank the cache pool from 180,558 tokens to 108,814."
        >
          <PairBars
            a="Without MTP"
            b="With MTP"
            shortA="Without"
            shortB="With"
            rows={rtxMtp.map((r) => ({
              label: r.label,
              detail: r.detail,
              a: { value: r.without, shown: `${r.without}${r.unit}` },
              b: { value: r.withMtp, shown: `${r.withMtp}${r.unit}` },
            }))}
          />
        </Figure>

        <More id="numbers" title="Every number" summary="Prefill, decode under load, gpt-oss-20b on every engine, how long context stays cached, and the real pi runs">
          <div>
            <Table
              label="Prefill of one request"
              head={["Prefill of one request, tok/s", ...rtxEngines]}
              right={[1, 2, 3, 4, 5]}
              min="40rem"
              rows={rtxPrefill.map((r) => [r.prompt, ...r.rates.map((v, i) => (r.prompt === "32k" && i === 0 ? `${n(v)}, see below` : n(v)))])}
            />
            <Note>
              Ollama&apos;s context was 32,768 tokens. Of its three 32k prompts, the one over that limit, 35.2k, was silently cut to 16,386 tokens. int4 KV is slower on long cold
              prompts: on host 2, a 32k prompt took 18.4 s to first token with int4 KV and 15.1 s with fp8 KV.
            </Note>
          </div>
          <Table
            label="Decode under load"
            head={["Decode at once: per user, total, first token", ...rtxEngines]}
            min="56rem"
            rows={rtxDecode.map((r) => [r.users, ...r.cells.map(([u, total, first]) => `${u}, ${total}, ${first} s`)])}
          />
          <div>
            <Table label="gpt-oss-20b on all four engines" head={["gpt-oss-20b", "vLLM", "llama.cpp", "Ollama", "SGLang"]} min="48rem" rows={rtxOssEngines} />
            <Note>
              All on host 2 with their own setups: vLLM 0.30.0 with bf16 KV pinned at 6 GiB, llama.cpp b11118 with ggml-org&apos;s MXFP4 GGUF, 8 slots and a 128k shared pool,
              Ollama 0.34.4 with 4 parallel requests, and SGLang 0.5.20 with bf16 KV and 16 running. Ollama&apos;s 34.1k prompt was silently cut to 16,386 tokens, so its 32k
              prefill is not of an intact prompt.
            </Note>
          </div>
          <div>
            <Table label="How long context stays cached" head={["Idle gap", "Quiet server", "4 other agents", "8 other agents"]} right={[1, 2, 3]} rows={rtxIdle} />
            <Note>
              Share of a context of about 12k tokens still cached after each gap, each gap with its own context. After an eviction, that turn took 5.7 to 21 s to start. Only one
              pool size was tested.
            </Note>
          </div>
          <div>
            <Table label="Real pi agents" head={["Server", "pi thinking", "Agents at once", "Passed", "Wall time"]} right={[3, 4]} min="38rem" rows={rtxPi} />
            <Note>34 of 34 runs passed, and no agent edited the test files. Tasks were small, 4 to 15 tool calls, on small repositories with failing tests.</Note>
          </div>
        </More>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="Question">Can one rented RTX 4090 serve Qwen3.8-27B to a team using the pi coding agent, and with which engine and quantization?</Row>
          <Row label="Machine">
            One RTX 4090, 24,564 MiB, Ryzen 9 7950X, 61 GB, on RunPod EU-RO-1, on two hosts with the same volume: host 1 on 2026-09-23 and host 2 on 2026-09-24.
          </Row>
          <Row label="Engines">
            Ollama 0.34.3 with its Q4_K_M build and speculative decoding on by default. llama.cpp b11118 with UD-Q4_K_XL, 8 slots and a 64k shared pool. SGLang 0.5.19 with INT4,
            fp8 KV and 4 running requests. vLLM 0.30.0 with INT4, once with fp8 KV and an 84,898-token pool, once with int4 KV and a pinned 246,094-token pool.
          </Row>
          <Row label="Load">
            A load generator on the pod, so no network is in the numbers, with real Python source, unique per request. The agent scenario uses pi&apos;s real system prompt and 4
            tools, for 8 turns of about 1.5k new tokens in and 150 out, growing to about 12.6k tokens.
          </Row>
          <Row label="Real agents">Real pi agents on a Mac, up to 8 at once, 34 of 34 passing.</Row>
          <Row label="The setup we recommend">
            vLLM 0.30.0, RedHatAI&apos;s INT4 weights at 16.59 GiB on the GPU, vision tower off, int4 KV pinned at 4.5 GiB, recurrent state in fp16, prefix caching on and
            speculative decoding off.
          </Row>
          <Row label="Review">
            Codex reviewed the method and report over 11 rounds. The notes are in the{" "}
            <Go href={rtxLinks.review} className={link}>
              repository
            </Go>
            .
          </Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="Two hosts">
            The recommended setup and vLLM fp8 ran on different hosts, and fp8 KV prefilled 17 to 18% slower on host 2 than host 1, with no explanation found. Do not read small
            differences between setups as real.
          </Row>
          <Row label="Not one file">The engines ran different quantizations of the model, and output quality was not measured on our own tasks.</Row>
          <Row label="Small tasks">The real pi runs had 4 to 15 tool calls, so they show tool calls and concurrency work, not quality on real work.</Row>
          <Row label="Longer sessions">
            Real pi sessions went no longer than about 12.6k tokens. Sessions near 30k should lower the ceiling to about 4 to 5 agents, which is a projection and not a measurement.
          </Row>
          <Row label="No fairness">vLLM serves first come, first served. One user running 8 agents slowed everyone else, and the light users were not protected.</Row>
          <Row label="One architecture">
            Which engine wins depends on the model&apos;s architecture and weight format. On gpt-oss-20b, llama.cpp had the fastest single stream. Test a new model before choosing.
          </Row>
          <Row label="Versions">Engines change quickly, and these are the versions of September 2026.</Row>
        </Rows>
      </Section>
    </Post>
  );
}
