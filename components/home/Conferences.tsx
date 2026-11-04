import Go from "@/components/home/Go";
import { TalkGrid } from "@/components/home/StudyCards";
import { h2, lede } from "@/components/home/ui";
import { talks } from "@/lib/talks";

// Straight after Research, because each talk is that work in front of the people who build the tools.
export default function Conferences() {
  return (
    <section id="conferences" className="scroll-mt-28 lg:scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
          <div>
            <h2 className={h2}>Conferences.</h2>
            <p className={`${lede} mt-5 max-w-2xl`}>Where we take what we measured. Every talk links to its listing and the evidence behind it.</p>
          </div>
          <Go href="/conferences/" className="rounded-full bg-blue px-6 py-3 text-base font-medium text-white hover:bg-blue-deep">
            All conferences
          </Go>
        </div>
        <div className="mt-10">
          <TalkGrid items={talks} />
        </div>
      </div>
    </section>
  );
}
