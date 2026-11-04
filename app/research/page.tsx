import type { Metadata } from "next";
import FeaturedStudy from "@/components/home/FeaturedStudy";
import Go from "@/components/home/Go";
import ResearchList from "@/components/home/ResearchList";
import { lede } from "@/components/home/ui";
import { openweights } from "@/lib/openweights";
import type { ResearchItem } from "@/lib/research";

const description =
  "Studies measured on real phones for OpenWeights, each linked to its committed results, and our research on ASICs and on GGUF files.";

export const metadata: Metadata = {
  title: "Research: Experimental Machines",
  description,
  openGraph: { title: "Research", description, url: "/research/" },
};

const [, ...earlier] = openweights.research;
const studies: ResearchItem[] = earlier.map((r) => ({ href: r.href, title: r.title, meta: r.date, line: r.line }));

const areas: ResearchItem[] = [
  { href: "/asic/", title: "ASIC research", meta: "Research area", line: "Training and serving models on TPU, Trainium, Inferentia and Gaudi, against GPUs." },
  { href: "/gguf/", title: "GGUF research", meta: "Research area", line: "The model file llama.cpp runs, measured from a datacenter GPU to a phone." },
];

// One column from the title to the last card: this page is a way into the studies, so nothing stands
// between its title and them.
const groupTitle = "display text-2xl tracking-[-0.02em] sm:text-3xl";

export default function Research() {
  return (
    <main id="main" className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:scroll-mt-16">
      <h1 className="display text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">Research.</h1>
      <p className={`${lede} mt-4 max-w-4xl`}>What we measured, on which hardware, and how. Every study links to its committed results.</p>

      <section id="openweights" className="mt-10 scroll-mt-28 lg:scroll-mt-16">
        <h2 className={groupTitle}>
          <Go href="/openweights/" className="hover:text-blue-deep">
            OpenWeights
          </Go>
          , on real phones
        </h2>
        <div className="mt-5">
          <FeaturedStudy />
        </div>
        <div className="mt-6">
          <ResearchList items={studies} />
        </div>
      </section>

      <section id="areas" className="mt-14 scroll-mt-28 lg:scroll-mt-16">
        <h2 className={groupTitle}>More research</h2>
        <div className="mt-5">
          <ResearchList items={areas} columns={2} />
        </div>
      </section>
    </main>
  );
}
