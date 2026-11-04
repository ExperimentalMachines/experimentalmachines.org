import type { Metadata } from "next";
import ApiTabs from "@/components/home/ApiTabs";
import CodeBlock from "@/components/home/CodeBlock";
import { DocLinks, Points, ProductSection, RefTable } from "@/components/home/Docs";
import { Action, Actions, PrimaryAction } from "@/components/home/Actions";
import Go from "@/components/home/Go";
import { lede as ledeClass, link, ProjectLabel } from "@/components/home/ui";
import { execuserve } from "@/lib/execuserve";
import { links, projects } from "@/lib/home";

export const metadata: Metadata = {
  title: "ExecuServe: ExecuTorch models, served from your phone",
  description:
    "An OpenAI- and Anthropic-compatible server for compiled ExecuTorch models, running in the background on Android. Open source, by Experimental Machines.",
  openGraph: {
    title: "ExecuServe",
    description: "ExecuTorch models, served from your phone: an OpenAI- and Anthropic-compatible server running in the background on Android.",
    url: "/execuserve/",
    images: ["/execuserve/chat.png"],
  },
};

// The homepage's dark code card.
const Code = ({ code, lang }: { code: string; lang: "python" | "shell" }) => (
  <CodeBlock code={code} lang={lang} className="rounded-2xl bg-[#0e1638] p-5 sm:p-6" />
);

const status = projects.find((p) => p.id === "execuserve")!.status;

export default function ExecuServe() {
  const l = execuserve.links;
  return (
    <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
      <section id="top">
        <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-20">
          <ProjectLabel name="ExecuServe" status={status} mark="/execuserve/mark.svg" />
          <h1 className="display mt-8 max-w-4xl text-balance text-5xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-6xl">
            ExecuTorch models, served from your phone.
          </h1>
          <p className={`${ledeClass} mt-6 max-w-3xl`}>
            ExecuServe keeps compiled{" "}
            <Go href={l.executorch} className={link}>
              ExecuTorch
            </Go>{" "}
            models loaded on an Android phone and answers the OpenAI and Anthropic APIs, for any app on the phone or, if you allow it, on your network.
          </p>
          <Actions className="mt-10">
            <PrimaryAction href={links.execuservePlay} className="bg-[#c4381c] text-white hover:bg-[#a52f17]">
              Get it on Google Play
            </PrimaryAction>
            <Action href="#start">Quick start</Action>
            <Action href="#docs">Documentation</Action>
            <Action href="/research/">Research</Action>
          </Actions>
          <p className="mt-6 text-sm text-ink-soft">{execuserve.status}</p>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24">
          <figure className="overflow-hidden rounded-[1.75rem] border border-rule bg-bench">
            {/* eslint-disable-next-line @next/next/no-img-element -- a static export serves committed files */}
            <img
              src="/execuserve/chat.png"
              alt="The browser chat served by the phone: a reply from Qwen3 1.7B running on the device, with its prefill and decode rates"
              width={1360}
              height={820}
              className="h-auto w-full"
            />
            <figcaption className="border-t border-rule bg-white px-5 py-4 text-sm leading-6 text-ink-soft">
              The browser chat, served by the phone and answering from Qwen3 1.7B running on it.
            </figcaption>
          </figure>
        </div>
      </section>

      <ProductSection id="different" title="What it does" tint>
        <Points items={execuserve.points} />
      </ProductSection>

      <ProductSection id="measured" title="Measured on a phone" lede={`On a ${execuserve.phone}, over Wi-Fi, with the minified release build.`}>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Phone results, scrolls sideways on small screens">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead className="text-left text-ink-soft">
              <tr className="border-b border-rule">
                <th className="py-2 pr-4 font-normal">Check</th>
                <th className="py-2 font-normal">Result</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {execuserve.measured.map((m) => (
                <tr key={m.check} className="border-b border-rule align-top">
                  <td className="py-2.5 pr-4">{m.check}</td>
                  <td className="py-2.5">{m.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-soft">
          Method and raw results:{" "}
          <Go href={l.results} className={link}>
            the POCO X8 Pro Max report
          </Go>
          . The decode advantage of the XNNPACK export over llama.cpp was measured in{" "}
          <Go href="/openweights/" className={link}>
            OpenWeights
          </Go>
          , on whose ExecuTorch engine ExecuServe is built.
        </p>
      </ProductSection>

      <ProductSection id="start" title="Quick start" lede="An arm64 phone on Android 12 or later, adb on your computer, and an ExecuTorch export with its tokenizer." tint>
        <ApiTabs
          panels={(["openai", "anthropic"] as const).map((id) => {
            const q = execuserve.quickstart[id];
            return {
              id,
              label: q.label,
              body: (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* min-w-0, so a long command scrolls inside its card instead of widening the page. */}
                  <div className="min-w-0">
                    <p className="mb-3 text-sm text-ink-soft">From a clone of the repository, with the app installed:</p>
                    <Code code={q.shell} lang="shell" />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-3 text-sm text-ink-soft">Then any {q.label} client:</p>
                    <Code code={q.python} lang="python" />
                  </div>
                </div>
              ),
            };
          })}
        />
        <p className="mt-6 max-w-3xl leading-7 text-ink-soft">
          The script pushes the model, starts the server, forwards the port over adb, and prints the base URL and key.
        </p>
      </ProductSection>

      <ProductSection id="api" title="Reference">
        <div className="space-y-12">
          <RefTable
            title="The API"
            note="OpenAI's and Anthropic's shapes, error codes and streaming, checked with their official SDKs."
            head={["Route", "What it does"]}
            rows={execuserve.endpoints.map((e) => [`\`${e.path}\``, e.what])}
          />
          <RefTable title="Clients" head={["Client", "Setting"]} rows={execuserve.clients} />
          <RefTable title="Get a model onto the phone" head={["Way", "How"]} rows={execuserve.getModel} />
        </div>
      </ProductSection>

      <ProductSection id="docs" title="Documentation" tint>
        <DocLinks items={execuserve.docs} />
      </ProductSection>

      <ProductSection id="next" title="Open source">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <p className="max-w-xl leading-7 text-ink-soft">
            Apache-2.0, on GitHub. Next are the iOS app, server-side tools, vision input, and TLS for network mode. Not affiliated with, endorsed by or
            sponsored by the PyTorch Foundation or Meta.
          </p>
          <Actions className="items-start lg:justify-end">
            <Action href={l.repo}>Source on GitHub</Action>
            <Action href={l.issues}>Report a problem</Action>
          </Actions>
        </div>
      </ProductSection>
    </main>
  );
}
