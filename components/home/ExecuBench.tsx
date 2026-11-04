import Go from "@/components/home/Go";
import { h2, lede, link, ProjectLabel } from "@/components/home/ui";
import { links } from "@/lib/home";

export default function ExecuBench() {
  return (
    <section id="execubench" className="scroll-mt-28 bg-bench lg:scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
          <div>
            <ProjectLabel name="ExecuBench" status="In development, no results yet" mark="/execubench/mark-small.svg" pending />
            <h2 className={`${h2} mt-6`}>Next: measurements on real phones.</h2>
            <p className={`${lede} mt-5 max-w-xl`}>
              It will measure speed, memory, heat and answer quality on real phones. Probing the phones is done; the pilot is next.
            </p>
            <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-base">
              <Go href={links.execubenchPlan} className={link}>
                The plan
              </Go>
              <Go href={links.execubench} className={link}>
                <span className="sr-only">ExecuBench </span>Source
              </Go>
            </p>
          </div>

          <figure className="rounded-[1.75rem] bg-white p-6 sm:p-8">
            <p className="text-base font-medium">Google Pixel 10, Tensor G5</p>
            <p className="mt-1 text-sm text-ink-soft">One of 83 Android device models probed on October 4, 2026</p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-rule p-5">
                <dt className="text-sm text-ink-soft">Device Farm&apos;s catalogue</dt>
                <dd className="display mt-2 text-4xl tabular-nums tracking-tight">2,246 MHz</dd>
                <dd className="mt-2 text-sm leading-6 text-ink-soft">
                  The clock of its first cluster, two Cortex-A520 cores
                </dd>
              </div>
              <div className="rounded-2xl border border-ink p-5">
                <dt className="text-sm text-ink-soft">What the phone reports</dt>
                <dd className="display mt-2 text-4xl tabular-nums tracking-tight">3,782 MHz</dd>
                <dd className="mt-2 text-sm leading-6 text-ink-soft">The top clock of its fastest core, a Cortex-X4</dd>
              </div>
            </dl>
            <figcaption className="mt-5 text-sm leading-6 text-ink-soft">
              Two parts of the same CPU, not a speed difference: why ExecuBench takes each phone&apos;s details from the
              phone.{" "}
              <Go href={links.execubenchDevices} className={link}>
                Every probed device
              </Go>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
