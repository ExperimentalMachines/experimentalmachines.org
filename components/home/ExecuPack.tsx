import { Action, Actions } from "@/components/home/Actions";
import { h2, lede, ProjectLabel } from "@/components/home/ui";
import Matrix from "@/components/home/Matrix";
import { catalogueDate, links, repairs } from "@/lib/home";

export default function ExecuPack() {
  return (
    <section id="execupack" className="scroll-mt-28 bg-bench lg:scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16">
          <div>
            <ProjectLabel name="ExecuPack" status="On Hugging Face" mark="/execupack/mark-small.svg" />
            <h2 className={`${h2} mt-6`}>Models built for phone chips.</h2>
          </div>
          <p className={`${lede} max-w-xl`}>
            Open models built for phone CPUs, GPUs, and Qualcomm and MediaTek NPUs.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <figure className="min-w-0 rounded-[1.75rem] bg-white p-5 sm:p-8">
            <Matrix />
            <figcaption className="mt-4 text-xs leading-5 text-ink-soft">
              <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full bg-blue align-middle" />
              Published, with its context windows.
              <span
                aria-hidden
                className="ml-4 mr-1.5 inline-block h-2 w-2 rounded-full border border-ink/50 align-middle"
              />
              Not published. From Hugging Face, {catalogueDate}.
            </figcaption>
          </figure>

          <div className="flex flex-col rounded-[1.75rem] bg-white p-6 sm:p-8">
            <h3 className="text-base font-medium">What making them run took</h3>
            <ul className="mt-2 divide-y divide-rule">
              {repairs.map((r) => (
                <li key={r.title} className="py-5 last:pb-0">
                  <p className="text-base">{r.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-ink-soft">{r.body}</p>
                  <p className="mt-1.5 text-xs text-ink-soft">{r.label} in the research log</p>
                </li>
              ))}
            </ul>
            <Actions className="mt-auto pt-8">
              <Action href={links.execupackFindings}>Research log</Action>
              <Action href={links.huggingface}>Hugging Face</Action>
              <Action href={links.exports}>What ExecuTorch can export</Action>
            </Actions>
          </div>
        </div>
      </div>
    </section>
  );
}
