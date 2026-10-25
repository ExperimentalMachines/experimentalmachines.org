// OpenWeights' page. Copy is taken from the repository's README and its GitHub Pages site,
// which still holds the privacy policy Google Play links to and the earlier research pages.

const repo = "https://github.com/ExperimentalMachines/openweights";
const pages = "https://experimentalmachines.github.io/openweights";

export const openweights = {
  status: "On Google Play · Android 12+ on arm64 · Apache-2.0",
  links: {
    play: "https://play.google.com/store/apps/details?id=io.github.alpharomercoma.openweights",
    repo,
    issues: `${repo}/issues`,
    ios: "https://github.com/ExperimentalMachines/OpenWeights-iOS",
    privacy: `${pages}/privacy.html`,
  },
  // Newest first. Pages on this site start with "/".
  research: [
    {
      href: "/openweights/prefill-decode/",
      title: "Prefill and decode on CPU, GPU and NPU",
      date: "24 October 2026",
      line: "Every pairing of the three processors on a Snapdragon 8 Elite Gen 5, for nine models in one llama.cpp build, on real multi-turn conversations.",
    },
    {
      href: `${pages}/window.html`,
      title: "Does the exported window matter?",
      date: "7 September 2026",
      line: "ExecuTorch fixes a model's context window when the model is exported, from 2k to 32k. Whether that choice changes anything but memory.",
    },
    {
      href: `${pages}/reruns.html`,
      title: "What the reruns changed",
      date: "7 September 2026",
      line: "A second pass over the window matrix: every cell checked for a failed or noisy run, and three things rerun the same day.",
    },
    {
      href: `${pages}/latency.html`,
      title: "Five chips, two runtimes",
      date: "3 and 4 September 2026",
      line: "Median time to first token and time per output token for five small models on five phone chips, in llama.cpp and ExecuTorch.",
    },
  ],
};
