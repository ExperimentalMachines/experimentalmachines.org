// OpenWeights' page. Copy is taken from the repository's README and its GitHub Pages site.
// The research pages that started there now live under /openweights; the privacy policy
// stays there, at the address registered in Google Play.

const repo = "https://github.com/ExperimentalMachines/openweights";
const pages = "https://experimentalmachines.github.io/openweights";

export const openweights = {
  requirements: "Android 12 or later on arm64",
  // From the README's "What makes it different", figures as published there.
  points: [
    {
      title: "Hugging Face is the model list",
      body: "Search the Hub for GGUF and ExecuTorch repositories from inside the app. It shows what fits and runs supported architectures on the phone.",
    },
    {
      title: "Fit before the download",
      body: "The app reads a GGUF's header over HTTP range requests, so it can say what the file needs at your context length, and whether it will run, before you spend a gigabyte.",
    },
    {
      title: "Two runtimes, one app",
      body: "llama.cpp runs GGUF files and ExecuTorch runs compiled .pte files for eight model families. The app picks by file format, and both ship in the same 28.8 MB release.",
    },
    {
      title: "A fast first turn",
      body: "The instructions and tool definitions are read into the cache while you type and kept on disk. On the reference phone, a fresh chat's first token came in under one second instead of about 18.5.",
    },
    {
      title: "An agent within limits you set",
      body: "Seventeen tools and four run modes. The three tools that use the internet each have their own switch, and every tool call is a row in the reply naming what it was given.",
    },
    {
      title: "Private by construction",
      body: "No accounts, no analytics, no crash reporter, and no backups off the device. What does reach the internet is named: model search and downloads, and the three network tools.",
    },
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
      href: "/openweights/prefill-decode/",
      title: "Prefill and decode on CPU, GPU and NPU",
      date: "24 October 2026",
      line: "Every pairing of the three processors on a Snapdragon 8 Elite Gen 5, for nine models in one llama.cpp build, on real multi-turn conversations.",
    },
    {
      href: "/openweights/window/",
      title: "Does the exported window matter?",
      date: "7 September 2026",
      line: "ExecuTorch fixes a model's context window when the model is exported, from 2k to 32k. Whether that choice changes anything but memory.",
    },
    {
      href: "/openweights/reruns/",
      title: "What the reruns changed",
      date: "7 September 2026",
      line: "A second pass over the window matrix: every cell checked for a failed or noisy run, and three things rerun the same day.",
    },
    {
      href: "/openweights/latency/",
      title: "Five chips, two runtimes",
      date: "3 and 4 September 2026",
      line: "Median time to first token and time per output token for five small models on five phone chips, in llama.cpp and ExecuTorch.",
    },
  ],
};
