import { site } from "@/lib/content";
import { team, work } from "@/lib/home";

export default function Team() {
  return (
    <section id="people" className="scroll-mt-28 lg:scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 className="display max-w-3xl text-4xl font-normal leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          The people behind it.
        </h2>
        <ul className="mt-10 grid gap-x-8 gap-y-6 sm:mt-12 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-5">
          {team.map((m) => (
            <li key={m.name} className="border-t border-ink pt-5">
              <p className="display text-xl leading-tight">{m.name}</p>
              <p className="mt-2 text-sm text-ink-soft">{m.role}</p>
              {m.href && (
                <a
                  href={m.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center text-sm underline decoration-rule underline-offset-4 hover:decoration-ink"
                >
                  {m.label}
                  <span className="sr-only">, {m.name}</span>
                </a>
              )}
            </li>
          ))}
        </ul>

        <div id="contact" className="mt-12 scroll-mt-28 rounded-3xl bg-bench p-8 sm:mt-20 sm:p-10 lg:scroll-mt-20">
          <h3 className="display text-3xl sm:text-4xl">Work with us.</h3>

          <ul className="mt-8 grid gap-x-8 gap-y-8 md:grid-cols-3">
            {work.map((w) => (
              <li key={w.title} className="border-t border-ink pt-5">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">{w.project}</p>
                <p className="display mt-3 text-xl leading-tight">{w.title}</p>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{w.body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-5 border-t border-rule pt-8 md:flex-row md:items-center md:justify-between">
            <p className="max-w-xl text-base leading-7">
              Tell us the model, the phone or chip, and what you are seeing.
            </p>
            <a
              href={`mailto:${site.email}`}
              className="self-start rounded-full bg-blue px-6 py-3 text-base font-medium text-white hover:bg-blue-deep md:self-auto"
            >
              Email us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
