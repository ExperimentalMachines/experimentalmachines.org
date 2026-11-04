import type { Metadata } from "next";
import { DocLinks, Points, ProductSection, RefTable, Steps } from "@/components/home/Docs";
import { Action, Actions, PrimaryAction } from "@/components/home/Actions";
import { lede, ProjectLabel } from "@/components/home/ui";
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
            <Actions className="mt-10">
              <PrimaryAction href={links.play} className="bg-[#E0FF4F] text-[#052B42] hover:bg-[#d4f53a]">
                Get it on Google Play
              </PrimaryAction>
              <Action href="#start">Quick start</Action>
              <Action href="#docs">Documentation</Action>
              <Action href="/research/">Research</Action>
            </Actions>
          </div>
          <div className="flex items-end justify-center gap-4 rounded-t-[1.75rem] bg-bench px-6 pt-10 sm:gap-6">
            <Phone
              src="/home/openweights-chat.png"
              alt="OpenWeights on a phone running LFM2.5 1.2B: asked whether to pack an umbrella in Tokyo tomorrow, it searches the web and says there is a significant chance of rain, then works out that 500 US dollars is about 79,000 yen at 158 yen to the dollar, at about 60 tokens per second"
              width={600}
              height={1212}
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

      <ProductSection id="features" title="What it does" tint>
        <Points items={openweights.points} />
      </ProductSection>

      <ProductSection id="start" title="Quick start" lede={`${openweights.requirements}, with memory for the model you pick.`}>
        <Steps items={openweights.quickstart} />
      </ProductSection>

      <ProductSection id="reference" title="Reference" tint>
        <div className="space-y-12">
          <RefTable title="Commands" note="Type one in the message box." head={["Command", "What it does"]} rows={openweights.commands} />
          <RefTable
            title="Tools"
            note="The three that go online start on, and each has its own switch. The rest stay off until you turn them on."
            head={["Tool", "What it does", "Goes online"]}
            rows={openweights.tools}
          />
          <RefTable title="Two runtimes" note="The app picks by file format." head={["", "llama.cpp", "ExecuTorch"]} rows={openweights.runtimes} />
        </div>
      </ProductSection>

      <ProductSection id="docs" title="Documentation">
        <DocLinks items={openweights.docs} />
      </ProductSection>

      <ProductSection id="source" title="Open source" tint>
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <p className="max-w-xl leading-7 text-ink-soft">
            Apache-2.0, on GitHub. An iPhone version is experimental. Models are published by third parties and their licences are their own.
          </p>
          <Actions className="items-start lg:justify-end">
            <Action href={links.repo}>Source on GitHub</Action>
            <Action href={links.ios}>iPhone, experimental</Action>
            <Action href={links.issues}>Report a problem</Action>
          </Actions>
        </div>
      </ProductSection>
    </main>
  );
}
