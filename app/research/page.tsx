import type { Metadata } from "next";
import FeaturedStudy from "@/components/home/FeaturedStudy";
import Go from "@/components/home/Go";
import ResearchList from "@/components/home/ResearchList";
import { h2, lede, link } from "@/components/home/ui";
import { openweights } from "@/lib/openweights";
import type { ResearchItem } from "@/lib/research";

const description =
  "Studies measured on real phones for OpenWeights, each linked to its committed results, and our research on ASICs and on GGUF files.";

export const metadata: Metadata = {
  title: "Research: Experimental Machines",
  description,
  openGraph: { title: "Research", description, url: "/research/" },
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

const [, ...earlier] = openweights.research;
const studies: ResearchItem[] = earlier.map((r) => ({ href: r.href, title: r.title, meta: r.date, line: r.line }));

const areas: ResearchItem[] = [
  { href: "/asic/", title: "ASIC research", meta: "Research area", line: "Training and serving models on TPU, Trainium, Inferentia and Gaudi, against GPUs." },
  { href: "/gguf/", title: "GGUF research", meta: "Research area", line: "The model file llama.cpp runs, measured from a datacenter GPU to a phone." },
];

export default function Research() {
  return (
    <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
      <section id="top">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <h1 className="display max-w-4xl text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">Research.</h1>
          <p className={`${lede} mt-6 max-w-2xl`}>
            What we measured, on which hardware, and how. Every study links to its committed results.
          </p>
        </div>
      </section>

      <Section id="openweights" title="OpenWeights, on real phones">
        <p className="mb-8 max-w-2xl leading-7 text-ink-soft">
          Studies run for{" "}
          <Go href="/openweights/" className={link}>
            OpenWeights
          </Go>
          , our on-device app, newest first.
        </p>
        <FeaturedStudy />
        <div className="mt-6">
          <ResearchList items={studies} />
        </div>
      </Section>

      <Section id="areas" title="More research" tint>
        <ResearchList items={areas} columns={2} />
      </Section>
    </main>
  );
}
