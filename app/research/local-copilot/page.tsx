import { Interval, PairBars, Scorecard, Stack } from "@/components/research/Compare";
import Post, { Figure, Findings, More, Note, postMetadata, Row, Rows, Section, Table } from "@/components/research/Post";
import { copilotCells, copilotContrasts, copilotHarness, copilotLinks, copilotWait } from "@/lib/hardware-studies";

const href = "/research/local-copilot/";

export const metadata = postMetadata(href);

const pct = (passed: number) => `${Math.round((passed / 24) * 100)}%`;

export default function LocalCopilot() {
  return (
    <Post
      href={href}
      sources={[
        { label: "The talk at GitHub Universe", href: "/conferences/github-universe/" },
        { label: "Every result", href: copilotLinks.results },
        { label: "The protocol", href: copilotLinks.protocol },
        { label: "Code, traces and patches", href: copilotLinks.repo },
      ]}
      sourcesNote="The measurement behind GitHub Universe 2026 session BLD1241D, “When is local Copilot worth it? Three open-weight coders vs. Copilot out of the box”. Every run's trace, patch, check result and timing row is committed."
    >
      <Section id="findings" title="What we found">
        <Findings
          items={[
            {
              headline: "Hosted finished more: 92% against 42%",
              line: "The main comparison, set before scoring, was Qwen3.6 on an RTX 4090 against Copilot Pro+ on Auto, where GitHub picks the model. On the same 24 tasks the local setup finished 50 percentage points fewer, with a 95% interval of 29 to 71 points (p = 0.0005).",
            },
            {
              headline: "Gemma 4 on the 4090 came closest",
              line: "It finished 58% against Pro+ on Auto's 92%; after correcting for making several comparisons, the study did not declare that gap. Every other local configuration finished 29% to 42%.",
            },
            {
              headline: "Fast is not the same as finished",
              line: "gpt-oss-20b on the 4090 had the shortest median run, 31.7 s against 57.9 s for Pro+ on Auto, and passed 10 of 24. Qwen3.6 on the 4090 had a median of 600 s, the time limit: 13 of its 24 runs reached it.",
            },
            {
              headline: "Qwen3.6 finished 6 more tasks under a different agent setup",
              line: "In a separate, exploratory test, Qwen3.6 finished 12 of 24 tasks with Copilot CLI and 18 with pi, a different coding agent; with Copilot CLI it often called a tool with made-up IDs until time ran out. Several setup details changed at once.",
            },
            {
              headline: "Local was not always cheaper per finished task",
              line: "Counting only per-use cost, rented GPU time without idle time and hosted credits without the monthly price, Qwen3.6 on the 4090 cost $0.218 per finished task and Pro+ on Auto $0.169. gpt-oss-20b cost $0.022 and Gemma 4 $0.098.",
            },
          ]}
        />
      </Section>

      <Section id="results" title="The results">
        <Figure
          id="scorecard"
          title="Hosted Copilot finished 22 to 24 of 24 tasks; local setups 7 to 14"
          lede="The ten setups the study registered, on the 24 tasks every setup ran; limiting the analysis to those 24 was decided after some results were in. Quick did not mean finished, as gpt-oss-20b on the 4090 shows."
          note="Finished: the task's checks pass on the agent's checkout. Runs are capped at 600 s. Cost: agent time at $0.89 an hour on the rented 4090, idle and loading excluded; credits at $0.01 on hosted plans, leaving out each plan's monthly price. Electricity on the MacBook Air was not measured."
        >
          <Scorecard
            a="Hosted Copilot"
            b="Served locally"
            rows={copilotCells.map((c) => ({
              name: c.name,
              first: c.name.startsWith("Copilot"),
              passed: c.passed,
              of: 24,
              wall: c.wall,
              cost: c.cost.startsWith("$") ? parseFloat(c.cost.slice(1)) : null,
              costShown: c.cost.startsWith("$") ? c.cost : "not measured",
            }))}
          />
        </Figure>

        <Figure
          id="gaps"
          title="Every local setup finished fewer tasks than Copilot Pro+ on Auto"
          lede="Gap in tasks finished, in percentage points, with its 95% interval. Left of zero finished less than Pro+ on Auto. The shaded band is the study's 10-point margin."
          note="Declared: the study counts the gap as real after correcting for making several comparisons (the Holm correction). Gemma 4 on the RTX 4090 lies past the margin, but its corrected p of 0.108 misses the 0.05 bar, so no difference is declared."
        >
          <Interval a="Hosted Copilot" b="Served locally" from={-80} to={40} band={10} rows={copilotContrasts} />
        </Figure>

        <Figure
          id="wait"
          title="On the rented 4090, a third or more of the time went to the network and proxy"
          lede="Share of each setup's agent time. Prefill is the model reading the prompt and decode is it writing the reply; on the Air nearly all the time went to those two. Hosted model time is one number."
        >
          <Stack parts={["Prefill", "Decode", "Network and proxy", "Tools and CLI"]} unsplit="Model, hosted and not split" rows={copilotWait} />
        </Figure>

        <Figure
          id="harness"
          title="Different agent setups moved results by up to 6 tasks, both ways"
          lede="Checked after the study with the same model files, server, tasks and checks, both agents on one 4090. Tasks finished of 24, with the median run. Exploratory, and outside every contrast."
        >
          <PairBars
            a="Copilot CLI"
            b="pi"
            shortA="Copilot CLI"
            shortB="pi"
            shared
            rows={copilotHarness.map(([model, cli, pi]) => {
              const reading = (s: string) => ({ value: parseInt(s, 10), shown: s });
              return { label: model, a: reading(cli), b: reading(pi) };
            })}
          />
        </Figure>

        <More id="numbers" title="Every number" summary="The ten setups and the two-agent check as tables">
          <Table
            label="The ten registered configurations"
            head={["Configuration", "Passed of 24", "Share", "Median run", "Per completed task"]}
            right={[1, 2, 3, 4]}
            rows={copilotCells.map((c) => [c.name, c.passed, pct(c.passed), `${c.wall.toFixed(1)} s`, c.cost])}
          />
          <Table label="Same models, two agents" head={["Model", "Copilot CLI", "pi"]} right={[1, 2]} rows={copilotHarness} />
        </More>
      </Section>

      <Section id="method" title="How we ran it">
        <Rows>
          <Row label="Tasks">24 real pending maintenance tasks on three public repositories, each frozen at a commit, with an acceptance check anyone can run.</Row>
          <Row label="Agent">Copilot CLI, the same binary and flags on every configuration. Every run starts from a fresh clone and is capped at 600 s: the waiting budget.</Row>
          <Row label="Scoring">The task&apos;s own acceptance test, the repository&apos;s existing tests and a tamper check, run outside the agent&apos;s copy.</Row>
          <Row label="Local">llama-server from llama.cpp at commit c1d0e7a, on a rented RTX 4090 and on a 24 GB MacBook Air M5.</Row>
          <Row label="Runs">
            754 scored runs: 240 in the ten registered configurations and 514 in exploratory ones. The core rules were committed before October scoring. Later changes are logged in
            the protocol and marked where they came after related results, such as limiting the analysis to the 24 tasks every setup ran.
          </Row>
          <Row label="Statistics">Task-paired bootstrap and permutation for the primary contrast, with the Holm correction on the secondary ones.</Row>
        </Rows>
      </Section>

      <Section id="limits" title="Limits">
        <Rows>
          <Row label="No buying rule">24 tasks from three repositories chosen by the author support no claim of equivalence, plan ranking or general buying rule.</Row>
          <Row label="Whole configurations">
            Model file and quantization (how many bits store each of the model&apos;s numbers), runtime, memory pressure, client OS, tools, credit budget and Auto routing all
            differ. The results compare configurations and do not attribute a gap to hardware alone.
          </Row>
          <Row label="One run each">
            The registered analysis is one run per task and configuration, at temperature 0 with no fixed seed, so its interval is across tasks and does not establish
            repeatability. In the exploratory setup with agent and model on one machine, a second Copilot CLI run of Qwen3.6 moved from 12 to 9 of 24.
          </Row>
          <Row label="A rented 4090">
            It was reached over the network. For Qwen3.6, 57% of the summed time went to the network, proxy and HTTP, a median of 284.6 s a run. The study estimates a desk 4090 at
            176.4 s a run, assuming the agent acts the same, which is not evidence that its capped runs would have finished.
          </Row>
          <Row label="Reasoning off">
            Qwen3.6 and Gemma 4 ran with reasoning off and gpt-oss-20b at low effort, while the hosted models ran as GitHub serves them. That may understate the open models: Mellum
            passed 4 of 24 with reasoning off and 11 of 24 with it on.
          </Row>
          <Row label="The MacBook Air">
            It paged memory to disk in most of its runs, with 1.6 to 10.1 GB of swap in use, and 13 of the 24 Qwen3.6 runs and 23 of the 24 Gemma 4 runs ran on battery. What that
            changed is not measured. It also ran Qwen3.6 and Gemma 4 at smaller quantizations than the 4090; only gpt-oss-20b is the same file on both.
          </Row>
          <Row label="One harness">
            Copilot CLI is the only harness in the registered design, so results are model-plus-harness outcomes. One model request at a time; several agents at once are not
            measured.
          </Row>
          <Row label="Isolation">
            The sandbox lowers, and does not rule out, the chance that an agent reached outside its copy of the task, for example to the web. Hosted runs kept web and GitHub tools,
            though no fetching command was detected in their traces. Hosted Auto routing cannot be reproduced; the model each run used is in its trace.
          </Row>
        </Rows>
        <Note>The results document opens with the full list of caveats. Read it before quoting these numbers.</Note>
      </Section>
    </Post>
  );
}
