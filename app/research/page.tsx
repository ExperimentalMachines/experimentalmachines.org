import type { Metadata } from "next";
import { StudyFeature, StudyGrid } from "@/components/home/StudyCards";
import { lede } from "@/components/home/ui";
import { studies } from "@/lib/studies";

const description =
  "What we measured, on which hardware, and how: phones, laptops, datacenter GPUs and AWS's ASICs, each study linked to its committed results.";

export const metadata: Metadata = {
  title: "Research: Experimental Machines",
  description,
  openGraph: { title: "Research", description, url: "/research/" },
};

const [latest, ...rest] = studies;

// One feed, newest first.
export default function Research() {
  return (
    <main id="main" className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:scroll-mt-16">
      <h1 className="display text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">Research.</h1>
      <p className={`${lede} mt-4 max-w-4xl`}>What we measured, on which hardware, and how. Every study links to its committed results.</p>
      <div className="mt-10">
        <StudyFeature s={latest} />
      </div>
      <div className="mt-6">
        <StudyGrid items={rest} />
      </div>
    </main>
  );
}
