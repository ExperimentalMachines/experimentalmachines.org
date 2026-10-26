import type { Metadata } from "next";
import Bars from "@/components/home/Bars";
import Go from "@/components/home/Go";
import ResearchList from "@/components/home/ResearchList";
import { h2, lede, link } from "@/components/home/ui";
import { ggufLinks, ggufRecommended, ggufRows } from "@/lib/gguf";
import { ggufStudies } from "@/lib/research";

const description =
  "GGUF, the model file llama.cpp runs, measured on an NVIDIA A100, on the CPUs, GPUs and NPUs of Android phones, and behind a coding agent on an RTX 4090 and a MacBook Air.";

export const metadata: Metadata = {
  title: "GGUF research: Experimental Machines",
  description,
  openGraph: { title: "GGUF research", description, url: "/gguf/" },
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

// One model's file in every format of the A100 study, smallest first.
const sizes = [...ggufRows]
  .sort((a, b) => a.bytes - b.bytes)
  .map((r) => ({ label: r.format, value: r.gib, shown: `${r.gib.toFixed(2)} GiB` }));
const a100 = ggufStudies.find((s) => s.href === "/gguf/a100-quantization/")!;

export default function Gguf() {
  return (
    <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
      <section id="top">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <h1 className="display text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">
              GGUF, from a datacenter GPU to a phone.
            </h1>
            <p className={`${lede} mt-6 max-w-xl`}>
              GGUF is the model file llama.cpp runs. We have measured it on an A100, on the CPUs, GPUs and NPUs of Android phones, and behind a coding agent on
              an RTX 4090 and a MacBook Air. Each study links to its committed results.
            </p>
            <p className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-base">
              <Go href={a100.href} className="rounded-full bg-blue px-6 py-3 font-medium text-white hover:bg-blue-deep">
                Ten formats on one A100
              </Go>
              <Go href={ggufLinks.files} className={link}>
                The files on Hugging Face
              </Go>
            </p>
          </div>
          <div className="self-end rounded-[1.75rem] bg-bench p-6 sm:p-8">
            <Bars
              rows={sizes}
              highlight={ggufRecommended}
              caption={`A 2B tool-calling model in each format, file size. ${ggufRecommended}, highlighted, is the smallest that passes OpenGrad's quality gate.`}
            />
          </div>
        </div>
      </section>

      <Section id="studies" title="The studies" tint>
        <ResearchList items={ggufStudies} columns={2} />
      </Section>
    </main>
  );
}
