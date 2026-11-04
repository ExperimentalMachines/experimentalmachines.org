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
  quickstart: [
    { title: "Install it", body: "Get OpenWeights from Google Play. No account to create." },
    { title: "Find a model", body: "Open Discover, then search Hugging Face or pick from Recommended." },
    { title: "Check the fit", body: "Before you download, the app says whether the model will run on your phone." },
    { title: "Start chatting", body: "Load it and ask. Every reply shows how fast it ran." },
  ],
  // Commands from ChatCommand in the app; the first four set how much the agent may do unasked.
  commands: [
    ["`/auto`", "Run tools directly, and pause for sensitive actions. The default"],
    ["`/ask`", "Approve each tool before it runs"],
    ["`/plan`", "Say what it would do, and run no tools"],
    ["`/yolo`", "Skip Auto's network checks until the app closes"],
    ["`/goal <task>`", "Work through a task on its own, and stop when it is done"],
    ["`/deep-research <question>`", "Research a question and write up what it finds"],
    ["`/compact`", "Summarize earlier turns to free up context now"],
    ["`/retry`", "Ask the model for a different answer"],
    ["`/new`", "Start a fresh conversation"],
  ],
  // Which tools start on comes from Tool.defaultsOn in core/tools, not the repository's README, which
  // still says only web search does.
  tools: [
    ["Search the web", "Looks up anything recent, or anything it does not know", "Yes"],
    ["Show pictures", "Finds pictures and short clips to view in the chat", "Yes"],
    ["Open a page", "Reads the text of one public page", "Yes"],
    ["Find, read and save files", "Work inside one folder you share, which you can revoke at any time", "No"],
    ["Run a script", "Runs JavaScript in a sandbox with no network and no files", "No"],
    ["Canvas", "Shows a saved website, document or slide deck inside the app", "No"],
    ["Memory", "Keeps short facts across conversations, which you can see and edit", "No"],
  ],
  runtimes: [
    ["Files", "GGUF", "`.pte`"],
    ["Models", "Any architecture the build reads", "Qwen3, Qwen3.5, Qwen2.5, SmolLM2, SmolLM3, Llama 3.2, Phi-4-mini, Gemma 3, LFM2.5"],
    ["Pictures", "Models with a projector", "LFM2.5-VL and Gemma 3"],
    ["Runs on", "CPU, and Adreno GPUs where the driver works", "CPU, and the GPU for files exported for it"],
    ["Context window", "You choose; the app suggests one", "Fixed when the model is exported"],
  ],
  docs: [
    { label: "README", href: `${repo}#readme`, what: "Everything the app does, and how to build it" },
    { label: "Architecture", href: `${repo}/blob/main/docs/ARCHITECTURE.md`, what: "How the modules fit, and how the two runtimes sit behind one engine" },
    { label: "Research", href: "/research/", what: "Every study, with its results" },
    { label: "Roadmap", href: `${repo}/blob/main/docs/ROADMAP.md`, what: "What is done, and why each part exists" },
    { label: "Privacy policy", href: `${pages}/privacy.html`, what: "What stays on the phone and what leaves" },
    { label: "Contributing", href: `${repo}/blob/main/CONTRIBUTING.md`, what: "Setting up, running the tests, what reviewers look for" },
  ],
  links: {
    play: "https://play.google.com/store/apps/details?id=io.github.alpharomercoma.openweights",
    repo,
    issues: `${repo}/issues`,
    ios: "https://github.com/ExperimentalMachines/OpenWeights-iOS",
    privacy: `${pages}/privacy.html`,
  },
};
