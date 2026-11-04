import Bars from "@/components/home/Bars";
import Go from "@/components/home/Go";
import { cardLink } from "@/components/home/ui";
import { openweights } from "@/lib/openweights";
import { pdModels, pdTurns } from "@/lib/prefill-decode";

// The newest study as one block that clicks anywhere. Its figure is drawn for the model the app ships, so a
// reader sees a result before deciding to open the study: the three pairings that keep both phases on one
// processor, and NPU prefill with CPU decode.
const qwen = pdModels.find((m) => m.name === "Qwen3 1.7B" && m.quant === "Q8_0")!;
const pairings = [
  { label: "NPU → NPU", cell: qwen.cells[2][2] },
  { label: "NPU → CPU", cell: qwen.cells[2][0] },
  { label: "CPU → CPU", cell: qwen.cells[0][0] },
  { label: "GPU → GPU", cell: qwen.cells[1][1] },
];

export default function FeaturedStudy() {
  const latest = openweights.research[0];
  return (
    <article className="group relative grid gap-10 rounded-[1.75rem] bg-bench p-6 transition-colors hover:bg-[color-mix(in_srgb,var(--color-blue)_7%,var(--color-bench))] sm:p-10 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
      <div>
        <p className="text-sm text-ink-soft">Newest, {latest.date}</p>
        <h3 className="display mt-3 text-3xl leading-tight tracking-[-0.02em] sm:text-4xl">
          <Go href={latest.href} className={`${cardLink} decoration-2 underline-offset-[6px] after:rounded-[1.75rem]`}>
            {latest.title}
          </Go>
        </h3>
        <p className="mt-4 max-w-xl text-lg leading-8 text-ink-soft">{latest.line}</p>
        <span aria-hidden className="mt-8 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white group-hover:bg-blue-deep">
          Read the study
        </span>
      </div>
      <div className="rounded-[1.25rem] bg-white p-5 sm:p-6">
        <Bars
          rows={pairings.map((p) => ({ label: p.label, value: p.cell.seconds, shown: `${p.cell.seconds.toFixed(1)} s` }))}
          caption={`${qwen.name} ${qwen.quant}, the model OpenWeights ships, on a warm Snapdragon 8 Elite Gen 5. Total time for the same ${pdTurns} turns at their own reply lengths; each label reads prefill → decode. Shorter is faster.`}
        />
      </div>
    </article>
  );
}
