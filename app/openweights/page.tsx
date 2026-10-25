import type { Metadata } from "next";
import Bars from "@/components/home/Bars";
import Go from "@/components/home/Go";
import { h2, lede, link, ProjectLabel } from "@/components/home/ui";
import { openweights } from "@/lib/openweights";
import { pdModels, pdTurns } from "@/lib/prefill-decode";

export const metadata: Metadata = {
  title: "OpenWeights: open-weight models on your Android phone",
  description:
    "Search Hugging Face from inside the app, find out whether a model will run on your phone before you download it, and chat with it on the device. No account, no cloud, no telemetry.",
  openGraph: {
    title: "OpenWeights",
    description: "Find a model on Hugging Face and run it on your Android phone. No account, no cloud, no telemetry.",
    url: "/openweights/",
    images: ["/home/openweights-chat.png"],
  },
};

function Section({ id, title, tint, children }: { id: string; title: string; tint?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-28 lg:scroll-mt-16 ${tint ? "bg-bench" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <h2 className={h2}>{title}</h2>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

function Phone({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="h-auto max-h-[320px] w-[46%] max-w-[230px] rounded-t-[1.5rem] border-x-[5px] border-t-[5px] border-white bg-white object-cover object-top sm:max-h-[420px]"
    />
  );
}

// The newest study, drawn for one model: the fastest pairing against the three
// that keep both halves on one processor.
const qwen = pdModels.find((m) => m.name === "Qwen3 1.7B" && m.quant === "Q4_0")!;
const pairings = [
  { label: "NPU + CPU", cell: qwen.cells[2][0] },
  { label: "NPU only", cell: qwen.cells[2][2] },
  { label: "CPU only", cell: qwen.cells[0][0] },
  { label: "GPU only", cell: qwen.cells[1][1] },
];

export default function OpenWeights() {
  const { links } = openweights;
  const [latest, ...earlier] = openweights.research;
  return (
    <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
      <section id="top" className="overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16">
          <div className="pb-4 lg:pb-24">
            <ProjectLabel name="OpenWeights" status="On Google Play" mark="/home/openweights-icon.png" />
            <h1 className="display mt-8 text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">
              Find a model. Run it here.
            </h1>
            <p className={`${lede} mt-6 max-w-xl`}>
              OpenWeights searches Hugging Face for GGUF and ExecuTorch models, estimates whether one fits your phone before you download it, and runs it on
              the device. Every token comes from your own hardware: no account, no cloud, no telemetry.
            </p>
            <p className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-base">
              <a
                href={links.play}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#E0FF4F] px-6 py-3 font-medium text-[#052B42] hover:bg-[#d4f53a]"
              >
                Get it on Google Play
              </a>
              <Go href={links.repo} className={link}>
                Source
              </Go>
              <Go href={links.ios} className={link}>
                iPhone, experimental
              </Go>
            </p>
          </div>
          <div className="flex items-end justify-center gap-4 rounded-t-[1.75rem] bg-bench px-6 pt-10 sm:gap-6">
            <Phone
              src="/home/openweights-chat.png"
              alt="OpenWeights on a phone with LFM2.5 1.2B loaded, ready for a first message"
              width={600}
              height={1222}
            />
            <Phone
              src="/home/openweights-discover.png"
              alt="OpenWeights' Discover screen: a Hugging Face search box, and Recommended showing the Experimental Machines ExecuTorch builds of LFM2.5 1.2B and 2.6B"
              width={600}
              height={861}
            />
          </div>
        </div>
      </section>

      <Section id="features" title="What it does" tint>
        <dl className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {openweights.points.map((p) => (
            <div key={p.title} className="border-t-2 border-blue pt-4">
              <dt className="display text-xl">{p.title}</dt>
              <dd className="mt-2 leading-7 text-ink-soft">{p.body}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="research" title="Measured on real phones">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <article>
            <p className="text-sm text-ink-soft">{latest.date}</p>
            <h3 className="display mt-2 text-3xl leading-tight tracking-[-0.02em]">
              <Go href={latest.href} className="hover:text-blue-deep">
                {latest.title}
              </Go>
            </h3>
            <p className={`${lede} mt-4 max-w-xl`}>{latest.line}</p>
            <p className="mt-6">
              <Go href={latest.href} className={`${link} font-medium`}>
                Read the results
              </Go>
            </p>
          </article>
          <div className="rounded-[1.75rem] bg-bench p-6 sm:p-8">
            <Bars
              rows={pairings.map((p) => ({ label: p.label, value: p.cell.seconds, shown: `${p.cell.seconds.toFixed(1)} s` }))}
              caption={`${qwen.name} ${qwen.quant} on a Snapdragon 8 Elite Gen 5: total time for ${pdTurns} conversation turns. NPU + CPU reads the prompt on the NPU and writes the reply on the CPU. Shorter is faster.`}
            />
          </div>
        </div>
        <ul className="mt-16 grid gap-x-8 gap-y-8 sm:grid-cols-3">
          {earlier.map((r) => (
            <li key={r.href} className="border-t border-rule pt-4">
              <p className="text-sm text-ink-soft">{r.date}</p>
              <p className="display mt-1 text-xl">
                <Go href={r.href} className="hover:text-blue-deep">
                  {r.title}
                </Go>
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{r.line}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="source" title="Open source" tint>
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <p className={`${lede} max-w-xl`}>
            Apache-2.0, on GitHub. {openweights.requirements}; an iPhone version is experimental. Models are published by third parties and their
            licences are their own.
          </p>
          <p className="flex flex-wrap items-start gap-x-6 gap-y-3 text-base lg:justify-end">
            <Go href={links.repo} className={link}>
              Source on GitHub
            </Go>
            <Go href={links.issues} className={link}>
              Report a problem
            </Go>
            <Go href={links.privacy} className={link}>
              Privacy policy
            </Go>
          </p>
        </div>
      </Section>
    </main>
  );
}
