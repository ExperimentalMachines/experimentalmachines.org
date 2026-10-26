// The research areas' pages, /asic and /gguf. Each lists the work in that area,
// newest study first. Pages on this site start with "/"; a study that belongs to
// a product lives under that product and is listed here too. Descriptions are
// taken from each repository's README or GitHub description.

import { ggufLinks } from "@/lib/gguf";
import { neuronLinks } from "@/lib/neuron";

export type ResearchItem = {
  href: string;
  title: string;
  line: string;
  // When it was measured, for a study; what it is, for a tool or a talk.
  meta: string;
  more?: { href: string; label: string }[];
};

const me = "https://github.com/alpharomercoma";

export const asicStudies: ResearchItem[] = [
  {
    href: "/asic/trainium-inferentia/",
    title: "Llama 3.1 8B on AWS Trainium and Inferentia",
    meta: "July and August 2026",
    line: "A LoRA fine-tune on one Trainium1 and one Trainium2, served by vLLM on one Inferentia2, measured beside one MI300X and one H200 with the same request shape.",
    more: [
      { href: neuronLinks.repo, label: "Code and logs" },
      { href: neuronLinks.gpuRepo, label: "The GPU study" },
      { href: neuronLinks.deck, label: "The talk" },
    ],
  },
];

export const asicTools: ResearchItem[] = [
  {
    href: "https://will-it-asic.vercel.app",
    title: "will-it-asic",
    meta: "Calculator",
    line: "Can that model run on that ASIC? Memory math and compiler support for Google TPU, AWS Trainium and Inferentia and Intel Gaudi against NVIDIA GPUs, every spec cited.",
    more: [{ href: `${me}/will-it-asic`, label: "Source" }],
  },
  {
    href: `${me}/xla-agentic-development`,
    title: "XLA agentic development",
    meta: "Agent skills",
    line: "Claude Code and Codex skills for Google TPUs: Pallas kernels, XProf profiling, XLA compiler artifacts and PyTorch/XLA lowering problems.",
  },
  {
    href: `${me}/pytorch-for-asics`,
    title: "De-mystifying PyTorch for ASICs",
    meta: "PyTorch Europe conference talk",
    line: "The talk's code and assets. Its companion repository fine-tunes three models, SFT then DPO with LoRA, on both GPU and TPU.",
    more: [{ href: `${me}/pytorch-for-asics-code`, label: "Pipeline code" }],
  },
  {
    href: `${me}/devfest25-tpu`,
    title: "PyTorch/XLA on Google TPU",
    meta: "Talk code, DevFest 2025",
    line: "Google TPU code for our talks: PyTorch/XLA basics, MNIST, and inner and outer products the way a systolic array computes them.",
  },
  {
    href: `${me}/aws-torchneuronx`,
    title: "First steps on Trainium1",
    meta: "Code",
    line: "Deep-learning projects on Trainium1 instances, starting with MNIST, and a write-up of why it first trained on the CPU instead.",
  },
];

// /gguf lists every study that ran GGUF files, wherever it lives.
export const ggufStudies: ResearchItem[] = [
  {
    href: "/openweights/prefill-decode/",
    title: "Prefill and decode on CPU, GPU and NPU",
    meta: "24 October 2026, OpenWeights",
    line: "Nine GGUF models through every pairing of the processor that reads the prompt and the one that writes the reply, in one llama.cpp build on a Snapdragon 8 Elite Gen 5.",
  },
  {
    href: "https://github.com/ExperimentalMachines/copilot-local-bench",
    title: "When is local Copilot worth it?",
    meta: "GitHub Universe 2026, BLD1241D",
    line: "The same Copilot CLI agent on the same real tasks, against open-weight GGUF models served by llama.cpp on an RTX 4090 and a MacBook Air M5, and against hosted Copilot.",
  },
  {
    href: "/gguf/a100-quantization/",
    title: "A 2B model in ten GGUF formats on one A100",
    meta: "12 September 2026",
    line: "BF16 and nine llama.cpp quantizations of one tool-calling model: size, speed and how many of its decisions each format keeps, and the same weights behind vLLM.",
    more: [{ href: ggufLinks.files, label: "The ten files" }],
  },
  {
    href: "/openweights/latency/",
    title: "Five chips, two runtimes",
    meta: "3 and 4 September 2026, OpenWeights",
    line: "Time to first token and per output token for five small models on five phone chips, as GGUF files in llama.cpp and as ExecuTorch exports.",
  },
];
