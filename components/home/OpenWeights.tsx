import Go from "@/components/home/Go";
import { h2, lede, link, ProjectLabel } from "@/components/home/ui";
import { links } from "@/lib/home";
import { latencyChips, latencyModels } from "@/lib/openweights-latency";

// LFM2.5 1.2B, median ms per output token, from the latency study's data.
const lfm = latencyModels.find((m) => m.name === "LFM2.5 1.2B")!;
const latency = latencyChips.map((c, i) => ({ chip: c.name, et: lfm.et[i].tpot, gguf: lfm.llama[i].tpot }));
const slowest = Math.max(...latency.map((r) => r.gguf));

export default function OpenWeights() {
  return (
    <section id="openweights" className="scroll-mt-28 bg-bench lg:scroll-mt-16">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <div className="flex flex-col">
          <ProjectLabel name="OpenWeights" status="On Google Play" mark="/home/openweights-icon.png" />
          <h2 className={`${h2} mt-6`}>Find a model. Run it here.</h2>
          <p className={`${lede} mt-5 max-w-xl`}>
            OpenWeights searches Hugging Face for GGUF and ExecuTorch models, estimates whether one fits your phone
            before you download it, and runs it on the device. No account.
          </p>

          <figure className="mt-10 max-w-md">
            <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-5 rounded-full bg-blue" />
                ExecuTorch build
              </span>
              <span className="inline-flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-5 rounded-full bg-ink/15" />
                GGUF in llama.cpp
              </span>
            </p>
            <ul className="mt-4 space-y-3">
              {latency.map((r) => (
                <li
                  key={r.chip}
                  className="grid grid-cols-[8.5rem_1fr] items-center gap-3 text-sm sm:grid-cols-[9.5rem_1fr]"
                >
                  <span className="text-ink-soft">{r.chip}</span>
                  <span className="space-y-1">
                    <span className="flex items-center gap-2">
                      <span className="h-2 rounded-full bg-blue" style={{ width: `${(r.et / slowest) * 75}%` }} />
                      <span className="text-xs font-medium tabular-nums">
                        {r.et} ms
                        <span className="sr-only"> with the ExecuTorch build,</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2 rounded-full bg-ink/15" style={{ width: `${(r.gguf / slowest) * 75}%` }} />
                      <span className="text-xs tabular-nums text-ink-soft">
                        {r.gguf} ms
                        <span className="sr-only"> with the GGUF</span>
                      </span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <figcaption className="mt-4 text-sm leading-6 text-ink-soft">
              Median time per output token for LFM2.5 1.2B on five phone chips, from{" "}
              <Go href={links.openweightsLatency} className={link}>
                OpenWeights&apos; latency report
              </Go>
              . Shorter is faster; conditions differ between phones.
            </figcaption>
          </figure>

          <p className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-base lg:mt-auto lg:pt-10">
            <a
              href={links.play}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#E0FF4F] px-5 py-2.5 text-sm font-medium text-[#052B42] hover:bg-[#d4f53a]"
            >
              Get it on Google Play
            </a>
            <Go href={links.openweights} className={link}>
              About OpenWeights
            </Go>
            <Go href={links.openweightsRepo} className={link}>
              <span className="sr-only">OpenWeights </span>Source
            </Go>
            <Go href={links.openweightsIos} className={link}>
              iPhone, experimental
            </Go>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.1fr_1fr] sm:items-end">
          <figure className="overflow-hidden rounded-[1.75rem] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files */}
            <img
              src="/home/openweights-discover.png"
              alt="OpenWeights' Discover screen: a Hugging Face search box, and Recommended showing the Experimental Machines ExecuTorch builds of LFM2.5 1.2B and 2.6B"
              width={600}
              height={861}
              loading="lazy"
              className="h-auto w-full"
            />
            <figcaption className="border-t border-rule px-5 py-4 text-sm leading-6 text-ink-soft">
              Discover searches Hugging Face and recommends our ExecuTorch builds.
            </figcaption>
          </figure>
          <figure className="overflow-hidden rounded-[1.75rem] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files */}
            <img
              src="/home/openweights-tools.png"
              alt="OpenWeights' Tools screen: under 'Leaves the device', switches for Search the web, Show pictures and Open a page"
              width={720}
              height={640}
              loading="lazy"
              className="h-auto w-full"
            />
            <figcaption className="border-t border-rule px-5 py-4 text-sm leading-6 text-ink-soft">
              Every tool that reaches the internet has its own switch.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
