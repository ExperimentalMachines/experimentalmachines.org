import type { Metadata } from "next";
import Bars from "@/components/home/Bars";
import Go from "@/components/home/Go";
import ResearchList from "@/components/home/ResearchList";
import { h2, lede, link } from "@/components/home/ui";
import { cost } from "@/lib/neuron";
import { asicStudies, asicTools } from "@/lib/research";

const description =
  "Training and serving models on Google TPU, AWS Trainium and Inferentia and Intel Gaudi, against GPUs: a study measured on the chips, a compatibility calculator, agent skills and talks.";

export const metadata: Metadata = {
  title: "ASIC research: Experimental Machines",
  description,
  openGraph: { title: "ASIC research", description, url: "/asic/" },
};

function Section({ id, title, tint, children }: { id: string; title: string; tint?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-28 lg:scroll-mt-16 ${tint ? "bg-bench" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 className={h2}>{title}</h2>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

// The study's cost per token at the concurrency all three chips reached.
const perToken = cost.map((d) => ({
  label: d.device.startsWith("inf2") ? "Inferentia2" : d.device.split(",")[0],
  value: d.matched,
  shown: `$${d.matched.toFixed(3)}`,
}));

export default function Asic() {
  const [study] = asicStudies;
  return (
    <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
      <section id="top">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <h1 className="display text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">
              Training and serving on AI ASICs.
            </h1>
            <p className={`${lede} mt-6 max-w-xl`}>
              Google TPU, AWS Trainium and Inferentia, Intel Gaudi: what runs on them, what a token costs against a GPU, and where the compiler stops you. One
              study measured on the chips, and the tools and talks around it.
            </p>
            <p className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-base">
              <Go href={study.href} className="rounded-full bg-blue px-6 py-3 font-medium text-white hover:bg-blue-deep">
                Read the study
              </Go>
              <Go href={asicTools[0].href} className={link}>
                Will your model run on an ASIC?
              </Go>
            </p>
          </div>
          <div className="self-end rounded-[1.75rem] bg-bench p-6 sm:p-8">
            <Bars
              rows={perToken}
              caption="Llama 3.1 8B: dollars per million output tokens at 32 concurrent streams, the highest load all three chips ran, at on-demand list prices. Lower is cheaper."
            />
          </div>
        </div>
      </section>

      <Section id="study" title="Measured on the chips" tint>
        <article className="max-w-3xl">
          <p className="text-sm text-ink-soft">{study.meta}</p>
          <h3 className="display mt-2 text-3xl leading-tight tracking-[-0.02em]">
            <Go href={study.href} className="hover:text-blue-deep">
              {study.title}
            </Go>
          </h3>
          <p className={`${lede} mt-4`}>{study.line}</p>
          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            <Go href={study.href} className={`${link} font-medium`}>
              Read the results
            </Go>
            {study.more?.map((m) => (
              <Go key={m.href} href={m.href} className={link}>
                {m.label}
              </Go>
            ))}
          </p>
        </article>
      </Section>

      <Section id="tools" title="Tools and talks">
        <ResearchList items={asicTools} />
      </Section>
    </main>
  );
}
