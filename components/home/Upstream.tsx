import Go from "@/components/home/Go";
import { h2, lede, link } from "@/components/home/ui";
import { merged, upstream } from "@/lib/home";

function MergeIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
      <circle cx="4" cy="3.5" r="1.75" />
      <circle cx="4" cy="12.5" r="1.75" />
      <circle cx="12" cy="8" r="1.75" />
      <path d="M4 5.25v5.5M4 5.25c0 1.75 1.75 2.75 4 2.75h2.25" />
    </svg>
  );
}

// The way back: what our apps turned up, taken to the runtime's maintainers.
export default function Upstream() {
  return (
    <section id="upstream" className="scroll-mt-28 lg:scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16">
          <h2 className={h2}>Fixes shared with ExecuTorch.</h2>
          <p className={`${lede} max-w-xl`}>
            Running these models in our own apps turns up bugs in the runtime underneath. We report them to the
            ExecuTorch team at PyTorch, and fix them where we can.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <a
            href={merged.href}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col rounded-[1.75rem] border border-rule p-6 hover:border-ink sm:p-8"
          >
            <span className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue px-3 py-1 text-xs font-medium text-white">
                <MergeIcon />
                Merged
              </span>
              pytorch/executorch #{merged.number}, {merged.date}
            </span>
            <span className="display mt-6 block max-w-xl text-2xl leading-snug sm:text-3xl">{merged.plain}</span>
            <span className="mt-4 block font-mono text-sm leading-6 text-ink-soft">{merged.title}</span>
            <span className={`mt-auto block self-start pt-6 text-base ${link}`}>Read the pull request</span>
          </a>

          <ul className="flex flex-col divide-y divide-rule rounded-[1.75rem] bg-bench px-6 sm:px-8">
            {upstream.map((u) => (
              <li key={u.href} className="flex flex-col py-5">
                <p>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs ${
                      u.status === "Open" ? "border-dashed border-ink/30 text-ink-soft" : "border-ink text-ink"
                    }`}
                  >
                    {u.status}
                  </span>
                </p>
                <p className="mt-4 text-base leading-7">{u.plain}</p>
                <p className="mt-2 text-sm leading-6 text-ink-soft">
                  {u.detail}{" "}
                  <Go href={u.href} className={link}>
                    On GitHub
                  </Go>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
