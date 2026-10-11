// Copy for the homepage. Project facts are taken from each repository's README,
// results and research log under github.com/ExperimentalMachines, and upstream
// items from pytorch/executorch; change them there first.

import { publishedAsOf, publishedRepos } from "@/lib/execupack-published";

const gh = "https://github.com/ExperimentalMachines";
const et = "https://github.com/pytorch/executorch";

export const links = {
  github: gh,
  huggingface: "https://huggingface.co/experimentalmachines",
  play: "https://play.google.com/store/apps/details?id=io.github.alpharomercoma.openweights",
  execuservePlay: "https://play.google.com/store/apps/details?id=org.experimentalmachines.execuserve",
  executorch: "https://pytorch.org/executorch/",
  openweights: `${gh}/openweights`,
  openweightsIos: `${gh}/OpenWeights-iOS`,
  openweightsLatency: "https://experimentalmachines.github.io/openweights/latency.html",
  execupack: `${gh}/execupack`,
  execupackFindings: `${gh}/execupack/blob/main/docs/research/README.md`,
  execuserve: "/execuserve",
  execuserveRepo: `${gh}/execuserve`,
  execuserveNpu: `${gh}/execuserve/blob/main/docs/results/2026-10-06-npu.md`,
  execubench: `${gh}/execubench`,
  execubenchPlan: `${gh}/execubench/blob/main/docs/PLAN.md`,
  execubenchDevices: `${gh}/execubench/blob/main/docs/DEVICES.md`,
  exports: "/executorch",
};

// The four projects, in the order the page tells them.
export const projects = [
  { id: "openweights", name: "OpenWeights", line: "Find open models on Hugging Face and chat with them on your phone", status: "On Google Play" },
  { id: "execuserve", name: "ExecuServe", line: "Turn your phone into a local AI server for your apps", status: "On Google Play" },
  { id: "execupack", name: "ExecuPack", line: "Open models built for phone CPUs, GPUs and NPUs", status: "On Hugging Face" },
  { id: "execubench", name: "ExecuBench", line: "Measurements of those models on real phones", status: "In development" },
];

// ExecuPack's published builds (generated from Hugging Face into
// lib/execupack-published.ts): one row per model, one column per target.
export const targets = [
  { key: "xnnpack", label: "CPU", detail: "XNNPACK" },
  { key: "vulkan", label: "GPU", detail: "Vulkan" },
  { key: "qnn", label: "Qualcomm NPU", detail: "SM8750" },
  { key: "mtk", label: "MediaTek NPU", detail: "MT6991" },
] as const;

// Rows shown before "all models", and the two that appear elsewhere on the page.
const featured = [
  "Qwen3-1.7B",
  "LFM2.5-1.2B-Instruct",
  "Llama-3.2-1B-Instruct",
  "SmolLM2-135M-Instruct",
  "Qwen2.5-1.5B-Instruct",
  "Qwen3-4B",
];
const notes: Record<string, string> = {
  "Qwen3-1.7B": "Answering in the ExecuServe chat above",
  "LFM2.5-1.2B-Instruct": "Recommended in OpenWeights",
};

const k = (w: number) => (w >= 1024 ? `${w / 1024}k` : `${w}`);

export const matrix = [...publishedRepos]
  .sort((a, b) => {
    const ia = featured.indexOf(a.name);
    const ib = featured.indexOf(b.name);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  })
  .map((r) => ({
    name: r.name,
    label: r.name.replaceAll("-", " "),
    href: `https://huggingface.co/${r.id}`,
    featured: featured.includes(r.name),
    note: notes[r.name],
    cells: targets.map((t) => {
      const windows = [...new Set(r.builds.filter((b) => b.backend === t.key).flatMap((b) => b.windows))].sort(
        (a, b) => a - b,
      );
      if (!windows.length) return null;
      return windows.length === 1 ? k(windows[0]) : `${k(windows[0])}–${k(windows[windows.length - 1])}`;
    }),
  }));

export const catalogueDate = new Date(`${publishedAsOf}T00:00:00Z`).toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

// What making them run took, from the research log.
export const repairs = [
  {
    title: "MediaTek position encoding",
    body: "MediaTek's stock export scripts built Qwen and Llama position tables at the wrong base. After our patch, three models matched the Hugging Face reference in a 301-token CPU test before quantization.",
    label: "Finding 37",
  },
  {
    title: "Embeddings that differed by machine",
    body: "The same model built on two machines decoded different text. The cause was a platform-dependent search in embedding quantization; new exports use a deterministic method.",
    label: "Finding 27",
  },
];

// Upstream: problems found in our apps and taken to pytorch/executorch.
export const merged = {
  title: "[LFM2] Clear short-conv state at the start of a new sequence",
  number: 23401,
  date: "October 8, 2026",
  plain: "A new conversation with an LFM2 model could inherit the previous one's state.",
  href: `${et}/pull/23401`,
};

export const upstream = [
  {
    status: "Fixed",
    plain: "On Android, a default temperature of 0.8 overrode the one the app set.",
    detail: "Our report; the maintainers' fix merged September 30, 2026.",
    href: `${et}/issues/23263`,
  },
  {
    status: "Open",
    plain:
      "The exporter and the runner disagreed by one token about the prompt limit, so some prompts failed to prefill.",
    detail: "Our report and fix, opened October 10, 2026.",
    href: `${et}/pull/23679`,
  },
];

// Earlier hardware research. The ids keep the anchors the shared navigation
// on the other pages links back to.
export const earlier: {
  id: "server" | "laptop" | "phone";
  title: string;
  text: string;
  href: string;
}[] = [
  {
    id: "server",
    title: "Server",
    text: "MI300X, H200, Trainium and Inferentia2",
    href: "/asic",
  },
  {
    id: "laptop",
    title: "Laptop",
    text: "Apple M5 and Snapdragon X2 Elite",
    href: "https://github.com/alpharomercoma/snapdragon-vs-m5",
  },
  {
    id: "phone",
    title: "Phone",
    text: "Snapdragon 8 Elite and Dimensity",
    href: "https://github.com/alpharomercoma/snapdragon-vs-mediatek",
  },
];

// Work with us: what we take on, each backed by a project on this page.
export const work = [
  {
    title: "Put a model on phones",
    body: "Name an open model, or the phone it has to run on. We build it for phone CPUs, GPUs and Qualcomm and MediaTek NPUs, and tell you which context windows fit.",
    project: "ExecuPack",
  },
  {
    title: "Run it inside your app",
    body: "The model stays on the phone behind the OpenAI and Anthropic APIs, so your Android app calls it like a cloud model.",
    project: "ExecuServe",
  },
  {
    title: "Trace a problem to its cause",
    body: "A crash, wrong output or a slow phone. We find the cause and take it upstream, as we did with LFM2's carried-over state and Android's temperature default.",
    project: "ExecuTorch",
  },
];

export type Member = {
  name: string;
  role: string;
  href?: string;
  label?: string;
};

export const team: Member[] = [
  {
    name: "Alpha Romer Coma",
    role: "Co-Founder",
    href: "https://www.linkedin.com/in/alpharomercoma/",
    label: "LinkedIn",
  },
  { name: "John Andrew Balbarosa", role: "Co-Founder" },
  {
    name: "Arjhine Ty",
    role: "Co-Founder",
    href: "https://www.linkedin.com/in/arjhinety/",
    label: "LinkedIn",
  },
  {
    name: "Xynil Jhed Lacap",
    role: "Co-Founder",
    href: "https://github.com/mr-jones123",
    label: "GitHub",
  },
  {
    name: "JC Diamante",
    role: "Core Contributor",
    href: "https://github.com/Zeraphim",
    label: "GitHub",
  },
];
