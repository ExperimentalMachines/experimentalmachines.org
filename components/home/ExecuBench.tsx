import Go from "@/components/home/Go";
import { h2, lede, link, ProjectLabel } from "@/components/home/ui";
import { earlier, links } from "@/lib/home";

export default function ExecuBench() {
  return (
    <section id="execubench" className="scroll-mt-28 bg-bench lg:scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
          <div>
            <ProjectLabel name="ExecuBench" status="In development, no results yet" mark="/execubench/mark-small.svg" pending />
            <h2 className={`${h2} mt-6`}>Next: measurements on real phones.</h2>
            <p className={`${lede} mt-5 max-w-xl`}>
              ExecuBench will measure the speed, memory, heat and answer quality of compiled models on real phones in
              AWS Device Farm, and record what each phone reports about itself beside every number. Probing the phones
              is done; the pilot is next.
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

        <div className="mt-20 border-t border-rule pt-8">
          <h3 className="text-base font-medium">Where we started</h3>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            Earlier research compared AI hardware across servers, laptops and phones. The reports stay published.
          </p>
          <ul className="mt-4 grid gap-x-8 sm:grid-cols-3">
            {earlier.map((e) => (
              <li key={e.id} id={e.id} className="scroll-mt-28 border-t border-rule sm:border-t-0 lg:scroll-mt-20">
                <Go href={e.href} className="flex min-h-11 flex-col justify-center py-2 hover:text-blue-deep">
                  <span className="text-sm font-medium">{e.title}</span>
                  <span className="text-sm text-ink-soft">{e.text}</span>
                </Go>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
