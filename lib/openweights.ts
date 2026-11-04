// OpenWeights' page. Copy is taken from the repository's README and its GitHub Pages site.
// The research pages that started there now live under /research (the old /openweights
// addresses forward); the privacy policy stays there, at the address registered in Google Play.

const repo = "https://github.com/ExperimentalMachines/openweights";
const pages = "https://experimentalmachines.github.io/openweights";

export const openweights = {
  requirements: "Android 12 or later on arm64",
  // Shortened from the README's "What makes it different": one line each, because the page only has
  // to say what the app does; the README and the research pages carry the detail and the figures.
  points: [
    { title: "Hugging Face is the model list", body: "Search the Hub from inside the app." },
    { title: "Fit before the download", body: "Estimate whether a GGUF fits your phone before you download it." },
    { title: "Two runtimes, one app", body: "llama.cpp for GGUF files, ExecuTorch for .pte files." },
    { title: "A fast first turn", body: "The instructions are cached while you type; on our test phone a new chat's first token came in under a second." },
    { title: "An agent within limits you set", body: "Seventeen tools, and every tool call shows what it was given." },
    { title: "Private by construction", body: "No account, no analytics. Only model search, downloads and three switchable web tools go online." },
  ],
  links: {
    play: "https://play.google.com/store/apps/details?id=io.github.alpharomercoma.openweights",
    repo,
    issues: `${repo}/issues`,
    ios: "https://github.com/ExperimentalMachines/OpenWeights-iOS",
    privacy: `${pages}/privacy.html`,
  },
  // Newest first.
  research: [
    {
      href: "/research/prefill-decode/",
      title: "Prefill and decode on CPU, GPU and NPU",
      date: "2 to 4 November 2026",
      line: "Which processor should prefill and which should decode: nine models, every pairing, on a Snapdragon 8 Elite Gen 5.",
    },
    {
      href: "/research/window/",
      title: "Does the exported window matter?",
      date: "7 September 2026",
      line: "Whether the context window fixed at export, from 2k to 32k, changes anything but memory.",
    },
    {
      href: "/research/reruns/",
      title: "What the reruns changed",
      date: "7 September 2026",
      line: "Every cell of the window matrix checked, and three things rerun the same day.",
    },
    {
      href: "/research/latency/",
      title: "Five chips, two runtimes",
      date: "3 and 4 September 2026",
      line: "How fast five small models answer on five phone chips, in llama.cpp and in ExecuTorch.",
    },
  ],
};
