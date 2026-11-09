// What ExecuTorch v1.5.1 can export, per text-LLM family and Android accelerator,
// for the dense ≤4B models execupack targets. Hand-written from the ExecuTorch
// source at the v1.5.1 tag (the version the openweights and ExecuServe runtimes ship;
// against v1.4.0 it adds only Gemma 4 E2B to Qualcomm's registry, which is multimodal);
// each claim names the file it comes from in `sources`. What has actually been
// published is generated separately into lib/execupack-published.ts.

export const execupackLinks = {
  repo: "https://github.com/ExperimentalMachines/execupack",
  plan: "https://github.com/ExperimentalMachines/execupack/blob/main/docs/PLAN.md",
  hub: "https://huggingface.co/experimentalmachines",
  executorch: "https://github.com/pytorch/executorch/tree/v1.5.1",
};

export const executorchVersion = "1.5.1";

export type BackendKey = "xnnpack" | "vulkan" | "qnn" | "mtk" | "exynos";

export const backends: { key: BackendKey; name: string; hardware: string; path: string }[] = [
  { key: "xnnpack", name: "XNNPACK", hardware: "CPU, any Android phone", path: "export_llm, backend.xnnpack" },
  { key: "vulkan", name: "Vulkan", hardware: "GPU, any Vulkan phone", path: "export_llm, backend.vulkan" },
  { key: "qnn", name: "Qualcomm QNN", hardware: "Snapdragon NPU, per chip", path: "examples/qualcomm/oss_scripts/llama" },
  { key: "mtk", name: "MediaTek", hardware: "Dimensity NPU, per chip", path: "examples/mediatek" },
  { key: "exynos", name: "Samsung Exynos", hardware: "Exynos NPU, per chip", path: "backends/samsung" },
];

// upstream:  ExecuTorch 1.5.1 has an export path for this family on this backend.
// checkpoints: only the listed checkpoints (Qualcomm's registry is per checkpoint, not per architecture).
// none:      no path in 1.5.1.
// patched:   exportable only with execupack's own patch (third_party/executorch/patches) or model definition (pipeline/).
// refused:   ExecuTorch has a path, but measured output degrades, so execupack does not publish it.
export type Support =
  | { kind: "upstream"; note?: string }
  | { kind: "checkpoints"; ids: string[]; note?: string }
  | { kind: "patched"; note: string }
  | { kind: "refused"; note: string }
  | { kind: "none"; note: string };

export type Family = {
  key: string;
  name: string;
  sizes: string;
  // Checkpoints ExecuTorch names for this family (export_llm model classes or registry repo ids).
  canonical: string[];
  // Set when execupack does not export the family at all, with the reason.
  blocked?: string;
  support: Record<BackendKey, Support>;
};

const NOT_EXPORT_LLM = "not in export_llm's ModelType list";
const NO_QNN = "not in Qualcomm's SUPPORTED_LLM_MODELS registry";
const NO_EXYNOS = "delegate exists, no LLM example";
const exynos: Support = { kind: "none", note: NO_EXYNOS };

export const families: Family[] = [
  {
    key: "qwen3",
    name: "Qwen3",
    sizes: "0.6B, 1.7B, 4B",
    canonical: ["Qwen/Qwen3-0.6B", "Qwen/Qwen3-1.7B", "Qwen/Qwen3-4B"],
    support: {
      xnnpack: { kind: "upstream" },
      vulkan: { kind: "upstream" },
      qnn: { kind: "checkpoints", ids: ["Qwen/Qwen3-0.6B", "Qwen/Qwen3-1.7B"] },
      mtk: { kind: "patched", note: "MediaTek's stock scripts build RoPE at base 10000; execupack's mediatek-rope-theta.patch makes the fp32 graph match Hugging Face exactly" },
      exynos,
    },
  },
  {
    key: "qwen2_5",
    name: "Qwen2.5",
    sizes: "0.5B, 1.5B, 3B",
    canonical: ["Qwen/Qwen2.5-0.5B", "Qwen/Qwen2.5-1.5B"],
    support: {
      xnnpack: { kind: "upstream" },
      vulkan: { kind: "upstream" },
      qnn: { kind: "checkpoints", ids: ["Qwen/Qwen2.5-0.5B", "Qwen/Qwen2.5-1.5B"], note: "base checkpoints only" },
      mtk: { kind: "refused", note: "the runner's -100 attention mask leaks through Qwen2.5's scores: KL 0.013 and 98% top-1 against Hugging Face before any quantization" },
      exynos,
    },
  },
  {
    key: "llama3_2",
    name: "Llama 3.2",
    sizes: "1B, 3B",
    canonical: ["meta-llama/Llama-3.2-1B-Instruct", "meta-llama/Llama-3.2-3B-Instruct"],
    support: {
      xnnpack: { kind: "upstream" },
      vulkan: { kind: "upstream" },
      qnn: { kind: "checkpoints", ids: ["meta-llama/Llama-3.2-1B-Instruct", "meta-llama/Llama-3.2-3B-Instruct"] },
      mtk: { kind: "patched", note: "MediaTek's Llama model lacks rope_theta and Llama 3 RoPE scaling; execupack's mediatek-rope-theta.patch adds both" },
      exynos,
    },
  },
  {
    key: "smollm2",
    name: "SmolLM2",
    sizes: "135M, 360M, 1.7B",
    canonical: ["HuggingFaceTB/SmolLM2-135M-Instruct"],
    support: {
      xnnpack: { kind: "upstream" },
      vulkan: { kind: "upstream" },
      qnn: { kind: "checkpoints", ids: ["HuggingFaceTB/SmolLM2-135M-Instruct"] },
      mtk: { kind: "patched", note: "rope_theta from execupack's patch, and the fast tokenizer instead of Llama's SentencePiece default" },
      exynos,
    },
  },
  {
    key: "lfm2",
    name: "LFM2.5",
    sizes: "350M, 1.2B, 2.6B",
    canonical: ["LiquidAI/LFM2.5-350M", "LiquidAI/LFM2.5-1.2B-Instruct"],
    support: {
      xnnpack: { kind: "upstream" },
      vulkan: { kind: "none", note: "no Vulkan kernel for the short convolution; a file that lowers anyway segfaults at the first prefill" },
      qnn: { kind: "none", note: NO_QNN },
      mtk: { kind: "patched", note: "no LFM2 model in examples/mediatek; execupack's mediatek-lfm2.patch adds one" },
      exynos,
    },
  },
  {
    key: "lfm3",
    name: "LFM3",
    sizes: "1.7B",
    // ExecuTorch names no LFM3 checkpoint: it has no LFM3 model at all.
    canonical: [],
    support: {
      xnnpack: {
        kind: "patched",
        note: "ExecuTorch 1.5.1 has no LFM3 model, and its transformer cannot express LFM3's sliding-window layers, second RoPE, per-head output gate or extra norms; execupack's own definition (pipeline/lfm3_model.py) matches Hugging Face on fp32 logits",
      },
      vulkan: { kind: "none", note: "no Vulkan kernel for the short convolution, which LFM3 keeps from LFM2" },
      qnn: { kind: "none", note: NO_QNN },
      mtk: { kind: "none", note: "no LFM3 model in examples/mediatek" },
      exynos,
    },
  },
  {
    key: "phi4_mini",
    name: "Phi-4-mini",
    sizes: "3.8B",
    canonical: ["microsoft/Phi-4-mini-instruct"],
    support: {
      xnnpack: { kind: "upstream" },
      vulkan: { kind: "upstream" },
      qnn: { kind: "checkpoints", ids: ["microsoft/Phi-4-mini-instruct"] },
      mtk: { kind: "upstream", note: "model_type phi4" },
      exynos,
    },
  },
  {
    key: "gemma3",
    name: "Gemma 3",
    sizes: "1B",
    canonical: ["google/gemma-3-1b-it"],
    support: {
      xnnpack: { kind: "none", note: NOT_EXPORT_LLM },
      vulkan: { kind: "none", note: NOT_EXPORT_LLM },
      qnn: { kind: "checkpoints", ids: ["google/gemma-3-1b-it"] },
      mtk: {
        kind: "patched",
        note: "MediaTek's Gemma 3 chunk gives every layer one RoPE table, but Gemma 3 rotates its sliding layers at base 10000 and its global ones at 1e6 (in fp32, one table at 10000 passes 6 of 11 gate prompts and at 1e6 5 of 11); execupack's mediatek-gemma.patch adds the second table, exact against Hugging Face, and the runner has to feed both",
      },
      exynos,
    },
  },
  {
    key: "gemma2",
    name: "Gemma 2",
    sizes: "2B",
    canonical: ["google/gemma-2-2b-it"],
    support: {
      xnnpack: { kind: "none", note: NOT_EXPORT_LLM },
      vulkan: { kind: "none", note: NOT_EXPORT_LLM },
      qnn: { kind: "checkpoints", ids: ["google/gemma-2-2b-it"] },
      mtk: {
        kind: "none",
        note: "the graph builds (model_type gemma2) and matches Hugging Face, but mtk_converter holds a chunk's weights as fp32 in one protobuf capped at 2 GB, and the 2.36 GB output head sits whole in the last chunk at any chunk count",
      },
      exynos,
    },
  },
  {
    key: "smollm3",
    name: "SmolLM3",
    sizes: "3B",
    canonical: ["HuggingFaceTB/SmolLM3-3B"],
    support: {
      xnnpack: { kind: "none", note: NOT_EXPORT_LLM },
      vulkan: { kind: "none", note: NOT_EXPORT_LLM },
      qnn: { kind: "checkpoints", ids: ["HuggingFaceTB/SmolLM3-3B"] },
      mtk: { kind: "none", note: "no SmolLM3 model in examples/mediatek" },
      exynos,
    },
  },
  {
    key: "gemma",
    name: "Gemma",
    sizes: "2B",
    canonical: ["google/gemma-2b-it"],
    support: {
      xnnpack: { kind: "none", note: NOT_EXPORT_LLM },
      vulkan: { kind: "none", note: NOT_EXPORT_LLM },
      qnn: { kind: "checkpoints", ids: ["google/gemma-2b-it"] },
      mtk: { kind: "none", note: "examples/mediatek resolves gemma2 and gemma3, not gemma" },
      exynos,
    },
  },
  {
    key: "glm_edge",
    name: "GLM-Edge",
    sizes: "1.5B",
    canonical: ["THUDM/glm-edge-1.5b-chat"],
    support: {
      xnnpack: { kind: "none", note: NOT_EXPORT_LLM },
      vulkan: { kind: "none", note: NOT_EXPORT_LLM },
      qnn: { kind: "checkpoints", ids: ["THUDM/glm-edge-1.5b-chat"] },
      mtk: { kind: "none", note: "no GLM model in examples/mediatek" },
      exynos,
    },
  },
  {
    key: "granite3_3",
    name: "Granite 3.3",
    sizes: "2B",
    canonical: ["ibm-granite/granite-3.3-2b-instruct"],
    support: {
      xnnpack: { kind: "none", note: NOT_EXPORT_LLM },
      vulkan: { kind: "none", note: NOT_EXPORT_LLM },
      qnn: { kind: "checkpoints", ids: ["ibm-granite/granite-3.3-2b-instruct"] },
      mtk: { kind: "none", note: "no Granite model in examples/mediatek" },
      exynos,
    },
  },
  {
    key: "qwen3_5",
    name: "Qwen3.5",
    sizes: "0.8B, 2B, 4B",
    canonical: ["Qwen/Qwen3.5-0.8B", "Qwen/Qwen3.5-2B", "Qwen/Qwen3.5-4B"],
    blocked: "the Hub checkpoints are image-text-to-text models (Qwen3_5ForConditionalGeneration), which execupack has no recipe for; it publishes text models only",
    support: {
      xnnpack: { kind: "upstream" },
      vulkan: { kind: "upstream", note: "export_llm accepts it; Vulkan coverage of its linear-attention layers is untested" },
      qnn: { kind: "none", note: NO_QNN },
      mtk: { kind: "none", note: "no Qwen3.5 model in examples/mediatek" },
      exynos,
    },
  },
];

// Entries in the same registries that are out of scope, and why.
export const excluded: { what: string; why: string }[] = [
  { what: "stories110M, stories260K", why: "toy checkpoints for testing" },
  { what: "Codegen2 1B", why: "code completion, not chat" },
  { what: "Llama 2, Llama 3, Llama 3.1, Qwen2.5-Coder 32B", why: "above 4B" },
  { what: "Qwen3.5 MoE", why: "mixture of experts" },
  { what: "Llama 3.2 Vision, InternVL3, SmolVLM, Granite Speech, Gemma 4, LFM3-VL, LFM3-Omni, LFM3-Audio", why: "multimodal; the apps run text models" },
  { what: "LFM2-350M, LFM2-700M, LFM2-1.2B", why: "the apps choose a chat template from the model's name and know LFM2.5, not the first LFM2 releases" },
];

export const sources: { file: string; what: string }[] = [
  { file: "extension/llm/export/config/llm_config.py", what: "ModelType: the model classes export_llm builds, for XNNPACK and Vulkan" },
  { file: "examples/qualcomm/oss_scripts/llama/__init__.py", what: "SUPPORTED_LLM_MODELS: the Qualcomm registry, one entry per checkpoint" },
  { file: "examples/mediatek/aot_utils/llm_utils/utils.py", what: "resolve_model_classes: the config model_types MediaTek's scripts build" },
  { file: "backends/samsung", what: "the Exynos delegate; examples/samsung has CNN examples only" },
];

// Chips each NPU backend can compile for in ExecuTorch 1.5.1. NPU programs are compiled
// for one chip and load only on it; XNNPACK and Vulkan files run on any Android phone.
// ran: a file compiled for it has been run on that chip, through ExecuServe.
export type ChipStatus = "ran" | "targeted" | "exportable" | "sdk" | "scripts" | "no-llm";

export type Chip = { id: string; name: string; kind: "phone" | "other"; arch?: string; status: ChipStatus; note?: string };

export const chipBackends: { key: "qnn" | "mtk" | "exynos"; name: string; source: string; summary: string; chips: Chip[] }[] = [
  {
    key: "qnn",
    name: "Qualcomm QNN",
    source: "backends/qualcomm/serialization/qc_schema.py",
    summary:
      "QcomChipset lists 20 chips. execupack compiles with QAIRT 2.37, the SDK the executorch 1.5.1 wheel downloads, and that includes the V81 chips: Qwen3-1.7B at 4k compiled for the Snapdragon 8 Elite Gen 5 runs on it, on Qualcomm's QNN runtime 2.39, the first release that ships the V81 driver (2.37's runtime stops at V79).",
    chips: [
      { id: "SM8750", name: "Snapdragon 8 Elite", kind: "phone", arch: "V79", status: "targeted", note: "execupack's QNN chip (qnn.socs)" },
      { id: "SM8650", name: "Snapdragon 8 Gen 3", kind: "phone", arch: "V75", status: "exportable" },
      { id: "SM8550", name: "Snapdragon 8 Gen 2", kind: "phone", arch: "V73", status: "exportable" },
      { id: "SM8475", name: "Snapdragon 8+ Gen 1", kind: "phone", arch: "V69", status: "exportable", note: "no block 4-bit (LPBQ) or 16-bit matmul input below V73" },
      { id: "SM8450", name: "Snapdragon 8 Gen 1", kind: "phone", arch: "V69", status: "exportable", note: "no block 4-bit (LPBQ) or 16-bit matmul input below V73" },
      { id: "SM8350", name: "Snapdragon 888", kind: "phone", arch: "V68", status: "exportable", note: "V68: the registry's default LLM recipes need 8-bit fallbacks" },
      {
        id: "SM8850",
        name: "Snapdragon 8 Elite Gen 5",
        kind: "phone",
        arch: "V81",
        status: "ran",
        note: "Qwen3-1.7B at 4k, compiled with QAIRT 2.37 and served by ExecuServe on QNN runtime 2.39: about 1,700 tok/s prefill, 25 tok/s decode",
      },
      { id: "SM8845", name: "Snapdragon 8 Gen 5", kind: "phone", arch: "V81", status: "exportable", note: "the same V81 compile as SM8850; not built" },
      { id: "QCM6490", name: "IoT", kind: "other", arch: "V68", status: "exportable" },
      { id: "SA8295", name: "Automotive", kind: "other", arch: "V68", status: "exportable" },
      { id: "SA8255", name: "Automotive", kind: "other", arch: "V73", status: "exportable" },
      { id: "QCS9100", name: "Automotive / industrial", kind: "other", arch: "V73", status: "exportable" },
      { id: "SSG2115P", name: "XR / glasses", kind: "other", arch: "V73", status: "exportable" },
      { id: "SSG2125P", name: "XR / glasses", kind: "other", arch: "V73", status: "exportable" },
      { id: "SXR1230P", name: "XR", kind: "other", arch: "V73", status: "exportable" },
      { id: "SXR2230P", name: "XR (Meta Quest 3)", kind: "other", arch: "V69", status: "exportable" },
      { id: "SXR2330P", name: "XR", kind: "other", arch: "V79", status: "exportable" },
      { id: "SA8797", name: "Automotive", kind: "other", arch: "V81", status: "exportable" },
      { id: "SAR2230P", name: "XR", kind: "other", arch: "V81", status: "exportable" },
      { id: "SW6100", name: "Wearable", kind: "other", arch: "V81", status: "exportable" },
    ],
  },
  {
    key: "mtk",
    name: "MediaTek NeuroPilot",
    source: "backends/mediatek/preprocess.py",
    summary:
      "The delegate accepts three platforms, but the LLM export scripts in examples/mediatek offer only DX3 and DX4 (--platform), so Dimensity 9500 has a delegate and no LLM path without patching them.",
    chips: [
      {
        id: "MT6991",
        name: "Dimensity 9400, 9500s",
        kind: "phone",
        arch: "DX4",
        status: "ran",
        note: "execupack's MediaTek chip (mtk.socs). LFM2.5-1.2B at 2k runs in ExecuServe, the NPU prefilling and the CPU decoding; Qwen3-1.7B and 0.6B at 4k need more memory than a 12 GB phone gives",
      },
      { id: "MT6989", name: "Dimensity 9300", kind: "phone", arch: "DX3", status: "exportable" },
      { id: "MT6993", name: "Dimensity 9500", kind: "phone", status: "scripts", note: "in SUPPORTED_PLATFORM_CONFIGS, not in the LLM scripts' --platform choices" },
    ],
  },
  {
    key: "exynos",
    name: "Samsung Exynos",
    source: "backends/samsung/README.md",
    summary: "The EnnBackend delegate supports two chipsets, and ExecuTorch 1.5.1 has no LLM example for either.",
    chips: [
      { id: "E9955", name: "Exynos 2500", kind: "phone", status: "no-llm" },
      { id: "E9965", name: "Exynos 2600", kind: "phone", status: "no-llm" },
    ],
  },
];

// Facts about running the published files that the tables above cannot show.
export const runtimeNotes = {
  nextRelease:
    "ExecuTorch 1.6.0 is at release candidate (rc1, tagged 2026-10-30). Exports stay on 1.5.1, the runtime both apps ship, until the apps move; execupack's LFM3 definition already exports and runs under 1.6.0.",
  lfm3:
    "LFM3-1.7B's files, and its base model's (published on request; a completion model, not a chat model), are traced from execupack's own LFM3 definition, since ExecuTorch has none, and run on any ExecuTorch 1.5.1 runtime with the LLM runner's custom ops. On a Snapdragon 8 Elite Gen 5, through ExecuTorch's llama_main, the 2k file decodes at 43 tokens per second and calls tools in LFM3's format, and the 32k file reads a 5,870-token prompt and recalls a code from its first line (with a runner that prefills in chunks of 2,047 tokens; ExecuTorch's stock 1.5.1 runner fails any prompt of 2,048 tokens or more on export_llm files, an upstream bug). Neither app has an LFM3 chat template yet, so neither loads them until one is added.",
  vulkanAar:
    "Both apps now ship ExecuTorch 1.5.1 with the Vulkan delegate beside XNNPACK; ExecuServe's build adds Qualcomm's QNN and MediaTek's NeuroPilot, and offers each phone only the NPU files compiled for its own chip.",
};

// Builds ExecuTorch can make that execupack measured and chose not to publish, by repo name.
// From execupack's research log, finding 43.
export const withheld: Record<string, Partial<Record<BackendKey, string>>> = {
  "Qwen3-0.6B": {
    vulkan:
      "int4 loses this model's tool decision: a GPTQ build keeps 0 of 4 calling rows, mean 0.016 against fp32's 0.619, so its CPU files keep fp32 linears (4 of 4, 0.618) and there is no int4 GPU file to publish",
  },
};

// The context windows execupack builds, in tokens (config/pipeline.yaml): the tiers 2k to 32k for every
// target, and MediaTek's 512 as well, its default cache, which no other target is built at.
export const windowTiers = [2048, 4096, 8192, 16384, 32768];
export const windowSlots = [512, ...windowTiers];

// What happens to a model between Hugging Face and the Hub, in order (execupack's pipeline/ and PLAN.md).
export const pipelineSteps: { title: string; body: string }[] = [
  {
    title: "Solve",
    body: "GPTQ solves each linear layer's int4 weights once per model, on prompts in the model's own chat template, each continued by the fp32 model's own reply.",
  },
  {
    title: "Export",
    body: "ExecuTorch builds one file per context window, from 2k to 32k tokens. A window's GPU file is built from the same solved weights as a CPU build of that window.",
  },
  {
    title: "Run",
    body: "Each CPU file loads in ExecuTorch's C++ runner, the one the apps use, and has to answer a question. NPU files are checked structurally: the build machine has no NPU.",
  },
  {
    title: "Gate",
    body: "On prompts shaped like the apps', the file has to pick the fp32 model's next token on 90% of the rows that model is sure of, which is where a lost tool call shows.",
  },
  {
    title: "Publish",
    body: "The window goes into the model's repo on Hugging Face beside its other windows, with the config.json the apps read, and the report of every check.",
  },
];

// The gate's own calibration, from execupack's pipeline/gate.py: of the rows the fp32 model is sure of,
// how many each build still decides the same way, and its mean probability on fp32's token.
export const gateEvidence = [
  { label: "Round to nearest", kept: 0, of: 12, mean: 0.049 },
  { label: "GPTQ, published", kept: 12, of: 12, mean: 0.701 },
];

// Published files that differ from the recipe, and why. Each is recorded in its repo's export report.
export const exceptions: { model: string; body: string }[] = [
  {
    model: "Qwen3-0.6B",
    body: "CPU files keep fp32 linear layers and there is no GPU file, because int4 loses its tool decision at this size: a GPTQ build keeps 0 of 4 calling rows, against 4 of 4 with fp32 linears.",
  },
  {
    model: "SmolLM2-360M-Instruct",
    body: "CPU files keep fp32 linear layers. Its GPU files are GPTQ, gated through a CPU build of the same weights (2 of 2 graded rows) that is not published.",
  },
  {
    model: "Phi-4-mini-instruct-3.8B",
    body: "Keeps 7 of the 8 tool calls its fp32 model is sure of, under the gate's 90%, and was published on the operator's decision. fp32 itself is near a tie on those rows, 0.40 to 0.78; an all-int8 build that keeps all 8 is 1.4 times the size.",
  },
  {
    model: "Qwen3-4B-Thinking-2507",
    body: "Passes, but the gate measures little here: the model reasons before it decides, so its first token is the same on every row.",
  },
  {
    model: "LFM3-1.7B",
    body: "ExecuTorch 1.5.1 has no LFM3 model, so its files are traced from execupack's own definition, which matches Hugging Face on fp32 logits. Neither app has an LFM3 chat template yet.",
  },
];

// When the last round-to-nearest files went, and the byte check each rebuilt file passed before publishing
// (execupack's PLAN.md, "No round-to-nearest CPU or GPU file is published", and research findings 43 to 45).
export const rollout =
  "No CPU or GPU file on the Hub is rounded to nearest. The last ones, every GPU file, were rebuilt from solved weights on 9 November 2026, and before each new file was published its int4 linear layers were read back from its bytes and matched to the solve that made them.";
