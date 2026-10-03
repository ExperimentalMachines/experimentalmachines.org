// What ExecuTorch v1.4.0 can export, per text-LLM family and Android accelerator,
// for the dense ≤4B models execupack targets. Hand-written from the ExecuTorch
// source at the v1.4.0 tag (the version the openweights app's runtime ships);
// each claim names the file it comes from in `sources`. What has actually been
// published is generated separately into lib/execupack-published.ts.

export const execupackLinks = {
  repo: "https://github.com/ExperimentalMachines/execupack",
  plan: "https://github.com/ExperimentalMachines/execupack/blob/main/docs/PLAN.md",
  hub: "https://huggingface.co/experimentalmachines",
  app: "https://github.com/ExperimentalMachines/openweights",
  executorch: "https://github.com/pytorch/executorch/tree/v1.4.0",
};

export const executorchVersion = "1.4.0";

export type BackendKey = "xnnpack" | "vulkan" | "qnn" | "mtk" | "exynos";

export const backends: { key: BackendKey; name: string; hardware: string; path: string }[] = [
  { key: "xnnpack", name: "XNNPACK", hardware: "CPU, any Android phone", path: "export_llm, backend.xnnpack" },
  { key: "vulkan", name: "Vulkan", hardware: "GPU, any Vulkan phone", path: "export_llm, backend.vulkan" },
  { key: "qnn", name: "Qualcomm QNN", hardware: "Snapdragon NPU, per chip", path: "examples/qualcomm/oss_scripts/llama" },
  { key: "mtk", name: "MediaTek", hardware: "Dimensity NPU, per chip", path: "examples/mediatek" },
  { key: "exynos", name: "Samsung Exynos", hardware: "Exynos NPU, per chip", path: "backends/samsung" },
];

// upstream:  ExecuTorch 1.4.0 has an export path for this family on this backend.
// checkpoints: only the listed checkpoints (Qualcomm's registry is per checkpoint, not per architecture).
// none:      no path in 1.4.0.
// patched:   no path upstream; execupack carries its own patch (third_party/executorch/patches).
export type Support =
  | { kind: "upstream"; note?: string }
  | { kind: "checkpoints"; ids: string[]; note?: string }
  | { kind: "patched"; note: string }
  | { kind: "none"; note: string };

export type Family = {
  key: string;
  name: string;
  sizes: string;
  // Checkpoints ExecuTorch names for this family (export_llm model classes or registry repo ids).
  canonical: string[];
  // Set when the openweights app refuses the family's names, so nothing is exported.
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
      mtk: { kind: "upstream", note: "model_type qwen3, any size" },
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
      mtk: { kind: "upstream", note: "model_type qwen2, any size" },
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
      mtk: { kind: "upstream", note: "model_type llama; the script reads rope_scaling['type'], Llama 3.2 configs say rope_type" },
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
      mtk: { kind: "upstream", note: "model_type llama" },
      exynos,
    },
  },
  {
    key: "lfm2",
    name: "LFM2 / LFM2.5",
    sizes: "350M, 700M, 1.2B, 2.6B",
    canonical: ["LiquidAI/LFM2-350M", "LiquidAI/LFM2-700M", "LiquidAI/LFM2-1.2B", "LiquidAI/LFM2.5-350M", "LiquidAI/LFM2.5-1.2B-Instruct"],
    support: {
      xnnpack: { kind: "upstream" },
      vulkan: { kind: "none", note: "no Vulkan kernel for the short convolution; a file that lowers anyway segfaults at the first prefill" },
      qnn: { kind: "none", note: NO_QNN },
      mtk: { kind: "patched", note: "no LFM2 model in examples/mediatek; execupack's mediatek-lfm2.patch adds one" },
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
      mtk: { kind: "upstream", note: "model_type gemma3; HF configs say gemma3_text" },
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
      mtk: { kind: "upstream", note: "model_type gemma2" },
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
    blocked: "the openweights app refuses names containing qwen35, so execupack does not export them",
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
  { what: "Llama 3.2 Vision, InternVL3, SmolVLM, Granite Speech, Gemma 4", why: "multimodal; the app runs text models" },
];

export const sources: { file: string; what: string }[] = [
  { file: "extension/llm/export/config/llm_config.py", what: "ModelType: the model classes export_llm builds, for XNNPACK and Vulkan" },
  { file: "examples/qualcomm/oss_scripts/llama/__init__.py", what: "SUPPORTED_LLM_MODELS: the Qualcomm registry, one entry per checkpoint" },
  { file: "examples/mediatek/aot_utils/llm_utils/utils.py", what: "resolve_model_classes: the config model_types MediaTek's scripts build" },
  { file: "backends/samsung", what: "the Exynos delegate; examples/samsung has CNN examples only" },
];
