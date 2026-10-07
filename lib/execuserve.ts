// ExecuServe's page. Copy and figures are taken from the repository's README and its
// results report (docs/results/2026-09-29-poco-x8-pro-max.md); change them there first.

const repo = "https://github.com/ExperimentalMachines/execuserve";

export const execuserve = {
  status: "Alpha · Android 12+ on arm64 · Apache-2.0",
  phone: "POCO X8 Pro Max (Dimensity 9500s)",
  links: {
    repo,
    readme: `${repo}#readme`,
    results: `${repo}/blob/main/docs/results/2026-09-29-poco-x8-pro-max.md`,
    executorch: "https://pytorch.org/executorch/",
    openweights: "https://github.com/ExperimentalMachines/openweights",
  },
  points: [
    {
      title: "A server, not a chat app",
      body: "The agents, SDKs and tools you already use call a model on your phone the way they call a cloud: OpenAI's Chat Completions, Completions and Responses, and Anthropic's Messages.",
    },
    {
      title: "The KV cache belongs to the server",
      body: "Clients resend the whole conversation, as both APIs expect; the server keeps the runtime's cache and the exact bytes of each reply, so follow-ups and tool loops still hit it.",
    },
    {
      title: "Several models, one phone",
      body: "Up to three resident, each with its own cache and endpoints, sharing one compute lane so they never halve each other's speed.",
    },
    {
      title: "Built to stay up",
      body: "A foreground service with the right locks, tested through forced deep Doze with the screen off. Where a phone maker's ROM can still stop it, the app names what to allow.",
    },
    {
      title: "A browser chat inside",
      body: "A small chat ships inside the server, so a laptop or tablet on your network can talk to the phone's models with nothing installed.",
    },
    {
      title: "CPU, GPU and NPU",
      body: "One app runs XNNPACK and Vulkan exports on any phone, and Qualcomm and MediaTek NPU exports on the chips they were compiled for. The catalog offers each phone only the files its own chip can load, and every model says which processor it runs on.",
    },
    {
      title: "A multiplatform core",
      body: "Everything but the runtime binding and the app shell is Kotlin Multiplatform and compiles for iOS on every build.",
    },
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
  quickstart: {
    shell: `tools/execuserve --model ~/models/Qwen3-1.7B-8da4w-gptq-2k.pte
export OPENAI_BASE_URL=http://127.0.0.1:8080/v1
export OPENAI_API_KEY=<the key it prints>`,
    python: `from openai import OpenAI

client = OpenAI()
reply = client.chat.completions.create(
    model="qwen3-1.7b",
    messages=[{"role": "user", "content": "Hello"}],
)`,
  },
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
