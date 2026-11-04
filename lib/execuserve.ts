// ExecuServe's page. Copy and figures are taken from the repository's README and its
// results report (docs/results/2026-09-29-poco-x8-pro-max.md); change them there first.

const repo = "https://github.com/ExperimentalMachines/execuserve";

export const execuserve = {
  status: "Android 12+ on arm64 · Apache-2.0",
  phone: "POCO X8 Pro Max (Dimensity 9500s)",
  links: {
    repo,
    readme: `${repo}#readme`,
    issues: `${repo}/issues`,
    results: `${repo}/blob/main/docs/results/2026-09-29-poco-x8-pro-max.md`,
    executorch: "https://pytorch.org/executorch/",
  },
  points: [
    { title: "A server, not a chat app", body: "Your agents, SDKs and tools call the phone the way they call a cloud." },
    { title: "The KV cache belongs to the server", body: "Clients resend the conversation, and the server reuses its cache, so follow-ups stay fast." },
    { title: "Several models, one phone", body: "Up to three resident, each with its own cache and endpoints." },
    { title: "Built to stay up", body: "A foreground service, tested through deep Doze with the screen off." },
    { title: "A browser chat inside", body: "A laptop on your network can talk to the phone with nothing installed." },
    { title: "CPU, GPU and NPU", body: "The catalog offers each phone only the files its chip can load." },
    { title: "Private by construction", body: "No account, no analytics, no crash reporter. Every request needs a key, loopback included." },
  ],
  measured: [
    { check: "Official OpenAI SDK suite", result: "16 of 16 pass" },
    { check: "Official Anthropic SDK suite", result: "8 of 8 pass" },
    { check: "Edge-case probe (refusals, limits, disconnects)", result: "28 of 28 pass" },
    { check: "Screen-off soak on battery, 10 minutes", result: "20 of 20 answered" },
    { check: "Warm second turn of a 2,000-token conversation", result: "0.47 s instead of 8.4 s" },
    { check: "Qwen3 tool loop, second request", result: "174 of 205 prompt tokens reused" },
    { check: "XNNPACK export against llama.cpp, Snapdragon 8 Elite", result: "1.2 to 1.6× faster decode" },
    { check: "Qwen3-1.7B, 700-token prompt, Snapdragon 8 Elite Gen 5: first token on the NPU", result: "0.41 s, against 2.0 s on the CPU and 1.0 s on the GPU" },
    { check: "Qwen3-1.7B decode on the same phone, CPU / GPU / NPU", result: "54 / 42 / 25 tokens per second" },
    { check: "MediaTek NPU, LFM2.5-1.2B, Dimensity", result: "NPU prefill, CPU decode at 39 to 43 tokens per second" },
  ],
  // Run as written against the server (:jvm:devserver) with each SDK. The Anthropic SDK adds /v1 itself,
  // so its base URL has none, and it requires max_tokens where OpenAI's does not.
  quickstart: {
    openai: {
      label: "OpenAI",
      shell: `tools/execuserve --model ~/models/Qwen3-1.7B-8da4w-gptq-2k.pte
export OPENAI_BASE_URL=http://127.0.0.1:8080/v1
export OPENAI_API_KEY=<the key it prints>`,
      python: `from openai import OpenAI

client = OpenAI()  # reads OPENAI_BASE_URL and OPENAI_API_KEY
reply = client.chat.completions.create(
    model="qwen3-1.7b",
    messages=[{"role": "user", "content": "Hello"}],
)`,
    },
    anthropic: {
      label: "Anthropic",
      shell: `tools/execuserve --model ~/models/Qwen3-1.7B-8da4w-gptq-2k.pte
export ANTHROPIC_BASE_URL=http://127.0.0.1:8080
export ANTHROPIC_API_KEY=<the key it prints>`,
      python: `from anthropic import Anthropic

client = Anthropic()  # reads ANTHROPIC_BASE_URL and ANTHROPIC_API_KEY
reply = client.messages.create(
    model="qwen3-1.7b",
    max_tokens=200,
    messages=[{"role": "user", "content": "Hello"}],
)`,
    },
  },
  // From the repository's README, "Clients" and "Getting a model onto the phone".
  clients: [
    ["OpenAI SDKs, LangChain, Vercel AI SDK", "Base URL `http://<phone>:8080/v1`, plus the key"],
    ["Anthropic SDKs and agents built on them", "Base URL `http://<phone>:8080`, with no `/v1`, plus the key"],
    ["Open WebUI", "Settings, Connections, OpenAI API, with the URL `http://<phone>:8080/v1`"],
    ["codex CLI", 'A provider with `wire_api = "responses"`'],
    ["Another app on the same phone", "`http://127.0.0.1:8080/v1`, with a network security config allowing loopback"],
  ],
  getModel: [
    ["In the app", "Library, then Browse the catalog, which lists the exports this phone can run"],
    ["From your computer", "`tools/execuserve --model path/to/Model.pte` pushes it with its tokenizer and starts serving"],
    ["Have the phone fetch it", "`tools/execuserve pull <hf-repo> <file.pte>` downloads and verifies it on the phone"],
  ],
  docs: [
    { label: "README", href: `${repo}#readme`, what: "Everything the server does, and how to build it" },
    { label: "Architecture", href: `${repo}/blob/main/docs/ARCHITECTURE.md`, what: "The design, the HTTP API in full, and edge cases" },
    { label: "Testing on a phone", href: `${repo}/blob/main/docs/TESTING-ON-A-PHONE.md`, what: "From installing to a screen-off soak" },
    { label: "Results", href: `${repo}/tree/main/docs/results`, what: "Measurements on real phones, with dates" },
    { label: "Privacy policy", href: "/execuserve/privacy/", what: "What stays on the phone and what leaves" },
    { label: "Contributing", href: `${repo}/blob/main/CONTRIBUTING.md`, what: "Setting up, the checks, what a change needs" },
    { label: "Security", href: `${repo}/blob/main/SECURITY.md`, what: "Reporting a vulnerability, and what is in scope" },
  ],
  endpoints: [
    { path: "POST /v1/chat/completions", what: "Streaming, tools and tool calls, reasoning, usage with cached tokens" },
    { path: "POST /v1/responses", what: "Items, function calls, typed stream events, previous_response_id" },
    { path: "POST /v1/messages", what: "Anthropic's Messages API: tool_use, thinking blocks, its stream events" },
    { path: "POST /v1/completions", what: "A raw prompt, no template" },
    { path: "GET /v1/models", what: "Installed models with context length, residency and capabilities" },
    { path: "GET /metrics", what: "Prometheus counters, gauges and quantiles" },
    { path: "/models/{id}/v1", what: "The model, inference and status routes scoped to one model, for hosting several at once" },
  ],
};
