import type { Metadata } from "next";
import FeaturedStudy from "@/components/home/FeaturedStudy";
import Go from "@/components/home/Go";
import ResearchList from "@/components/home/ResearchList";
import { h2, lede, link, ProjectLabel } from "@/components/home/ui";
import { openweights } from "@/lib/openweights";

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
      className="h-auto w-[46%] max-w-[230px] rounded-t-[1.5rem] border-x-[5px] border-t-[5px] border-white bg-white"
    />
  );
}

export default function OpenWeights() {
  const { links } = openweights;
  const [, ...earlier] = openweights.research;
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
              <Go href="/research/#openweights" className={link}>
                Research
              </Go>
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
              alt="OpenWeights on a phone running LFM2.5 1.2B: asked to open experimentalmachines.org, it reads the page with its web tool and sums up what we make in three bullets, at 55 tokens per second"
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
        <FeaturedStudy />
        <div className="mt-6">
          <ResearchList items={earlier.map((r) => ({ href: r.href, title: r.title, meta: r.date, line: r.line }))} />
        </div>
        <p className="mt-10">
          <Go href="/research/" className="rounded-full bg-blue px-6 py-3 text-base font-medium text-white hover:bg-blue-deep">
            All research
          </Go>
        </p>
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
