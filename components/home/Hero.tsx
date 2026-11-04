import Link from "next/link";
import { projects } from "@/lib/home";

function Phone({
  src,
  alt,
  label,
  href,
  width,
  height,
  className = "",
}: {
  src: string;
  alt: string;
  label: string;
  href: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <figure className={`group relative flex w-[46%] max-w-[240px] flex-col items-center ${className}`}>
      <figcaption className="mb-3">
        {/* Stretched over the figure, so the phone clicks through too while the link's name stays the product's. */}
        <Link
          href={href}
          className="inline-flex rounded-full border border-white/50 bg-white/15 px-4 py-2 text-sm font-medium text-white after:absolute after:inset-0 group-hover:border-white group-hover:bg-white group-hover:text-blue-deep"
        >
          {label}
        </Link>
      </figcaption>
      {/* eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="aspect-[600/1120] w-full rounded-t-[1.6rem] border-x-[5px] border-t-[5px] border-white bg-white object-cover object-top"
      />
    </figure>
  );
}

export default function Hero() {
  return (
    <>
      <section className="on-blue overflow-hidden bg-blue text-white">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10">
          <p
            aria-hidden
            className="display whitespace-nowrap text-[calc((100vw-40px)/5.3)] font-semibold leading-[0.9] tracking-[-0.055em] sm:text-[min(calc((100vw-64px)/9.45),130px)]"
          >
            {/* Sized so the wordmark spans the content width: two lines on phones, one above. */}
            <span className="block sm:inline">Experimental</span> <span className="block sm:inline">Machines</span>
          </p>

          <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-2 lg:gap-16">
            <div className="lg:order-2 lg:pb-20">
              <h1 className="display text-balance text-4xl font-medium leading-[1.05] tracking-[-0.03em] sm:text-5xl">
                On-device AI, built in the open.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-white/90">
                We build apps, models and runtime fixes that bring open models to phones.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#projects"
                  className="rounded-full bg-white px-6 py-3 text-base font-medium text-blue-deep hover:bg-white/90"
                >
                  See what we build
                </a>
                <Link
                  href="/research/"
                  className="rounded-full border border-white/40 px-6 py-3 text-base font-medium text-white hover:border-white"
                >
                  Read our research
                </Link>
                <a
                  href="#contact"
                  className="rounded-full border border-white/40 px-6 py-3 text-base font-medium text-white hover:border-white"
                >
                  Work with us
                </a>
              </div>
            </div>
            <div className="flex items-end justify-center gap-4 sm:gap-6 lg:order-1 lg:justify-start">
              <Phone
                src="/home/openweights-chat.png"
                alt="OpenWeights on a phone running LFM2.5 1.2B: asked to open experimentalmachines.org, it reads the page with its web tool and sums up what we make in three bullets, at 55 tokens per second"
                label="OpenWeights"
                href="/openweights/"
                width={600}
                height={1222}
                className="sm:mb-[-2rem]"
              />
              <Phone
                src="/home/execuserve-serving.png"
                alt="ExecuServe on a phone, serving: qwen3-1.7b ready in memory with its prefill and decode speed"
                label="ExecuServe"
                href="/execuserve/"
                width={600}
                height={1181}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="projects" aria-label="Projects" className="scroll-mt-28 lg:scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ul className="grid gap-x-8 gap-y-8 py-12 sm:grid-cols-2 sm:py-14 lg:grid-cols-4">
            {projects.map((p) => (
              <li key={p.id}>
                <a href={`#${p.id}`} className="group block border-t-2 border-blue pt-4">
                  <span className="flex items-center justify-between gap-3">
                    <span className="display text-xl group-hover:text-blue-deep">{p.name}</span>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs text-ink-soft ${
                        p.id === "execubench" ? "border-dashed border-ink/30" : "border-rule"
                      }`}
                    >
                      {p.status}
                    </span>
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-ink-soft">{p.line}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
