import FeaturedStudy from "@/components/home/FeaturedStudy";
import Go from "@/components/home/Go";
import ResearchList from "@/components/home/ResearchList";
import { h2, lede } from "@/components/home/ui";
import { openweights } from "@/lib/openweights";

// Research sits straight after the projects, above the products it measures, because what we measured is
// a large part of why anyone should trust the rest of the page.
export default function Research() {
  const [, ...earlier] = openweights.research;
  return (
    <section id="research" className="scroll-mt-28 lg:scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 sm:pb-28 sm:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
          <div>
            <h2 className={h2}>Research.</h2>
            <p className={`${lede} mt-5 max-w-2xl`}>What we measured, on which hardware, and how. Every study links to its committed results.</p>
          </div>
          <Go href="/research/" className="rounded-full bg-blue px-6 py-3 text-base font-medium text-white hover:bg-blue-deep">
            All research
          </Go>
        </div>
        <div className="mt-10">
          <FeaturedStudy />
        </div>
        <div className="mt-6">
          <ResearchList items={earlier.map((r) => ({ href: r.href, title: r.title, meta: r.date, line: r.line }))} />
        </div>
      </div>
    </section>
  );
}
