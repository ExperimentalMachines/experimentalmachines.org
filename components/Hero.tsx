import Link from "next/link";
import LatencyFigure from "@/components/LatencyFigure";
import RatioFigure from "@/components/RatioFigure";
import ScaleFigure from "@/components/ScaleFigure";
import { latencyLinks } from "@/lib/latency";
import { ggufRecommended, ggufRows } from "@/lib/gguf";

const bf16Row = ggufRows.find((r) => r.format === "BF16")!;
const ggufPick = ggufRows.find((r) => r.format === ggufRecommended)!;
const quantRows = ggufRows.filter((r) => r.format !== "BF16");
const smallestRow = [...quantRows].sort((a, b) => a.bytes - b.bytes)[0];

export default function Hero() {
  return (
    <section id="top" className="scroll-mt-14">
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-14 sm:pt-20">
        <h1 className="wide max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          LLM inference on datacenter, laptop and phone silicon.
        </h1>
        <div className="mt-10">
          <ScaleFigure />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <Link
          href="/gguf"
          className="block rounded-lg border border-rule bg-plate p-6 transition-colors hover:border-blue sm:p-8"
        >
          <h2 className="wide text-2xl font-bold tracking-tight sm:text-3xl">
            GGUF on one A100: a 2B model in {ggufRows.length} formats
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-7 text-ink-soft">
            One Qwen3.5-2B tool-calling model as a BF16 GGUF and {quantRows.length} llama.cpp quantizations, from{" "}
            {bf16Row.gib.toFixed(2)} GiB down to {smallestRow.gib.toFixed(2)} GiB, all benchmarked on one NVIDIA A100. Against BF16 the
            quantized formats generate {Math.round(Math.min(...quantRows.map((r) => r.tg / bf16Row.tg - 1)) * 100)}% to{" "}
            {Math.round(Math.max(...quantRows.map((r) => r.tg / bf16Row.tg - 1)) * 100)}% faster, but process long prompts at{" "}
            {Math.round(Math.min(...quantRows.map((r) => r.pp / bf16Row.pp)) * 100)}% to{" "}
            {Math.round(Math.max(...quantRows.map((r) => r.pp / bf16Row.pp)) * 100)}% of its rate — on this GPU, quantization mainly buys
            memory. {ggufRecommended} at {ggufPick.gib.toFixed(2)} GiB is the smallest format that passes OpenGrad&apos;s quality gate.
          </p>
          <span className="mt-4 inline-block text-blue hover:text-blue-deep">
            Throughput, size and what each format keeps, plus the same weights behind vLLM →
          </span>
        </Link>
      </div>
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="wide text-3xl font-bold tracking-tight sm:text-4xl">
          Winner and margin, every lane
        </h2>
        <p className="mt-3 max-w-2xl text-lg leading-7 text-ink-soft">
          Bars grow toward the chip that wins, on a log scale.
        </p>
        <div className="mt-8">
          <RatioFigure />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="wide text-3xl font-bold tracking-tight sm:text-4xl">
          First token and per token on five phone chips
        </h2>
        <p className="mt-3 max-w-2xl text-lg leading-7 text-ink-soft">
          Five small models on llama.cpp and ExecuTorch, measured inside the{" "}
          <a href={latencyLinks.repo} target="_blank" rel="noreferrer" className="text-blue hover:text-blue-deep">
            OpenWeights
          </a>{" "}
          app. Medians over 60 to 90 prompts per cell.{" "}
          <a href={latencyLinks.page} target="_blank" rel="noreferrer" className="text-blue hover:text-blue-deep">
            Interactive version
          </a>
          .
        </p>
        <div className="mt-8">
          <LatencyFigure />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <div className="border-t border-rule pt-8">
          <h2 className="wide text-2xl font-bold tracking-tight sm:text-3xl">GPU against ASIC</h2>
          <p className="mt-3 max-w-2xl text-lg leading-7 text-ink-soft">
            At 32 concurrent streams, one Inferentia2 cost 2.4x as much per output token as one MI300X. Trainium1 fine-tuned the same 8B model at 68.3% MFU.{" "}
            <Link href="/asic" className="text-blue hover:text-blue-deep">
              The comparison, with the training, serving and speculative decoding figures
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
