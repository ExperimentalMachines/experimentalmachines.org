import { ggufRecommended, ggufRows } from "@/lib/gguf";

const ggufPick = ggufRows.find((r) => r.format === ggufRecommended)!;

export const site = {
  name: "Experimental Machines",
  wordmark: ["Experimental", "Machines"] as const,
  url: "https://experimentalmachines.org",
  description:
    "Benchmarks of AI accelerators at datacenter, laptop and phone scale, with published logs.",
  email: "alpha@experimentalmachines.org",
  github: "https://github.com/ExperimentalMachines",
};

export const sibling = {
  name: "Experimental Intelligence",
  url: "https://experimentalintelligence.org",
};

type Row = {
  repo: string;
  href: string;
  measured: string;
  result: string;
};

export type HardwareClass = {
  id: "server" | "laptop" | "phone";
  title: string;
  lede: string;
  rows: Row[];
};

export const classes: HardwareClass[] = [
  {
    id: "server",
    title: "Server",
    lede: "AMD MI300X against NVIDIA H200 in inference and training, plus Trainium, Inferentia and TPUs.",
    rows: [
      {
        repo: "MI300X-vs-H200",
        href: "https://github.com/alpharomercoma/MI300X-vs-H200",
        measured: "One GPU each, serving and training, three shapes, eight concurrency points",
        result: "MI300X 1.14x on 70B FP8; H200 1.40x on 8B serving and 1.32 to 1.40x on training",
      },
      {
        repo: "gguf-a100",
        href: "/gguf",
        measured: `A 2B model as BF16 GGUF and ${ggufRows.length - 1} llama.cpp quantizations on one A100: size, bits per weight, throughput`,
        result: `${ggufRecommended}: ${ggufPick.gib.toFixed(2)} GiB, ${Math.round(ggufPick.tg)} tok/s`,
      },
      {
        repo: "qwen3.8-27b-mi300x",
        href: "https://github.com/alpharomercoma/qwen3.8-27b-mi300x",
        measured: "Qwen3.8-27B served from one MI300X with vLLM behind an authenticated endpoint",
        result: "OpenAI-compatible endpoint",
      },
      {
        repo: "torchneuronx",
        href: "https://github.com/alpharomercoma/torchneuronx",
        measured: "Llama 3.1 8B LoRA on Trainium1, served by vLLM on Inferentia2",
        result: "trn1 to inf2",
      },
      {
        repo: "serverless-inference",
        href: "https://github.com/alpharomercoma/serverless-inference",
        measured: "Scale-to-zero inference on RunPod; model and GPU chosen by shootout",
        result: "RunPod, scale to zero",
      },
      {
        repo: "compute-visualizer",
        href: "https://github.com/alpharomercoma/compute-visualizer",
        measured: "Roofline and five-way bottleneck analysis for H100 training and inference",
        result: "H100 roofline, five bottlenecks",
      },
      {
        repo: "will-it-asic",
        href: "https://github.com/alpharomercoma/will-it-asic",
        measured: "Will this model fit a TPU, Trainium, Inferentia, Gaudi or GPU?",
        result: "TPU, Trainium, Inferentia, Gaudi, GPU",
      },
      {
        repo: "pytorch-for-asics",
        href: "https://github.com/alpharomercoma/pytorch-for-asics",
        measured: "De-mystifying PyTorch for ASICs, PyTorch Conference Europe 2026",
        result: "conference talk",
      },
      {
        repo: "xla-agentic-development",
        href: "https://github.com/alpharomercoma/xla-agentic-development",
        measured: "Skills for coding agents on TPUs: Pallas, XProf, XLA lowering",
        result: "Claude Code and Codex plugin",
      },
    ],
  },
  {
    id: "laptop",
    title: "Laptop",
    lede: "Apple M5 against Snapdragon X2 Elite: same llama.cpp release, byte-identical weights, each chip's own GPU backend.",
    rows: [
      {
        repo: "snapdragon-vs-m5",
        href: "https://github.com/alpharomercoma/snapdragon-vs-m5",
        measured: "37 tests each: CPU, GPU and NPU inference, training, a 10-minute sustained loop, perplexity",
        result: "M5 1.93x on GPU decode; X2 1.10x on CPU",
      },
      {
        repo: "mlx-models",
        href: "https://github.com/alpharomercoma/mlx-models",
        measured: "MLP, CNN and ViT trained from scratch on an M5 Air, then Whisper, CLIP, SigLIP",
        result: "MLX 0.32 on 24 GB unified memory",
      },
      {
        repo: "mlx-agentic-development",
        href: "https://github.com/alpharomercoma/mlx-agentic-development",
        measured: "Does an MLX skills kit help a coding agent? Pre-registered, placebo arm, 250 runs",
        result: "null result, p = 0.69",
      },
    ],
  },
  {
    id: "phone",
    title: "Phone",
    lede: "Snapdragon 8 Elite against Dimensity 9500s, measured on the phones themselves, no root.",
    rows: [
      {
        repo: "snapdragon-vs-mediatek",
        href: "https://github.com/alpharomercoma/snapdragon-vs-mediatek",
        measured: "NPU, GPU and CPU inference and training, int8 and fp16, on device",
        result: "4,307 vs 1,100 to 1,470 GOPS int8 on the NPU",
      },
      {
        repo: "poco-phone-ai-training",
        href: "https://github.com/alpharomercoma/poco-phone-ai-training",
        measured: "Is the Dimensity 9500s NPU reachable without root? Through NeuroPilot, yes",
        result: "1.1 to 1.5 TOPS int8",
      },
      {
        repo: "openweights",
        href: "https://github.com/ExperimentalMachines/openweights",
        measured: "Hugging Face open weights on Android, native Kotlin and llama.cpp, no account",
        result: "on the Play Store",
      },
    ],
  },
];

export type Person = {
  name: string;
  role: string;
  href: string;
  email?: string;
};

export const people: Person[] = [
  {
    name: "Alpha Romer Coma",
    role: "Founder",
    href: "https://www.linkedin.com/in/alpharomercoma/",
  },
  {
    name: "Arjhine Ty",
    role: "Co-Founder",
    href: "https://www.linkedin.com/in/arjhinety/",
    email: "arjhine@experimentalmachines.org",
  },
];
