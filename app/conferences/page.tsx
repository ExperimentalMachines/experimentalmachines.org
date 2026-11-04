import type { Metadata } from "next";
import { TalkGrid } from "@/components/home/StudyCards";
import { lede } from "@/components/home/ui";
import { talks } from "@/lib/talks";

const description = "Our talks at PyTorch and GitHub events in 2026, each with its listing, the evidence behind it and, once given, its recording.";

export const metadata: Metadata = {
  title: "Conferences: Experimental Machines",
  description,
  openGraph: { title: "Conferences", description, url: "/conferences/" },
};

// Newest first, as research is.
export default function Conferences() {
  return (
    <main id="main" className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:scroll-mt-16">
      <h1 className="display text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">Conferences.</h1>
      <p className={`${lede} mt-4 max-w-4xl`}>Where we take what we measured. Every talk links to its listing and the evidence behind it.</p>
      <div className="mt-10">
        <TalkGrid items={talks} />
      </div>
    </main>
  );
}
