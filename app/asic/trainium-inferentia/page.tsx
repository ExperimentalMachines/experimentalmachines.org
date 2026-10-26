import type { Metadata } from "next";
import FactsStrip from "@/components/asic/FactsStrip";
import ServingFigure from "@/components/asic/ServingFigure";
import SpecDecodeFigure from "@/components/asic/SpecDecodeFigure";
import TrainingFigure from "@/components/asic/TrainingFigure";
import Go from "@/components/home/Go";
import { h2, lede, link } from "@/components/home/ui";
import { decision, neuronLinks } from "@/lib/neuron";

export const metadata: Metadata = {
  title: "Llama 3.1 8B on Trainium and Inferentia: ASIC research",
  description:
    "Llama 3.1 8B trained on one AWS Trainium and served on one Inferentia, measured beside one MI300X and one H200.",
  openGraph: {
    title: "Llama 3.1 8B on AWS Trainium and Inferentia",
    description: "Llama 3.1 8B trained on one AWS Trainium and served on one Inferentia, measured beside one MI300X and one H200.",
    url: "/asic/trainium-inferentia/",
  },
};

function Section({ id, title, tint, children }: { id: string; title: string; tint?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-28 lg:scroll-mt-16 ${tint ? "bg-bench" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className={h2}>{title}</h2>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export default function Asic() {
  return (
    <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
      <section id="top">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <li>
                <a href="/asic/" className="hover:text-ink">
                  ASIC research
                </a>
              </li>
            </ol>
          </nav>
          <h1 className="display mt-8 max-w-4xl text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">
            Llama 3.1 8B on AWS Trainium and Inferentia.
          </h1>
          <p className={`${lede} mt-6 max-w-3xl`}>
            One trn1.2xlarge fine-tunes the model, one inf2.xlarge serves it, one trn2.3xlarge repeats the fine-tune, and every number has a committed log in{" "}
            <Go href={neuronLinks.repo} className={link}>
              torchneuronx
            </Go>
            . The GPU points come from{" "}
            <Go href={neuronLinks.gpuRepo} className={link}>
              MI300X-vs-H200
            </Go>
            , which used the same request shape and metric schema. The conditions that differ are listed under the first figure. The{" "}
            <Go href={neuronLinks.deck} className={link}>
              talk
            </Go>{" "}
            covers the same material.
          </p>
        </div>
      </section>
      <Section id="serving" title="Serving one 8B model, and what a token costs" tint>
        <ServingFigure />
      </Section>
      <Section id="training" title="Training on one Trainium1 and one Trainium2">
        <TrainingFigure />
      </Section>
      <Section id="specdec" title="Speculative decoding on one Trainium1" tint>
        <SpecDecodeFigure />
      </Section>
      <Section id="facts" title="Compile cost, quality and stability">
        <FactsStrip />
      </Section>
      <Section id="fit" title="Where it fit, on this evidence" tint>
        <table className="w-full max-w-4xl border-collapse text-base">
          <tbody>
            {decision.map((d) => (
              <tr key={d[0]} className="border-b border-rule align-top">
                <td className="py-3 pr-6">{d[0]}</td>
                <td className={`py-3 sm:w-[24rem] ${/blocked|wall|cheaper/.test(d[1]) ? "text-ink-soft" : "font-medium"}`}>{d[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-6 max-w-3xl leading-7 text-ink-soft">
          Most of the study&apos;s walls were toolchain, not silicon: an exporter allowlist, ahead-of-time compilation per tensor shape, and a training class without generate(). The instances were terminated on 2026-08-26; the analysis re-runs from the committed results with no AWS account.
        </p>
      </Section>
    </main>
  );
}
