// Our conference talks, newest first, for /conferences and the homepage. Each listing's details are copied from
// the conference's own page on 2026-11-04. A cover carries the talk's finding over its own numbers, as a research
// post's does, except a talk with no published number, whose cover names what it covers.

import { copilotCells } from "@/lib/hardware-studies";
import type { Study } from "@/lib/studies";

const repo = "https://github.com/ExperimentalMachines/openweights/blob/main/docs/research";

export const talkLinks = {
  japan: {
    listing: "https://events.linuxfoundation.org/pytorch-day-japan/program/schedule/?id=1325509",
    firstTurn: `${repo}/first-turn-latency.md`,
    executorch: `${repo}/executorch.md`,
    prompt: `${repo}/date-in-the-prompt.md`,
  },
  korea: {
    listing: "https://pytorchday.kr/#sessions",
    decision: `${repo}/retrieve-or-answer.md`,
    toolCalling: `${repo}/executorch-tool-calling.md`,
    runtime: `${repo}/recommended-runtime.md`,
  },
  universe: {
    listing: "https://reg.githubuniverse.com/flow/github/universe26/attendee-portal/page/sessioncatalog/session/1777208642747001yQNz",
  },
  europe: {
    listing: "https://pytorchconferenceeu2026.sched.com/event/2HirM",
    recording: "https://www.youtube.com/watch?v=2jweAgKcT8w",
    rerun: "https://www.youtube.com/watch?v=2PbHb70v_EY",
    code: "https://github.com/alpharomercoma/pytorch-for-asics",
    pipeline: "https://github.com/alpharomercoma/pytorch-for-asics-code",
  },
};

// ExecuTorch, Qwen3-1.7B: turn one against turn two. docs/research/executorch.md.
export const prefixTurns = { first: 5852, second: 215 };

// LFM2.5 1.2B with search only, the model deciding, over the 75 rows that need a search on four phones.
// docs/research/retrieve-or-answer.md.
export const searchCalls = { gguf: 33, compiledMax: 3 };

export const talks: Study[] = [
  {
    href: "/conferences/pytorch-day-japan/",
    title: "When the KV Cache Cannot Roll Back",
    fullTitle: "When the KV Cache Cannot Roll Back: Prefix Reuse on Android",
    eyebrow: "PyTorch Day Japan",
    meta: "Tokyo, 10 December 2026",
    date: "10 December 2026",
    project: "OpenWeights",
    speakers: ["Alpha Romer Coma", "Arjhine Ty"],
    line: "How a phone skips re-reading a 2,050-token agent prompt, built twice because the app's two runtimes have different cache constraints.",
    hook: `${Math.round(prefixTurns.first / prefixTurns.second)}×`,
    hookLabel: "faster prefill on a second turn: Qwen3-1.7B on ExecuTorch, reusing 1,192 tokens",
    viz: {
      kind: "bars",
      rows: [
        { label: "First turn", value: prefixTurns.first, shown: "5,852 ms" },
        { label: "Second turn", value: prefixTurns.second, shown: "215 ms", on: true },
      ],
    },
  },
  {
    href: "/conferences/pytorch-day-korea/",
    title: "The Search It Never Made",
    fullTitle: "The Search It Never Made: When a 1.2B On-Device Model Should Call Web Search",
    eyebrow: "PyTorch Day Korea",
    meta: "Seoul, 21 November 2026",
    date: "21 November 2026",
    project: "OpenWeights",
    speakers: ["Xynil Jhed Lacap"],
    line: "Whether a small model on a phone searches when it must, on 160 public questions, four phones and two builds of the same weights.",
    hook: "1 in 5",
    hookLabel: "replies from the compiled 1.2B cited a search it never made, on our first test set. As a GGUF, none of 640",
    viz: {
      kind: "bars",
      rows: [
        { label: "GGUF searched", value: searchCalls.gguf, shown: "33 of 75" },
        { label: "Compiled searched", value: searchCalls.compiledMax, shown: "1 to 3 of 75", on: true },
      ],
    },
  },
  {
    href: "/conferences/github-universe/",
    title: "When is local Copilot worth it?",
    fullTitle: "When is local Copilot worth it? Three open-weight coders vs. Copilot out of the box",
    eyebrow: "GitHub Universe",
    meta: "San Francisco, 28 October 2026",
    date: "28 October 2026",
    project: "GGUF",
    speakers: ["Alpha Romer Coma"],
    line: "The same Copilot CLI agent on the same real tasks: open-weight models you serve yourself against hosted Copilot.",
    hook: "24 tasks",
    hookLabel: "of real work on ten setups. Each bar is tasks finished; the bright ones ran locally",
    viz: { kind: "columns", groups: copilotCells.map((c) => [{ value: c.passed, on: !c.name.startsWith("Copilot") }]) },
  },
  {
    href: "/conferences/pytorch-europe/",
    title: "De-mystifying PyTorch for ASICs",
    fullTitle: "De-mystifying PyTorch for ASICs: When (and Why) To Move Your Development To AI Accelerators",
    eyebrow: "PyTorch Conference Europe",
    meta: "Paris, 8 April 2026",
    date: "8 April 2026",
    project: "ASICs",
    speakers: ["Alpha Romer Coma"],
    line: "A code-first check on moving PyTorch from GPUs to Google TPUs and AWS Trainium, and when it is worth doing.",
    hook: "Compiler Tax",
    hookLabel: "what surprises developers moving PyTorch workloads to ASICs",
    viz: { kind: "chips", items: ["Llama 4", "Gemma 3", "Qwen 3", "CNNs", "ViTs"] },
  },
];
