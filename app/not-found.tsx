import type { Metadata } from "next";
import HomeShell from "@/components/home/HomeShell";
import ResearchList from "@/components/home/ResearchList";
import { lede } from "@/components/home/ui";
import { projects } from "@/lib/home";
import type { ResearchItem } from "@/lib/research";

// The page for any address the site does not have: the static export writes it
// to 404.html, which GitHub Pages serves for every unknown URL. It renders in the
// root layout, so it wraps itself in the organisation's look.

export const metadata: Metadata = {
  title: "Page not found",
};

const project = (id: string, href: string): ResearchItem => {
  const p = projects.find((x) => x.id === id)!;
  return { href, title: p.name, meta: p.status, line: p.line };
};

const places: ResearchItem[] = [
  { href: "/", title: "Experimental Machines", meta: "Home", line: "Our apps, the models under them, and the fixes we took to ExecuTorch" },
  project("openweights", "/openweights/"),
  project("execuserve", "/execuserve/"),
  {
    href: "/executorch/",
    title: "ExecuTorch exports",
    meta: "ExecuPack",
    line: "Every model ExecuPack has published, per accelerator, against everything ExecuTorch can export for Android",
  },
  { href: "/asic/", title: "ASIC research", meta: "Research", line: "Training and serving models on TPU, Trainium, Inferentia and Gaudi, against GPUs" },
  { href: "/gguf/", title: "GGUF research", meta: "Research", line: "The model file llama.cpp runs, measured from a datacenter GPU to a phone" },
];

export default function NotFound() {
  return (
    <HomeShell>
      <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20">
          <p className="text-sm text-ink-soft">404</p>
          <h1 className="display mt-4 max-w-4xl text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">
            Nothing at this address.
          </h1>
          <p className={`${lede} mt-6 max-w-2xl`}>The link may be old or mistyped. Every page on the site can be reached from one of these.</p>
          <div className="mt-14">
            <ResearchList items={places} />
          </div>
        </div>
      </main>
    </HomeShell>
  );
}
